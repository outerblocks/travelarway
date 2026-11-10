import { query, withTransaction } from '@/server/db';
import { HimsConflictError } from '@/server/hims/http';
import { assertMakerChecker, slaDueAt } from '@/server/hims/permissions';

export async function listApprovals(status = 'submitted') {
  const { rows } = await query(
    `select id, kind, status, object_type as "objectType", object_id as "objectId",
            maker, checker, reason, decided_reason as "decidedReason", mode, created_at as "createdAt"
       from app.approval_item
      where status = $1
      order by created_at asc
      limit 200`,
    [status],
  );
  return { data: rows };
}

export async function submitApproval(input: {
  kind: string;
  objectType: string;
  objectId: string;
  maker: string;
  reason?: string;
  mode?: string | null;
}) {
  const { rows } = await query<{ id: string }>(
    `insert into app.approval_item (kind, object_type, object_id, maker, reason, mode)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (kind, object_id) where status = 'submitted'
     do update set reason = excluded.reason
     returning id`,
    [input.kind, input.objectType, input.objectId, input.maker, input.reason ?? null, input.mode ?? null],
  );
  return { id: rows[0]?.id };
}

export async function decideApproval(input: {
  id: string;
  checker: string;
  decision: 'approved' | 'rejected' | 'withdrawn';
  reason: string;
}) {
  if (!input.reason.trim() && input.decision !== 'withdrawn') throw new Error('invalid_reason');
  const found = await query<{ maker: string; status: string; kind: string; object_id: string }>(
    `select maker, status, kind, object_id from app.approval_item where id = $1`,
    [input.id],
  );
  const row = found.rows[0];
  if (!row) throw new Error('invalid_id');
  if (row.status !== 'submitted') throw new HimsConflictError('approval_not_open');
  if (input.decision === 'withdrawn') {
    if (row.maker !== input.checker) throw new HimsConflictError('maker_checker_required');
  } else {
    assertMakerChecker(row.maker, input.checker);
  }
  await query(
    `update app.approval_item
        set status = $2, checker = $3, decided_reason = $4, decided_at = now()
      where id = $1 and status = 'submitted'`,
    [input.id, input.decision, input.checker, input.reason.trim() || null],
  );
  return { kind: row.kind, objectId: row.object_id, decision: input.decision };
}

export async function applyApprovalDecision(input: {
  id: string;
  checker: string;
  decision: 'approved' | 'rejected' | 'withdrawn';
  reason: string;
}) {
  const result = await decideApproval(input);
  if (result.decision !== 'approved') return result;
  if (result.kind === 'commission') {
    const { approveCommission } = await import('@/server/hims/repository');
    await approveCommission({ actor: input.checker, desk: 'admin', rateId: result.objectId });
  } else if (result.kind === 'payout') {
    const { approvePayout } = await import('@/server/hims/repository');
    await approvePayout({ actor: input.checker, desk: 'admin', payoutId: result.objectId });
  } else if (result.kind === 'supplier_activation') {
    const { changeOperatorPipeline } = await import('@/server/hims/supply');
    await changeOperatorPipeline({ operatorId: result.objectId, action: 'activate' });
  } else if (result.kind === 'supplier_suspend') {
    const { changeOperatorPipeline } = await import('@/server/hims/supply');
    await changeOperatorPipeline({ operatorId: result.objectId, action: 'suspend' });
  }
  return result;
}

export async function submitQuotedRefund(input: {
  actorUserId: string;
  actor: string;
  bookingId: string;
  reason: string;
}) {
  if (!input.reason.trim()) throw new Error('invalid_reason');
  const found = await query<{ id: string; total_minor: number; pnr: string }>(
    `select id, total_minor, pnr from app.booking where id = $1`,
    [input.bookingId],
  );
  const booking = found.rows[0];
  if (!booking) throw new Error('invalid_booking');
  const opened = await createCase({
    actorUserId: input.actorUserId,
    actor: input.actor,
    kind: 'refund',
    priority: 'p2',
    title: `Refund ${booking.pnr} quoted ${booking.total_minor}`,
    bookingId: booking.id,
  });
  const approval = await submitApproval({
    kind: 'refund',
    objectType: 'booking',
    objectId: booking.id,
    maker: input.actor,
    reason: `${input.reason.trim()} quoted_minor=${booking.total_minor}`,
  });
  return { caseId: opened.id, approvalId: approval.id, quotedMinor: booking.total_minor };
}

export async function listCases(kind?: string) {
  const { rows } = await query(
    kind
      ? `select c.id, c.kind, c.priority, c.status, c.title, c.sla_due_at as "slaDueAt",
                c.booking_id as "bookingId", c.operator_id as "operatorId",
                o.name as "operatorName", b.pnr,
                c.created_at as "createdAt"
           from app.work_case c
           left join app.operator o on o.id = c.operator_id
           left join app.booking b on b.id = c.booking_id
          where c.kind = $1
          order by c.created_at desc
          limit 200`
      : `select c.id, c.kind, c.priority, c.status, c.title, c.sla_due_at as "slaDueAt",
                c.booking_id as "bookingId", c.operator_id as "operatorId",
                o.name as "operatorName", b.pnr,
                c.created_at as "createdAt"
           from app.work_case c
           left join app.operator o on o.id = c.operator_id
           left join app.booking b on b.id = c.booking_id
          order by c.created_at desc
          limit 200`,
    kind ? [kind] : [],
  );
  return { data: rows };
}

export async function createCase(input: {
  actorUserId: string;
  actor: string;
  kind: string;
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  title: string;
  bookingId?: string | null;
  operatorId?: string | null;
  marketId?: string | null;
}) {
  if (!input.title.trim()) throw new Error('invalid_title');
  const due = slaDueAt(input.priority);
  return withTransaction(async (client) => {
    const created = await client.query<{ id: string }>(
      `insert into app.work_case (
         kind, priority, status, title, market_id, booking_id, operator_id, sla_due_at, created_by, owner_user_id
       ) values ($1, $2, 'open', $3, $4, $5, $6, $7, $8, $8)
       returning id`,
      [
        input.kind,
        input.priority,
        input.title.trim(),
        input.marketId ?? null,
        input.bookingId ?? null,
        input.operatorId ?? null,
        due.toISOString(),
        input.actorUserId,
      ],
    );
    const id = created.rows[0]!.id;
    await client.query(
      `insert into app.work_event (case_id, actor, kind, note) values ($1, $2, 'opened', $3)`,
      [id, input.actor, input.title.trim()],
    );
    return { id, slaDueAt: due.toISOString() };
  });
}

export async function escalateCase(input: { caseId: string; actor: string; severity: 'p1' | 'p2' }) {
  const found = await query(`select id, status from app.work_case where id = $1`, [input.caseId]);
  if (!found.rowCount) throw new Error('invalid_id');
  await withTransaction(async (client) => {
    await client.query(`update app.work_case set status = 'escalated', priority = $2, updated_at = now() where id = $1`, [
      input.caseId,
      input.severity,
    ]);
    await client.query(
      `insert into app.escalation (case_id, severity, raised_by) values ($1, $2, $3)`,
      [input.caseId, input.severity, input.actor],
    );
    await client.query(
      `insert into app.work_event (case_id, actor, kind, note) values ($1, $2, 'escalated', $3)`,
      [input.caseId, input.actor, input.severity],
    );
  });
  return { ok: true };
}

export async function lookupBooking(pnr: string) {
  const code = pnr.trim().toUpperCase();
  if (!code) throw new Error('invalid_pnr');
  const { rows } = await query(
    `select b.id, b.pnr, b.status::text as status, b.channel, b.currency, b.total_minor as "totalMinor",
            o.id as "operatorId", o.name as "operatorName", o.mode
       from app.booking b
       join app.operator o on o.id = b.operator_id
      where b.pnr = $1
      limit 1`,
    [code],
  );
  return rows[0] ?? null;
}
