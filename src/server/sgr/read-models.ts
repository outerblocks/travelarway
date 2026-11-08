import { query } from '@/server/db';

/**
 * SGR search and seat-selection read models.
 *
 * Both answer a question a seat map cannot answer from layout alone: *for this passenger's
 * range*, what is actually free. A seat that is sold Dar es Salaam → Morogoro is still
 * available Morogoro → Dodoma, so availability is always computed against the requested
 * stop interval, never as a property of the seat.
 *
 * The overlap test is written as `from_seq < to AND to_seq > from` — the same half-open
 * interval rule the exclusion constraint uses — so the read model and the database cannot
 * disagree about what "overlaps" means. If they did, a search could show a seat as free and
 * the hold would then refuse it, which is the experience of a website lying to you.
 */

export interface ClassAvailability {
  seatClassCode: string;
  name: string;
  totalSellable: number;
  available: number;
  /** Resolved from sgr_fares. Null means no approved fare is on file, not that it is free. */
  fareAmount: number | null;
  currency: string | null;
  soldOut: boolean;
}

export interface CarSeatState {
  seatNumber: number;
  seatLabel: string;
  row: number;
  col: number;
  position: string;
  seatKind: string;
  state: 'AVAILABLE' | 'HELD' | 'SOLD' | 'BLOCKED' | 'NOT_SELLABLE';
  /** Only set for the caller's own hold, so a client can mark a seat "selected by you". */
  holdId?: string;
  attributes?: Record<string, string>;
}

export interface CarState {
  coachNo: number;
  seatClassCode: string;
  layoutKind: string;
  gridRows: number;
  gridCols: number;
  aisleAfterRow: number;
  cells: { cellType: string; row: number; col: number }[];
  seats: CarSeatState[];
  availableCount: number;
  capacity: number;
  full: boolean;
  prevCoachNo: number | null;
  nextCoachNo: number | null;
}

export interface CarNavigation {
  seatClassCode: string;
  cars: CarState[];
  /** First car with somewhere to sit; null when the class is sold out for this range. */
  defaultCoachNo: number | null;
  seatSelection: 'PER_SEAT' | 'AUTO_ASSIGN';
}

interface AvailabilityRow {
  seat_class_code: string;
  name: string;
  total_sellable: number;
  available: number;
}

/**
 * Seats per class for one travel range, with the fare that applies to it.
 *
 * Every active class is returned, including one this trainset does not carry. A missing
 * class would otherwise be indistinguishable from a sold-out one in the UI, and the two
 * need different answers: "not offered on this service" versus "choose another train".
 */
export async function getClassAvailability(input: {
  tripId: string;
  fromSeq: number;
  toSeq: number;
  passengerType?: 'adult' | 'child';
}): Promise<ClassAvailability[]> {
  const rows = await query<AvailabilityRow>(
    `select sc.code as seat_class_code, sc.name,
            count(s.id) filter (where s.sellable)::int                                as total_sellable,
            count(s.id) filter (
              where s.sellable
                and not exists (
                  select 1 from app.sgr_seat_segments g
                   where g.trip_seat_id = s.id
                     and g.state in ('HELD', 'SOLD', 'BLOCKED')
                     and g.from_seq < $3 and g.to_seq > $2
                )
            )::int                                                                     as available
       from app.sgr_seat_classes sc
       left join app.sgr_trip_seats s on s.seat_class_id = sc.id and s.trip_id = $1
      where sc.is_active
      group by sc.code, sc.name, sc.rank
      order by sc.rank desc`,
    [input.tripId, input.fromSeq, input.toSeq],
  );

  const fares = await query<{
    seat_class_code: string;
    amount: string;
    currency: string;
  }>(
    `select sc.code as seat_class_code, f.amount::text, f.currency
       from app.sgr_fares f
       join app.sgr_seat_classes sc on sc.id = f.seat_class_id
       join app.sgr_trips t on t.id = $2
      where f.origin_station_id = t.origin_station_id
        and f.destination_station_id = t.destination_station_id
        and f.passenger_type = $1
        and f.valid_to is null`,
    [input.passengerType ?? 'adult', input.tripId],
  );

  const fareByClass = new Map(fares.rows.map((row) => [row.seat_class_code, row]));

  return rows.rows.map((row) => {
    const fare = fareByClass.get(row.seat_class_code);
    return {
      seatClassCode: row.seat_class_code,
      name: row.name,
      totalSellable: row.total_sellable,
      available: row.available,
      fareAmount: fare ? Number(fare.amount) : null,
      currency: fare?.currency ?? null,
      soldOut: row.available === 0,
    };
  });
}

interface SnapshotCoach {
  coachNo: number;
  classCode: string;
  layoutKind: string;
  gridRows: number;
  gridCols: number;
  aisleAfterRow: number;
  seats: {
    seatNumber: number;
    seatLabel: string;
    row: number;
    col: number;
    position: string;
    seatKind?: string;
    attributes?: Record<string, string>;
  }[];
  fixtures?: { cellType: string; row: number; col: number }[];
}

interface SeatStateRow {
  coach_no: number;
  seat_number: number;
  sellable: boolean;
  state: string | null;
  hold_id: string | null;
}

/**
 * One entry per car of a class, with per-seat state for the requested range.
 *
 * The layout comes from the trip's `layout_snapshot`, not from the live coach table: the
 * map a passenger sees must be the one their ticket was cut against, even after the operator
 * reconfigures the coach.
 *
 * Seats that are not ours to sell are returned as NOT_SELLABLE rather than dropped. Hiding
 * them would make a partly-allocated coach look empty, and a passenger would conclude the
 * train is full when the seats simply are not Travelar's to sell.
 */
export async function getCarSeatState(input: {
  tripId: string;
  seatClassCode: string;
  fromSeq: number;
  toSeq: number;
  /** The caller's own hold, so their selections can be shown as selected. */
  holdId?: string;
}): Promise<CarNavigation> {
  // Distinguishes "this class is not offered on this trainset" from "that is not a class".
  // Both would otherwise return an empty list of cars, and only one of them is a caller error
  // worth reporting.
  const knownClass = await query<{ code: string }>(
    `select sc.code from app.sgr_seat_classes sc where sc.code = $1 and sc.is_active`,
    [input.seatClassCode],
  );
  if (!knownClass.rowCount) throw new Error(`class_not_found:${input.seatClassCode}`);

  const [tripRow, stateRows] = await Promise.all([
    query<{ layout_snapshot: string }>(`select layout_snapshot::text from app.sgr_trips where id = $1`, [input.tripId]),
    query<SeatStateRow>(
      `select s.coach_no, s.seat_number, s.sellable,
              (select g.state from app.sgr_seat_segments g
                where g.trip_seat_id = s.id
                  and g.state in ('HELD', 'SOLD', 'BLOCKED')
                  and g.from_seq < $4 and g.to_seq > $3
                limit 1) as state,
              (select g.hold_id from app.sgr_seat_segments g
                where g.trip_seat_id = s.id
                  and g.state = 'HELD'
                  and g.from_seq < $4 and g.to_seq > $3
                limit 1) as hold_id
         from app.sgr_trip_seats s
         join app.sgr_seat_classes sc on sc.id = s.seat_class_id
        where s.trip_id = $1 and sc.code = $2`,
      [input.tripId, input.seatClassCode, input.fromSeq, input.toSeq],
    ),
  ]);

  const snapshot: SnapshotCoach[] = JSON.parse(tripRow.rows[0]?.layout_snapshot ?? '[]');
  const coaches = snapshot
    .filter((coach) => coach.classCode === input.seatClassCode)
    .sort((left, right) => left.coachNo - right.coachNo);

  const stateByKey = new Map(stateRows.rows.map((row) => [`${row.coach_no}:${row.seat_number}`, row]));

  const cars: CarState[] = coaches.map((coach) => {
    const seats: CarSeatState[] = coach.seats.map((seat) => {
      const live = stateByKey.get(`${coach.coachNo}:${seat.seatNumber}`);
      const state: CarSeatState['state'] = !live
        ? 'NOT_SELLABLE'
        : !live.sellable
          ? 'NOT_SELLABLE'
          : (live.state as CarSeatState['state']) ?? 'AVAILABLE';
      return {
        seatNumber: seat.seatNumber,
        seatLabel: seat.seatLabel,
        row: seat.row,
        col: seat.col,
        position: seat.position,
        seatKind: seat.seatKind ?? 'STANDARD',
        state,
        ...(live?.hold_id && live.hold_id === input.holdId ? { holdId: live.hold_id } : {}),
        ...(seat.attributes ? { attributes: seat.attributes } : {}),
      };
    });

    const availableCount = seats.filter((seat) => seat.state === 'AVAILABLE').length;
    return {
      coachNo: coach.coachNo,
      seatClassCode: coach.classCode,
      layoutKind: coach.layoutKind,
      gridRows: coach.gridRows,
      gridCols: coach.gridCols,
      aisleAfterRow: coach.aisleAfterRow,
      cells: coach.fixtures ?? [],
      seats,
      availableCount,
      capacity: seats.length,
      full: availableCount === 0,
      prevCoachNo: null,
      nextCoachNo: null,
    };
  });

  // The arrows are wired here rather than in the client, so the chain cannot be rebuilt
  // differently by every screen that shows a seat map.
  cars.forEach((car, index) => {
    car.prevCoachNo = index > 0 ? cars[index - 1].coachNo : null;
    car.nextCoachNo = index < cars.length - 1 ? cars[index + 1].coachNo : null;
  });

  return {
    seatClassCode: input.seatClassCode,
    cars,
    defaultCoachNo: cars.find((car) => car.availableCount > 0)?.coachNo ?? null,
    seatSelection: 'PER_SEAT',
  };
}
