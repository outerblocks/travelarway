/**
 * Ferry class counters. No numbered seats: a sailing class is a pool whose sold_count
 * must never exceed capacity. The CHECK constraint is the last line of defence; callers
 * increment with a predicated UPDATE so a race returns zero rows instead of overselling.
 */
import type pg from 'pg';

export async function claimFerryCapacity(
  client: pg.PoolClient,
  tripId: string,
  vesselClassId: string,
  seats: number,
): Promise<boolean> {
  const claimed = await client.query(
    `update app.sailing_inventory
        set sold_count = sold_count + $3
      where trip_id = $1 and vessel_class_id = $2 and sold_count + $3 <= capacity
      returning sold_count`,
    [tripId, vesselClassId, seats],
  );
  return (claimed.rowCount ?? 0) > 0;
}

export async function releaseFerryCapacity(
  client: pg.PoolClient,
  bookingIds: string[],
): Promise<void> {
  if (bookingIds.length === 0) return;
  await client.query(
    `update app.sailing_inventory si
        set sold_count = si.sold_count - c.n
       from (
         select trip_id, vessel_class_id, count(*)::int as n
           from app.booking_passenger
          where booking_id = any($1::uuid[])
            and vessel_class_id is not null
            and status in ('pending', 'active')
          group by trip_id, vessel_class_id
       ) c
      where si.trip_id = c.trip_id and si.vessel_class_id = c.vessel_class_id`,
    [bookingIds],
  );
}
