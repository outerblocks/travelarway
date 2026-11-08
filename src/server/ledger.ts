/**
 * The revenue record.
 *
 * A ledger row is written when, and only when, a sale actually happens: seats are sold
 * and the money has been confirmed. `createBooking` deliberately does not call this — a
 * pending checkout is not revenue, and a ledger row for it would show income that never
 * reached a bank.
 */
import type pg from 'pg';

export class RevenueRuleError extends Error {
  constructor(public readonly reason: 'markup_requires_supplier_net' | 'no_commission_rate') {
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
}

/**
 * Records one sale inside the caller's transaction.
 *
 * Commission modes take a share of the gross; markup modes earn the difference between
 * the customer's price and the supplier's net rate. There is no supplier net rate in the
 * schema yet, so markup refuses loudly instead of inventing a cost — an invented cost
 * produces invented profit, and profit is the number people act on.
 */
export async function recordSale(client: pg.PoolClient, input: SaleInput): Promise<void> {
  const rate = await client.query<{ rate: string; revenue_type: string }>(
    `select rate::text, revenue_type::text
       from app.commission_rate
      where operator_id = $1 and mode = $2 and effective_from <= now()
        and (effective_to is null or effective_to > now())
      order by effective_from desc limit 1`,
    [input.operatorId, input.mode],
  );

  if (rate.rowCount === 0) throw new RevenueRuleError('no_commission_rate');

  const revenueType = rate.rows[0].revenue_type === 'markup' ? 'markup' : 'commission';
  if (revenueType === 'markup') throw new RevenueRuleError('markup_requires_supplier_net');

  const revenue = Math.round(input.grossMinor * Number(rate.rows[0].rate));
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
}
