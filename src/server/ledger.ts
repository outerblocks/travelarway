/**
 * The revenue record plus the balanced mode subledger.
 *
 * A ledger row is written when, and only when, a sale actually happens. Commission is
 * read from the operator's approved, effective-dated agreement for that mode — never a
 * hardcoded percentage. The booking_commercial snapshot freezes the math for disputes.
 */
import type pg from 'pg';
import { commercialSaleBlocked } from '@/domain/finance-modes';
import { postBalancedJournal } from '@/server/finance/journal';

export class RevenueRuleError extends Error {
  constructor(public readonly reason: string) {
    super(`revenue_rule:${reason}`);
  }
}

export interface SaleInput {
  bookingId: string;
  pnr: string;
  operatorId: string;
  mode: string;
  countryCode: string;
  grossMinor: number;
  currency: string;
  collection?: 'psp' | 'otc_cash';
}

export async function recordSale(client: pg.PoolClient, input: SaleInput): Promise<void> {
  const blocked = commercialSaleBlocked(input.mode);
  if (blocked) throw new RevenueRuleError(blocked);

  const rate = await client.query<{ id: string; rate: string; revenue_type: string }>(
    `select id, rate::text, revenue_type::text
       from app.commission_rate
      where operator_id = $1 and mode = $2
        and approval_status = 'approved'
        and effective_from <= now()
        and (effective_to is null or effective_to > now())
      order by effective_from desc limit 1`,
    [input.operatorId, input.mode],
  );

  if (rate.rowCount === 0) throw new RevenueRuleError('no_commission_rate');

  const revenueType = rate.rows[0].revenue_type === 'markup' ? 'markup' : 'commission';
  if (revenueType === 'markup') throw new RevenueRuleError('markup_requires_supplier_net');

  const share = Number(rate.rows[0].rate);
  if (!Number.isFinite(share) || share < 0 || share > 1) throw new RevenueRuleError('no_commission_rate');
  const revenue = Math.round(input.grossMinor * share);
  const supplierCost = Math.max(0, input.grossMinor - revenue);

  await client.query(
    `insert into app.ledger_entry
       (booking_id, document_type, document_number, party_type, party_id, mode, pos_country,
        revenue_type, currency, base_minor, gross_minor, supplier_cost_minor, revenue_minor,
        status, issued_at)
     values ($1, 'voucher', $2, 'operator', $3, $4, $5, $6, $7, $8, $8, $9, $10, 'issued', now())`,
    [
      input.bookingId,
      input.pnr,
      input.operatorId,
      input.mode,
      input.countryCode,
      revenueType,
      input.currency,
      input.grossMinor,
      supplierCost,
      revenue,
    ],
  );

  await client.query(
    `insert into app.booking_commercial (
        booking_id, operator_id, mode, currency, commission_rate_id, rate, revenue_type,
        gross_minor, travelar_minor, operator_net_minor
      ) values ($1, $2, $3, $4, $5, $6, 'commission', $7, $8, $9)
      on conflict (booking_id) do nothing`,
    [
      input.bookingId,
      input.operatorId,
      input.mode,
      input.currency,
      rate.rows[0].id,
      share,
      input.grossMinor,
      revenue,
      supplierCost,
    ],
  );

  const otc = input.collection === 'otc_cash';
  if (otc && revenue <= 0) return;
  await postBalancedJournal(client, {
    mode: input.mode,
    currency: input.currency,
    sourceType: 'sale',
    sourceId: input.bookingId,
    memo: otc ? `OTC cash ${input.pnr}` : `Sale ${input.pnr}`,
    lines: otc
      ? [
          { accountCode: '2100', debitMinor: revenue, operatorId: input.operatorId },
          { accountCode: '4100', creditMinor: revenue },
        ]
      : [
          { accountCode: '1100', debitMinor: input.grossMinor },
          { accountCode: '4100', creditMinor: revenue },
          { accountCode: '2100', creditMinor: supplierCost, operatorId: input.operatorId },
        ],
  });
}

export async function reverseSaleJournal(
  client: pg.PoolClient,
  input: { bookingId: string; kind: string },
): Promise<void> {
  const snap = await client.query<{
    mode: string;
    currency: string;
    operator_id: string;
    gross_minor: string;
    travelar_minor: string;
    operator_net_minor: string;
  }>(
    `select mode, currency, operator_id, gross_minor::text, travelar_minor::text, operator_net_minor::text
       from app.booking_commercial where booking_id = $1`,
    [input.bookingId],
  );
  const row = snap.rows[0];
  if (!row) return;
  const gross = Number(row.gross_minor);
  const travelar = Number(row.travelar_minor);
  const operatorNet = Number(row.operator_net_minor);
  await postBalancedJournal(client, {
    mode: row.mode,
    currency: row.currency,
    sourceType: 'reversal',
    sourceId: `${input.bookingId}:${input.kind}`,
    memo: `Reversal ${input.kind}`,
    lines: [
      { accountCode: '4100', debitMinor: travelar },
      { accountCode: '2100', debitMinor: operatorNet, operatorId: row.operator_id },
      { accountCode: '1100', creditMinor: gross },
    ],
  });
}

export async function recordUnallocatedCollection(
  client: pg.PoolClient,
  input: {
    orderReference: string;
    mode: string;
    currency: string;
    amountMinor: number;
    operatorId: string | null;
  },
): Promise<void> {
  if (input.amountMinor <= 0) return;
  await postBalancedJournal(client, {
    mode: input.mode,
    currency: input.currency,
    sourceType: 'unallocated',
    sourceId: input.orderReference,
    memo: 'Paid collection without a ticket',
    lines: [
      { accountCode: '1100', debitMinor: input.amountMinor },
      { accountCode: '2200', creditMinor: input.amountMinor, operatorId: input.operatorId },
    ],
  });
}
