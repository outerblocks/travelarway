/**
 * Bus results, shaped for the existing results card.
 *
 * Deliberately does not invent presentation values. Where the card expects something the
 * database does not model — a class label, an amenity list, an operator logo — the field
 * is either derived from real data (layout name, operator initials) or left empty so the
 * UI can omit it. Fabricating "WiFi" because the old fixture had it would put invented
 * facts in front of a paying customer.
 */
import { query } from '@/server/db';
import { normalizeAmenityKey } from '@/domain/amenities';

export interface BusResultStop {
  name: string;
  terminal: string;
  sequence: number;
  offsetMinutes: number;
}

export interface BusResultDto {
  id: string;
  operatorName: string;
  operatorInitials: string;
  operatorSource: string;
  seatLayoutName: string | null;
  classLabel: string | null;
  vehicleModel: string | null;
  registrationNumber: string | null;
  departureTime: string;
  arrivalTime: string;
  arrivalNextDay: boolean;
  durationMinutes: number;
  durationLabel: string;
  passengerOrigin: string;
  passengerDestination: string;
  departureTerminal: string;
  arrivalTerminal: string;
  serviceOrigin: string;
  serviceDestination: string;
  intermediateStops: BusResultStop[];
  segmentFare: number;
  currency: string;
  serviceClass: string | null;
  supportPhone: string | null;
  capacity: number;
  availableSeats: number;
  amenities: string[];
}

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

const durationLabel = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

interface Row {
  trip_id: string;
  operator_name: string;
  operator_source: string;
  layout_name: string | null;
  class_label: string | null;
  service_class: string | null;
  support_phone: string | null;
  amenities: string[] | null;
  model: string | null;
  registration: string | null;
  service_date: string;
  departs_at: string;
  arrives_at: string;
  duration_minutes: number;
  fare_minor: number;
  currency: string;
  capacity: number | null;
  taken_seats: number;
  origin_name: string;
  origin_terminal: string | null;
  destination_name: string;
  destination_terminal: string | null;
  route_id: string;
}

/**
 * Sort orders a caller may ask for. The keys are what the wire accepts and the values are
 * fixed SQL fragments, so a request string can never reach the ORDER BY itself.
 */
const SORTS: Record<string, string> = {
  departure: 'departs_at',
  fare: 'fare_minor',
  duration: 'duration_minutes',
};

/**
 * Resolves a stop by code or by display name, in that order, so the search card can keep
 * sending names while the API can also be called with IATA-style codes.
 */
export async function searchBusResults(input: {
  from: string;
  to: string;
  date: string;
  sort?: string;
}): Promise<BusResultDto[]> {
  const order = SORTS[input.sort ?? 'departure'] ?? SORTS.departure;

  const { rows } = await query<Row>(
    `select
        t.id                       as trip_id,
        o.name                     as operator_name,
        o.source::text             as operator_source,
        sl.name                    as layout_name,
        v.class_label              as class_label,
        v.service_class            as service_class,
        o.support_phone            as support_phone,
        v.amenities                as amenities,
        v.model                    as model,
        v.registration             as registration,
        to_char(t.service_date, 'YYYY-MM-DD') as service_date,
        to_char(sch.departure_time + make_interval(mins => fs.offset_minutes), 'HH24:MI') as departs_at,
        to_char(sch.departure_time + make_interval(mins => ts.offset_minutes), 'HH24:MI') as arrives_at,
        (ts.offset_minutes - fs.offset_minutes) as duration_minutes,
        sf.fare_minor::int         as fare_minor,
        sf.currency::text          as currency,
        coalesce(v.total_seats, sl.row_count * cardinality(sl.lanes)) as capacity,
        (select count(*)::int from (
           select distinct occupied.seat_no from (
             select h.seat_no from app.seat_hold h
              where h.trip_id = t.id and h.status = 'active' and h.expires_at > now()
                and h.from_seq < ts.sequence and h.to_seq > fs.sequence
             union
             select bp.seat_no from app.booking_passenger bp
              where bp.trip_id = t.id and bp.status in ('pending', 'active') and bp.seat_no is not null
                and bp.from_seq < ts.sequence and bp.to_seq > fs.sequence
           ) occupied
         ) taken) as taken_seats,
        ol.name                    as origin_name,
        fs.terminal_name           as origin_terminal,
        dl.name                    as destination_name,
        ts.terminal_name           as destination_terminal,
        r.id                       as route_id
       from app.trip t
       join app.schedule sch on sch.id = t.schedule_id
       join app.route r      on r.id = t.route_id
       join app.operator o   on o.id = t.operator_id
       left join app.vehicle v      on v.id = t.vehicle_id
       left join app.seat_layout sl on sl.id = v.seat_layout_id
       join app.route_stop fs on fs.route_id = r.id
       join app.location  ol  on ol.id = fs.location_id
       join app.route_stop ts on ts.route_id = r.id and ts.sequence > fs.sequence
       join app.location  dl  on dl.id = ts.location_id
       join app.segment_fare sf
         on sf.route_id = r.id and sf.from_stop_id = fs.id and sf.to_stop_id = ts.id
      where t.status = 'scheduled'
        and fs.pickup_allowed
        and ts.dropoff_allowed
        and (t.service_date::timestamp + sch.departure_time + make_interval(mins => fs.offset_minutes))::date = $3::date
        and (
          ol.id::text = $1
          or upper(ol.code) = upper($1)
          or lower(ol.name) = lower($1)
        )
        and (
          dl.id::text = $2
          or upper(dl.code) = upper($2)
          or lower(dl.name) = lower($2)
        )
      order by ${order}`,
    [input.from, input.to, input.date],
  );

  if (rows.length === 0) return [];

  const routeIds = [...new Set(rows.map((row) => row.route_id))];
  const stops = await query<{
    route_id: string;
    name: string;
    terminal_name: string | null;
    sequence: number;
    offset_minutes: number;
  }>(
    `select rs.route_id, l.name, rs.terminal_name, rs.sequence, rs.offset_minutes
       from app.route_stop rs
       join app.location l on l.id = rs.location_id
      where rs.route_id = any($1::uuid[])
      order by rs.route_id, rs.sequence`,
    [routeIds],
  );

  const stopsByRoute = new Map<string, BusResultStop[]>();
  for (const stop of stops.rows) {
    const list = stopsByRoute.get(stop.route_id) ?? [];
    list.push({
      name: stop.name,
      terminal: stop.terminal_name ?? stop.name,
      sequence: stop.sequence,
      offsetMinutes: stop.offset_minutes,
    });
    stopsByRoute.set(stop.route_id, list);
  }

  return rows.map((row) => {
    const all = stopsByRoute.get(row.route_id) ?? [];
    const originStop = all.find((stop) => stop.name === row.origin_name);
    const destinationStop = all.find((stop) => stop.name === row.destination_name);
    const between = all.filter(
      (stop) =>
        originStop &&
        destinationStop &&
        stop.sequence > originStop.sequence &&
        stop.sequence < destinationStop.sequence,
    );
    const taken = Number(row.taken_seats);
    const capacity = row.capacity ?? 0;

    return {
      id: row.trip_id,
      operatorName: row.operator_name,
      operatorInitials: initials(row.operator_name),
      operatorSource: row.operator_source,
      seatLayoutName: row.layout_name,
      classLabel: row.class_label,
      // LATRA Regulation 22 category. `classLabel` is what the operator calls the service;
      // this is what the regulator issued the licence against, and what a comparison uses.
      serviceClass: row.service_class,
      supportPhone: row.support_phone,
      vehicleModel: row.model,
      registrationNumber: row.registration,
      departureTime: row.departs_at,
      arrivalTime: row.arrives_at,
      arrivalNextDay: row.arrives_at < row.departs_at,
      durationMinutes: row.duration_minutes,
      durationLabel: durationLabel(row.duration_minutes),
      passengerOrigin: row.origin_name,
      passengerDestination: row.destination_name,
      departureTerminal: row.origin_terminal ?? row.origin_name,
      arrivalTerminal: row.destination_terminal ?? row.destination_name,
      serviceOrigin: all[0]?.name ?? row.origin_name,
      serviceDestination: all[all.length - 1]?.name ?? row.destination_name,
      intermediateStops: between,
      segmentFare: row.fare_minor,
      currency: row.currency,
      capacity,
      availableSeats: Math.max(0, capacity - taken),
      amenities: (row.amenities ?? []).map(normalizeAmenityKey).filter(Boolean),
    };
  });
}
