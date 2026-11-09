import { query, withTransaction } from '@/server/db';
import { isFinanceMode, isOperatorCommissionMode } from '@/domain/finance-modes';
import { HimsConflictError } from '@/server/hims/http';

export async function loadModeFinance(mode: string) {
  if (!isFinanceMode(mode)) throw new Error('invalid_mode');
  const [gross, payments, payables, unallocated, rates, payouts] = await Promise.all([
    query<{ currency: string; gross: string; travelar: string; operator_net: string; sales: string }>(
      `select currency,
              coalesce(sum(gross_minor),0)::text as gross,
              coalesce(sum(travelar_minor),0)::text as travelar,
              coalesce(sum(operator_net_minor),0)::text as operator_net,
              count(*)::text as sales
         from app.booking_commercial
        where mode = $1
        group by currency`,
      [mode],
    ),
    query<{ status: string; currency: string; amount: string; n: string }>(
      `select p.status::text, p.currency, coalesce(sum(p.amount_minor),0)::text as amount, count(*)::text as n
         from app.payment p
         join app.booking b on b.id = p.booking_id
         join app.operator o on o.id = b.operator_id
        where o.mode = $1
        group by p.status, p.currency`,
      [mode],
    ),
    query<{ operator_id: string; name: string; currency: string; payable: string }>(
      `select o.id as operator_id, o.name, j.currency,
              coalesce(sum(jl.credit_minor - jl.debit_minor), 0)::text as payable
         from app.journal_line jl
         join app.journal j on j.id = jl.journal_id
         join app.finance_account fa on fa.id = jl.account_id
         join app.operator o on o.id = jl.operator_id
        where j.mode = $1 and fa.code = '2100'
        group by o.id, o.name, j.currency`,
      [mode],
    ),
    query<{ currency: string; amount: string }>(
      `select j.currency, coalesce(sum(jl.credit_minor - jl.debit_minor),0)::text as amount
         from app.journal_line jl
         join app.journal j on j.id = jl.journal_id
         join app.finance_account fa on fa.id = jl.account_id
        where j.mode = $1 and fa.code = '2200'
        group by j.currency`,
      [mode],
    ),
    query(
      `select cr.id, cr.operator_id as "operatorId", o.name as "operatorName", cr.mode,
              cr.rate::float8 as rate, cr.revenue_type as "revenueType",
              cr.approval_status as "approvalStatus", cr.effective_from as "effectiveFrom",
              cr.effective_to as "effectiveTo", cr.proposed_by as "proposedBy", cr.approved_by as "approvedBy"
         from app.commission_rate cr
         join app.operator o on o.id = cr.operator_id
        where cr.mode = $1
        order by o.name, cr.effective_from desc`,
      [mode],
    ),
    query(
      `select pb.id, pb.status, pb.amount_minor as "amountMinor", pb.currency, pb.business_key as "businessKey",
              pb.hold_reason as "holdReason", pb.prepared_by as "preparedBy", pb.approved_by as "approvedBy",
              o.name as "operatorName", pb.created_at as "createdAt"
         from app.payout_batch pb
         join app.operator o on o.id = pb.operator_id
        where pb.mode = $1
        order by pb.created_at desc
        limit 50`,
      [mode],
    ),
  ]);

  return {
    mode,
    commercial: gross.rows.map((row) => ({
      currency: row.currency,
      grossMinor: Number(row.gross),
      travelarMinor: Number(row.travelar),
      operatorNetMinor: Number(row.operator_net),
      sales: Number(row.sales),
    })),
    payments: payments.rows.map((row) => ({
      status: row.status,
      currency: row.currency,
      amountMinor: Number(row.amount),
      count: Number(row.n),
    })),
    operatorPayables: payables.rows.map((row) => ({
      operatorId: row.operator_id,
      operatorName: row.name,
      currency: row.currency,
      payableMinor: Number(row.payable),
    })),
    unallocated: unallocated.rows.map((row) => ({
      currency: row.currency,
      amountMinor: Number(row.amount),
    })),
    commissionRates: rates.rows,
    payouts: payouts.rows,
    clickpesaPayout: 'not_dispatched',
  };
}

export async function loadOverview() {
  const { rows } = await query<{ mode: string; operators: string }>(
    `select mode, count(*)::text as operators from app.operator group by mode`,
  );
  return {
    modes: ['bus', 'ferry', 'flights', 'stays', 'train', 'experiences'].map((mode) => ({
      mode,
      operators: Number(rows.find((row) => row.mode === mode)?.operators ?? 0),
    })),
  };
}

export async function loadOperators() {
  const { rows } = await query(
    `select o.id, o.name, o.mode, o.status, o.currency, o.is_hq_approved as "hqApproved",
            o.latra_licence_number as "latraLicenceNumber"
       from app.operator o
      order by o.mode, o.name`,
  );
  return { data: rows };
}

export async function proposeCommission(input: {
  actor: string;
  operatorId: string;
  mode: string;
  rate: number;
  effectiveFrom: string;
  reason: string;
}) {
  if (!isOperatorCommissionMode(input.mode)) throw new Error('invalid_mode');
  if (!(input.rate >= 0 && input.rate <= 1)) throw new Error('invalid_rate');
  if (!input.reason.trim()) throw new Error('invalid_reason');
  const { rows } = await query<{ id: string }>(
    `insert into app.commission_rate (
        operator_id, mode, rate, revenue_type, effective_from, approval_status, proposed_by, reason
      ) values ($1, $2, $3, 'commission', $4::timestamptz, 'draft', $5, $6)
      returning id`,
    [input.operatorId, input.mode, input.rate, input.effectiveFrom, input.actor, input.reason.trim()],
  );
  return { id: rows[0]?.id, status: 'draft' };
}

export async function approveCommission(input: { actor: string; desk: string; rateId: string }) {
  if (input.desk !== 'admin') throw new HimsConflictError('checker_desk_required');
  const found = await query<{ proposed_by: string | null }>(
    `select proposed_by from app.commission_rate where id = $1`,
    [input.rateId],
  );
  const row = found.rows[0];
  if (!row) throw new Error('invalid_id');
  if (row.proposed_by && row.proposed_by === input.actor) throw new HimsConflictError('maker_checker_required');
  await query(
    `update app.commission_rate
        set approval_status = 'approved', approved_by = $2, approved_at = now()
      where id = $1 and approval_status = 'draft'`,
    [input.rateId, input.actor],
  );
}

export async function preparePayout(input: {
  actor: string;
  desk: string;
  mode: string;
  operatorId: string;
  currency: string;
}) {
  if (input.desk !== 'finance') throw new HimsConflictError('finance_desk_required');
  if (!isOperatorCommissionMode(input.mode)) throw new Error('invalid_mode');

  const paused = await query(`select 1 from app.payout_pause where active and (mode is null or mode = $1)`, [input.mode]);
  if (paused.rowCount) throw new HimsConflictError('payouts_paused');

  return withTransaction(async (client) => {
    const payable = await client.query<{ amount: string }>(
      `select coalesce(sum(jl.credit_minor - jl.debit_minor), 0)::text as amount
         from app.journal_line jl
         join app.journal j on j.id = jl.journal_id
         join app.finance_account fa on fa.id = jl.account_id
        where j.mode = $1 and fa.code = '2100' and jl.operator_id = $2 and j.currency = $3`,
      [input.mode, input.operatorId, input.currency],
    );
    const open = await client.query<{ amount: string }>(
      `select coalesce(sum(amount_minor),0)::text as amount
         from app.payout_batch
        where operator_id = $1 and mode = $2 and currency = $3
          and status in ('candidate', 'held', 'prepared', 'approved', 'intent', 'accepted')`,
      [input.operatorId, input.mode, input.currency],
    );
    const amount = Number(payable.rows[0]?.amount ?? 0) - Number(open.rows[0]?.amount ?? 0);
    if (amount <= 0) throw new HimsConflictError('nothing_payable');

    const beneficiary = await client.query<{ id: string; status: string; cooling_until: string }>(
      `select id, status, cooling_until::text
         from app.payout_beneficiary
        where operator_id = $1 and mode = $2 and currency = $3`,
      [input.operatorId, input.mode, input.currency],
    );
    const dest = beneficiary.rows[0];
    const key = `payout:${input.mode}:${input.operatorId}:${input.currency}:${new Date().toISOString().slice(0, 10)}`;
    let status = 'prepared';
    let hold: string | null = null;
    if (!dest) {
      status = 'held';
      hold = 'beneficiary_required';
    } else if (dest.status !== 'approved' || dest.cooling_until > new Date().toISOString()) {
      status = 'held';
      hold = 'beneficiary_cooling_or_frozen';
    }

    const inserted = await client.query<{ id: string }>(
      `insert into app.payout_batch (
          mode, operator_id, currency, amount_minor, status, business_key, beneficiary_id,
          hold_reason, prepared_by
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        on conflict (business_key) do update set updated_at = now()
        returning id`,
      [input.mode, input.operatorId, input.currency, amount, status, key, dest?.id ?? null, hold, input.actor],
    );
    return { id: inserted.rows[0]?.id, amountMinor: amount, status, holdReason: hold, clickpesa: 'not_dispatched' };
  });
}

export async function approvePayout(input: { actor: string; desk: string; payoutId: string }) {
  if (input.desk !== 'admin') throw new HimsConflictError('checker_desk_required');
  const found = await query<{ prepared_by: string | null; status: string }>(
    `select prepared_by, status from app.payout_batch where id = $1`,
    [input.payoutId],
  );
  const row = found.rows[0];
  if (!row) throw new Error('invalid_id');
  if (row.status !== 'prepared') throw new HimsConflictError('payout_not_prepared');
  if (row.prepared_by === input.actor) throw new HimsConflictError('maker_checker_required');
  await query(
    `update app.payout_batch set status = 'approved', approved_by = $2, updated_at = now()
      where id = $1 and status = 'prepared'`,
    [input.payoutId, input.actor],
  );
}

export async function createPayoutIntent(input: { actor: string; payoutId: string }) {
  const found = await query<{ status: string }>(`select status from app.payout_batch where id = $1`, [input.payoutId]);
  if (found.rows[0]?.status !== 'approved') throw new HimsConflictError('payout_not_approved');
  await query(
    `update app.payout_batch
        set status = 'intent', provider = 'none', provider_ref = null, updated_at = now()
      where id = $1 and status = 'approved'`,
    [input.payoutId],
  );
  return { status: 'intent', dispatched: false, reason: 'clickpesa_payout_requires_human_approval' };
}

export async function loadAudit(mode: string | null) {
  const { rows } = await query(
    mode
      ? `select id, actor, desk, action, object_type as "objectType", object_id as "objectId", mode, diff, at
           from app.hq_audit where mode = $1 order by at desc limit 100`
      : `select id, actor, desk, action, object_type as "objectType", object_id as "objectId", mode, diff, at
           from app.hq_audit order by at desc limit 100`,
    mode ? [mode] : [],
  );
  return { data: rows };
}

export async function loadMovements(mode: string) {
  if (!isFinanceMode(mode)) throw new Error('invalid_mode');
  const { rows } = await query(
    `select bc.booking_id as "bookingId", b.pnr, o.name as "operatorName", bc.mode, bc.currency,
            bc.gross_minor as "grossMinor", bc.travelar_minor as "travelarMinor",
            bc.operator_net_minor as "operatorNetMinor", bc.rate, bc.captured_at as "capturedAt"
       from app.booking_commercial bc
       join app.booking b on b.id = bc.booking_id
       join app.operator o on o.id = bc.operator_id
      where bc.mode = $1
      order by bc.captured_at desc
      limit 100`,
    [mode],
  );
  return { data: rows };
}
