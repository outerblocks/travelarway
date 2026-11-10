/**
 * Reservation expiry.
 *
 * `pending_payment` is a promise with a deadline. When the deadline passes, the booking is
 * not pending any more — it is dead — and saying otherwise is a lie the customer sees on
 * their own confirmation page ("seats held until 21:15") hours after the seats were gone.
 *
 * Expiry has to be safe against a payment arriving at the same instant. A provider callback
 * takes `for update` on the booking row; the sweeper takes `for update skip locked`, so a
 * booking being paid is skipped rather than expired underneath the callback. Whichever
 * transaction gets the lock first wins, and the loser sees the other's outcome.
 */
import { query, withTransaction } from '@/server/db';
import type pg from 'pg';
import { releaseFerryCapacity } from '@/server/sailing-inventory';

export interface ExpirySummary {
  expired: number;
  bookingIds: string[];
}

/**
 * Cancels one booking whose payment window has closed.
 *
 * Returns true only when this call performed the transition, so callers can tell "it was
 * already expired" from "I just expired it".
 */
export async function expireIfDue(bookingId: string): Promise<boolean> {
  return withTransaction(async (client) => {
    const booking = await client.query<{ status: string; payment_due_at: Date | null }>(
      `select status::text, payment_due_at from app.booking where id = $1 for update`,
      [bookingId],
    );

    if (booking.rowCount === 0) return false;
    const row = booking.rows[0];
    if (row.status !== 'pending_payment') return false;
    if (!row.payment_due_at || row.payment_due_at.getTime() > Date.now()) return false;

    await expireRows(client, [bookingId]);
    return true;
  });
}

/**
 * Expires every booking past its deadline, up to `limit`.
 *
 * Batched rather than unbounded so a backlog cannot hold one long transaction while the
 * rest of the system waits on row locks.
 */
export async function sweepExpiredReservations(limit = 200): Promise<ExpirySummary> {
  return withTransaction(async (client) => {
    const due = await client.query<{ id: string }>(
      `select id
         from app.booking
        where status = 'pending_payment'
          and payment_due_at is not null
          and payment_due_at <= now()
        order by payment_due_at
        limit $1
        for update skip locked`,
      [limit],
    );

    const ids = due.rows.map((row) => row.id);
    if (ids.length === 0) return { expired: 0, bookingIds: [] };

    await expireRows(client, ids);
    return { expired: ids.length, bookingIds: ids };
  });
}

/** The transition itself. Assumes the caller already holds the booking locks. */
async function expireRows(client: pg.PoolClient, bookingIds: string[]): Promise<void> {
  await client.query(
    `update app.booking set status = 'expired'
      where id = any($1::uuid[]) and status = 'pending_payment'`,
    [bookingIds],
  );

  await releaseFerryCapacity(client, bookingIds);

  // Pending passengers were never sold; cancelling them keeps interval exclusion honest.
  await client.query(
    `update app.booking_passenger set status = 'cancelled'
      where booking_id = any($1::uuid[]) and status = 'pending'`,
    [bookingIds],
  );

  // Releasing the hold is what actually returns the seat to inventory. Expired holds do
  // not block a new hold, but leaving them 'active' would hide the fact that nobody owns
  // these seats any more.
  await client.query(
    `update app.seat_hold set status = 'released'
      where booking_id = any($1::uuid[]) and status = 'active'`,
    [bookingIds],
  );

  // No provider will ever answer an attempt that never reached it. One that *did* reach the
  // provider stays `pending`: the money may still be in flight, and calling it expired would
  // be a claim we cannot support. Reconciliation resolves those when the provider does.
  await client.query(
    `update app.payment
        set status = 'expired', updated_at = now()
      where booking_id = any($1::uuid[])
        and status in ('initiated', 'pending')
        and provider_reference is null`,
    [bookingIds],
  );

  await client.query(
    `insert into app.booking_event (booking_id, type, payload, actor)
     select id, 'booking.expired', jsonb_build_object('reason', 'payment_window_closed'), 'expiry'
       from unnest($1::uuid[]) as id`,
    [bookingIds],
  );
}

/** How many bookings are waiting on a window that has already closed. */
export async function countExpiredPending(): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `select count(*)::text as count
       from app.booking
      where status = 'pending_payment'
        and payment_due_at is not null
        and payment_due_at <= now()`,
  );
  return Number(rows[0]?.count ?? '0');
}
