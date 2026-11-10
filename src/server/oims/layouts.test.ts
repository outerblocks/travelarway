import { beforeAll, describe, expect, it } from 'vitest';
import { query } from '@/server/db';
import { OimsConflictError, OimsForbiddenError } from '@/server/oims/repository';
import {
  assignVehicleLayout,
  cloneLayout,
  createBlankLayout,
  publishLayout,
  saveDraft,
} from '@/server/oims/layouts';
import { resolveSeatsForTrip } from '@/server/seat-map';

const OPERATOR_A = 'a0000000-0000-4000-8000-000000000002';
const OPERATOR_B = 'a0000000-0000-4000-8000-000000000003';
const PUBLIC_LAYOUT = 'aa000000-0000-4000-8000-000000000001';
const ACTOR = 'test:layouts';

let db = false;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  try {
    await query('select 1 as ok');
    db = true;
  } catch {
    db = false;
  }
});

describe('OIMS seat layouts', () => {
  it('clones a public template and refuses a foreign save or a draft assign', async () => {
    if (!db) return;
    await query(
      `delete from app.seat_layout_seat where layout_id in (
         select id from app.seat_layout where operator_id = $1 and name like '% copy')`,
      [OPERATOR_A],
    );
    await query(
      `delete from app.seat_layout_cell where layout_id in (
         select id from app.seat_layout where operator_id = $1 and name like '% copy')`,
      [OPERATOR_A],
    );
    await query(`delete from app.seat_layout where operator_id = $1 and name like '% copy'`, [OPERATOR_A]);
    const cloned = await cloneLayout(OPERATOR_A, ACTOR, PUBLIC_LAYOUT);
    expect(cloned.status).toBe('draft');
    try {
      await expect(saveDraft(OPERATOR_B, ACTOR, {
        layoutId: cloned.id,
        rows: 14,
        cols: 5,
        cells: [{ row: 0, col: 1, type: 'door_front' }],
        seats: [],
      })).rejects.toBeInstanceOf(OimsForbiddenError);
      await expect(assignVehicleLayout(OPERATOR_A, ACTOR, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', cloned.id))
        .rejects.toBeInstanceOf(OimsConflictError);
    } finally {
      await query(`delete from app.seat_layout_seat where layout_id = $1`, [cloned.id]);
      await query(`delete from app.seat_layout_cell where layout_id = $1`, [cloned.id]);
      await query(`delete from app.seat_layout where id = $1`, [cloned.id]);
    }
  });

  it('creates 2+1 and double-deck blanks and accepts a galley cell', async () => {
    if (!db) return;
    const created: string[] = [];
    try {
      const vip = await createBlankLayout(OPERATOR_A, ACTOR, { name: 'Pattern 2+1', pattern: '2+1' });
      created.push(vip.id);
      const shape = await query<{ cols: number; decks: number }>(
        `select cols, decks from app.seat_layout where id = $1`,
        [vip.id],
      );
      expect(shape.rows[0]).toMatchObject({ cols: 4, decks: 1 });
      const decker = await createBlankLayout(OPERATOR_A, ACTOR, { name: 'Pattern decks', pattern: 'double-deck' });
      created.push(decker.id);
      const stairs = await query<{ n: string }>(
        `select count(*)::text as n from app.seat_layout_cell where layout_id = $1 and cell_type = 'stairs'`,
        [decker.id],
      );
      expect(Number(stairs.rows[0]?.n)).toBe(2);
      await saveDraft(OPERATOR_A, ACTOR, {
        layoutId: vip.id,
        rows: 11,
        cols: 4,
        decks: 1,
        cells: [
          { row: 0, col: 1, type: 'door_front' },
          { row: 0, col: 4, type: 'driver' },
          { row: 11, col: 1, type: 'toilet' },
          { row: 11, col: 3, type: 'galley' },
          { row: 1, col: 1, type: 'seat' },
        ],
        seats: [{ row: 1, col: 1, label: '1A' }],
      });
      const galley = await query<{ cell_type: string }>(
        `select cell_type from app.seat_layout_cell where layout_id = $1 and row = 11 and col = 3`,
        [vip.id],
      );
      expect(galley.rows[0]?.cell_type).toBe('galley');
    } finally {
      for (const id of created.reverse()) {
        await query(`delete from app.seat_layout_seat where layout_id = $1`, [id]);
        await query(`delete from app.seat_layout_cell where layout_id = $1`, [id]);
        await query(`delete from app.seat_layout where id = $1`, [id]);
      }
    }
  });

  it('refuses an invented seat label against a trip layout', async () => {
    if (!db) return;
    const trip = await query<{ id: string }>(
      `select t.id from app.trip t
         join app.vehicle v on v.id = t.vehicle_id
        where coalesce(t.seat_layout_id, v.seat_layout_id) is not null
        limit 1`,
    );
    if (!trip.rows[0]) return;
    await expect(resolveSeatsForTrip(query, trip.rows[0].id, ['ZZ9'])).rejects.toThrow('invalid_seats');
  });

  it('keeps a published trip on v1 after a new version is published', async () => {
    if (!db) return;
    await query(`delete from app.trip where id = $1`, ['d0000000-0000-4000-8000-000000000098']);
    await query(
      `delete from app.seat_layout_seat where layout_id in (select id from app.seat_layout where operator_id = $1 and name = 'Isolation map')`,
      [OPERATOR_A],
    );
    await query(
      `delete from app.seat_layout_cell where layout_id in (select id from app.seat_layout where operator_id = $1 and name = 'Isolation map')`,
      [OPERATOR_A],
    );
    await query(`delete from app.seat_layout where operator_id = $1 and name = 'Isolation map'`, [OPERATOR_A]);
    const created: string[] = [];
    try {
      const blank = await createBlankLayout(OPERATOR_A, ACTOR, { name: 'Isolation map', rows: 2, cols: 3, aisleCol: 2 });
      created.push(blank.id);
      await saveDraft(OPERATOR_A, ACTOR, {
        layoutId: blank.id,
        rows: 2,
        cols: 3,
        cells: [
          { row: 0, col: 1, type: 'door_front' },
          { row: 0, col: 3, type: 'driver' },
          { row: 1, col: 1, type: 'seat' },
          { row: 1, col: 2, type: 'aisle' },
          { row: 1, col: 3, type: 'seat' },
        ],
        seats: [
          { row: 1, col: 1, label: '01' },
          { row: 1, col: 3, label: '02' },
        ],
      });
      await publishLayout(OPERATOR_A, ACTOR, blank.id);
      const schedule = await query<{ id: string; route_id: string }>(
        `select id, route_id from app.schedule where operator_id = $1 limit 1`,
        [OPERATOR_A],
      );
      if (!schedule.rows[0]) return;
      const tripId = 'd0000000-0000-4000-8000-000000000098';
      await query(`delete from app.trip where id = $1`, [tripId]);
      await query(
        `insert into app.trip (id, schedule_id, route_id, operator_id, service_date, status, seat_layout_id)
         values ($1, $2, $3, $4, current_date + 400, 'scheduled', $5)`,
        [tripId, schedule.rows[0].id, schedule.rows[0].route_id, OPERATOR_A, blank.id],
      );
      const revised = await publishLayout(OPERATOR_A, ACTOR, blank.id);
      expect(revised.status).toBe('draft');
      created.push(revised.id);
      await saveDraft(OPERATOR_A, ACTOR, {
        layoutId: revised.id,
        rows: 2,
        cols: 3,
        cells: [
          { row: 0, col: 1, type: 'door_front' },
          { row: 0, col: 3, type: 'driver' },
          { row: 1, col: 1, type: 'seat' },
          { row: 1, col: 2, type: 'aisle' },
          { row: 1, col: 3, type: 'seat' },
        ],
        seats: [
          { row: 1, col: 1, label: '11' },
          { row: 1, col: 3, label: '12' },
        ],
      });
      await publishLayout(OPERATOR_A, ACTOR, revised.id);
      const map = await query<{ label: string }>(
        `select s.label from app.trip t
           join app.seat_layout_seat s on s.layout_id = t.seat_layout_id
          where t.id = $1 order by s.label`,
        [tripId],
      );
      expect(map.rows.map((row) => row.label)).toEqual(['01', '02']);
      await query(`delete from app.trip where id = $1`, [tripId]);
    } finally {
      await query(`delete from app.trip where id = $1`, ['d0000000-0000-4000-8000-000000000098']);
      for (const id of created.reverse()) {
        await query(`delete from app.seat_layout_seat where layout_id = $1`, [id]);
        await query(`delete from app.seat_layout_cell where layout_id = $1`, [id]);
        await query(`delete from app.seat_layout where id = $1`, [id]);
      }
    }
  });
});
