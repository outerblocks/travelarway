/**
 * Seat map reads.
 *
 * Two callers, one shape: the editor asks for a layout family, the booking flow asks for a
 * trip. In both cases the client receives cells plus seats and never derives geometry.
 *
 * Availability is deliberately NOT part of the layout: a seat's state belongs to a trip,
 * because the same template is reused across every departure of that vehicle.
 */
import { query } from '@/server/db';

export interface SeatMapCell {
  deck: number;
  row: number;
  col: number;
  type: string;
}

export interface SeatMapSeat {
  id: string;
  deck: number;
  row: number;
  col: number;
  label: string;
  seatClass: string | null;
  status: 'available' | 'held' | 'booked';
  isWindow: boolean;
  isAisle: boolean;
  extraLegroom: boolean;
  accessible: boolean;
}

export interface SeatMapLayout {
  id: string;
  familyId: string;
  version: number;
  name: string;
  description: string | null;
  visibility: string;
  rows: number;
  cols: number;
  decks: number;
  mirrored: boolean;
}

export interface SeatMap {
  layout: SeatMapLayout;
  cells: SeatMapCell[];
  seats: SeatMapSeat[];
}

interface LayoutRow {
  id: string;
  family_id: string;
  version: number;
  name: string;
  description: string | null;
  visibility: string;
  rows: number;
  cols: number;
  decks: number;
  mirrored: boolean;
}

const toLayout = (row: LayoutRow): SeatMapLayout => ({
  id: row.id,
  familyId: row.family_id,
  version: row.version,
  name: row.name,
  description: row.description,
  visibility: row.visibility,
  rows: row.rows,
  cols: row.cols,
  decks: row.decks,
  mirrored: row.mirrored,
});

const LAYOUT_COLUMNS = `id, family_id, version, name, description, visibility, rows, cols, decks, mirrored`;

async function readCells(layoutId: string): Promise<SeatMapCell[]> {
  const { rows } = await query<{ deck: number; row: number; col: number; cell_type: string }>(
    `select deck, row, col, cell_type from app.seat_layout_cell
      where layout_id = $1 order by deck, row, col`,
    [layoutId],
  );
  return rows.map((row) => ({ deck: row.deck, row: row.row, col: row.col, type: row.cell_type }));
}

/** Layout for the editor. Defaults to the newest published version of the family. */
export async function getLayoutByFamily(
  familyId: string,
  version?: number,
): Promise<SeatMap | null> {
  const { rows } = await query<LayoutRow>(
    `select ${LAYOUT_COLUMNS} from app.seat_layout
      where family_id = $1 and ($2::int is null or version = $2)
      order by version desc limit 1`,
    [familyId, version ?? null],
  );
  if (rows.length === 0) return null;

  const layout = toLayout(rows[0]);
  const [cells, seats] = await Promise.all([
    readCells(layout.id),
    query<{
      id: string;
      deck: number;
      row: number;
      col: number;
      label: string;
      class_name: string | null;
      is_window: boolean;
      is_aisle: boolean;
      extra_legroom: boolean;
      accessible: boolean;
    }>(
      `select s.id, s.deck, s.row, s.col, s.label, sc.name as class_name,
              s.is_window, s.is_aisle, s.extra_legroom, s.accessible
         from app.seat_layout_seat s
         left join app.seat_class sc on sc.id = s.seat_class_id
        where s.layout_id = $1
        order by s.deck, s.row, s.col`,
      [layout.id],
    ),
  ]);

  return {
    layout,
    cells,
    seats: seats.rows.map((seat) => ({
      id: seat.id,
      deck: seat.deck,
      row: seat.row,
      col: seat.col,
      label: seat.label,
      seatClass: seat.class_name,
      status: 'available',
      isWindow: seat.is_window,
      isAisle: seat.is_aisle,
      extraLegroom: seat.extra_legroom,
      accessible: seat.accessible,
    })),
  };
}

/**
 * Layout plus live state for one departure. Held and booked are distinguished because the
 * UI needs to know a seat is temporarily blocked versus sold for good.
 */
type QueryFn = typeof query;

function execQuery<T extends import('pg').QueryResultRow>(
  client: { query: QueryFn } | QueryFn,
  text: string,
  values: unknown[] = [],
) {
  if (typeof client === 'function') return client<T>(text, values);
  return client.query<T>(text, values);
}

export async function layoutIdForTrip(
  client: { query: QueryFn } | QueryFn,
  tripId: string,
): Promise<string | null> {
  const trip = await execQuery<{ seat_layout_id: string | null }>(client,
    `select coalesce(t.seat_layout_id, v.seat_layout_id) as seat_layout_id
       from app.trip t
       left join app.vehicle v on v.id = t.vehicle_id
      where t.id = $1`,
    [tripId],
  );
  return trip.rows[0]?.seat_layout_id ?? null;
}

export async function resolveSeatsForTrip(
  client: { query: QueryFn } | QueryFn,
  tripId: string,
  labels: string[],
): Promise<{ id: string; label: string }[]> {
  const layoutId = await layoutIdForTrip(client, tripId);
  if (!layoutId) throw new Error('invalid_layout');
  const wanted = [...new Set(labels.map((label) => label.trim().toUpperCase()).filter(Boolean))];
  const found = await execQuery<{ id: string; label: string }>(
    client,
    `select id, label from app.seat_layout_seat
      where layout_id = $1 and upper(label) = any($2::text[])`,
    [layoutId, wanted],
  );
  if (found.rowCount !== wanted.length) throw new Error('invalid_seats');
  const byLabel = new Map(found.rows.map((row) => [row.label.toUpperCase(), row]));
  return wanted.map((label) => {
    const seat = byLabel.get(label);
    if (!seat) throw new Error('invalid_seats');
    return { id: seat.id, label: seat.label };
  });
}

export async function getTripSeatMap(
  tripId: string,
  interval?: { fromSeq: number; toSeq: number },
): Promise<SeatMap | null> {
  const layoutId = await layoutIdForTrip(query, tripId);
  const exists = await query(`select 1 from app.trip where id = $1`, [tripId]);
  if (exists.rowCount === 0) return null;
  if (!layoutId) return null;

  const { rows } = await query<LayoutRow>(
    `select ${LAYOUT_COLUMNS} from app.seat_layout where id = $1`,
    [layoutId],
  );
  if (rows.length === 0) return null;
  const layout = toLayout(rows[0]);

  const fromSeq = interval?.fromSeq ?? Number.NEGATIVE_INFINITY;
  const toSeq = interval?.toSeq ?? Number.POSITIVE_INFINITY;

  const [cells, seats] = await Promise.all([
    readCells(layout.id),
    query<{
      id: string;
      deck: number;
      row: number;
      col: number;
      label: string;
      class_name: string | null;
      status: string;
      is_window: boolean;
      is_aisle: boolean;
      extra_legroom: boolean;
      accessible: boolean;
    }>(
      `select s.id, s.deck, s.row, s.col, s.label, sc.name as class_name,
              case
                when bp.seat_no is not null then 'booked'
                when h.seat_no  is not null then 'held'
                else 'available'
              end as status,
              s.is_window, s.is_aisle, s.extra_legroom, s.accessible
         from app.seat_layout_seat s
         left join app.seat_class sc on sc.id = s.seat_class_id
         left join (
           select distinct seat_no from app.booking_passenger
            where trip_id = $1 and status in ('pending', 'active') and seat_no is not null
              and from_seq < $4 and to_seq > $3
         ) bp on bp.seat_no = s.label
         left join (
           select distinct seat_no from app.seat_hold
            where trip_id = $1 and status = 'active' and expires_at > now()
              and from_seq < $4 and to_seq > $3
         ) h on h.seat_no = s.label
        where s.layout_id = $2
        order by s.deck, s.row, s.col`,
      [tripId, layout.id, Number.isFinite(fromSeq) ? fromSeq : -1_000_000, Number.isFinite(toSeq) ? toSeq : 1_000_000],
    ),
  ]);

  return {
    layout,
    cells,
    seats: seats.rows.map((seat) => ({
      id: seat.id,
      deck: seat.deck,
      row: seat.row,
      col: seat.col,
      label: seat.label,
      seatClass: seat.class_name,
      status: seat.status === 'booked' ? 'booked' : seat.status === 'held' ? 'held' : 'available',
      isWindow: seat.is_window,
      isAisle: seat.is_aisle,
      extraLegroom: seat.extra_legroom,
      accessible: seat.accessible,
    })),
  };
}
