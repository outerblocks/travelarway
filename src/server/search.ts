/**
 * Read-side queries for the public search surface.
 *
 * Server only. Every statement is parameterised; nothing is interpolated from the URL.
 */
import { query } from '@/server/db';
import { quoteBusSegment, type SegmentQuote } from '@/server/quote';

export interface LocationDto {
  id: string;
  name: string;
  code: string;
  kind: string;
  countryCode: string;
  source: string;
  /** Null when the place has no region link yet. Not the same as "no region exists". */
  region: string | null;
}

/**
 * What each booking mode can be searched between.
 *
 * The old card filtered a hand-maintained list per mode; this is the same rule applied to
 * rows, so adding a station in HIMS makes it searchable immediately with no code change on
 * either side. A mode with no entry would return nothing rather than everything, which is
 * the safe direction for a mistake.
 */
export const MODE_LOCATION_KINDS: Record<string, string[]> = {
  bus: ['city', 'town'],
  train: ['station'],
  ferry: ['port', 'terminal'],
  flights: ['airport'],
  stays: ['city', 'town'],
  experiences: ['city', 'town'],
};

/** Operator-direct markets kept on Tanzania geography. GDS modes are worldwide. */
export const LOCAL_COUNTRY_MODES = ['bus', 'ferry', 'experiences'] as const;

export function isGdsLocationMode(mode: string): boolean {
  return mode === 'flights' || mode === 'stays';
}

export async function listLocations(
  term?: string,
  options: { kinds?: string[]; country?: string; limit?: number } = {},
): Promise<LocationDto[]> {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const needle = term?.trim() ?? '';
  const likeAnywhere = needle ? `%${needle}%` : null;
  const likePrefix = needle ? `${needle}%` : null;
  const { rows } = await query<{
    id: string;
    name: string;
    code: string;
    kind: string;
    country_code: string;
    source: string;
    region: string | null;
  }>(
    // Deactivated places are excluded: a station that stops serving trains should disappear
    // from search but stay resolvable for tickets already sold against it. Non-searchable ones
    // are the complement — a town that exists but is not offered as a From/To endpoint.
    `select l.id, l.name, l.code, l.kind, l.country_code, l.source, r.name as region
       from app.location l
       left join app.region r on r.id = l.region_id
      where l.is_active
        and l.is_searchable
        and (
          $1::text is null
          or lower(l.code) = lower($5)
          or l.code ilike $1
          or l.name ilike $1
        )
        and ($2::text[] is null or l.kind = any($2))
        and ($3::char(2) is null or l.country_code = $3)
      order by
        (lower(l.code) = lower($5)) desc,
        (l.kind = 'city') desc,
        (l.kind = 'town') desc,
        (l.name ilike $6) desc,
        (l.code ilike $6) desc,
        l.name
      limit $4`,
    [
      likeAnywhere,
      options.kinds?.length ? options.kinds : null,
      options.country ?? null,
      limit,
      needle || null,
      likePrefix,
    ],
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    kind: row.kind,
    countryCode: row.country_code,
    source: row.source,
    region: row.region,
  }));
}

export interface TripStopDto {
  id: string;
  locationName: string;
  code: string;
  sequence: number;
  offsetMinutes: number;
  terminalName: string | null;
}

export interface SegmentFareDto {
  fromStopId: string;
  toStopId: string;
  fareMinor: number;
  currency: string;
}

export interface TakenSeatDto {
  seatNo: string;
  reason: 'hold' | 'sold';
}

export interface TripDetailDto {
  tripId: string;
  serviceDate: string;
  status: string;
  /** Base departure from the first stop; every stop time is this plus its offset. */
  departureTime: string;
  operatorName: string;
  operatorSource: string;
  routeName: string;
  vehicleRegistration: string | null;
  vehicleModel: string | null;
  classLabel: string | null;
  seatLayout: { name: string; rowCount: number; lanes: string[] } | null;
  stops: TripStopDto[];
  fares: SegmentFareDto[];
  takenSeats: TakenSeatDto[];
  /**
   * Present when the caller supplied a travelled segment and a party. This is the price
   * the server will charge — the UI displays it rather than recomputing it, so what a
   * customer sees and what they are billed cannot drift apart.
   */
  quote: SegmentQuote | null;
  segment: { fromStopId: string; toStopId: string } | null;
}

/**
 * Everything one trip needs to be booked: its stops in order, the fare for any stop pair,
 * and which seats are unavailable. Taken seats combine live holds and sold seats, because
 * the seat map has no business knowing which of the two blocked a seat.
 */
export async function findTripDetail(
  tripId: string,
  party?: { from: string; to: string; adults: number; children: number },
): Promise<TripDetailDto | null> {
  const trip = await query<{
    trip_id: string;
    service_date: string;
    status: string;
    base_time: string;
    operator_name: string;
    operator_source: string;
    route_name: string;
    registration: string | null;
    model: string | null;
    class_label: string | null;
    layout_name: string | null;
    row_count: number | null;
    lanes: string[] | null;
  }>(
    `select
        t.id as trip_id,
        to_char(t.service_date, 'YYYY-MM-DD') as service_date,
        t.status,
        to_char(sch.departure_time, 'HH24:MI') as base_time,
        o.name as operator_name,
        o.source::text as operator_source,
        r.name as route_name,
        v.registration,
        v.model,
        v.class_label,
        sl.name as layout_name,
        sl.row_count,
        sl.lanes
       from app.trip t
       join app.schedule sch on sch.id = t.schedule_id
       join app.operator o on o.id = t.operator_id
       join app.route r    on r.id = t.route_id
       left join app.vehicle v      on v.id = t.vehicle_id
       left join app.seat_layout sl on sl.id = v.seat_layout_id
      where t.id = $1`,
    [tripId],
  );

  if (trip.rowCount === 0) return null;
  const row = trip.rows[0];

  const [stops, fares, taken] = await Promise.all([
    query<{
      id: string;
      name: string;
      code: string;
      sequence: number;
      offset_minutes: number;
      terminal_name: string | null;
    }>(
      `select rs.id, l.name, l.code, rs.sequence, rs.offset_minutes, rs.terminal_name
         from app.route_stop rs
         join app.location l on l.id = rs.location_id
         join app.trip t on t.route_id = rs.route_id
        where t.id = $1
        order by rs.sequence`,
      [tripId],
    ),
    query<{ from_stop_id: string; to_stop_id: string; fare_minor: number; currency: string }>(
      `select sf.from_stop_id, sf.to_stop_id, sf.fare_minor::int as fare_minor, sf.currency::text
         from app.segment_fare sf
         join app.trip t on t.route_id = sf.route_id
        where t.id = $1`,
      [tripId],
    ),
    query<{ seat_no: string; reason: string }>(
      `select seat_no, 'hold' as reason
         from app.seat_hold
        where trip_id = $1 and status = 'active' and expires_at > now()
        union
       select seat_no, 'sold' as reason
         from app.booking_passenger
        where trip_id = $1 and status = 'active' and seat_no is not null`,
      [tripId],
    ),
  ]);

  const base: Omit<TripDetailDto, 'quote' | 'segment'> = {
    tripId: row.trip_id,
    serviceDate: row.service_date,
    status: row.status,
    departureTime: row.base_time,
    operatorName: row.operator_name,
    operatorSource: row.operator_source,
    routeName: row.route_name,
    vehicleRegistration: row.registration,
    vehicleModel: row.model,
    classLabel: row.class_label,
    seatLayout: row.layout_name
      ? { name: row.layout_name, rowCount: row.row_count ?? 0, lanes: row.lanes ?? [] }
      : null,
    stops: stops.rows.map((stop) => ({
      id: stop.id,
      locationName: stop.name,
      code: stop.code,
      sequence: stop.sequence,
      offsetMinutes: stop.offset_minutes,
      terminalName: stop.terminal_name,
    })),
    fares: fares.rows.map((fare) => ({
      fromStopId: fare.from_stop_id,
      toStopId: fare.to_stop_id,
      fareMinor: fare.fare_minor,
      currency: fare.currency,
    })),
    takenSeats: taken.rows.map((seat) => ({
      seatNo: seat.seat_no,
      reason: seat.reason === 'sold' ? 'sold' : 'hold',
    })),
  };

  if (!party) {
    return { ...base, quote: null, segment: null };
  }

  // Resolve the travelled segment by id, code or display name, then price it on the
  // server. Matched against the raw query rows, whose columns are snake_case — using the
  // mapped DTO field names here would read undefined and throw at runtime.
  //
  // Id wins: a passenger can board at an intermediate stop, and pricing the route's
  // origin would charge them for a journey they are not taking.
  const matches = (stop: { id: string; code: string; name: string }, needle: string) =>
    stop.id === needle ||
    stop.code.toUpperCase() === needle.toUpperCase() ||
    stop.name.toLowerCase() === needle.toLowerCase();
  const fromStop = stops.rows.find((stop) => matches(stop, party.from));
  const toStop = stops.rows.find((stop) => matches(stop, party.to));
  if (!fromStop || !toStop) {
    return { ...base, quote: null, segment: null };
  }

  const quote = await quoteBusSegment({
    tripId,
    fromStopId: fromStop.id,
    toStopId: toStop.id,
    adults: party.adults,
    children: party.children,
  });

  return { ...base, quote, segment: { fromStopId: fromStop.id, toStopId: toStop.id } };
}

export interface TripDto {
  tripId: string;
  operatorName: string;
  operatorSource: string;
  routeName: string;
  serviceDate: string;
  departsAt: string;
  arrivesAt: string;
  durationMinutes: number;
  fareMinor: number;
  currency: string;
  vehicleModel: string | null;
  seatLayout: string | null;
  capacity: number | null;
}

/**
 * Trips between two stops on one date, priced from the segment the passenger actually
 * travels rather than the full route fare.
 */
export async function findTrips(params: {
  from: string;
  to: string;
  date: string;
}): Promise<TripDto[]> {
  const { rows } = await query<{
    trip_id: string;
    operator_name: string;
    operator_source: string;
    route_name: string;
    service_date: string;
    departs_at: string;
    arrives_at: string;
    duration_minutes: number;
    fare_minor: number;
    currency: string;
    vehicle_model: string | null;
    seat_layout: string | null;
    capacity: number | null;
  }>(
    `select
        t.id                        as trip_id,
        o.name                      as operator_name,
        o.source::text              as operator_source,
        r.name                      as route_name,
        to_char(t.service_date, 'YYYY-MM-DD') as service_date,
        to_char(sch.departure_time + make_interval(mins => fs.offset_minutes), 'HH24:MI') as departs_at,
        to_char(sch.departure_time + make_interval(mins => ts.offset_minutes), 'HH24:MI') as arrives_at,
        (ts.offset_minutes - fs.offset_minutes) as duration_minutes,
        sf.fare_minor::int          as fare_minor,
        sf.currency::text           as currency,
        v.model                     as vehicle_model,
        sl.name                     as seat_layout,
        (sl.row_count * cardinality(sl.lanes)) as capacity
       from app.trip t
       join app.schedule sch  on sch.id = t.schedule_id
       join app.route r       on r.id = t.route_id
       join app.operator o    on o.id = t.operator_id
       left join app.vehicle v      on v.id = t.vehicle_id
       left join app.seat_layout sl on sl.id = v.seat_layout_id
       join app.route_stop fs on fs.route_id = r.id
       join app.location  fl  on fl.id = fs.location_id
       join app.route_stop ts on ts.route_id = r.id and ts.sequence > fs.sequence
       join app.location  tl  on tl.id = ts.location_id
       join app.segment_fare sf
         on sf.route_id = r.id and sf.from_stop_id = fs.id and sf.to_stop_id = ts.id
      where t.service_date = $3::date
        and t.status = 'scheduled'
        and upper(fl.code) = upper($1)
        and upper(tl.code) = upper($2)
      order by departs_at`,
    [params.from, params.to, params.date],
  );

  return rows.map((row) => ({
    tripId: row.trip_id,
    operatorName: row.operator_name,
    operatorSource: row.operator_source,
    routeName: row.route_name,
    serviceDate: row.service_date,
    departsAt: row.departs_at,
    arrivesAt: row.arrives_at,
    durationMinutes: row.duration_minutes,
    fareMinor: row.fare_minor,
    currency: row.currency,
    vehicleModel: row.vehicle_model,
    seatLayout: row.seat_layout,
    capacity: row.capacity,
  }));
}
