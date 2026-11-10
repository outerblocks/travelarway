import { query } from '@/server/db';
import { loadSearchClassCards } from '@/server/sgr/read-models';

/**
 * SGR services for a searched corridor and date.
 *
 * Two rules this file exists to keep.
 *
 * **The day is the traveller's day, not UTC.** Dar es Salaam is UTC+3 with no daylight
 * saving, so a service at 06:00 local is 03:00 UTC. Filtering with a UTC midnight window
 * would drop the first hours of the day and show tomorrow's evening train — the bug that
 * made a search for today return yesterday.
 *
 * **The stop pair is resolved inside the trip.** A passenger travelling Dar es Salaam →
 * Morogoro is not buying the whole journey, and availability must be computed for the
 * interval they actually occupy. The sequence numbers come from the trip's own stops, so a
 * train that does not call at the requested station simply does not appear.
 */

const AFRICA_DAR_UTC_OFFSET_HOURS = 3;

export interface SgrServiceClass {
  seatClassCode: string;
  name: string;
  /** Null when no fare is on file. Not zero, and never a placeholder. */
  fare: number | null;
  currency: string | null;
  /** PROVISIONAL fares are shown as provisional; the passenger is not told they are official. */
  fareSource: string | null;
  available: number;
  totalSellable: number;
  soldOut: boolean;
}

export interface SgrService {
  tripId: string;
  serviceRef: string;
  tripNumber: string;
  name: string;
  operatorName: string;
  servicePattern: string | null;
  trainsetCode: string;
  origin: string;
  destination: string;
  /** Local times on the corridor. Null when the stop is intermediate and TRC has not published a time for it. */
  departureTime: string | null;
  arrivalTime: string | null;
  departureDate: string;
  duration: string;
  fromSeq: number;
  toSeq: number;
  serviceOrigin: string;
  serviceDestination: string;
  classes: SgrServiceClass[];
}

interface TripRow {
  trip_id: string;
  service_ref: string;
  trainset_code: string;
  service_pattern: string | null;
  origin: string;
  destination: string;
  from_station: string;
  to_station: string;
  departs_at: Date;
  arrives_at: Date;
  from_seq: number;
  to_seq: number;
  last_seq: number;
}

/** Corridor labels the search card offers, which name the station rather than the city. */
const STATION_QUALIFIERS = ['sgr station', 'sgr', 'station', 'km 125', 'main station'];

/**
 * Strips the trailing words the search card appends to a city to name its station, so
 * "Dar es Salaam SGR Station" resolves to the place the traveller means.
 *
 * The card offers station labels while `app.location` holds places; that gap is closed
 * properly by the geographic master data work, which will give each station its own row. Until
 * then the resolution is done here, in one place, rather than by matching loosely in SQL
 * where a prefix could silently pick the wrong town.
 */
function placeNameFromLabel(value: string): string {
  let name = value.trim();
  let changed = true;
  // Repeated because more than one qualifier can stack on the end of a label.
  while (changed) {
    changed = false;
    for (const qualifier of STATION_QUALIFIERS) {
      const pattern = new RegExp(`\\s+${qualifier.replace(/\s/g, '\\s+')}\\s*$`, 'i');
      if (pattern.test(name)) {
        name = name.replace(pattern, '').trim();
        changed = true;
      }
    }
  }
  return name;
}

/** Corridor names as the traveller wrote them, matched the way the rest of the platform matches places. */
async function resolveStation(name: string): Promise<{ id: string; name: string } | null> {
  const raw = name.trim();
  if (!raw) return null;
  const candidates = [...new Set([raw, placeNameFromLabel(raw)])];
  const rows = await query<{ id: string; name: string }>(
    `select id::text as id, name from app.location
      where is_active
        and (
          id::text = $1
          or lower(code) = lower($1)
          or lower(trim(name)) = any($2::text[])
        )
      order by (id::text = $1) desc, kind = 'station' desc, name
      limit 1`,
    [raw, candidates.map((candidate) => candidate.toLowerCase())],
  );
  return rows.rows[0] ?? null;
}

function localParts(instant: Date): { time: string; date: string } {
  const shifted = new Date(instant.getTime() + AFRICA_DAR_UTC_OFFSET_HOURS * 3_600_000);
  return {
    time: shifted.toISOString().slice(11, 16),
    date: shifted.toISOString().slice(0, 10),
  };
}

function durationOf(departs: Date, arrives: Date): string {
  const minutes = Math.round((arrives.getTime() - departs.getTime()) / 60_000);
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/**
 * Services running between two places on one local date, with seats and fares per class.
 *
 * Returns an empty list rather than an error when nothing runs: "no trains that day" is a
 * real answer the page has to show, and it must not look like a failure.
 */
export async function findSgrServices(input: {
  from: string;
  to: string;
  date: string;
}): Promise<{ services: SgrService[]; unresolved: string[] }> {
  const origin = await resolveStation(input.from);
  const destination = await resolveStation(input.to);
  if (!origin || !destination) {
    // Named places the platform has no row for. Returned as a distinct answer rather than an
    // empty service list, so an unseeded station is not read as "no trains today".
    return {
      services: [],
      unresolved: [!origin ? input.from : null, !destination ? input.to : null].filter(
        (name): name is string => Boolean(name),
      ),
    };
  }

  // The window is the corridor's calendar day, expressed against UTC.
  const dayStart = new Date(`${input.date}T00:00:00+03:00`);
  if (Number.isNaN(dayStart.getTime())) throw new Error('invalid_date');
  const dayEnd = new Date(dayStart.getTime() + 24 * 3_600_000);

  const trips = await query<TripRow>(
    // Note the absence of any condition on the trip's own origin and destination. A
    // passenger travelling Morogoro → Dodoma boards the Dar es Salaam train at Morogoro; if
    // the search demanded that the train *start* where they start, every intermediate
    // station would be unreachable and the segment model would be worth nothing. The two
    // stop rows below are what decide whether a train serves the journey.
    `select t.id as trip_id, t.service_ref, tt.code as trainset_code, t.service_pattern,
            o.name as origin, d.name as destination,
            fs_st.name as from_station, ts_st.name as to_station,
            t.departs_at, t.arrives_at, fs.seq as from_seq, ts.seq as to_seq,
            (select max(last_seq.seq) from app.sgr_trip_stops last_seq where last_seq.trip_id = t.id) as last_seq
       from app.sgr_trips t
       join app.sgr_trainset_types tt on tt.id = t.trainset_type_id
       join app.location o on o.id = t.origin_station_id
       join app.location d on d.id = t.destination_station_id
       join app.sgr_trip_stops fs on fs.trip_id = t.id and fs.station_id = $1
       join app.sgr_trip_stops ts on ts.trip_id = t.id and ts.station_id = $2
       join app.location fs_st on fs_st.id = fs.station_id
       join app.location ts_st on ts_st.id = ts.station_id
      where t.status in ('SCHEDULED', 'ON_SALE')
        and t.departs_at >= $3
        and t.departs_at < $4
        and ts.seq > fs.seq
      order by t.departs_at`,
    [origin.id, destination.id, dayStart, dayEnd],
  );

  const classCards = await loadSearchClassCards(
    trips.rows.map((trip) => ({
      tripId: trip.trip_id,
      fromSeq: trip.from_seq,
      toSeq: trip.to_seq,
      fromStation: trip.from_station,
      toStation: trip.to_station,
      servicePattern: trip.service_pattern,
    })),
  );

  const services = trips.rows.map((trip) => {
      const departure = localParts(trip.departs_at);

      /**
       * Only the train's own endpoints have published times. A traveller joining at Kilosa
       * gets `null`, and the card prints an em dash — because showing the 06:00 departure
       * from Dar es Salaam under a Kilosa heading would send someone to the platform at the
       * wrong hour, and that is worse than an unknown.
       */
      const departsHere = trip.from_seq === 0 ? departure.time : null;
      const arrivesHere = trip.to_seq === trip.last_seq ? localParts(trip.arrives_at).time : null;

      return {
        tripId: trip.trip_id,
        serviceRef: trip.service_ref,
        // The operator's own running number, taken from the reference so a passenger can
        // match the ticket against the platform announcement.
        tripNumber: trip.service_ref.replace(/^SGR-/, '').replace(/-\d{4}-\d{2}-\d{2}$/, ''),
        name: `${trip.from_station} → ${trip.to_station} | ${trip.service_pattern?.replace(/_/g, ' ') ?? 'SGR'}`,
        operatorName: 'Tanzania Railways Corporation',
        servicePattern: trip.service_pattern,
        trainsetCode: trip.trainset_code,
        origin: trip.from_station,
        destination: trip.to_station,
        departureTime: departsHere,
        arrivalTime: arrivesHere,
        departureDate: departure.date,
        duration: durationOf(trip.departs_at, trip.arrives_at),
        fromSeq: trip.from_seq,
        toSeq: trip.to_seq,
        /** The train's own endpoints, so the card can say where the service actually runs. */
        serviceOrigin: trip.origin,
        serviceDestination: trip.destination,
        classes: classCards.get(trip.trip_id) ?? [],
      };
    });

  return { services, unresolved: [] };
}

/**
 * The server's price for a trip and class.
 *
 * Kept separate from the search so the booking path can ask for it again: a fare read off a
 * results list ten minutes ago is a display value, not something to charge.
 */
export async function quoteSgrClass(input: {
  tripId: string;
  seatClassCode: string;
  adults: number;
  children: number;
  /** The travelled interval. Without it the quote can only price the train's whole journey. */
  fromSeq: number;
  toSeq: number;
}): Promise<{ unitFare: number; currency: string; fareSource: string; total: number; lines: { label: string; count: number; amount: number }[] } | { error: string }> {
  const trip = await query<{
    origin: string;
    destination: string;
    pattern: string | null;
  }>(
    // The two stations the passenger is between, resolved from the trip's own stop list.
    `select fs_st.name as origin, ts_st.name as destination, t.service_pattern as pattern
       from app.sgr_trips t
       join app.sgr_trip_stops fs on fs.trip_id = t.id and fs.seq = $2
       join app.sgr_trip_stops ts on ts.trip_id = t.id and ts.seq = $3
       join app.location fs_st on fs_st.id = fs.station_id
       join app.location ts_st on ts_st.id = ts.station_id
      where t.id = $1`,
    [input.tripId, input.fromSeq, input.toSeq],
  );
  if (!trip.rowCount) return { error: 'trip_not_found' };

  const fares = await query<{ passenger_type: string; amount: string; currency: string; fare_source: string }>(
    `select f.passenger_type, f.amount::text, f.currency, f.fare_source
       from app.sgr_fares f
       join app.location o on o.id = f.origin_station_id
       join app.location d on d.id = f.destination_station_id
       join app.sgr_seat_classes sc on sc.id = f.seat_class_id
      where o.name = $1 and d.name = $2 and sc.code = $3
        and (f.service_pattern = $4 or f.service_pattern is null)
        and f.valid_to is null
      order by f.service_pattern nulls last`,
    [trip.rows[0].origin, trip.rows[0].destination, input.seatClassCode, trip.rows[0].pattern],
  );

  const adult = fares.rows.find((row) => row.passenger_type === 'adult');
  const child = fares.rows.find((row) => row.passenger_type === 'child');

  if (!adult) return { error: 'fare_unavailable' };
  // A child in the party with no child fare on file is refused rather than quietly charged
  // the adult price: that would be over-charging the passenger to complete a booking.
  if (input.children > 0 && !child) return { error: 'child_fare_unavailable' };

  const lines = [
    { label: 'adult', count: input.adults, amount: Number(adult.amount) },
    ...(input.children > 0 ? [{ label: 'child', count: input.children, amount: Number(child?.amount ?? 0) }] : []),
  ].filter((line) => line.count > 0);

  return {
    unitFare: Number(adult.amount),
    currency: adult.currency,
    fareSource: adult.fare_source,
    total: lines.reduce((sum, line) => sum + line.amount * line.count, 0),
    lines,
  };
}
