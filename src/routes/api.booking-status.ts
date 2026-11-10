import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { findBooking } from '@/server/bookings';
import { readBookingAccessToken } from '@/server/booking-access';
import { findOpenAttempt } from '@/server/payments';
import { createTicketToken } from '@/server/ticket-token';

/**
 * GET /api/booking-status?token=<booking access token>
 *
 * The customer's view of a booking while it waits for money. The token is issued at
 * checkout and names exactly one booking, so the id never has to be trusted on its own —
 * an id in a URL is shared, logged and screenshotted far more freely than a signature.
 *
 * The ticket token is minted here and only here, and only for an issued booking: handing
 * one out while the payment is still pending would produce a QR that scans as invalid at
 * the door and looks like a system fault to the conductor.
 *
 * `paymentInFlight` says a collection reached the provider and has not resolved. The page
 * needs it because its own memory of "we started a payment" does not survive a reload, and
 * inviting a second payment while the first is in the air is how customers get charged twice.
 */
export const Route = createFileRoute('/api/booking-status')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = await rateLimit(request, 'search');
        if (limited) return limited;

        const token = new URL(request.url).searchParams.get('token')?.trim() ?? '';
        if (!token) {
          return Response.json({ error: 'token_required' }, { status: 400 });
        }

        let payload;
        try {
          payload = readBookingAccessToken(token);
        } catch {
          console.error('[api/booking-status] access tokens unavailable: BOOKING_ACCESS_SECRET not configured');
          return Response.json({ error: 'booking_lookup_unavailable' }, { status: 503 });
        }

        if (!payload) {
          return Response.json({ error: 'bad_access_token' }, { status: 403 });
        }

        try {
          const booking = await findBooking(payload.bookingId);
          if (!booking) {
            return Response.json({ error: 'booking_not_found' }, { status: 404 });
          }

          // The secret is required to mint a token; without it an issued booking still
          // answers truthfully but carries no QR rather than an unverifiable one.
          let verifyToken: string | null = null;
          if (booking.status === 'issued') {
            try {
              verifyToken = createTicketToken({ bookingId: booking.bookingId, pnr: booking.pnr });
            } catch (error) {
              console.error('[api/booking-status] token unavailable:', (error as Error).message);
            }
          }

          const open = booking.status === 'pending_payment'
            ? await findOpenAttempt(booking.bookingId)
            : null;

          return Response.json(
            { ...booking, verifyToken, paymentInFlight: Boolean(open) },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          console.error('[api/booking-status] read failed:', (error as Error).message);
          return Response.json({ error: 'booking_unavailable' }, { status: 503 });
        }
      },
    },
  },
});
