import { query } from '@/server/db';
import type { SgrCoachLayout, SgrSeat, SgrTrainsetLayouts } from '@/server/sgr/layouts';

/**
 * Reading coach layouts from the database.
 *
 * The generators in `layouts.ts` are how the layouts get *in*; this is how everything else
 * finds out. Nothing downstream should call the generator, because then the code would be
 * the source of truth and the tables a copy of it — an operator could not correct a coach
 * without a deploy, which is the thing being removed.
 */
interface SeatRow {
  coach_no: number;
  class_code: string;
  layout_kind: SgrCoachLayout['layoutKind'];
  grid_rows: number;
  grid_cols: number;
  aisle_after_row: number;
  seat_count: number;
  version: number;
  seat_number: number;
  seat_label: string;
  position: SgrSeat['position'];
  seat_kind: 'STANDARD' | 'ACCESSIBLE';
  attributes: Record<string, string> | null;
  cell_row_idx: number;
  cell_col_idx: number;
}

interface FixtureRow {
  coach_no: number;
  cell_type: string;
  row_idx: number;
  col_idx: number;
}

export interface SgrTrainsetLayout {
  code: string;
  name: string;
  /** The published version of each coach, so a trip can be pinned to the layout it sold on. */
  coaches: SgrCoachLayout[];
  seatClassByCode: Record<string, { id: string; name: string; freeBaggageKg: number | null }>;
}

/**
 * The published layout of one trainset, assembled per coach.
 *
 * Returns null rather than throwing when the trainset is unknown: a caller asking about
 * rolling stock that has not been loaded should render "no seat map yet", not a 500.
 */
export async function findPublishedTrainset(code: string): Promise<SgrTrainsetLayout | null> {
  const [seatResult, fixtureResult, classResult] = await Promise.all([
    query<SeatRow>(
      `select l.coach_no, sc.code as class_code, l.layout_kind, l.grid_rows, l.grid_cols,
              l.aisle_after_row, l.seat_count, l.version,
              s.seat_number, s.seat_label, s.position, s.seat_kind, s.attributes,
              s.cell_row_idx, s.cell_col_idx
         from app.sgr_coach_layouts l
         join app.sgr_trainset_types t on t.id = l.trainset_type_id
         join app.sgr_seat_classes sc on sc.id = l.seat_class_id
         join app.sgr_layout_seats s on s.coach_layout_id = l.id
        where t.code = $1 and l.status = 'PUBLISHED'
        order by l.coach_no, s.seat_number`,
      [code],
    ),
    query<FixtureRow>(
      `select l.coach_no, c.cell_type, c.row_idx, c.col_idx
         from app.sgr_coach_layouts l
         join app.sgr_trainset_types t on t.id = l.trainset_type_id
         join app.sgr_layout_cells c on c.coach_layout_id = l.id
        where t.code = $1 and l.status = 'PUBLISHED' and c.cell_type <> 'SEAT'
        order by l.coach_no, c.row_idx, c.col_idx`,
      [code],
    ),
    query<{ code: string; id: string; name: string; free_baggage_kg: number | null }>(
      `select sc.id, sc.code, sc.name, sc.free_baggage_kg
         from app.sgr_seat_classes sc
        where sc.is_active
        order by sc.rank`,
    ),
  ]);

  if (seatResult.rowCount === 0) return null;

  const fixturesByCoach = new Map<number, { cellType: string; row: number; col: number }[]>();
  for (const row of fixtureResult.rows) {
    const list = fixturesByCoach.get(row.coach_no) ?? [];
    list.push({ cellType: row.cell_type, row: row.row_idx, col: row.col_idx });
    fixturesByCoach.set(row.coach_no, list);
  }

  /** Coaches are assembled from their seat rows; the coach's own columns repeat per seat. */
  const byCoach = new Map<number, SgrCoachLayout>();
  for (const row of seatResult.rows) {
    let coach = byCoach.get(row.coach_no);
    if (!coach) {
      coach = {
        coachNo: row.coach_no,
        classCode: row.class_code as SgrCoachLayout['classCode'],
        layoutKind: row.layout_kind,
        gridRows: row.grid_rows,
        gridCols: row.grid_cols,
        aisleAfterRow: row.aisle_after_row,
        seats: [],
        fixtures: (fixturesByCoach.get(row.coach_no) ?? []) as SgrCoachLayout['fixtures'],
        seatCount: row.seat_count,
      };
      byCoach.set(row.coach_no, coach);
    }
    coach.seats.push({
      seatNumber: row.seat_number,
      row: row.cell_row_idx,
      col: row.cell_col_idx,
      seatLabel: row.seat_label,
      position: row.position,
      seatKind: row.seat_kind,
      // A screen marker the operator has not explained stays an attribute. It never changes
      // what can be sold: seat_kind is only ACCESSIBLE when that has been confirmed.
      ...(row.attributes && Object.keys(row.attributes).length > 0 ? { attributes: row.attributes } : {}),
    });
  }

  return {
    code,
    name: code,
    coaches: [...byCoach.values()],
    seatClassByCode: Object.fromEntries(
      classResult.rows.map((entry) => [
        entry.code,
        { id: entry.id, name: entry.name, freeBaggageKg: entry.free_baggage_kg },
      ]),
    ),
  };
}

/**
 * Seats per class across a trainset, straight from the layouts.
 *
 * This is what replaces the coach inventories that used to be constants in
 * `src/data/sgr.ts`. A class with no coach on this trainset reports zero rather than
 * being left out, so the caller can say "Economy is not offered on this service" instead
 * of showing an empty selector.
 */
export async function findClassSeatCounts(code: string): Promise<{ classCode: string; seatCount: number; coaches: number[] }[]> {
  const result = await query<{ class_code: string; seat_count: bigint; coach_no: number }>(
    `select sc.code as class_code, sum(l.seat_count) as seat_count, l.coach_no
       from app.sgr_coach_layouts l
       join app.sgr_trainset_types t on t.id = l.trainset_type_id
       join app.sgr_seat_classes sc on sc.id = l.seat_class_id
      where t.code = $1 and l.status = 'PUBLISHED'
      group by sc.code, l.coach_no
      order by max(sc.rank) desc, l.coach_no`,
    [code],
  );

  /**
   * One row per coach, so the class total is summed across them. Assigning it would report
   * the last coach's seats as the whole class's, which is how Business came to look like 70
   * seats instead of 544 on an EMU.
   */
  const grouped = new Map<string, { seatCount: number; coaches: number[] }>();
  for (const row of result.rows) {
    const entry = grouped.get(row.class_code) ?? { seatCount: 0, coaches: [] };
    entry.seatCount += Number(row.seat_count);
    entry.coaches.push(row.coach_no);
    grouped.set(row.class_code, entry);
  }

  return [...grouped.entries()].map(([classCode, entry]) => ({
    classCode,
    seatCount: entry.seatCount,
    coaches: entry.coaches,
  }));
}

export type { SgrTrainsetLayouts };
