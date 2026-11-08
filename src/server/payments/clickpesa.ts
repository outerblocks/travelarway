/**
 * Payment service provider adapter: ClickPesa.
 *
 * Design constraints taken from ClickPesa's own documentation:
 *
 * - There is **no sandbox**. Every request moves real money. The adapter therefore refuses
 *   to run unless `CLICKPESA_LIVE=true` is set explicitly, so an accidental call from a
 *   test or a staging box cannot move funds.
 * - Credentials are server-side only (`client-id`, `api-key`). No token ever reaches the
 *   browser, and no token or connection detail is logged here.
 * - The token contains its own `Bearer ` prefix and is valid for one hour: mint once, reuse.
 *   Pre-KYC accounts are limited to 100 API calls per day *including* token generation, so
 *   caching is a correctness requirement, not an optimisation.
 * - `SUCCESS` means received, not settled. Settlement is a separate state and payouts may
 *   only draw on settled funds.
 *
 * Nothing in this file is called by a route yet: the interface exists so the booking
 * funnel can depend on a shape rather than on ClickPesa.
 */
import { withChecksum } from '@/server/payments/checksum';

/**
 * The only provider statuses that mean "the payment is confirmed".
 *
 * `PENDING` is the customer not yet acting; `PROCESSING` is the request in flight;
 * `ON-HOLD` needs merchant action. None of them is payment, and none may issue a ticket.
 * `SUCCESS` means ClickPesa has collected the money; `SETTLED` means it has reached the
 * merchant account. Both are confirmation — settlement only gates payouts.
 */
export const CONFIRMING_COLLECTION_STATUSES = new Set(['SUCCESS', 'SETTLED']);

export type CollectionStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'held'
  | 'voided'
  | 'refunded';

export type PayoutStatus = 'submitted' | 'processing' | 'paid' | 'returned' | 'failed';

export interface CollectionRequest {
  orderReference: string;
  amountMinor: number;
  currency: string;
  phoneNumber: string;
}

/** One payment method ClickPesa would use, and what it would cost. */
export interface PreviewedMethod {
  name: string;
  available: boolean;
  /** Provider fee for this method, when it is available. */
  fee: number | null;
  message: string | null;
}

export interface CollectionPreview {
  methods: PreviewedMethod[];
  sender: { name: string | null; number: string | null; provider: string | null } | null;
  raw: Record<string, unknown>;
}

export interface CardCollectionRequest {
  orderReference: string;
  amountMinor: number;
  /** ClickPesa's card API is USD-only. Enforced by the adapter, not by hope. */
  currency: string;
  customer: { fullName: string; email: string; phoneNumber: string };
}

export interface CardCollectionResult {
  orderReference: string;
  /** Hosted page the customer must complete. The PAN never reaches this origin. */
  redirectUrl: string | null;
  raw: Record<string, unknown>;
}

export interface CollectionResult {
  orderReference: string;
  providerReference: string | null;
  status: CollectionStatus;
  raw: Record<string, unknown>;
}

export interface PayoutRequest {
  orderReference: string;
  amountMinor: number;
  currency: string;
  /** Either a mobile wallet or a bank account, decided by the caller. */
  destination: { kind: 'mobile'; phoneNumber: string } | { kind: 'bank'; accountNumber: string; accountName: string };
}

export interface PaymentProvider {
  readonly name: string;
  readonly live: boolean;
  previewCollection(request: CollectionRequest): Promise<CollectionPreview>;
  initiateCollection(request: CollectionRequest): Promise<CollectionResult>;
  initiateCardPayment(request: CardCollectionRequest): Promise<CardCollectionResult>;
  getCollectionStatus(orderReference: string): Promise<CollectionResult>;
  initiatePayout(request: PayoutRequest): Promise<{ orderReference: string; status: PayoutStatus }>;
}

const BASE_URL = 'https://api.clickpesa.com/third-parties';

/** ClickPesa statuses mapped onto our lifecycle. Never collapse refunded and reversed. */
const COLLECTION_STATUS: Record<string, CollectionStatus> = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'paid',
  SETTLED: 'paid',
  FAILED: 'failed',
  'ON-HOLD': 'held',
  REFUNDED: 'voided',
  REVERSED: 'refunded',
};

const PAYOUT_STATUS: Record<string, PayoutStatus> = {
  AUTHORIZED: 'submitted',
  PROCESSING: 'processing',
  SUCCESS: 'paid',
  REFUNDED: 'returned',
  REVERSED: 'returned',
};

export class PaymentConfigurationError extends Error {}
export class PaymentNotEnabledError extends Error {
  constructor() {
    super('live_payments_disabled');
  }
}

/**
 * The provider is throttling us.
 *
 * ClickPesa limits token requests (pre-KYC also caps the whole day at 100 calls). A 429 is
 * not a configuration fault and not a customer mistake — it is "come back shortly", and it
 * has to be distinguishable so the customer is told that instead of "did not respond".
 */
export class PaymentRateLimitedError extends Error {
  constructor(public readonly retryAfterSeconds: number | null) {
    super('payment_rate_limited');
  }
}

/** Extracts "Try again in 66 seconds" from their 429 body. */
const retryAfterFrom = (body: unknown): number | null => {
  const message = (body as { message?: unknown })?.message;
  if (typeof message !== 'string') return null;
  const match = /(\d+)\s*second/i.exec(message);
  return match ? Number(match[1]) : null;
};

/** Raised rather than sending a currency their endpoint will reject. */
export class UnsupportedCurrencyError extends Error {
  constructor(public readonly currency: string) {
    super(`unsupported_currency:${currency}`);
  }
}

/**
 * The provider answered and refused. Carries the HTTP status and their own sentence, which
 * is the only thing that makes a failed collection diagnosable — "Invalid / unsupported
 * phone number" tells a customer what to fix; "provider_error" tells nobody anything.
 */
export class ProviderRejectedError extends Error {
  constructor(
    public readonly status: number,
    public readonly providerMessage: string,
  ) {
    super(providerMessage || `provider_rejected_${status}`);
  }
}

interface ClickPesaOptions {
  clientId: string;
  apiKey: string;
  live: boolean;
  /** Present only when checksums are enabled on the merchant account. */
  checksumSecret?: string;
  fetchImpl?: typeof fetch;
}

export class ClickPesaProvider implements PaymentProvider {
  readonly name = 'clickpesa';
  readonly live: boolean;

  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumSecret?: string;
  private readonly fetchImpl: typeof fetch;
  private token: { value: string; expiresAt: number } | null = null;

  constructor(options: ClickPesaOptions) {
    this.clientId = options.clientId;
    this.apiKey = options.apiKey;
    this.checksumSecret = options.checksumSecret;
    this.live = options.live;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /** Token is valid for an hour; regenerate only when it is close to expiring. */
  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 60_000) return this.token.value;

    const response = await this.fetchImpl(`${BASE_URL}/generate-token`, {
      method: 'POST',
      headers: { 'client-id': this.clientId, 'api-key': this.apiKey },
    });
    if (response.status === 429) {
      const body = await response.json().catch(() => null);
      throw new PaymentRateLimitedError(retryAfterFrom(body));
    }
    if (!response.ok) throw new PaymentConfigurationError('clickpesa_token_failed');

    const body = (await response.json()) as { token?: string };
    if (!body.token) throw new PaymentConfigurationError('clickpesa_token_missing');

    // The response token already carries the "Bearer " prefix.
    this.token = { value: body.token, expiresAt: now + 3_600_000 };
    return this.token.value;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.live) throw new PaymentNotEnabledError();
    if (!this.clientId || !this.apiKey) {
      throw new PaymentConfigurationError('clickpesa_credentials_missing');
    }

    const token = await this.getToken();
    const response = await this.fetchImpl(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        authorization: token,
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      // Their validation errors carry a human message ("Invalid / unsupported phone
      // number"). Keeping it turns an opaque provider_error into something diagnosable;
      // their message never echoes credentials or a token.
      const detail = await response
        .json()
        .then((body: unknown) =>
          typeof (body as { message?: unknown })?.message === 'string'
            ? ((body as { message: string }).message)
            : '',
        )
        .catch(() => '');

      if (response.status === 429) {
        throw new PaymentRateLimitedError(retryAfterFrom({ message: detail }));
      }

      console.error('[clickpesa] request failed', path, response.status, detail || '(no message)');
      throw new ProviderRejectedError(response.status, detail);
    }

    return (await response.json()) as T;
  }

  /**
   * `POST /payments/preview-ussd-push-request`
   *
   * Validates the amount, the reference and the phone number, and reports which wallets
   * are available with their fees. It costs one API call, so it is offered as an explicit
   * step rather than fired on every keystroke.
   */
  async previewCollection(request: CollectionRequest): Promise<CollectionPreview> {
    const body = withChecksum(this.checksumSecret, {
      amount: String(Math.round(request.amountMinor)),
      currency: request.currency,
      orderReference: request.orderReference,
      phoneNumber: request.phoneNumber.replace(/^\+/, ''),
    });

    const preview = await this.request<{
      activeMethods?: {
        name?: string;
        status?: string;
        fee?: number;
        message?: number | string;
      }[];
      sender?: { accountName?: string; accountNumber?: string; accountProvider?: string };
    }>('/payments/preview-ussd-push-request', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      methods: (preview.activeMethods ?? []).map((method) => ({
        name: method.name ?? 'unknown',
        available: method.status === 'AVAILABLE',
        fee: typeof method.fee === 'number' ? method.fee : null,
        message: method.message === undefined ? null : String(method.message),
      })),
      sender: preview.sender
        ? {
            name: preview.sender.accountName ?? null,
            number: preview.sender.accountNumber ?? null,
            provider: preview.sender.accountProvider ?? null,
          }
        : null,
      raw: preview as Record<string, unknown>,
    };
  }

  /**
   * `POST /payments/initiate-card-payment`
   *
   * Returns a hosted payment link: the card number is entered on ClickPesa's page, so this
   * origin stays outside PCI scope. Their card API accepts USD only, so anything else is
   * refused here rather than sent to fail at the provider.
   */
  async initiateCardPayment(request: CardCollectionRequest): Promise<CardCollectionResult> {
    if (request.currency.toUpperCase() !== 'USD') {
      throw new UnsupportedCurrencyError(request.currency);
    }

    const body = withChecksum(this.checksumSecret, {
      amount: String(Math.round(request.amountMinor)),
      currency: 'USD',
      orderReference: request.orderReference,
      customer: {
        fullName: request.customer.fullName,
        email: request.customer.email,
        phoneNumber: request.customer.phoneNumber.replace(/^\+/, ''),
      },
    });

    const created = await this.request<{ cardPaymentLink?: string }>(
      '/payments/initiate-card-payment',
      { method: 'POST', body: JSON.stringify(body) },
    );

    return {
      orderReference: request.orderReference,
      redirectUrl: created.cardPaymentLink ?? null,
      raw: created as Record<string, unknown>,
    };
  }

  async initiateCollection(request: CollectionRequest): Promise<CollectionResult> {
    // ClickPesa takes the amount as a string with no decimals for TZS, in major units.
    // The `amountMinor` name is this codebase's legacy: the columns hold major units and a
    // rename is a separate migration. Sending minor units here would overcharge by 100x.
    const body = withChecksum(this.checksumSecret, {
      amount: String(Math.round(request.amountMinor)),
      currency: request.currency,
      orderReference: request.orderReference,
      phoneNumber: request.phoneNumber.replace(/^\+/, ''),
    });

    const created = await this.request<{
      id?: string;
      status?: string;
      collectedAmount?: string;
      orderReference?: string;
    }>('/payments/initiate-ussd-push-request', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      orderReference: request.orderReference,
      providerReference: created.id ?? null,
      status: COLLECTION_STATUS[created.status ?? 'PROCESSING'] ?? 'processing',
      raw: created as Record<string, unknown>,
    };
  }

  /**
   * `GET /payments/{orderReference}` — the documented path, which returns an array.
   *
   * The most recent entry is the one that matters: a reference can only be reused after a
   * failure, and the later row is the attempt being asked about.
   */
  async getCollectionStatus(orderReference: string): Promise<CollectionResult> {
    let result:
      | { status?: string; paymentReference?: string; id?: string; collectedAmount?: string | number }
      | { status?: string; paymentReference?: string; id?: string; collectedAmount?: string | number }[];

    try {
      result = await this.request<
        | { status?: string; paymentReference?: string; id?: string; collectedAmount?: string | number }
        | { status?: string; paymentReference?: string; id?: string; collectedAmount?: string | number }[]
      >(`/payments/${encodeURIComponent(orderReference)}`);
    } catch (error) {
      // Their OpenAPI documents 404 for an unknown reference; the live API answers 400 with
      // "Invalid or missing payment: <ref>". Both mean the same thing — we have not been
      // seen yet — and neither is a failure. Treating it as one would break the status
      // fallback precisely when a webhook has not arrived.
      if (error instanceof ProviderRejectedError && error.status === 400) {
        return {
          orderReference,
          providerReference: null,
          status: 'pending',
          raw: { notFoundAtProvider: true },
        };
      }
      throw error;
    }

    const rows = Array.isArray(result) ? result : [result];
    const latest = rows[rows.length - 1] ?? {};

    return {
      orderReference,
      providerReference: latest.paymentReference ?? latest.id ?? null,
      status: COLLECTION_STATUS[latest.status ?? 'PENDING'] ?? 'pending',
      raw: latest as Record<string, unknown>,
    };
  }

  async initiatePayout(request: PayoutRequest): Promise<{ orderReference: string; status: PayoutStatus }> {
    const destination =
      request.destination.kind === 'mobile'
        ? { phoneNumber: request.destination.phoneNumber.replace(/^\+/, '') }
        : {
            accountNumber: request.destination.accountNumber,
            accountName: request.destination.accountName,
          };

    const created = await this.request<{ status?: string }>(
      request.destination.kind === 'mobile' ? '/payouts/initiate-mno-payout' : '/payouts/initiate-bank-payout',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: String(Math.round(request.amountMinor)),
          currency: request.currency,
          orderReference: request.orderReference,
          ...destination,
        }),
      },
    );

    return {
      orderReference: request.orderReference,
      // AUTHORIZED is acknowledgement, not payment: mapped to 'submitted'.
      status: PAYOUT_STATUS[created.status ?? 'AUTHORIZED'] ?? 'submitted',
    };
  }
}

/**
 * Server-side factory. Refuses to construct a live provider without explicit opt-in.
 *
 * The instance is cached for the process. It holds the bearer token, which is valid for an
 * hour and whose minting is rate-limited by the provider — building a provider per request
 * would throw that cache away and mint a token on every payment attempt. That is exactly
 * what produced `429 Too many token requests` in production traffic.
 *
 * `fetchImpl` is only passed by tests, which want an isolated instance.
 */
let sharedProvider: PaymentProvider | null = null;

export function getPaymentProvider(fetchImpl?: typeof fetch): PaymentProvider {
  if (fetchImpl) {
    return new ClickPesaProvider({
      clientId: process.env.CLICKPESA_CLIENT_ID ?? '',
      apiKey: process.env.CLICKPESA_API_KEY ?? '',
      checksumSecret: process.env.CLICKPESA_CHECKSUM_SECRET,
      live: process.env.CLICKPESA_LIVE === 'true',
      fetchImpl,
    });
  }

  if (!sharedProvider) {
    sharedProvider = new ClickPesaProvider({
      clientId: process.env.CLICKPESA_CLIENT_ID ?? '',
      apiKey: process.env.CLICKPESA_API_KEY ?? '',
      checksumSecret: process.env.CLICKPESA_CHECKSUM_SECRET,
      live: process.env.CLICKPESA_LIVE === 'true',
    });
  }

  return sharedProvider;
}
