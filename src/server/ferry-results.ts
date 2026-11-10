/**
 * Public ferry sailings from operator-published trip instances.
 * Empty when no corridor has been committed. Does not invent ports, fares, or capacity.
 */
import { query } from '@/server/db';

export interface FerryClassDto {
  id: string;
  name: string;
  adultFare: number;
  childFare: number;
  residentAdultFare: number;
  residentChildFare: number;
  hasResidentFare: boolean;
  capacity: number;
  availableCapacity: number;
  currency: string;
  description: string;
}

export interface FerrySailingDto {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorLogo: string;
  vesselName: string;
  departurePort: string;
  arrivalPort: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  duration: string;
  classes: FerryClassDto[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const durationLabel = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

interface TripRow {
  trip_id: string;
  operator_id: string;
  operator_name: string;
  vessel_name: string;
  origin_name: string;
  destination_name: string;
  service_date: string;
  departs_at: string;
  arrives_at: string;
  duration_minutes: number;
}

interface ClassRow {
  trip_id: string;
  class_id: string;
  name: string;
  capacity: number;
  adult_fare_minor: string;
  child_fare_minor: string;
  resident_adult_minor: string | null;
  resident_child_minor: string | null;
  currency: string;
  sold: string;
}

export function presentFerryClass(row: {
  class_id: string;
  name: string;
  capacity: number;
  adult_fare_minor: string | number;
  child_fare_minor: string | number;
  resident_adult_minor: string | number | null;
  resident_child_minor: string | number | null;
  currency: string;
  sold: string | number;
}): FerryClassDto {
  const residentAdult = row.resident_adult_minor == null || row.resident_adult_minor === ''
    ? null
    : Number(row.resident_adult_minor);
  const residentChild = row.resident_child_minor == null || row.resident_child_minor === ''
    ? null
    : Number(row.resident_child_minor);
  const capacity = Number(row.capacity);
  const sold = Number(row.sold);
  return {
    id: row.class_id,
    name: row.name,
    adultFare: Number(row.adult_fare_minor),
    childFare: Number(row.child_fare_minor),
    residentAdultFare: residentAdult ?? 0,
    residentChildFare: residentChild ?? 0,
    hasResidentFare: residentAdult != null && residentChild != null,
    capacity,
    availableCapacity: Math.max(0, capacity - sold),
    currency: row.currency,
    description: '',
  };
}

function sailingFrom(row: TripRow, classes: FerryClassDto[]): FerrySailingDto {
  return {
    id: row.trip_id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    operatorLogo: '',
    vesselName: row.vessel_name,
    departurePort: row.origin_name,
    arrivalPort: row.destination_name,
    departureTime: row.departs_at,
    arrivalTime: row.arrives_at,
    departureDate: row.service_date,
    arrivalDate: row.arrives_at < row.departs_at
      ? nextIsoDate(row.service_date)
      : row.service_date,
    duration: durationLabel(row.duration_minutes),
    classes,
  };
}

function nextIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

const TRIP_SQL = `
  select
      t.id as trip_id,
      o.id as operator_id,
      o.name as operator_name,
      coalesce(vs.name, 'Vessel') as vessel_name,
      ol.name as origin_name,
      dl.name as destination_name,
      to_char(t.service_date, 'YYYY-MM-DD') as service_date,
      to_char(sch.departure_time + make_interval(mins => fs.offset_minutes), 'HH24:MI') as departs_at,
      to_char(sch.departure_time + make_interval(mins => ts.offset_minutes), 'HH24:MI') as arrives_at,
      (ts.offset_minutes - fs.offset_minutes) as duration_minutes
    from app.trip t
    join app.schedule sch on sch.id = t.schedule_id
    join app.route r on r.id = t.route_id
    join app.operator o on o.id = t.operator_id
    join app.vessel vs on vs.id = coalesce(t.vessel_id, sch.vessel_id)
    join app.route_stop fs on fs.route_id = r.id
    join app.location ol on ol.id = fs.location_id
    join app.route_stop ts on ts.route_id = r.id and ts.sequence > fs.sequence
    join app.location dl on dl.id = ts.location_id
   where t.status = 'scheduled'
     and r.mode = 'ferry'
     and o.mode = 'ferry'
`;

async function classesForTrips(tripIds: string[]): Promise<Map<string, FerryClassDto[]>> {
  const map = new Map<string, FerryClassDto[]>();
  if (tripIds.length === 0) return map;
  const { rows } = await query<ClassRow>(
    `select si.trip_id, vc.id as class_id, vc.name, si.capacity,
            vc.adult_fare_minor::text, vc.child_fare_minor::text,
            vc.resident_adult_minor::text, vc.resident_child_minor::text,
            vc.currency,
            si.sold_count::text as sold
       from app.sailing_inventory si
       join app.vessel_class vc on vc.id = si.vessel_class_id
      where si.trip_id = any($1::uuid[])`,
    [tripIds],
  );
  for (const row of rows) {
    const list = map.get(row.trip_id) ?? [];
    list.push(presentFerryClass(row));
    map.set(row.trip_id, list);
  }
  return map;
}

export async function searchFerrySailings(input: {
  from: string;
  to: string;
  date: string;
}): Promise<FerrySailingDto[]> {
  const { rows } = await query<TripRow>(
    `${TRIP_SQL}
       and t.service_date = $3::date
       and (
         ol.id::text = $1 or upper(ol.code) = upper($1) or lower(ol.name) = lower($1)
       )
       and (
         dl.id::text = $2 or upper(dl.code) = upper($2) or lower(dl.name) = lower($2)
       )
     order by departs_at`,
    [input.from, input.to, input.date],
  );
  const classes = await classesForTrips(rows.map((row) => row.trip_id));
  return rows
    .map((row) => sailingFrom(row, classes.get(row.trip_id) ?? []))
    .filter((sailing) => sailing.classes.length > 0);
}

export async function findFerrySailing(tripId: string): Promise<FerrySailingDto | null> {
  if (!UUID.test(tripId)) return null;
  const { rows } = await query<TripRow>(
    `${TRIP_SQL} and t.id = $1
     order by fs.sequence, ts.sequence
     limit 1`,
    [tripId],
  );
  const row = rows[0];
  if (!row) return null;
  const classes = await classesForTrips([row.trip_id]);
  const sailing = sailingFrom(row, classes.get(row.trip_id) ?? []);
  return sailing.classes.length ? sailing : null;
}
