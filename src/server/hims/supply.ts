import { query } from '@/server/db';
import { HimsConflictError } from '@/server/hims/http';
import { isFinanceMode } from '@/domain/finance-modes';
import { nextPipelineStatus } from '@/server/hims/permissions';
import { listPosRegistry } from '@/server/markets';

const TZ_MARKET = 'a0000000-0000-4000-8000-000000000001';

export async function loadOperatorsDetailed() {
  const { rows } = await query(
    `select o.id, o.name, o.mode, o.status, o.pipeline_status as "pipelineStatus", o.currency,
            o.is_hq_approved as "hqApproved", o.latra_licence_number as "latraLicenceNumber",
            o.tasac_licence_number as "tasacLicenceNumber", o.licence_valid_to as "licenceValidTo",
            o.electronic_ticketing_registered as "electronicTicketingRegistered",
            o.country_code as "countryCode"
       from app.operator o
      order by o.mode, o.name`,
  );
  return { data: rows };
}

export async function createOperatorLead(input: {
  name: string;
  mode: string;
  countryCode: string;
  currency: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error('invalid_operator_name');
  if (!isFinanceMode(input.mode)) throw new Error('invalid_mode');
  const country = input.countryCode.trim().toUpperCase();
  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z]{3}$/.test(currency)) throw new Error('invalid_geography');
  const market = await query<{ id: string }>(
    `select id from app.market where country_code = $1 order by created_at asc limit 1`,
    [country],
  );
  const marketId = market.rows[0]?.id ?? TZ_MARKET;
  const created = await query<{ id: string }>(
    `insert into app.operator (
       name, mode, country_code, currency, status, pipeline_status, is_hq_approved, source, market_id
     ) values ($1, $2, $3, $4, 'pending', 'lead', false, 'operator_contract', $5)
     returning id`,
    [name, input.mode, country, currency, marketId],
  );
  return { id: created.rows[0]!.id, pipelineStatus: 'lead' };
}

export async function requestPipelineAction(input: {
  actor: string;
  operatorId: string;
  action: 'advance' | 'activate' | 'suspend' | 'reinstate' | 'terminate';
  reason?: string;
}) {
  if (input.action === 'advance') {
    return changeOperatorPipeline({ operatorId: input.operatorId, action: 'advance' });
  }
  const found = await query<{ pipeline_status: string }>(
    `select pipeline_status from app.operator where id = $1`,
    [input.operatorId],
  );
  const current = found.rows[0]?.pipeline_status;
  if (!current) throw new Error('operator_not_found');
  nextPipelineStatus(current, input.action);
  const kind = input.action === 'activate' ? 'supplier_activation' : 'supplier_suspend';
  const { submitApproval } = await import('@/server/hims/work');
  const pending = await submitApproval({
    kind,
    objectType: 'operator',
    objectId: input.operatorId,
    maker: input.actor,
    reason: input.reason,
  });
  return { id: input.operatorId, pendingApprovalId: pending.id, action: input.action };
}

export async function changeOperatorPipeline(input: {
  operatorId: string;
  action: 'advance' | 'activate' | 'suspend' | 'reinstate' | 'terminate';
}) {
  const found = await query<{ pipeline_status: string }>(
    `select pipeline_status from app.operator where id = $1`,
    [input.operatorId],
  );
  const current = found.rows[0]?.pipeline_status;
  if (!current) throw new Error('operator_not_found');
  const next = nextPipelineStatus(current, input.action);
  const live = next === 'active';
  const suspended = next === 'suspended' || next === 'terminated';
  const status = live ? 'active' : suspended ? 'suspended' : 'pending';
  await query(
    `update app.operator
        set pipeline_status = $2,
            status = $3,
            is_hq_approved = $4,
            updated_at = now()
      where id = $1`,
    [input.operatorId, next, status, live],
  );
  return { id: input.operatorId, pipelineStatus: next, status };
}

export async function requireOperatorActiveForInvite(operatorId: string) {
  const found = await query<{ pipeline_status: string }>(
    `select pipeline_status from app.operator where id = $1`,
    [operatorId],
  );
  const status = found.rows[0]?.pipeline_status;
  if (status !== 'active') throw new HimsConflictError('operator_not_active');
}

export async function loadComplianceQueue() {
  const pos = await listPosRegistry();
  const { rows } = await query(
    `select o.id, o.name, o.mode, o.pipeline_status as "pipelineStatus",
            o.latra_licence_number as "latraLicenceNumber",
            o.tasac_licence_number as "tasacLicenceNumber",
            o.licence_valid_to as "licenceValidTo",
            o.electronic_ticketing_registered as "electronicTicketingRegistered",
            case
              when o.licence_valid_to is null then 'missing'
              when o.licence_valid_to < current_date then 'expired'
              when o.licence_valid_to < current_date + 30 then 'expiring'
              else 'current'
            end as "licenceHealth"
       from app.operator o
      order by o.licence_valid_to nulls first, o.name`,
  );
  return { data: rows, pos };
}

export async function loadControlTower() {
  const { rows } = await query(
    `select t.id, t.service_date as "serviceDate", t.status, o.id as "operatorId", o.name as "operatorName", o.mode,
            r.name as "routeName",
            exists(select 1 from app.manifest_issue m where m.trip_id = t.id) as "manifestIssued",
            (select count(*)::int from app.booking_passenger bp
              where bp.trip_id = t.id and bp.status = 'active') as booked,
            coalesce((
              select v.total_seats from app.vehicle v where v.id = t.vehicle_id
            ), (
              select sum(si.capacity)::int from app.sailing_inventory si where si.trip_id = t.id
            ), 0) as capacity,
            (select count(*)::int from app.booking b where b.trip_id = t.id and b.channel = 'otc' and b.status = 'issued') as "otcIssued",
            (select count(*)::int from app.booking b where b.trip_id = t.id and b.channel = 'online' and b.status = 'issued') as "onlineIssued"
       from app.trip t
       join app.operator o on o.id = t.operator_id
       join app.route r on r.id = t.route_id
      where t.service_date between current_date and current_date + 1
      order by t.service_date, o.name
      limit 300`,
  );
  return { data: rows };
}

export async function loadOperatorDossier(operatorId: string) {
  const found = await query(
    `select o.id, o.name, o.mode, o.status, o.pipeline_status as "pipelineStatus", o.currency,
            o.latra_licence_number as "latraLicenceNumber", o.tasac_licence_number as "tasacLicenceNumber",
            o.licence_valid_to as "licenceValidTo", o.electronic_ticketing_registered as "electronicTicketingRegistered"
       from app.operator o where o.id = $1`,
    [operatorId],
  );
  const operator = found.rows[0];
  if (!operator) throw new Error('invalid_operator_id');
  const [staff, routes, fleet, trips, channels, cases, lastManifest] = await Promise.all([
    query<{ n: string }>(`select count(*)::text as n from app.staff_assignment where operator_id = $1 and kind = 'oims' and status = 'active'`, [operatorId]),
    query<{ n: string }>(`select count(*)::text as n from app.route where operator_id = $1`, [operatorId]),
    query<{ vehicles: string; vessels: string; layouts: string }>(
      `select (select count(*)::text from app.vehicle where operator_id = $1) as vehicles,
              (select count(*)::text from app.vessel where operator_id = $1) as vessels,
              (select count(*)::text from app.seat_layout where operator_id = $1 and status = 'published') as layouts`,
      [operatorId],
    ),
    query(
      `select t.id, t.service_date as "serviceDate", t.status, r.name as "routeName",
              (select count(*)::int from app.booking_passenger bp where bp.trip_id = t.id and bp.status = 'active') as booked,
              coalesce((select v.total_seats from app.vehicle v where v.id = t.vehicle_id),
                       (select sum(si.capacity)::int from app.sailing_inventory si where si.trip_id = t.id), 0) as capacity
         from app.trip t join app.route r on r.id = t.route_id
        where t.operator_id = $1 and t.service_date between current_date and current_date + 1
        order by t.service_date limit 50`,
      [operatorId],
    ),
    query<{ channel: string; n: string }>(
      `select channel, count(*)::text as n from app.booking where operator_id = $1 and status = 'issued' group by channel`,
      [operatorId],
    ),
    query<{ n: string }>(
      `select count(*)::text as n from app.work_case where operator_id = $1 and status not in ('resolved', 'closed')`,
      [operatorId],
    ),
    query<{ issuedAt: string | null }>(
      `select m.issued_at as "issuedAt"
         from app.manifest_issue m
         join app.trip t on t.id = m.trip_id
        where t.operator_id = $1
        order by m.issued_at desc
        limit 1`,
      [operatorId],
    ),
  ]);
  return {
    operator,
    staffActive: Number(staff.rows[0]?.n ?? 0),
    routes: Number(routes.rows[0]?.n ?? 0),
    vehicles: Number(fleet.rows[0]?.vehicles ?? 0),
    vessels: Number(fleet.rows[0]?.vessels ?? 0),
    publishedLayouts: Number(fleet.rows[0]?.layouts ?? 0),
    trips: trips.rows,
    channels: channels.rows.map((row) => ({ channel: row.channel, count: Number(row.n) })),
    openCases: Number(cases.rows[0]?.n ?? 0),
    lastManifestIssuedAt: lastManifest.rows[0]?.issuedAt ?? null,
  };
}
