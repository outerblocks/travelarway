import { query, withTransaction } from '@/server/db';
import { occurrenceDates } from '@/server/oims/calendar';
import { buildManifest, latraCopies, tasacCopies, type ManifestDocument } from '@/server/oims/manifest';
import { publicationBlocks, type OperatorReadiness } from '@/server/oims/readiness';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class OimsForbiddenError extends Error {
  constructor() {
    super('oims_forbidden');
  }
}

export class OimsNotReadyError extends Error {
  constructor(public readonly blocks: string[]) {
    super('oims_not_ready');
  }
}

async function audit(operatorId: string, actor: string, action: string, objectType: string, objectId: string | null, diff: unknown) {
  await query(
    `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
     values ($1, $2, $3, $4, $5, $6::jsonb)`,
    [operatorId, actor, action, objectType, objectId, JSON.stringify(diff ?? {})],
  );
}

export async function loadWorkspace(operatorId: string, mode: 'bus' | 'ferry') {
  const operator = await loadOperator(operatorId, mode);
  const [routes, schedules, vehicles, vessels, trips] = await Promise.all([
    query(
      `select r.id, r.name, r.mode,
              coalesce(json_agg(json_build_object(
                'id', rs.id, 'sequence', rs.sequence, 'offsetMinutes', rs.offset_minutes,
                'terminalName', rs.terminal_name, 'locationId', rs.location_id,
                'locationName', l.name, 'locationCode', l.code
              ) order by rs.sequence) filter (where rs.id is not null), '[]'::json) as stops,
              coalesce((
                select json_agg(json_build_object(
                  'fromStopId', sf.from_stop_id, 'toStopId', sf.to_stop_id,
                  'fareMinor', sf.fare_minor, 'currency', sf.currency
                ))
                  from app.segment_fare sf
                 where sf.route_id = r.id
              ), '[]'::json) as fares
         from app.route r
         left join app.route_stop rs on rs.route_id = r.id
         left join app.location l on l.id = rs.location_id
        where r.operator_id = $1 and r.mode = $2
        group by r.id
        order by r.name`,
      [operatorId, mode],
    ),
    query(
      `select s.id, s.route_id as "routeId", to_char(s.departure_time, 'HH24:MI') as "departureTime",
              s.days_of_week as "daysOfWeek", s.valid_from as "validFrom", s.valid_to as "validTo",
              s.service_timezone as "timezone", s.vessel_id as "vesselId", s.status
         from app.schedule s
        where s.operator_id = $1
        order by s.valid_from desc`,
      [operatorId],
    ),
    query(
      `select v.id, v.registration, v.model, v.service_class as "serviceClass", v.total_seats as "totalSeats",
              v.seat_layout_id as "seatLayoutId"
         from app.vehicle v
        where v.operator_id = $1
        order by v.registration`,
      [operatorId],
    ),
    query(
      `select vs.id, vs.name, vs.registration, vs.passenger_certificate_max as "passengerCertificateMax",
              vs.status, vs.last_inspection as "lastInspection",
              coalesce(json_agg(json_build_object(
                'id', vc.id, 'name', vc.name, 'capacity', vc.capacity,
                'adultFareMinor', vc.adult_fare_minor, 'childFareMinor', vc.child_fare_minor,
                'currency', vc.currency
              ) ) filter (where vc.id is not null), '[]'::json) as classes
         from app.vessel vs
         left join app.vessel_class vc on vc.vessel_id = vs.id
        where vs.operator_id = $1
        group by vs.id
        order by vs.name`,
      [operatorId],
    ),
    query(
      `select t.id, t.schedule_id as "scheduleId", t.service_date as "serviceDate", t.status,
              t.vehicle_id as "vehicleId", t.vessel_id as "vesselId"
         from app.trip t
        where t.operator_id = $1
          and t.service_date >= current_date
        order by t.service_date, t.id
        limit 200`,
      [operatorId],
    ),
  ]);
  const bookings = await query(
    `select b.id, b.pnr as reference, b.status::text as status, b.channel, b.currency,
            b.total_minor as "amountMinor", coalesce(b.customer_name, '') as "customerName",
            b.created_at as "bookedAt", r.name as "routeLabel", t.schedule_id as "scheduleId",
            (select count(*)::int from app.booking_passenger bp
              where bp.booking_id = b.id and bp.status = 'active') as passengers,
            coalesce((
              select array_agg(bp.seat_no order by bp.seat_no)
                from app.booking_passenger bp
               where bp.booking_id = b.id and bp.seat_no is not null
            ), '{}') as seats
       from app.booking b
       join app.trip t on t.id = b.trip_id
       join app.route r on r.id = t.route_id
      where b.operator_id = $1
      order by b.created_at desc
      limit 100`,
    [operatorId],
  );

  return {
    operator,
    routes: routes.rows,
    schedules: schedules.rows,
    vehicles: vehicles.rows,
    vessels: vessels.rows,
    trips: trips.rows,
    bookings: bookings.rows,
    staffInvites: { status: 'blocked', reason: 'identity_provider_required' },
  };
}

async function loadOperator(operatorId: string, mode: 'bus' | 'ferry'): Promise<OperatorReadiness & { id: string; name: string }> {
  const { rows } = await query<{
    id: string;
    name: string;
    mode: string;
    latra_licence_number: string | null;
    tasac_licence_number: string | null;
    electronic_ticketing_registered: boolean;
    licence_valid_to: string | null;
    passenger_certificate_max: number | null;
  }>(
    `select id, name, mode, latra_licence_number, tasac_licence_number,
            electronic_ticketing_registered, licence_valid_to::text, passenger_certificate_max
       from app.operator
      where id = $1 and mode = $2`,
    [operatorId, mode],
  );
  const row = rows[0];
  if (!row) throw new OimsForbiddenError();
  return {
    id: row.id,
    name: row.name,
    mode: row.mode as 'bus' | 'ferry',
    latraLicenceNumber: row.latra_licence_number,
    tasacLicenceNumber: row.tasac_licence_number,
    electronicTicketingRegistered: row.electronic_ticketing_registered,
    licenceValidTo: row.licence_valid_to,
    passengerCertificateMax: row.passenger_certificate_max,
  };
}

export async function saveCompliance(
  operatorId: string,
  mode: 'bus' | 'ferry',
  actor: string,
  patch: {
    latraLicenceNumber?: string | null;
    tasacLicenceNumber?: string | null;
    electronicTicketingRegistered?: boolean;
    licenceValidTo?: string | null;
    passengerCertificateMax?: number | null;
  },
) {
  await loadOperator(operatorId, mode);
  await query(
    `update app.operator
        set latra_licence_number = coalesce($2, latra_licence_number),
            tasac_licence_number = coalesce($3, tasac_licence_number),
            electronic_ticketing_registered = coalesce($4, electronic_ticketing_registered),
            licence_valid_to = coalesce($5::date, licence_valid_to),
            passenger_certificate_max = coalesce($6, passenger_certificate_max),
            updated_at = now()
      where id = $1`,
    [
      operatorId,
      patch.latraLicenceNumber ?? null,
      patch.tasacLicenceNumber ?? null,
      patch.electronicTicketingRegistered ?? null,
      patch.licenceValidTo ?? null,
      patch.passengerCertificateMax ?? null,
    ],
  );
  await audit(operatorId, actor, 'compliance.update', 'operator', operatorId, patch);
}

export async function createRoute(operatorId: string, mode: 'bus' | 'ferry', actor: string, name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 120) throw new Error('invalid_route_name');
  const { rows } = await query<{ id: string }>(
    `insert into app.route (operator_id, name, mode, source)
     values ($1, $2, $3, 'operator_contract')
     returning id`,
    [operatorId, trimmed, mode],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('route_create_failed');
  await audit(operatorId, actor, 'route.create', 'route', id, { name: trimmed, mode });
  return { id, name: trimmed, mode };
}

export async function previewSchedule(input: {
  operatorId: string;
  mode: 'bus' | 'ferry';
  routeId: string;
  departureTime: string;
  daysOfWeek: number[];
  validFrom: string;
  validTo: string;
  exceptions?: { serviceDate: string; kind: 'blackout' | 'extra' }[];
  vesselId?: string | null;
}) {
  const operator = await loadOperator(input.operatorId, input.mode);
  if (!UUID.test(input.routeId)) throw new Error('invalid_route');
  const stats = await routeStats(input.operatorId, input.routeId);
  const classTotal = input.mode === 'ferry' && input.vesselId
    ? await vesselClassTotal(input.operatorId, input.vesselId)
    : null;
  const blocks = publicationBlocks({
    operator,
    stopCount: stats.stopCount,
    fareCount: stats.fareCount,
    vesselClassCapacityTotal: classTotal,
  });
  const validTo = input.validTo.trim() || input.validFrom;
  const dates = occurrenceDates(input.validFrom, validTo, input.daysOfWeek, input.exceptions ?? []);
  return {
    dates,
    count: dates.length,
    timezone: 'Africa/Dar_es_Salaam',
    departureTime: input.departureTime,
    blocks,
    canCommit: blocks.length === 0 && dates.length > 0,
  };
}

export async function commitSchedule(input: {
  operatorId: string;
  mode: 'bus' | 'ferry';
  actor: string;
  routeId: string;
  departureTime: string;
  daysOfWeek: number[];
  validFrom: string;
  validTo: string;
  exceptions?: { serviceDate: string; kind: 'blackout' | 'extra' }[];
  vehicleId?: string | null;
  vesselId?: string | null;
}) {
  const preview = await previewSchedule(input);
  if (!preview.canCommit) throw new OimsNotReadyError(preview.blocks.length ? preview.blocks : ['no_occurrences']);

  return withTransaction(async (client) => {
    const schedule = await client.query<{ id: string }>(
      `insert into app.schedule (
          route_id, operator_id, departure_time, days_of_week, valid_from, valid_to,
          service_timezone, vessel_id, status
        ) values ($1, $2, $3::time, $4::smallint[], $5::date, $6::date, 'Africa/Dar_es_Salaam', $7, 'published')
        returning id`,
      [
        input.routeId,
        input.operatorId,
        input.departureTime,
        input.daysOfWeek,
        input.validFrom,
        input.validTo.trim() || input.validFrom,
        input.vesselId ?? null,
      ],
    );
    const scheduleId = schedule.rows[0]?.id;
    if (!scheduleId) throw new Error('schedule_create_failed');

    for (const exception of input.exceptions ?? []) {
      await client.query(
        `insert into app.schedule_exception (schedule_id, service_date, kind) values ($1, $2::date, $3)`,
        [scheduleId, exception.serviceDate, exception.kind],
      );
    }

    let created = 0;
    let reused = 0;
    for (const date of preview.dates) {
      const trip = await client.query<{ id: string }>(
        `insert into app.trip (schedule_id, route_id, operator_id, service_date, vehicle_id, vessel_id, status, service_timezone)
         values ($1, $2, $3, $4::date, $5, $6, 'scheduled', 'Africa/Dar_es_Salaam')
         on conflict (schedule_id, service_date) do update set status = excluded.status
         returning id`,
        [scheduleId, input.routeId, input.operatorId, date, input.vehicleId ?? null, input.vesselId ?? null],
      );
      const tripId = trip.rows[0]?.id;
      if (!tripId) continue;
      created += 1;
      if (input.mode === 'ferry' && input.vesselId) {
        await client.query(
          `insert into app.sailing_inventory (trip_id, vessel_class_id, capacity)
           select $1, vc.id, vc.capacity
             from app.vessel_class vc
             join app.vessel vs on vs.id = vc.vessel_id
            where vs.id = $2 and vs.operator_id = $3
           on conflict (trip_id, vessel_class_id) do nothing`,
          [tripId, input.vesselId, input.operatorId],
        );
      }
    }
    await client.query(
      `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
       values ($1, $2, 'schedule.commit', 'schedule', $3, $4::jsonb)`,
      [input.operatorId, input.actor, scheduleId, JSON.stringify({ dates: preview.dates.length, created, reused })],
    );
    return { scheduleId, trips: created, dates: preview.dates };
  });
}

export async function loadManifest(operatorId: string, mode: 'bus' | 'ferry', tripId: string): Promise<ManifestDocument> {
  if (!UUID.test(tripId)) throw new Error('invalid_trip');
  const operator = await loadOperator(operatorId, mode);
  const { rows } = await query<{
    service_date: string;
    departure_time: string;
    route_name: string;
    registration: string | null;
    vessel_name: string | null;
  }>(
    `select t.service_date::text, to_char(s.departure_time, 'HH24:MI') as departure_time,
            r.name as route_name, v.registration, vs.name as vessel_name
       from app.trip t
       join app.schedule s on s.id = t.schedule_id
       join app.route r on r.id = t.route_id
       left join app.vehicle v on v.id = t.vehicle_id
       left join app.vessel vs on vs.id = t.vessel_id
      where t.id = $1 and t.operator_id = $2`,
    [tripId, operatorId],
  );
  const trip = rows[0];
  if (!trip) throw new Error('trip_not_found');

  const passengers = await query<{
    full_name: string;
    citizenship: string | null;
    phone: string | null;
    next_of_kin_phone: string | null;
    origin: string | null;
    destination: string | null;
    seat_no: string | null;
    fare_minor: string;
    currency: string;
  }>(
    `select bp.full_name, bp.citizenship, bp.phone, bp.next_of_kin_phone,
            ol.name as origin, dl.name as destination, bp.seat_no,
            bp.fare_minor::text, b.currency
       from app.booking_passenger bp
       join app.booking b on b.id = bp.booking_id
       left join app.route_stop fs on fs.id = bp.from_stop_id
       left join app.location ol on ol.id = fs.location_id
       left join app.route_stop ts on ts.id = bp.to_stop_id
       left join app.location dl on dl.id = ts.location_id
      where bp.trip_id = $1 and bp.status <> 'cancelled'
      order by bp.seat_no, bp.full_name`,
    [tripId],
  );

  const crew = await query<{ role: string; full_name: string; licence_number: string | null; phone: string | null }>(
    `select role, full_name, licence_number, phone from app.trip_crew where trip_id = $1`,
    [tripId],
  );

  return buildManifest({
    regulation: mode === 'bus' ? 'LATRA_PSV_2020_R33' : 'TASAC_PASSENGER_LIST',
    operatorName: operator.name,
    licenceNumber: mode === 'bus' ? operator.latraLicenceNumber : operator.tasacLicenceNumber ?? operator.latraLicenceNumber,
    vehicleOrVessel: trip.registration ?? trip.vessel_name,
    routeName: trip.route_name,
    serviceDate: trip.service_date,
    departureTime: trip.departure_time,
    crew: crew.rows.map((row) => ({
      role: row.role,
      fullName: row.full_name,
      licenceNumber: row.licence_number,
      phone: row.phone,
    })),
    passengers: passengers.rows.map((row) => ({
      fullName: row.full_name,
      citizenship: row.citizenship,
      phone: row.phone,
      nextOfKinPhone: row.next_of_kin_phone,
      originStop: row.origin,
      destinationStop: row.destination,
      seatOrClass: row.seat_no,
      fareMinor: Number(row.fare_minor),
      currency: row.currency,
    })),
    issuedAt: null,
  });
}

export async function issueManifest(operatorId: string, mode: 'bus' | 'ferry', actor: string, tripId: string) {
  const document = await loadManifest(operatorId, mode, tripId);
  const copies = mode === 'bus' ? latraCopies() : tasacCopies();
  await query(
    `insert into app.manifest_issue (trip_id, operator_id, copies, payload, actor)
     values ($1, $2, $3, $4::jsonb, $5)`,
    [tripId, operatorId, copies, JSON.stringify(document), actor],
  );
  await audit(operatorId, actor, 'manifest.issue', 'trip', tripId, { copies });
  return { ...document, issuedAt: new Date().toISOString(), copiesRequired: copies };
}

async function routeStats(operatorId: string, routeId: string) {
  const { rows } = await query<{ stops: string; fares: string }>(
    `select
        (select count(*)::text from app.route_stop rs where rs.route_id = r.id) as stops,
        (select count(*)::text from app.segment_fare sf where sf.route_id = r.id) as fares
       from app.route r
      where r.id = $1 and r.operator_id = $2`,
    [routeId, operatorId],
  );
  const row = rows[0];
  if (!row) throw new Error('invalid_route');
  return { stopCount: Number(row.stops), fareCount: Number(row.fares) };
}

export async function addStop(
  operatorId: string,
  actor: string,
  routeId: string,
  locationId: string,
  offsetMinutes: number,
  terminalName: string | null,
) {
  if (!UUID.test(routeId) || !UUID.test(locationId)) throw new Error('invalid_id');
  if (!Number.isInteger(offsetMinutes) || offsetMinutes < 0) throw new Error('invalid_offset');
  const owned = await query(`select 1 from app.route where id = $1 and operator_id = $2`, [routeId, operatorId]);
  if (!owned.rowCount) throw new OimsForbiddenError();
  const seq = await query<{ n: string }>(
    `select coalesce(max(sequence), -1) + 1 as n from app.route_stop where route_id = $1`,
    [routeId],
  );
  const { rows } = await query<{ id: string }>(
    `insert into app.route_stop (route_id, location_id, sequence, offset_minutes, terminal_name)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [routeId, locationId, Number(seq.rows[0]?.n ?? 0), offsetMinutes, terminalName],
  );
  await audit(operatorId, actor, 'route.stop.add', 'route_stop', rows[0]?.id ?? null, { routeId, locationId });
  return { id: rows[0]?.id };
}

export async function addSegmentFare(
  operatorId: string,
  actor: string,
  routeId: string,
  fromStopId: string,
  toStopId: string,
  fareMinor: number,
  currency: string,
) {
  if (![routeId, fromStopId, toStopId].every((id) => UUID.test(id))) throw new Error('invalid_id');
  if (!Number.isInteger(fareMinor) || fareMinor < 0) throw new Error('invalid_fare');
  const owned = await query(`select 1 from app.route where id = $1 and operator_id = $2`, [routeId, operatorId]);
  if (!owned.rowCount) throw new OimsForbiddenError();
  await query(
    `insert into app.segment_fare (route_id, from_stop_id, to_stop_id, fare_minor, currency)
     values ($1, $2, $3, $4, $5)
     on conflict (route_id, from_stop_id, to_stop_id) do update set fare_minor = excluded.fare_minor, currency = excluded.currency`,
    [routeId, fromStopId, toStopId, fareMinor, currency],
  );
  await audit(operatorId, actor, 'route.fare.upsert', 'segment_fare', routeId, { fromStopId, toStopId, fareMinor });
}

export async function createVehicle(
  operatorId: string,
  actor: string,
  input: { registration: string; model?: string; serviceClass?: 'ordinary' | 'semi_luxury' | 'luxury'; totalSeats?: number },
) {
  const registration = input.registration.trim();
  if (registration.length < 3) throw new Error('invalid_registration');
  const { rows } = await query<{ id: string }>(
    `insert into app.vehicle (operator_id, registration, model, service_class, total_seats)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [operatorId, registration, input.model ?? null, input.serviceClass ?? null, input.totalSeats ?? null],
  );
  await audit(operatorId, actor, 'vehicle.create', 'vehicle', rows[0]?.id ?? null, { registration });
  return { id: rows[0]?.id, registration };
}

export async function createVessel(
  operatorId: string,
  actor: string,
  input: { name: string; passengerCertificateMax: number; registration?: string },
) {
  const name = input.name.trim();
  if (name.length < 2) throw new Error('invalid_vessel_name');
  if (!Number.isInteger(input.passengerCertificateMax) || input.passengerCertificateMax < 1) {
    throw new Error('invalid_certificate');
  }
  const { rows } = await query<{ id: string }>(
    `insert into app.vessel (operator_id, name, registration, passenger_certificate_max)
     values ($1, $2, $3, $4)
     returning id`,
    [operatorId, name, input.registration ?? null, input.passengerCertificateMax],
  );
  await audit(operatorId, actor, 'vessel.create', 'vessel', rows[0]?.id ?? null, { name });
  return { id: rows[0]?.id, name };
}

export async function createVesselClass(
  operatorId: string,
  actor: string,
  input: { vesselId: string; name: string; capacity: number; adultFareMinor: number; currency: string },
) {
  if (!UUID.test(input.vesselId)) throw new Error('invalid_id');
  const name = input.name.trim();
  if (name.length < 2) throw new Error('invalid_class_name');
  if (!Number.isInteger(input.capacity) || input.capacity < 1) throw new Error('invalid_capacity');
  if (!Number.isInteger(input.adultFareMinor) || input.adultFareMinor < 0) throw new Error('invalid_fare');
  const owned = await query(`select 1 from app.vessel where id = $1 and operator_id = $2`, [input.vesselId, operatorId]);
  if (!owned.rowCount) throw new OimsForbiddenError();
  const { rows } = await query<{ id: string }>(
    `insert into app.vessel_class (vessel_id, name, capacity, adult_fare_minor, child_fare_minor, currency)
     values ($1, $2, $3, $4, $4, $5)
     returning id`,
    [input.vesselId, name, input.capacity, input.adultFareMinor, input.currency],
  );
  await audit(operatorId, actor, 'vessel.class.create', 'vessel_class', rows[0]?.id ?? null, { name, capacity: input.capacity });
  return { id: rows[0]?.id, name };
}

async function vesselClassTotal(operatorId: string, vesselId: string): Promise<number | null> {
  const { rows } = await query<{ total: string | null }>(
    `select sum(vc.capacity)::text as total
       from app.vessel vs
       join app.vessel_class vc on vc.vessel_id = vs.id
      where vs.id = $1 and vs.operator_id = $2`,
    [vesselId, operatorId],
  );
  const total = rows[0]?.total;
  return total == null ? 0 : Number(total);
}
