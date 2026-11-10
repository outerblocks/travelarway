/**
 * Payments, and the moment a booking becomes a sale.
 *
 * The rule this module exists to enforce: a ticket is never issued for money that has not
 * arrived, and money that arrives is never lost because a ticket could not be issued.
 * Those are two different failures and they get two different outcomes —
 *
 *   money confirmed + seats still held   -> `paid`,      booking `issued`, revenue recorded
 *   money confirmed + seats gone         -> `unallocated`, booking `cancelled`, refund owed
 *
 * `unallocated` is not an error path to be swallowed. It is a customer who paid and has no
 * seat, and it must be countable. Collapsing it into `failed` would hide a refund
 * obligation inside a support queue.
 *
 * Confirmation arrives from a provider, never from the browser. The caller proves itself
 * with a signature over the raw request body; see `api.payments.callback.ts`.
 */
import type pg from 'pg';
import { query, withTransaction } from '@/server/db';
import { isInventoryConflict, isUniqueViolation } from '@/server/errors';
import { releaseFerryCapacity } from '@/server/sailing-inventory';
import { recordSale, recordUnallocatedCollection, reverseSaleJournal } from '@/server/ledger';
import {
  PaymentConfigurationError,
  PaymentNotEnabledError,
  PaymentRateLimitedError,
  ProviderRejectedError,
  UnsupportedCurrencyError,
  type CollectionStatus,
} from '@/server/payments/clickpesa';
import { getCollectionAdapter } from '@/server/payments/registry';
import { resolvePaymentMerchant } from '@/server/markets';
import { orderReferenceFor } from '@/server/payments/order-reference';
import { normaliseMsisdn } from '@/server/payments/phone';
import { attemptStatusFor } from '@/server/payments/attempt-status';
import { safePaymentRedirectUrl } from '@/domain/payment-redirect';

/** The only collection provider wired today. Routing becomes a server decision. */
export const PAYMENT_PROVIDER = 'clickpesa';

const METHODS = new Set(['mobile_money', 'card', 'bank_transfer']);

export class BookingNotPayableError extends Error {
  constructor(public readonly reason: 'not_found' | 'not_pending' | 'window_closed') {
    super(`booking_not_payable:${reason}`);
  }
}

export class InvalidMethodError extends Error {
  constructor() {
    super('invalid_payment_method');
  }
}

export class UnknownPaymentError extends Error {
  constructor() {
    super('unknown_payment');
  }
}

/**
 * Money confirmed, but the inventory that money was for is gone. The caller turns this
 * into `unallocated`; it must never be reported to the customer as a failure.
 */
export class InventoryLostError extends Error {
  constructor(
    public readonly bookingId: string,
    public readonly pnr: string,
  ) {
    super('inventory_lost');
  }
}

export interface PaymentIntent {
  paymentId: string;
  bookingId: string;
  provider: string;
  method: string | null;
  amountMinor: number;
  currency: string;
  status: string;
  /** Reference the provider gave the collection, when it was started. */
  providerReference: string | null;
  /** Our reference for the attempt: alphanumeric, unique, the join key for callbacks. */
  orderReference: string;
  /** Card payments hand the customer to the provider's hosted page. */
  redirectUrl: string | null;
}

export interface StartPaymentResult {
  intent: PaymentIntent;
  /** Null when the collection reached the provider; otherwise why it did not. */
  failure:
    | null
    | 'not_enabled'
    | 'not_configured'
    | 'method_unsupported'
    | 'card_requires_usd'
    | 'phone_required'
    | 'invalid_phone'
    | 'rate_limited'
    | 'provider_error';
  /**
   * The provider's own words when it refused us. Development only: it belongs in a log and
   * on an operator's screen, not on a production customer's page.
   */
  detail?: string;
}

/**
 * Opens a collection attempt for a pending booking and asks the provider to collect.
 *
 * The amount comes from the booking row, never from the request: what the customer is
 * asked to pay is what the server already decided they owe. An attempt that is already
 * open is returned as-is rather than duplicated — two tabs must not mean two charges.
 *
 * The provider call happens outside the database transaction. A USSD push can take
 * seconds, and holding a pooled connection across a network round trip to a payment
 * provider is how a slow provider becomes a database outage.
 */
export async function startPayment(input: {
  bookingId: string;
  method: string;
  phoneNumber?: string;
}): Promise<StartPaymentResult> {
  const intent = await openIntent(input);
  const adapter = getCollectionAdapter(intent.provider);

  // An intent that already reached the provider is not sent twice.
  if (intent.providerReference || intent.status !== 'initiated') {
    return { intent, failure: null };
  }

  const phoneNumber = input.phoneNumber?.trim() ?? '';

  // Cards take a different endpoint and a different currency from a USSD push.
  if (input.method === 'card') return startCardPayment(intent);

  if (input.method !== 'mobile_money') {
    // Bank transfers have no route yet; pretending a USSD push is one would leave the
    // customer waiting for a prompt that never arrives.
    await markCollectionFailed(intent.paymentId, 'method_unsupported');
    return { intent: { ...intent, status: 'failed' }, failure: 'method_unsupported' };
  }

  if (!phoneNumber) {
    await markCollectionFailed(intent.paymentId, 'phone_required');
    return { intent: { ...intent, status: 'failed' }, failure: 'phone_required' };
  }

  // The form holds the national part (`712345678`) with a fixed +255 beside it; the
  // provider needs `255712345678`. Sending it unnormalised is what produced a generic
  // provider failure for a perfectly good number.
  let msisdn: string;
  try {
    msisdn = normaliseMsisdn(phoneNumber, intent.countryCode);
  } catch {
    await markCollectionFailed(intent.paymentId, 'invalid_phone');
    return { intent: { ...intent, status: 'failed' }, failure: 'invalid_phone' };
  }

  try {
    const collection = await adapter.initiateCollection({
      orderReference: intent.orderReference,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
      phoneNumber: msisdn,
    });

    const recorded = await recordCollection(intent.paymentId, collection.providerReference, collection.status, collection.raw);
    return { intent: { ...intent, ...recorded }, failure: null };
  } catch (error) {
    const reason =
      error instanceof PaymentRateLimitedError
        ? 'rate_limited'
        : error instanceof PaymentNotEnabledError
          ? 'not_enabled'
          : error instanceof PaymentConfigurationError
            ? 'not_configured'
            : 'provider_error';

    console.error('[payments] collection could not start:', reason, (error as Error).message);
    await markCollectionFailed(intent.paymentId, reason);
    return {
      intent: { ...intent, status: 'failed' },
      failure: reason,
      detail: describeFailure(error),
    };
  }
}

/**
 * Card collection: a hosted page, and only in USD.
 *
 * ClickPesa's card endpoints accept USD alone. Most Travelar fares are quoted in TZS, so
 * the honest answer for those is a refusal the customer can understand, not a currency
 * conversion invented here.
 */
async function startCardPayment(intent: IntentWithPnr): Promise<StartPaymentResult> {
  if (intent.currency.toUpperCase() !== 'USD') {
    await markCollectionFailed(intent.paymentId, 'card_requires_usd');
    return { intent: { ...intent, status: 'failed' }, failure: 'card_requires_usd' };
  }

  try {
    const card = await getCollectionAdapter(intent.provider).initiateCardPayment({
      orderReference: intent.orderReference,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
      customer: {
        fullName: intent.customerName,
        email: intent.customerEmail,
        phoneNumber: intent.customerPhone,
      },
    });

    const redirectUrl = safePaymentRedirectUrl(card.redirectUrl);
    if (!redirectUrl) {
      // No link, or a link that is not on the provider host, is not a payment page.
      await markCollectionFailed(intent.paymentId, 'card_link_missing');
      return { intent: { ...intent, status: 'failed' }, failure: 'provider_error' };
    }

    const recorded = await recordCollection(intent.paymentId, null, 'pending', card.raw);
    return {
      intent: { ...intent, ...recorded, redirectUrl },
      failure: null,
    };
  } catch (error) {
    const reason = error instanceof UnsupportedCurrencyError
      ? 'card_requires_usd'
      : error instanceof PaymentRateLimitedError
        ? 'rate_limited'
        : error instanceof PaymentNotEnabledError
          ? 'not_enabled'
          : error instanceof PaymentConfigurationError
            ? 'not_configured'
            : 'provider_error';

    console.error('[payments] card collection could not start:', reason, (error as Error).message);
    await markCollectionFailed(intent.paymentId, reason);
    return {
      intent: { ...intent, status: 'failed' },
      failure: reason,
      detail: describeFailure(error),
    };
  }
}

interface IntentWithPnr extends PaymentIntent {
  pnr: string;
  /** Market of the operator: decides the dial code a mobile money number needs. */
  countryCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

/**
 * Our reference for one collection attempt.
 *
 * ClickPesa accepts alphanumeric only, up to 20 characters, and rejects a reused reference
 * with 409 — so the attempt number is part of it. `TRV-ABC123` becomes `TRVABC12301`.
 */
export { orderReferenceFor } from '@/server/payments/order-reference';

async function openIntent(input: { bookingId: string; method: string }): Promise<IntentWithPnr> {
  if (!METHODS.has(input.method)) throw new InvalidMethodError();

  return withTransaction(async (client) => {
    const booking = await client.query<{
      status: string;
      pnr: string;
      total_minor: string;
      currency: string;
      payment_due_at: Date | null;
      customer_name: string | null;
      customer_email: string | null;
      customer_phone: string | null;
      country_code: string;
    }>(
      `select b.status::text, b.pnr, b.total_minor::text, b.currency::text, b.payment_due_at,
              b.customer_name, b.customer_email, b.customer_phone, o.country_code
         from app.booking b join app.operator o on o.id = b.operator_id
        where b.id = $1 for update of b`,
      [input.bookingId],
    );

    if (booking.rowCount === 0) throw new BookingNotPayableError('not_found');
    const bookingRow = booking.rows[0];
    if (bookingRow.status !== 'pending_payment') throw new BookingNotPayableError('not_pending');
    if (!bookingRow.payment_due_at || bookingRow.payment_due_at.getTime() <= Date.now()) {
      throw new BookingNotPayableError('window_closed');
    }

    // Reuse the attempt that is already open. 'pending' counts: the provider accepted the
    // push and the customer has not answered yet. Inserting a second row here would hit
    // ux_payment_open_per_booking and charge them twice once they both resolve.
    const open = await client.query<{
      id: string;
      status: string;
      amount_minor: string;
      currency: string;
      method: string | null;
      provider: string;
      provider_reference: string | null;
      order_reference: string | null;
    }>(
      `select id, status::text, amount_minor::text, currency::text, method, provider,
              provider_reference, order_reference
         from app.payment
        where booking_id = $1 and status in ('initiated', 'pending')
        for update`,
      [input.bookingId],
    );

    if ((open.rowCount ?? 0) > 0) {
      const existing = open.rows[0];
      return {
        paymentId: existing.id,
        bookingId: input.bookingId,
        provider: existing.provider || PAYMENT_PROVIDER,
        method: existing.method,
        amountMinor: Number(existing.amount_minor),
        currency: existing.currency,
        status: existing.status,
        providerReference: existing.provider_reference,
        orderReference: existing.order_reference ?? orderReferenceFor(bookingRow.pnr, 1),
        redirectUrl: null,
        pnr: bookingRow.pnr,
        countryCode: bookingRow.country_code,
        customerName: bookingRow.customer_name ?? '',
        customerEmail: bookingRow.customer_email ?? '',
        customerPhone: bookingRow.customer_phone ?? '',
      };
    }

    // The attempt number makes the reference unique per attempt, which is what lets the
    // customer retry after a failure without the provider reading it as a double charge.
    const attempts = await client.query<{ attempts: number }>(
      `select count(*)::int as attempts from app.payment where booking_id = $1`,
      [input.bookingId],
    );
    const orderReference = orderReferenceFor(bookingRow.pnr, attempts.rows[0].attempts + 1);

    const merchant = await resolvePaymentMerchant(client, {
      countryCode: bookingRow.country_code,
      currency: bookingRow.currency,
      method: input.method,
    });
    if (!merchant) throw new PaymentNotEnabledError('no_merchant');
    if (merchant.status !== 'licensed') throw new PaymentNotEnabledError('merchant_not_licensed');

    const created = await client.query<{ id: string; status: string }>(
      `insert into app.payment (booking_id, provider, method, amount_minor, currency, order_reference, payment_merchant_id)
       values ($1, $2, $3, $4::bigint, $5, $6, $7)
       returning id, status::text`,
      [
        input.bookingId,
        merchant.providerCode,
        input.method,
        bookingRow.total_minor,
        bookingRow.currency,
        orderReference,
        merchant.id,
      ],
    );

    await client.query(
      `update app.booking set payment_merchant_id = $2 where id = $1 and payment_merchant_id is null`,
      [input.bookingId, merchant.id],
    );

    return {
      paymentId: created.rows[0].id,
      bookingId: input.bookingId,
      provider: merchant.providerCode,
      method: input.method,
      amountMinor: Number(bookingRow.total_minor),
      currency: bookingRow.currency,
      status: created.rows[0].status,
      providerReference: null,
      orderReference,
      redirectUrl: null,
      pnr: bookingRow.pnr,
      countryCode: bookingRow.country_code,
      customerName: bookingRow.customer_name ?? '',
      customerEmail: bookingRow.customer_email ?? '',
      customerPhone: bookingRow.customer_phone ?? '',
    };
  });
}

/**
 * Asks the provider what collecting this booking would cost and whether the wallet is
 * reachable — without opening an attempt.
 *
 * Deliberately separate from `startPayment`: a preview must not create a payment row, or
 * an abandoned look would occupy the one open attempt per booking
 * (`ux_payment_open_per_booking`) and block the real one.
 */
export async function previewPayment(input: {
  bookingId: string;
  phoneNumber?: string;
}): Promise<{ orderReference: string; methods: unknown[]; sender: unknown }> {
  const booking = await query<{
    status: string;
    pnr: string;
    total_minor: string;
    currency: string;
    payment_due_at: Date | null;
    attempts: number;
    country_code: string;
  }>(
    `select b.status::text, b.pnr, b.total_minor::text, b.currency::text, b.payment_due_at,
            (select count(*)::int from app.payment where booking_id = b.id) as attempts,
            o.country_code
       from app.booking b
       join app.operator o on o.id = b.operator_id
      where b.id = $1`,
    [input.bookingId],
  );

  if (booking.rowCount === 0) throw new BookingNotPayableError('not_found');
  const row = booking.rows[0];
  if (row.status !== 'pending_payment') throw new BookingNotPayableError('not_pending');
  if (!row.payment_due_at || row.payment_due_at.getTime() <= Date.now()) {
    throw new BookingNotPayableError('window_closed');
  }

  const merchant = await resolvePaymentMerchant({ query }, {
      countryCode: row.country_code,
      currency: row.currency,
      method: 'mobile_money',
    });
  if (!merchant || merchant.status !== 'licensed') {
    throw new PaymentNotEnabledError('merchant_not_licensed');
  }

  const orderReference = orderReferenceFor(row.pnr, row.attempts + 1);
  const preview = await getCollectionAdapter(merchant.providerCode).previewCollection({
    orderReference,
    amountMinor: Number(row.total_minor),
    currency: row.currency,
    phoneNumber: input.phoneNumber?.trim() ?? '',
  });

  return { orderReference, methods: preview.methods, sender: preview.sender };
}

/**
 * What an *attempt* may record before any confirmation has arrived.
 *
 * An attempt is only ever `pending` or `failed`. `paid` is written by `confirmPayment` and
 * by nothing else — see `payments/attempt-status.ts` for why that distinction matters.
 */
export { attemptStatusFor } from '@/server/payments/attempt-status';

async function recordCollection(
  paymentId: string,
  providerReference: string | null,
  status: CollectionStatus,
  raw: unknown,
): Promise<{ providerReference: string | null; status: string }> {
  // Never `paid` here: an accepted request is not a confirmed payment.
  const mapped = attemptStatusFor(status);
  return withTransaction(async (client) => {
    const updated = await client.query<{ status: string; provider_reference: string | null }>(
      `update app.payment
          set provider_reference = coalesce($2, provider_reference),
              status = $3, raw = $4, updated_at = now()
        where id = $1
        returning status::text, provider_reference`,
      [paymentId, providerReference, mapped, JSON.stringify(raw ?? {})],
    );
    return {
      providerReference: updated.rows[0].provider_reference,
      status: updated.rows[0].status,
    };
  });
}

async function markCollectionFailed(paymentId: string, failureCode: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `update app.payment
          set status = 'failed', failure_code = $2, updated_at = now()
        where id = $1 and status = 'initiated'`,
      [paymentId, failureCode],
    );
  });
}

export interface ConfirmPaymentInput {
  provider: string;
  /**
   * Our reference for the attempt, not the provider's. ClickPesa's webhook carries it,
   * their documentation names it the join key, and it exists before they ever see the
   * request — so a callback can be matched even if their id never reaches us.
   */
  orderReference: string;
  amountMinor: number;
  currency: string;
  paidAt?: string;
  raw?: unknown;
}

export interface ConfirmPaymentResult {
  bookingId: string;
  pnr: string;
  bookingStatus: string;
  paymentStatus: 'paid' | 'unallocated' | 'failed';
  /** Set when the payment could not be turned into a sale; null on success. */
  failureCode: 'amount_mismatch' | null;
  /** True when this webhook was a replay; nothing changed and nothing was charged twice. */
  replay: boolean;
}

/**
 * Applies a provider confirmation.
 *
 * Idempotent by `(provider, order_reference)`: a webhook delivered three times marks one
 * payment paid and returns the same answer three times.
 */
export async function confirmPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
  try {
    return await withTransaction((client) => applyPayment(client, input));
  } catch (error) {
    if (error instanceof InventoryLostError) {
      // The rollback undid everything above; record the money in its own transaction so
      // the refund obligation survives.
      await markUnallocated(input, error);
      return {
        bookingId: error.bookingId,
        pnr: error.pnr,
        bookingStatus: 'cancelled',
        paymentStatus: 'unallocated',
        failureCode: null,
        replay: false,
      };
    }
    throw error;
  }
}

export interface ReconciliationSummary {
  checked: number;
  confirmed: number;
  failed: number;
}

/**
 * Asks the provider about every open attempt.
 *
 * A webhook is an optimisation, not the source of truth: if it is lost, a customer who paid
 * would sit on a pending booking until it expired. This is the fallback that turns a
 * provider-confirmed SUCCESS into a ticket, using the same gate as the webhook — `pending`
 * and `processing` issue nothing.
 *
 * Never confirms an attempt the provider has not confirmed.
 */
export async function reconcileOpenPayments(limit = 25): Promise<ReconciliationSummary> {
  const { rows } = await query<{
    provider: string;
    order_reference: string;
    amount_minor: string;
    currency: string;
  }>(
    `select provider, order_reference, amount_minor::text, currency::text
       from app.payment
      where status in ('initiated', 'pending')
        and order_reference is not null
        and provider_reference is not null
      order by created_at
      limit $1`,
    [limit],
  );

  let confirmed = 0;
  let failed = 0;

  for (const row of rows) {
    let result;
    try {
      result = await getCollectionAdapter(row.provider).getCollectionStatus(row.order_reference);
    } catch (error) {
      // A failed status query leaves the attempt exactly as it was. Guessing either way
      // would issue a ticket without evidence, or fail a payment that may have succeeded.
      console.error(
        '[payments] status query failed',
        row.order_reference,
        (error as Error).message,
      );
      continue;
    }

    if (result.status === 'paid') {
      // Prefer what the provider says it collected, so a shortfall is caught rather than
      // assumed away.
      const reported = Number((result.raw as { collectedAmount?: unknown }).collectedAmount);
      const amountMinor =
        Number.isFinite(reported) && reported > 0 ? reported : Number(row.amount_minor);

      await confirmPayment({
        provider: row.provider,
        orderReference: row.order_reference,
        amountMinor,
        currency: row.currency,
        paidAt: new Date().toISOString(),
        raw: result.raw,
      });
      confirmed += 1;
      continue;
    }

    if (result.status === 'failed') {
      await failPaymentByOrderReference({
        provider: row.provider,
        orderReference: row.order_reference,
        failureCode: 'provider_status_failed',
      });
      failed += 1;
    }
  }

  return { checked: rows.length, confirmed, failed };
}

export interface OpenAttempt {
  orderReference: string;
  status: string;
}

/**
 * An attempt the provider has acknowledged and not resolved.
 *
 * The page needs this after a reload: `collectionStarted` lives in the browser's memory, so
 * without it a customer who refreshes sees "payment not started" and is invited to pay
 * again while the first debit may still be on its way.
 */
export async function findOpenAttempt(bookingId: string): Promise<OpenAttempt | null> {
  const result = await query<{ order_reference: string; status: string }>(
    `select order_reference, status::text
       from app.payment
      where booking_id = $1
        and status in ('initiated', 'pending')
        and provider_reference is not null
      order by created_at desc
      limit 1`,
    [bookingId],
  );
  const row = result.rows[0];
  return row ? { orderReference: row.order_reference, status: row.status } : null;
}

export interface ReversalResult {
  bookingId: string;
  pnr: string;
  bookingStatus: string;
  /** True when this call performed the reversal; false when it had already happened. */
  reversed: boolean;
}

/**
 * Undoes a sale after the money went back to the customer.
 *
 * TIPS settles same-day but supports reversals, and a wallet debit can be undone after we
 * have already issued a ticket. Ignoring that would leave a void ticket in a conductor's
 * hands and revenue in the ledger that was never earned.
 *
 * Three things happen together: the document is voided (a reversal row, never an edit), the
 * booking is marked refunded, and the seats return to inventory so they can be sold again.
 * Idempotent: a repeated reversal status changes nothing.
 */
export async function reversePayment(input: {
  provider: string;
  orderReference: string;
  /** REVERSED arrived after settlement; REFUNDED happened before it. */
  kind: 'reversed' | 'refunded';
  reason?: string;
}): Promise<ReversalResult | null> {
  return withTransaction(async (client) => {
    const payment = await client.query<{ id: string; booking_id: string; status: string }>(
      `select id, booking_id, status::text
         from app.payment
        where provider = $1 and order_reference = $2
        for update`,
      [input.provider, input.orderReference],
    );
    if (payment.rowCount === 0) return null;
    const record = payment.rows[0];

    if (record.status === 'reversed' || record.status === 'refunded') {
      const booking = await client.query<{ pnr: string; status: string }>(
        `select pnr, status::text from app.booking where id = $1`,
        [record.booking_id],
      );
      return {
        bookingId: record.booking_id,
        pnr: booking.rows[0]?.pnr ?? '',
        bookingStatus: booking.rows[0]?.status ?? 'unknown',
        reversed: false,
      };
    }

    await client.query(
      `update app.payment set status = $2, failure_code = $3, updated_at = now() where id = $1`,
      [record.id, input.kind, input.reason ?? input.kind],
    );

    const booking = await client.query<{ pnr: string; status: string }>(
      `select pnr, status::text from app.booking where id = $1 for update`,
      [record.booking_id],
    );
    const sale = booking.rows[0];

    // Reversed before the sale completed: no ticket to void and no revenue to un-earn. The
    // attempt simply failed; another try can still pay for the booking.
    if (!sale || sale.status !== 'issued') {
      await client.query(
        `insert into app.booking_event (booking_id, type, payload, actor)
         values ($1, 'payment.reversed_before_issue', $2, 'payment-provider')`,
        [record.booking_id, JSON.stringify({ orderReference: input.orderReference, kind: input.kind })],
      );
      return {
        bookingId: record.booking_id,
        pnr: sale?.pnr ?? '',
        bookingStatus: sale?.status ?? 'unknown',
        reversed: true,
      };
    }

    // The document is voided by appending a reversal, never by editing the original row.
    await client.query(
      `insert into app.ledger_entry
         (booking_id, document_type, document_number, party_type, party_id, mode, pos_country,
          revenue_type, currency, base_minor, taxes_minor, fees_minor, ancillaries_minor,
          gross_minor, supplier_cost_minor, costs_minor, revenue_minor,
          status, reverses, issued_at)
       select le.booking_id, le.document_type, le.document_number, le.party_type, le.party_id,
              le.mode, le.pos_country, le.revenue_type, le.currency,
              le.base_minor, le.taxes_minor, le.fees_minor, le.ancillaries_minor,
              le.gross_minor, le.supplier_cost_minor, le.costs_minor, le.revenue_minor,
              $2, le.id, now()
         from app.ledger_entry le
        where le.booking_id = $1 and le.reverses is null`,
      [record.booking_id, input.kind === 'reversed' ? 'refunded' : 'voided'],
    );
    await reverseSaleJournal(client, { bookingId: record.booking_id, kind: input.kind });

    await client.query(`update app.booking set status = 'refunded' where id = $1`, [
      record.booking_id,
    ]);

    await releaseFerryCapacity(client, [record.booking_id]);

    await client.query(
      `update app.booking_passenger set status = 'cancelled'
        where booking_id = $1 and status = 'active'`,
      [record.booking_id],
    );

    await client.query(
      `insert into app.booking_event (booking_id, type, payload, actor)
       values ($1, 'payment.reversed', $2, 'payment-provider')`,
      [
        record.booking_id,
        JSON.stringify({
          orderReference: input.orderReference,
          kind: input.kind,
          reason: input.reason ?? null,
        }),
      ],
    );

    return { bookingId: record.booking_id, pnr: sale.pnr, bookingStatus: 'refunded', reversed: true };
  });
}

/**
 * The most specific sentence available about a failed collection.
 *
 * The provider's own message when it answered, otherwise the transport error. This is what
 * the customer sees: a reason they can act on beats a polite nothing.
 */
function describeFailure(error: unknown): string | undefined {
  if (error instanceof ProviderRejectedError) {
    return error.providerMessage
      ? `${error.status}: ${error.providerMessage}`
      : `Provider rejected the request (HTTP ${error.status})`;
  }
  if (error instanceof Error && error.message) return error.message;
  return undefined;
}

async function applyPayment(client: pg.PoolClient, input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
  const payment = await client.query<{
    id: string;
    booking_id: string;
    amount_minor: string;
    currency: string;
    status: string;
  }>(
    `select id, booking_id, amount_minor::text, currency::text, status::text
       from app.payment
      where provider = $1 and order_reference = $2
      for update`,
    [input.provider, input.orderReference],
  );

  if (payment.rowCount === 0) throw new UnknownPaymentError();
  const record = payment.rows[0];

  const booking = await client.query<{
    status: string;
    pnr: string;
    total_minor: string;
    currency: string;
    operator_id: string;
    mode: string;
    country_code: string;
  }>(
    `select b.status::text, b.pnr, b.total_minor::text, b.currency::text,
            b.operator_id, o.mode, o.country_code
       from app.booking b join app.operator o on o.id = b.operator_id
      where b.id = $1
      for update of b`,
    [record.booking_id],
  );
  const sale = booking.rows[0];

  // A replay changes nothing — but only when the sale it refers to actually happened.
  // A payment row marked `paid` whose booking is still pending is a half-finished sale (a
  // crash between the two writes, or an older bug); refusing it as a replay would strand a
  // customer who has paid. Fall through and issue instead.
  if (record.status === 'unallocated') {
    return {
      bookingId: record.booking_id,
      pnr: sale?.pnr ?? '',
      bookingStatus: sale?.status ?? 'unknown',
      paymentStatus: 'unallocated',
      failureCode: null,
      replay: true,
    };
  }
  if (record.status === 'paid' && sale?.status === 'issued') {
    return {
      bookingId: record.booking_id,
      pnr: sale.pnr,
      bookingStatus: 'issued',
      paymentStatus: 'paid',
      failureCode: null,
      replay: true,
    };
  }

  const expected = Number(record.amount_minor);
  // A row already marked paid is being repaired, not verified again: re-checking the
  // reported amount would flip a genuine sale to failed on a stale retry.
  if (record.status !== 'paid' && (input.amountMinor !== expected || input.currency !== record.currency)) {
    // Never issue against a number the provider did not agree to. Recorded rather than
    // thrown: a throw inside this transaction would roll the record back with it, and the
    // discrepancy would disappear from the books entirely.
    await client.query(
      `update app.payment
          set status = 'failed', failure_code = 'amount_mismatch', raw = $2, updated_at = now()
        where id = $1`,
      [
        record.id,
        JSON.stringify({
          reported: { amountMinor: input.amountMinor, currency: input.currency },
          raw: input.raw ?? null,
        }),
      ],
    );
    await client.query(
      `insert into app.booking_event (booking_id, type, payload, actor)
       values ($1, 'payment.amount_mismatch', $2, 'payment-provider')`,
      [
        record.booking_id,
        JSON.stringify({
          paymentId: record.id,
          expectedMinor: expected,
          reportedMinor: input.amountMinor,
          expectedCurrency: record.currency,
          reportedCurrency: input.currency,
        }),
      ],
    );

    return {
      bookingId: record.booking_id,
      pnr: sale?.pnr ?? '',
      bookingStatus: sale?.status ?? 'unknown',
      paymentStatus: 'failed',
      failureCode: 'amount_mismatch',
      replay: false,
    };
  }

  // Money for a booking that is no longer waiting for it: the payment window closed, it
  // was cancelled, or it is already issued. The first two owe a refund; the third is a
  // duplicate confirmation for the same money.
  if (!sale || sale.status !== 'pending_payment') {
    if (sale?.status === 'issued') {
      await client.query(
        `update app.payment
            set status = 'paid', failure_code = null,
                paid_at = coalesce($2::timestamptz, now()), raw = $3, updated_at = now()
          where id = $1`,
        [record.id, input.paidAt ?? null, JSON.stringify(input.raw ?? {})],
      );
      return {
        bookingId: record.booking_id,
        pnr: sale.pnr,
        bookingStatus: 'issued',
        paymentStatus: 'paid',
        failureCode: null,
        replay: true,
      };
    }

    throw new InventoryLostError(record.booking_id, sale?.pnr ?? '');
  }

  // The seats must still be reserved by this booking's holds. A hold that expired while
  // the customer was in their mobile-money menu means the seat may already be sold.
  const inventory = await client.query<{ held: number; expected: number }>(
    `select
        (select count(*)::int from app.seat_hold
          where booking_id = $1 and status = 'active' and expires_at > now()) as held,
        (select count(*)::int from app.booking_passenger
          where booking_id = $1 and seat_no is not null) as expected`,
    [record.booking_id],
  );

  const { held, expected: seats } = inventory.rows[0];
  if (held < seats) throw new InventoryLostError(record.booking_id, sale.pnr);

  const paidAt = input.paidAt ?? null;

  try {
    // Activating the passengers is where interval exclusion finally fires for pending
    // rows that overlapped a sale completed while this customer paid. If it does,
    // the seat was sold in the gap and this money cannot become a ticket.
    await client.query(
      `update app.booking_passenger set status = 'active'
        where booking_id = $1 and status = 'pending'`,
      [record.booking_id],
    );
  } catch (error) {
    if (isInventoryConflict(error)) throw new InventoryLostError(record.booking_id, sale.pnr);
    throw error;
  }

  await client.query(
    `update app.seat_hold set status = 'consumed'
      where booking_id = $1 and status = 'active'`,
    [record.booking_id],
  );

  await client.query(
    `update app.booking
        set status = 'issued',
            paid_at = coalesce($2::timestamptz, now()),
            issued_at = coalesce($2::timestamptz, now())
      where id = $1 and status = 'pending_payment'`,
    [record.booking_id, paidAt],
  );

  await client.query(
    `update app.payment
        set status = 'paid', failure_code = null,
            paid_at = coalesce($2::timestamptz, now()), raw = $3, updated_at = now()
      where id = $1`,
    [record.id, paidAt, JSON.stringify(input.raw ?? {})],
  );

  await recordSale(client, {
    bookingId: record.booking_id,
    pnr: sale.pnr,
    operatorId: sale.operator_id,
    mode: sale.mode,
    countryCode: sale.country_code,
    grossMinor: Number(sale.total_minor),
    currency: sale.currency,
  });

  await client.query(
    `insert into app.booking_event (booking_id, type, payload, actor)
     values ($1, 'booking.issued', $2, 'payment-provider')`,
    [
      record.booking_id,
      JSON.stringify({
        pnr: sale.pnr,
        paymentId: record.id,
        provider: input.provider,
        orderReference: input.orderReference,
        amountMinor: input.amountMinor,
        currency: input.currency,
      }),
    ],
  );

  return {
    bookingId: record.booking_id,
    pnr: sale.pnr,
    bookingStatus: 'issued',
    paymentStatus: 'paid',
    failureCode: null,
    replay: false,
  };
}

/**
 * Records money that could not buy a seat.
 *
 * Runs in its own transaction because the original one rolled back. The booking is
 * cancelled — nobody is travelling — and the payment stays `unallocated` until a refund
 * reverses it. Both facts need to exist for finance to act on either.
 */
async function markUnallocated(input: ConfirmPaymentInput, lost: InventoryLostError): Promise<void> {
  await withTransaction(async (client) => {
    const updated = await client.query(
      `update app.payment
          set status = 'unallocated', failure_code = null,
              paid_at = coalesce($2::timestamptz, now()),
              raw = $3, updated_at = now()
        where provider = $1 and order_reference = $4
          and status not in ('paid', 'unallocated')`,
      [input.provider, input.paidAt ?? null, JSON.stringify(input.raw ?? {}), input.orderReference],
    );

    // Another worker already recorded it; nothing to add.
    if ((updated.rowCount ?? 0) === 0) return;

    await client.query(
      `update app.booking set status = 'cancelled'
        where id = $1 and status = 'pending_payment'`,
      [lost.bookingId],
    );
    await releaseFerryCapacity(client, [lost.bookingId]);
    await client.query(
      `update app.booking_passenger set status = 'cancelled'
        where booking_id = $1 and status = 'pending'`,
      [lost.bookingId],
    );
    await client.query(
      `update app.seat_hold set status = 'released'
        where booking_id = $1 and status = 'active'`,
      [lost.bookingId],
    );
    await client.query(
      `insert into app.booking_event (booking_id, type, payload, actor)
       values ($1, 'payment.unallocated', $2, 'payment-provider')`,
      [lost.bookingId, JSON.stringify({ pnr: lost.pnr, provider: input.provider, orderReference: input.orderReference })],
    );
    const money = await client.query<{
      amount_minor: string;
      currency: string;
      mode: string;
      operator_id: string;
    }>(
      `select p.amount_minor::text, p.currency, o.mode, o.id as operator_id
         from app.payment p
         join app.booking b on b.id = p.booking_id
         join app.operator o on o.id = b.operator_id
        where p.provider = $1 and p.order_reference = $2`,
      [input.provider, input.orderReference],
    );
    const row = money.rows[0];
    if (row) {
      await recordUnallocatedCollection(client, {
        orderReference: input.orderReference,
        mode: row.mode,
        currency: row.currency,
        amountMinor: Number(row.amount_minor),
        operatorId: row.operator_id,
      });
    }
  });
}

/** Marks an attempt failed without touching the booking: the customer may try again. */
export async function failPayment(input: {
  paymentId: string;
  failureCode: string;
}): Promise<boolean> {
  return withTransaction(async (client) => {
    const result = await client.query(
      `update app.payment
          set status = 'failed', failure_code = $2, updated_at = now()
        where id = $1 and status in ('initiated', 'pending')`,
      [input.paymentId, input.failureCode],
    );
    return (result.rowCount ?? 0) > 0;
  });
}

/**
 * Marks the attempt behind a provider reference as failed.
 *
 * Used by the ClickPesa `PAYMENT FAILED` webhook. The booking is deliberately untouched:
 * a failed attempt does not cancel the reservation, the customer can retry inside the
 * same payment window with a fresh order reference.
 */
export async function failPaymentByOrderReference(input: {
  provider: string;
  orderReference: string;
  failureCode: string;
}): Promise<boolean> {
  return withTransaction(async (client) => {
    const result = await client.query(
      `update app.payment
          set status = 'failed', failure_code = $3, updated_at = now()
        where provider = $1 and order_reference = $2 and status in ('initiated', 'pending')`,
      [input.provider, input.orderReference, input.failureCode],
    );
    return (result.rowCount ?? 0) > 0;
  });
}
