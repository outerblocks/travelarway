import { timingSafeEqual } from 'node:crypto';
import { createFileRoute } from '@tanstack/react-router';
import { getServerConfig } from '@/server/config';
import { countExpiredPending, sweepExpiredReservations } from '@/server/expiry';
import { reconcileOpenPayments } from '@/server/payments';

/**
 * POST /api/internal/sweep
 *
 * Releases seats and closes bookings whose payment window has passed. Call it from a
 * scheduler; the app also expires a booking whenever somebody opens it, so a missed sweep
 * delays the truth rather than changing it.
 *
 * It also **reconciles open payments** first: a lost webhook must not leave a customer who
 * paid holding a pending booking. Reconciliation asks the provider, and only a confirmed
 * SUCCESS issues a ticket.
 *
 * Guarded by a shared secret rather than a session: the caller is a cron, not a person.
 * Missing secret → 503 and nothing runs, so an unconfigured deployment cannot be swept by
 * anyone who guesses the path.
 */
export const Route = createFileRoute('/api/internal/sweep')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { maintenanceSecret } = getServerConfig();
        if (!maintenanceSecret) {
          console.error('[api/internal/sweep] refused: MAINTENANCE_SECRET not configured');
          return Response.json({ error: 'sweep_not_configured' }, { status: 503 });
        }

        const provided = Buffer.from(request.headers.get('x-sweep-secret') ?? '', 'utf8');
        const expected = Buffer.from(maintenanceSecret, 'utf8');
        if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
          return Response.json({ error: 'unauthorized' }, { status: 401 });
        }

        try {
          // Reconcile before expiring: a booking that was paid must be issued, not swept
          // away because its webhook went missing.
          const reconciled = await reconcileOpenPayments();

          const summary = await sweepExpiredReservations();
          // Whatever is left was locked by a payment arriving at the same moment, or is
          // beyond this batch. Reporting it makes a stuck backlog visible instead of
          // silently reporting success every minute.
          const remaining = await countExpiredPending();

          if (summary.expired > 0) {
            console.log(`[api/internal/sweep] expired ${summary.expired} bookings, ${remaining} remaining`);
          }

          return Response.json(
            { expired: summary.expired, remaining, reconciled },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          console.error('[api/internal/sweep] failed:', (error as Error).message);
          return Response.json({ error: 'sweep_failed' }, { status: 503 });
        }
      },
    },
  },
});
