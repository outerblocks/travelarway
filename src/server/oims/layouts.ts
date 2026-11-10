import type pg from 'pg';
import { query, withOperatorTransaction } from '@/server/db';
import { OimsConflictError, OimsForbiddenError } from '@/server/oims/repository';
import { isCellType, LAYOUT_PATTERNS, type LayoutPatternId } from '@/domain/seat-cells';

export { CELL_TYPES } from '@/domain/seat-cells';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LayoutCellInput {
  deck?: number;
  row: number;
  col: number;
  type: string;
}

export interface LayoutSeatInput {
  deck?: number;
  row: number;
  col: number;
  label: string;
}

export async function listLayouts(operatorId: string) {
  const { rows } = await query(
    `select distinct on (sl.family_id)
            sl.id, sl.family_id as "familyId", sl.version, sl.name, sl.description, sl.visibility,
            sl.status, sl.rows, sl.cols, sl.decks, sl.operator_id as "operatorId",
            (select count(*)::int from app.seat_layout_seat s where s.layout_id = sl.id) as "seatCount"
       from app.seat_layout sl
      where sl.visibility = 'public'
         or sl.operator_id = $1
      order by sl.family_id, sl.version desc`,
    [operatorId],
  );
  return { data: rows };
}

async function readableLayout(operatorId: string, layoutId: string) {
  const found = await query<{
    id: string;
    family_id: string;
    version: number;
    name: string;
    status: string;
    visibility: string;
    operator_id: string | null;
    rows: number;
    cols: number;
    decks: number;
  }>(
    `select id, family_id, version, name, status, visibility, operator_id, rows, cols, decks
       from app.seat_layout where id = $1`,
    [layoutId],
  );
  const row = found.rows[0];
  if (!row) throw new Error('invalid_layout');
  const owned = row.operator_id === operatorId;
  const publicTemplate = row.visibility === 'public' && row.operator_id == null;
  if (!owned && !publicTemplate) throw new OimsForbiddenError();
  return row;
}

function validateGrid(rows: number, cols: number) {
  if (!Number.isInteger(rows) || rows < 1 || rows > 60) throw new Error('invalid_rows');
  if (!Number.isInteger(cols) || cols < 1 || cols > 8) throw new Error('invalid_cols');
}

function validateDraftPayload(input: {
  rows: number;
  cols: number;
  decks?: number;
  cells: LayoutCellInput[];
  seats: LayoutSeatInput[];
}) {
  validateGrid(input.rows, input.cols);
  const deckCount = input.decks ?? 1;
  if (!Number.isInteger(deckCount) || deckCount < 1 || deckCount > 2) throw new Error('invalid_decks');
  const maxDeck = deckCount - 1;
  const seatKeys = new Set<string>();
  const labels = new Set<string>();
  const cellSeats = new Set<string>();
  for (const cell of input.cells) {
    if (!isCellType(cell.type)) throw new Error('invalid_cell_type');
    const deck = cell.deck ?? 0;
    if (deck < 0 || deck > maxDeck) throw new Error('invalid_cell_position');
    if (cell.row < 0 || cell.row > input.rows || cell.col < 1 || cell.col > input.cols) {
      throw new Error('invalid_cell_position');
    }
    if (cell.type === 'seat') cellSeats.add(`${deck}:${cell.row}:${cell.col}`);
  }
  for (const seat of input.seats) {
    const label = seat.label.trim().toUpperCase();
    if (!label || label.length > 8) throw new Error('invalid_seat_label');
    const deck = seat.deck ?? 0;
    const key = `${deck}:${seat.row}:${seat.col}`;
    const labelKey = `${deck}:${label}`;
    if (seatKeys.has(key) || labels.has(labelKey)) throw new Error('invalid_seat_duplicate');
    if (deck < 0 || deck > maxDeck) throw new Error('invalid_seat_position');
    if (seat.row < 1 || seat.row > input.rows || seat.col < 1 || seat.col > input.cols) {
      throw new Error('invalid_seat_position');
    }
    seatKeys.add(key);
    labels.add(labelKey);
  }
  for (const key of cellSeats) {
    if (!seatKeys.has(key)) throw new Error('invalid_seat_cell');
  }
  for (const key of seatKeys) {
    if (!cellSeats.has(key)) throw new Error('invalid_seat_cell');
  }
}

async function copyGeometry(client: pg.PoolClient, fromId: string, toId: string) {
  await client.query(
    `insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
     select $2, deck, row, col, cell_type from app.seat_layout_cell where layout_id = $1`,
    [fromId, toId],
  );
  await client.query(
    `insert into app.seat_layout_seat (
       layout_id, deck, row, col, label, seat_class_id, is_window, is_aisle, extra_legroom, accessible
     )
     select $2, deck, row, col, label, seat_class_id, is_window, is_aisle, extra_legroom, accessible
       from app.seat_layout_seat where layout_id = $1`,
    [fromId, toId],
  );
}

async function writeGeometry(
  client: pg.PoolClient,
  layoutId: string,
  cells: LayoutCellInput[],
  seats: LayoutSeatInput[],
  cols: number,
) {
  await client.query(`delete from app.seat_layout_seat where layout_id = $1`, [layoutId]);
  await client.query(`delete from app.seat_layout_cell where layout_id = $1`, [layoutId]);
  for (const cell of cells) {
    await client.query(
      `insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
       values ($1, $2, $3, $4, $5)`,
      [layoutId, cell.deck ?? 0, cell.row, cell.col, cell.type],
    );
  }
  for (const seat of seats) {
    const col = seat.col;
    await client.query(
      `insert into app.seat_layout_seat (layout_id, deck, row, col, label, is_window, is_aisle)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        layoutId,
        seat.deck ?? 0,
        seat.row,
        col,
        seat.label.trim().toUpperCase(),
        col === 1 || col === cols,
        false,
      ],
    );
  }
}

export async function cloneLayout(operatorId: string, actor: string, sourceId: string) {
  if (!UUID.test(sourceId)) throw new Error('invalid_layout');
  const source = await readableLayout(operatorId, sourceId);
  if (source.status !== 'published') throw new OimsConflictError('layout_not_published');
  return withOperatorTransaction(operatorId, async (client) => {
    const created = await client.query<{ id: string; family_id: string }>(
      `insert into app.seat_layout (
         family_id, version, operator_id, name, description, visibility, rows, cols, decks,
         status, row_count, lanes, mirrored
       )
       select gen_random_uuid(), 1, $2, left(name || ' copy', 80), description, 'private',
              rows, cols, decks, 'draft', row_count, lanes, mirrored
         from app.seat_layout where id = $1
       returning id, family_id`,
      [source.id, operatorId],
    );
    const row = created.rows[0]!;
    await client.query(`update app.seat_layout set family_id = id where id = $1`, [row.id]);
    await copyGeometry(client, source.id, row.id);
    await client.query(
      `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
       values ($1, $2, 'layout.clone', 'seat_layout', $3, $4::jsonb)`,
      [operatorId, actor, row.id, JSON.stringify({ sourceId: source.id })],
    );
    return { id: row.id, familyId: row.id, version: 1, status: 'draft' };
  });
}

export async function createBlankLayout(operatorId: string, actor: string, input: {
  name: string;
  rows?: number;
  cols?: number;
  aisleCol?: number;
  pattern?: string;
}) {
  const name = input.name.trim();
  if (name.length < 2) throw new Error('invalid_layout_name');
  if (input.pattern && !(input.pattern in LAYOUT_PATTERNS)) throw new Error('invalid_pattern');
  const preset = input.pattern
    ? LAYOUT_PATTERNS[input.pattern as LayoutPatternId]
    : null;
  const rows = preset?.rows ?? input.rows ?? 0;
  const cols = preset?.cols ?? input.cols ?? 0;
  const decks = preset?.decks ?? 1;
  const aisle = preset?.aisleCol ?? input.aisleCol;
  validateGrid(rows, cols);
  if (aisle != null && (!Number.isInteger(aisle) || aisle < 1 || aisle > cols)) {
    throw new Error('invalid_aisle');
  }
  const cells: LayoutCellInput[] = [];
  for (let deck = 0; deck < decks; deck += 1) {
    if (deck === 0) {
      cells.push({ deck, row: 0, col: 1, type: 'door_front' });
      cells.push({ deck, row: 0, col: cols, type: 'driver' });
    }
    if (aisle) {
      for (let row = 1; row <= rows; row += 1) {
        cells.push({ deck, row, col: aisle, type: 'aisle' });
      }
    }
    if (decks === 2) {
      const stairRow = Math.max(1, Math.floor(rows / 2));
      cells.push({ deck, row: stairRow, col: 1, type: 'stairs' });
    }
  }
  return withOperatorTransaction(operatorId, async (client) => {
    const created = await client.query<{ id: string }>(
      `insert into app.seat_layout (
         family_id, version, operator_id, name, visibility, rows, cols, decks, status, row_count, lanes
       ) values (gen_random_uuid(), 1, $1, $2, 'private', $3, $4, $5, 'draft', $3, $6)
       returning id`,
      [operatorId, name, rows, cols, decks, ['A', 'B', 'C', 'D'].slice(0, Math.max(2, cols - 1))],
    );
    const id = created.rows[0]!.id;
    await client.query(`update app.seat_layout set family_id = id where id = $1`, [id]);
    await writeGeometry(client, id, cells, [], cols);
    await client.query(
      `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
       values ($1, $2, 'layout.create', 'seat_layout', $3, $4::jsonb)`,
      [operatorId, actor, id, JSON.stringify({ rows, cols, decks, pattern: input.pattern ?? null })],
    );
    return { id, familyId: id, version: 1, status: 'draft' };
  });
}

export async function saveDraft(operatorId: string, actor: string, input: {
  layoutId: string;
  name?: string;
  rows: number;
  cols: number;
  decks?: number;
  cells: LayoutCellInput[];
  seats: LayoutSeatInput[];
}) {
  if (!UUID.test(input.layoutId)) throw new Error('invalid_layout');
  validateDraftPayload(input);
  return withOperatorTransaction(operatorId, async (client) => {
    const found = await client.query<{ status: string; operator_id: string | null }>(
      `select status, operator_id from app.seat_layout where id = $1 for update`,
      [input.layoutId],
    );
    const row = found.rows[0];
    if (!row || row.operator_id !== operatorId) throw new OimsForbiddenError();
    if (row.status !== 'draft') throw new OimsConflictError('layout_not_draft');
    await client.query(
      `update app.seat_layout
          set name = coalesce($2, name), rows = $3, cols = $4, row_count = $3, decks = coalesce($5, decks)
        where id = $1`,
      [input.layoutId, input.name?.trim() || null, input.rows, input.cols, input.decks ?? null],
    );
    await writeGeometry(client, input.layoutId, input.cells, input.seats, input.cols);
    await client.query(
      `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
       values ($1, $2, 'layout.save', 'seat_layout', $3, $4::jsonb)`,
      [operatorId, actor, input.layoutId, JSON.stringify({ seats: input.seats.length })],
    );
    return { id: input.layoutId, status: 'draft', seatCount: input.seats.length };
  });
}

export async function publishLayout(operatorId: string, actor: string, layoutId: string) {
  if (!UUID.test(layoutId)) throw new Error('invalid_layout');
  return withOperatorTransaction(operatorId, async (client) => {
    const found = await client.query<{
      id: string;
      family_id: string;
      version: number;
      status: string;
      operator_id: string | null;
    }>(
      `select id, family_id, version, status, operator_id from app.seat_layout where id = $1 for update`,
      [layoutId],
    );
    const row = found.rows[0];
    if (!row || row.operator_id !== operatorId) throw new OimsForbiddenError();
    const seats = await client.query(`select 1 from app.seat_layout_seat where layout_id = $1 limit 1`, [layoutId]);
    if (!seats.rowCount) throw new Error('invalid_layout_empty');

    if (row.status === 'draft') {
      const prior = await client.query<{ id: string; version: number }>(
        `select id, version from app.seat_layout
          where family_id = $1 and status = 'published' and id <> $2
          order by version desc limit 1`,
        [row.family_id, layoutId],
      );
      if (prior.rows[0]) {
        const nextVersion = prior.rows[0].version + 1;
        await client.query(`update app.seat_layout set version = $2 where id = $1`, [layoutId, nextVersion]);
        await client.query(
          `update app.seat_layout set status = 'archived' where family_id = $1 and status = 'published'`,
          [row.family_id],
        );
      }
      await client.query(`update app.seat_layout set status = 'published' where id = $1`, [layoutId]);
      await client.query(
        `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
         values ($1, $2, 'layout.publish', 'seat_layout', $3, $4::jsonb)`,
        [operatorId, actor, layoutId, JSON.stringify({ familyId: row.family_id })],
      );
      return { id: layoutId, status: 'published' };
    }

    if (row.status !== 'published') throw new OimsConflictError('layout_not_draft');
    const created = await client.query<{ id: string }>(
      `insert into app.seat_layout (
         family_id, version, operator_id, name, description, visibility, rows, cols, decks,
         status, row_count, lanes, mirrored
       )
       select family_id, version + 1, operator_id, name, description, visibility, rows, cols, decks,
              'draft', row_count, lanes, mirrored
         from app.seat_layout where id = $1
       returning id`,
      [layoutId],
    );
    const nextId = created.rows[0]!.id;
    await copyGeometry(client, layoutId, nextId);
    await client.query(
      `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
       values ($1, $2, 'layout.revise', 'seat_layout', $3, $4::jsonb)`,
      [operatorId, actor, nextId, JSON.stringify({ from: layoutId })],
    );
    return { id: nextId, status: 'draft', from: layoutId };
  });
}

export async function assignVehicleLayout(operatorId: string, actor: string, vehicleId: string, layoutId: string) {
  if (!UUID.test(vehicleId) || !UUID.test(layoutId)) throw new Error('invalid_id');
  const layout = await readableLayout(operatorId, layoutId);
  if (layout.status !== 'published') throw new OimsConflictError('layout_not_published');
  return withOperatorTransaction(operatorId, async (client) => {
    const vehicle = await client.query<{ id: string }>(
      `select id from app.vehicle where id = $1 and operator_id = $2 for update`,
      [vehicleId, operatorId],
    );
    if (!vehicle.rowCount) throw new OimsForbiddenError();
    const labels = await client.query<{ label: string }>(
      `select label from app.seat_layout_seat where layout_id = $1`,
      [layoutId],
    );
    const newLabels = new Set(labels.rows.map((row) => row.label));
    const booked = await client.query<{ label: string }>(
      `select distinct bp.seat_no as label
         from app.trip t
         join app.booking_passenger bp on bp.trip_id = t.id and bp.status = 'active' and bp.seat_no is not null
        where t.vehicle_id = $1 and t.status = 'scheduled'`,
      [vehicleId],
    );
    if (booked.rowCount) {
      const missing = booked.rows.filter((row) => !newLabels.has(row.label.toUpperCase()));
      if (missing.length) throw new OimsConflictError('layout_incompatible');
    }
    const seats = labels.rowCount ?? 0;
    await client.query(
      `update app.vehicle set seat_layout_id = $2, total_seats = $3 where id = $1`,
      [vehicleId, layoutId, seats],
    );
    await client.query(
      `insert into app.oims_audit (operator_id, actor, action, object_type, object_id, diff)
       values ($1, $2, 'vehicle.layout.assign', 'vehicle', $3, $4::jsonb)`,
      [operatorId, actor, vehicleId, JSON.stringify({ layoutId, seats })],
    );
    return { vehicleId, layoutId, totalSeats: seats };
  });
}

