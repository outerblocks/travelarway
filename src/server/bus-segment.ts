/**
 * Bus origin-destination intervals.
 *
 * Occupancy is the half-open stop sequence [from_seq, to_seq). Two claims conflict only
 * when those intervals overlap. Pickup/drop-off flags on the dated route's stop rows decide
 * whether a pair is even a product — stop presence is not sale authority.
 */
export interface BusSegment {
  fromStopId: string;
  toStopId: string;
  fromSeq: number;
  toSeq: number;
}

type Queryable = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
};

export function intervalsOverlap(
  aFrom: number,
  aTo: number,
  bFrom: number,
  bTo: number,
): boolean {
  return aFrom < bTo && bFrom < aTo;
}

export async function resolveBusSegment(
  client: Queryable,
  tripId: string,
  fromStopId: string,
  toStopId: string,
): Promise<BusSegment | null> {
  const found = await client.query(
    `select fs.id as from_stop_id, ts.id as to_stop_id,
            fs.sequence as from_seq, ts.sequence as to_seq
       from app.trip t
       join app.route_stop fs on fs.route_id = t.route_id and fs.id = $2
       join app.route_stop ts on ts.route_id = t.route_id and ts.id = $3
      where t.id = $1
        and fs.sequence < ts.sequence
        and fs.pickup_allowed
        and ts.dropoff_allowed`,
    [tripId, fromStopId, toStopId],
  );
  const row = found.rows[0] as
    | { from_stop_id: string; to_stop_id: string; from_seq: number; to_seq: number }
    | undefined;
  if (!row) return null;
  return {
    fromStopId: row.from_stop_id,
    toStopId: row.to_stop_id,
    fromSeq: Number(row.from_seq),
    toSeq: Number(row.to_seq),
  };
}
