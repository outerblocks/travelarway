import type { TrainCoach, TrainSeat } from '@/types';

/**
 * Seat-map geometry for a coach, kept apart from the component that draws it.
 *
 * Split out because a file that exports both a component and helpers defeats React's fast
 * refresh, and because this is the part worth testing on its own: it decides where a seat
 * sits in the grid, which is exactly the thing that was wrong when the map assumed four
 * seats across.
 */

export type SeatState = 'AVAILABLE' | 'HELD' | 'SOLD' | 'BLOCKED' | 'NOT_SELLABLE';

/** A seat as the map needs it: where it sits, what it is called, and whether it can be taken. */
export interface GeometrySeat {
  seatNumber: number;
  seatLabel: string;
  /** 1-based, matching the layout grid. */
  row: number;
  /** 1-based seat column, contiguous across the coach. The aisle is a marker between columns,
   *  not a column itself — the same convention the published layouts use. */
  col: number;
  state: SeatState;
  wheelchair: boolean;
  /** The value the passenger record carries, e.g. `2-14`. */
  seatId: string;
}

export interface CoachGeometry {
  coachNo: number;
  className: string;
  gridRows: number;
  gridCols: number;
  /**
   * Seat columns to the left of the aisle. Named after the database column, which calls the
   * across-track position a "row" because the layout is authored as pairs of rows.
   */
  aisleAfterCol: number;
  capacity: number;
  seats: GeometrySeat[];
  fixtures: { kind: 'wc' | 'door' | 'luggage' | 'table'; row: number; col: number }[];
}

/**
 * The carriage ends of every SGR coach, from the operator's own maps: two WCs facing each
 * other at the vestibule. Shared by all layouts, so drawn here rather than stored per coach.
 */
const VESTIBULE_WCS = [
  { kind: 'wc' as const, row: 0, col: 1 },
  { kind: 'wc' as const, row: 0, col: 2 },
];

/**
 * Turns a fixture coach into geometry.
 *
 * Exists so the booking flow can move to the endpoint one screen at a time. The fixture
 * records a lane (1–4, aisle after lane 2); a lane is already a contiguous seat column, so it
 * maps straight across and the aisle stays a marker. Nothing here invents a seat the fixture
 * does not have — taken becomes SOLD and everything else AVAILABLE, because a fixture cannot
 * know about another passenger's hold.
 */
export function geometryFromFixtureCoach(coach: TrainCoach): CoachGeometry {
  const seats: GeometrySeat[] = coach.seats.map((seat) => ({
    seatNumber: seat.number,
    seatLabel: String(seat.number),
    row: seat.row,
    col: seat.lane,
    state: seat.state ?? (seat.taken ? 'SOLD' : 'AVAILABLE'),
    wheelchair: seat.wheelchair,
    seatId: seat.id,
  }));

  return {
    coachNo: coach.number,
    className: coach.className,
    gridRows: Math.max(...seats.map((seat) => seat.row), 1),
    // The widest thing in the coach sets the grid: seats or the vestibule fixtures. Counting
    // only seats clipped the second WC on a coach drawn with one seat, which made the
    // carriage end look like it had one toilet on one side.
    gridCols: Math.max(
      ...seats.map((seat) => seat.col),
      ...VESTIBULE_WCS.map((fixture) => fixture.col),
      1,
    ),
    aisleAfterCol: 2,
    capacity: coach.capacity,
    seats,
    fixtures: VESTIBULE_WCS,
  };
}

/**
 * A coach as `/api/sgr/trips/:tripId/classes/:classCode/cars` describes it.
 *
 * Declared here rather than imported from the server module: this file is bundled into the
 * browser, and pulling a server import in would drag the database client with it.
 */
export interface SgrCarView {
  coachNo: number;
  seatClassCode: string;
  gridRows: number;
  gridCols: number;
  aisleAfterRow: number;
  capacity: number;
  availableCount: number;
  seats: {
    seatNumber: number;
    seatLabel: string;
    row: number;
    col: number;
    position: string;
    seatKind: string;
    state: SeatState;
  }[];
}

/**
 * Turns cars from the endpoint into the coach shape the map draws.
 *
 * The layout grid is authored 0-based and the map reserves row 0 for the vestibule, so rows
 * and columns shift by one on the way in. That conversion lives here rather than in the page
 * because getting it wrong moves seats by one position — silently, into the wrong column.
 */
export function sgrCarsToTrainCoaches(cars: SgrCarView[]): TrainCoach[] {
  return cars.map((car) => ({
    number: car.coachNo,
    className: car.seatClassCode,
    capacity: car.capacity,
    seats: car.seats.map((seat) => ({
      id: `${car.coachNo}-${seat.seatNumber}`,
      number: seat.seatNumber,
      row: seat.row + 1,
      lane: seat.col + 1,
      wheelchair: seat.seatKind === 'ACCESSIBLE',
      taken: seat.state !== 'AVAILABLE',
      state: seat.state,
    })),
  }));
}

/** Columns of the grid, with the aisle occupying a real column between the two groups. */
export function columnsOf(geometry: CoachGeometry): (number | 'aisle')[] {
  const leftCount = Math.min(geometry.aisleAfterCol, geometry.gridCols);
  const left = Array.from({ length: leftCount }, (_, index) => index + 1);
  const right = Array.from({ length: Math.max(geometry.gridCols - leftCount, 0) }, (_, index) => leftCount + index + 1);
  return [...left, 'aisle', ...right];
}

/**
 * Maps a geometry seat back to the shape the booking page already holds.
 *
 * The page stores `${coach}-${number}`, so the key is reproduced rather than reinvented —
 * passenger records saved before this change still point at the same seat.
 */
export function toTrainSeat(coach: TrainCoach, seat: GeometrySeat): TrainSeat {
  const original = coach.seats.find((candidate) => candidate.id === seat.seatId);
  return original ?? {
    id: seat.seatId,
    number: seat.seatNumber,
    row: seat.row,
    lane: seat.col,
    wheelchair: seat.wheelchair,
    taken: seat.state === 'SOLD' || seat.state === 'BLOCKED',
  };
}
