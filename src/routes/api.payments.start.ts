import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import {
  BookingNotPayableError,
  InvalidMethodError,
  startPayment,
} from '@/server/payments';
import { PaymentNotEnabledError } from '@/server/payments/clickpesa';
import { readBookingAccessToken } from '@/server/booking-access';
import { isUuid } from '@/domain/input-validation';
import { refuseIfPurchasesPaused } from '@/server/purchases';

/**
 * POST /api/payments/start
 *
 * Opens a collection attempt for a pending booking and returns what the provider needs to
 * ask the customer for money. The amount is read from the booking, never from the request.
 *
 * Requires the booking's access token. This endpoint makes a real phone ring once the
 * provider is live, so an unguessable id is not a strong enough credential to call it.
 *
 * This endpoint deliberately cannot mark anything paid. Only a signed provider callback
 * can, because a browser saying "I paid" is not evidence of payment.
 */
export const Route = createFileRoute('/api/payments/start')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'payments');
        if (limited) return limited;
        const paused = refuseIfPurchasesPaused();
        if (paused) return paused;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 });
        }

        const input = body as Record<string, unknown>;
        const bookingId = typeof input.bookingId === 'string' ? input.bookingId.trim() : '';
        const method = typeof input.method === 'string' ? input.method.trim() : '';
        const phoneNumber = typeof input.phoneNumber === 'string' ? input.phoneNumber.trim() : '';
        const accessToken = typeof input.accessToken === 'string' ? input.accessToken.trim() : '';

        if (!isUuid(bookingId)) {
          return Response.json({ error: 'invalid_booking' }, { status: 400 });
        }

        // The token names the booking it was issued for. A valid token for a different
        // booking is still a refusal: it proves nothing about this one.
        let tokenBookingId: string | null = null;
        try {
          tokenBookingId = readBookingAccessToken(accessToken)?.bookingId ?? null;
        } catch {
          console.error('[api/payments/start] BOOKING_ACCESS_SECRET not configured');
          return Response.json({ error: 'payment_unavailable' }, { status: 503 });
        }
        if (tokenBookingId !== bookingId) {
          return Response.json({ error: 'bad_access_token' }, { status: 403 });
        }

        try {
          const { intent, failure, detail } = await startPayment({ bookingId, method, phoneNumber });

          // The booking and the attempt are real either way. `failure` says whether the
          // provider was actually asked to collect, so the browser never claims a request
          // was sent when none left the building.
          return Response.json(
            {
              ...intent,
              collectionStarted: failure === null,
              failure,
              // Only in development: the provider's own message is how a rejected request
              // gets diagnosed without reading server logs.
              detail: process.env.NODE_ENV === 'production' ? undefined : detail,
            },
            { status: failure === null ? 201 : 502, headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          if (error instanceof InvalidMethodError) {
            return Response.json({ error: 'invalid_payment_method' }, { status: 400 });
          }
          if (error instanceof PaymentNotEnabledError) {
            return Response.json(
              { error: 'not_enabled', reason: error.reason },
              { status: 502, headers: { 'cache-control': 'no-store' } },
            );
          }
          if (error instanceof BookingNotPayableError) {
            return Response.json(
              { error: 'booking_not_payable', reason: error.reason },
              { status: error.reason === 'not_found' ? 404 : 409 },
            );
          }
          console.error('[api/payments/start] failed:', (error as Error).message);
          return Response.json({ error: 'payment_unavailable' }, { status: 503 });
        }
      },
    },
  },
});
