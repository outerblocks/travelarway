import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression tests for audit M-002: SGR seat release and cancellation.
 *
 * The database is replaced by a tiny in-memory model of `sgr_seat_segments` that understands
 * exactly the statements inventory.ts issues for release/cancel. That is enough to prove the
 * two properties that matter: the work happens inside one transaction, and freed intervals are
 * merged with AVAILABLE neighbours on *both* sides.
 */

interface Segment {
  trip_seat_id: string;
  from_seq: number;
  to_seq: number;
  state: 'AVAILABLE' | 'HELD' | 'SOLD';
  hold_id?: string;
  booking_item_id?: string;
}

const db = vi.hoisted(() => ({
  segments: [] as Segment[],
  holds: new Map<string, string>(),
  transactions: 0,
  bareQueries: [] as string[],
}));

function run(sql: string, params: unknown[]) {
  const text = sql.replace(/\s+/g, ' ').trim();
  const take = (predicate: (s: Segment) => boolean) => {
    const hit = db.segments.filter(predicate);
    db.segments = db.segments.filter((s) => !predicate(s));
    return hit;
  };

  if (text.startsWith("delete from app.sgr_seat_segments where hold_id = $1 and state = 'HELD'")) {
    const rows = take((s) => s.state === 'HELD' && s.hold_id === params[0]);
    return { rows: rows.map((r, i) => ({ id: String(i), ...r })), rowCount: rows.length };
  }
  if (text.startsWith("delete from app.sgr_seat_segments where booking_item_id = $1 and state = 'SOLD'")) {
    const rows = take((s) => s.state === 'SOLD' && s.booking_item_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (text.includes("state = 'AVAILABLE' and to_seq = $2")) {
    const rows = take((s) => s.trip_seat_id === params[0] && s.state === 'AVAILABLE' && s.to_seq === params[1]);
    return { rows, rowCount: rows.length };
  }
  if (text.includes("state = 'AVAILABLE' and from_seq = $2")) {
    const rows = take((s) => s.trip_seat_id === params[0] && s.state === 'AVAILABLE' && s.from_seq === params[1]);
    return { rows, rowCount: rows.length };
  }
  if (text.startsWith('insert into app.sgr_seat_segments')) {
    db.segments.push({
      trip_seat_id: params[0] as string,
      from_seq: params[1] as number,
      to_seq: params[2] as number,
      state: 'AVAILABLE',
    });
    return { rows: [], rowCount: 1 };
  }
  if (text.startsWith('update app.sgr_holds set status = $2')) {
    if (db.holds.get(params[0] as string) === 'HELD') db.holds.set(params[0] as string, params[1] as string);
    return { rows: [], rowCount: 1 };
  }
  if (text.startsWith("select id from app.sgr_holds where status = 'HELD'")) {
    const rows = [...db.holds].filter(([, status]) => status === 'HELD').map(([id]) => ({ id }));
    return { rows, rowCount: rows.length };
  }
  throw new Error(`unexpected SQL in test: ${text}`);
}

vi.mock('@/server/db', () => ({
  query: vi.fn(async (sql: string, params: unknown[] = []) => {
    db.bareQueries.push(sql);
    return run(sql, params);
  }),
  withTransaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => {
    db.transactions += 1;
    return work({ query: async (sql: string, params: unknown[] = []) => run(sql, params) });
  }),
}));

vi.mock('@/server/sgr/layout-repository', () => ({ findPublishedTrainset: vi.fn() }));

const { cancelBookingSeats, releaseExpiredHolds, releaseHold } = await import('@/server/sgr/inventory');

const available = (seat = 'seat-1') =>
  db.segments
    .filter((s) => s.trip_seat_id === seat && s.state === 'AVAILABLE')
    .map((s) => [s.from_seq, s.to_seq])
    .sort((a, b) => a[0] - b[0]);

beforeEach(() => {
  db.segments = [];
  db.holds = new Map();
  db.transactions = 0;
  db.bareQueries = [];
});

describe('cancelBookingSeats', () => {
  it('frees a sold interval inside a single transaction', async () => {
    db.segments = [{ trip_seat_id: 'seat-1', from_seq: 0, to_seq: 9, state: 'SOLD', booking_item_id: 'item-1' }];

    await expect(cancelBookingSeats('item-1')).resolves.toEqual({ freed: 1 });

    expect(db.transactions).toBe(1);
    expect(db.bareQueries).toEqual([]);
    expect(available()).toEqual([[0, 9]]);
  });

  it('merges the freed interval with AVAILABLE neighbours on both sides', async () => {
    db.segments = [
      { trip_seat_id: 'seat-1', from_seq: 0, to_seq: 3, state: 'AVAILABLE' },
      { trip_seat_id: 'seat-1', from_seq: 3, to_seq: 6, state: 'SOLD', booking_item_id: 'item-1' },
      { trip_seat_id: 'seat-1', from_seq: 6, to_seq: 9, state: 'AVAILABLE' },
    ];

    await cancelBookingSeats('item-1');

    expect(available()).toEqual([[0, 9]]);
    expect(db.segments).toHaveLength(1);
  });

  it('leaves other passengers\u2019 sold intervals alone', async () => {
    db.segments = [
      { trip_seat_id: 'seat-1', from_seq: 0, to_seq: 3, state: 'SOLD', booking_item_id: 'item-2' },
      { trip_seat_id: 'seat-1', from_seq: 3, to_seq: 6, state: 'SOLD', booking_item_id: 'item-1' },
    ];

    await cancelBookingSeats('item-1');

    expect(available()).toEqual([[3, 6]]);
    expect(db.segments.filter((s) => s.state === 'SOLD')).toHaveLength(1);
  });
});

describe('releaseHold', () => {
  it('rejoins both neighbours rather than only one', async () => {
    db.holds.set('hold-1', 'HELD');
    db.segments = [
      { trip_seat_id: 'seat-1', from_seq: 0, to_seq: 2, state: 'AVAILABLE' },
      { trip_seat_id: 'seat-1', from_seq: 2, to_seq: 5, state: 'HELD', hold_id: 'hold-1' },
      { trip_seat_id: 'seat-1', from_seq: 5, to_seq: 9, state: 'AVAILABLE' },
    ];

    await expect(releaseHold('hold-1')).resolves.toEqual({ released: 1 });

    expect(available()).toEqual([[0, 9]]);
    expect(db.holds.get('hold-1')).toBe('RELEASED');
  });
});

describe('releaseExpiredHolds', () => {
  it('records the hold as EXPIRED, not RELEASED', async () => {
    db.holds.set('hold-9', 'HELD');
    db.segments = [{ trip_seat_id: 'seat-1', from_seq: 0, to_seq: 4, state: 'HELD', hold_id: 'hold-9' }];

    await expect(releaseExpiredHolds()).resolves.toEqual({ expired: 1 });

    expect(db.holds.get('hold-9')).toBe('EXPIRED');
    expect(available()).toEqual([[0, 4]]);
  });
});

