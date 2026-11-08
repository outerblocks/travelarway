import { describe, expect, it } from 'vitest';
import {
  columnsOf,
  geometryFromFixtureCoach,
  toTrainSeat,
} from '@/components/train/coach-geometry';
import type { TrainCoach, TrainSeat } from '@/types';

/**
 * The map used to assume four seats across. These tests are the proof that it now follows
 * the layout it is given, which is the difference between a 2+1 coach that looks like a 2+1
 * coach and one that shows an empty fourth column.
 */

function seat(overrides: Partial<TrainSeat> & { id: string; number: number; row: number; lane: number }): TrainSeat {
  return { wheelchair: false, taken: false, ...overrides };
}

describe('columnsOf', () => {
  it('puts the aisle between the two groups of a 2+2 coach', () => {
    expect(
      columnsOf({ coachNo: 2, className: 'Business', gridRows: 11, gridCols: 4, aisleAfterCol: 2, capacity: 44, seats: [], fixtures: [] }),
    ).toEqual([1, 2, 'aisle', 3, 4]);
  });

  it('renders a 2+1 coach with three seat columns, not four', () => {
    // Royal: two abreast on one side, a single on the other. The old component drew this as
    // a 2+2 and left a gap where no seat exists.
    expect(
      columnsOf({ coachNo: 1, className: 'Royal', gridRows: 13, gridCols: 3, aisleAfterCol: 2, capacity: 39, seats: [], fixtures: [] }),
    ).toEqual([1, 2, 'aisle', 3]);
  });

  it('renders a 3+2 coach with the aisle after the three abreast', () => {
    expect(
      columnsOf({ coachNo: 4, className: 'Economy', gridRows: 16, gridCols: 5, aisleAfterCol: 3, capacity: 80, seats: [], fixtures: [] }),
    ).toEqual([1, 2, 3, 'aisle', 4, 5]);
  });

  it('leaves the aisle at the end when a layout puts everything on one side', () => {
    // aisleAfterCol clamps to gridCols so a single-side layout still gets an aisle cell,
    // which keeps the grid width stable rather than shifting the coach interior sideways.
    const geometry = columnsOf({ coachNo: 1, className: 'x', gridRows: 1, gridCols: 2, aisleAfterCol: 5, capacity: 2, seats: [], fixtures: [] });
    expect(geometry).toEqual([1, 2, 'aisle']);
  });
});

describe('geometryFromFixtureCoach', () => {
  it('maps lanes straight onto contiguous seat columns', () => {
    const coach: TrainCoach = {
      number: 2,
      className: 'Business',
      capacity: 4,
      seats: [
        seat({ id: '2-1', number: 1, row: 1, lane: 1 }),
        seat({ id: '2-2', number: 2, row: 1, lane: 2 }),
        seat({ id: '2-3', number: 3, row: 1, lane: 3 }),
        seat({ id: '2-4', number: 4, row: 1, lane: 4 }),
      ],
    };

    const geometry = geometryFromFixtureCoach(coach);
    // The aisle is a marker between columns, so no seat is pushed out of the grid. A previous
    // version added a hole here and then clamped the count, which silently dropped every seat
    // to the right of the aisle.
    expect(geometry.seats.map((entry) => entry.col)).toEqual([1, 2, 3, 4]);
    expect(geometry.gridCols).toBe(4);
    expect(geometry.aisleAfterCol).toBe(2);
  });

  it('marks taken seats as sold and leaves the rest available', () => {
    const coach: TrainCoach = {
      number: 3,
      className: 'Business',
      capacity: 2,
      seats: [seat({ id: '3-1', number: 1, row: 1, lane: 1 }), seat({ id: '3-2', number: 2, row: 1, lane: 2, taken: true })],
    };

    expect(geometryFromFixtureCoach(coach).seats.map((entry) => entry.state)).toEqual(['AVAILABLE', 'SOLD']);
  });

  it('does not invent a seat the coach does not have', () => {
    // A 2+1 row: two abreast, then the single on the far side. Column 3 stays empty, so the
    // map shows the aisle and the single rather than a phantom seat.
    const coach: TrainCoach = {
      number: 1,
      className: 'Royal',
      capacity: 3,
      seats: [
        seat({ id: '1-1', number: 1, row: 1, lane: 1 }),
        seat({ id: '1-2', number: 2, row: 1, lane: 2 }),
        seat({ id: '1-3', number: 3, row: 1, lane: 4 }),
      ],
    };

    const geometry = geometryFromFixtureCoach(coach);
    expect(geometry.seats).toHaveLength(3);
    expect(geometry.seats.map((entry) => entry.col)).toEqual([1, 2, 4]);
    expect(geometry.gridCols).toBe(4);

    const columns = columnsOf(geometry);
    expect(columns).toEqual([1, 2, 'aisle', 3, 4]);
    // Nothing occupies column 3, which is the whole point: it is empty space, not a seat.
    expect(geometry.seats.some((entry) => entry.col === 3)).toBe(false);
  });

  it('carries the wheelchair flag through to the map', () => {
    const coach: TrainCoach = {
      number: 2,
      className: 'Business',
      capacity: 1,
      seats: [seat({ id: '2-90', number: 90, row: 12, lane: 1, wheelchair: true })],
    };

    expect(geometryFromFixtureCoach(coach).seats[0]?.wheelchair).toBe(true);
  });
});

describe('toTrainSeat', () => {
  it('returns the original fixture seat so the stored key does not change', () => {
    const original = seat({ id: '2-14', number: 14, row: 4, lane: 2 });
    const coach: TrainCoach = { number: 2, className: 'Business', capacity: 1, seats: [original] };
    const geometry = geometryFromFixtureCoach(coach).seats[0];

    expect(toTrainSeat(coach, geometry)).toBe(original);
    expect(toTrainSeat(coach, geometry).id).toBe('2-14');
  });

  it('maps a column back to the same lane the record format uses', () => {
    const coach: TrainCoach = { number: 6, className: 'Business', capacity: 0, seats: [] };
    expect(toTrainSeat(coach, { seatNumber: 7, seatLabel: '7', row: 2, col: 4, state: 'AVAILABLE', wheelchair: false, seatId: '6-7' }).lane).toBe(4);
    expect(toTrainSeat(coach, { seatNumber: 7, seatLabel: '7', row: 2, col: 2, state: 'SOLD', wheelchair: false, seatId: '6-7' }).taken).toBe(true);
  });
});
