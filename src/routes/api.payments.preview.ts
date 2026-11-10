import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import {
  BookingNotPayableError,
  PAYMENT_PROVIDER,
  previewPayment,
} from '@/server/payments';
import {
  PaymentConfigurationError,
  PaymentNotEnabledError,
} from '@/server/payments/clickpesa';
import { readBookingAccessToken } from '@/server/booking-access';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/payments/preview
 *
 * What collecting this booking would cost, and whether the customer's wallet can be
 * reached — asked before any money moves. ClickPesa validates the amount, the reference and
 * the phone number, and returns the fee for each active wallet.
 *
 * One provider call, so it is an explicit step rather than something the page fires while
 * the customer types. Pre-KYC accounts have a 100-call daily budget that includes token
 * generation.
 *
 * This opens no payment attempt and cannot mark anything paid.
 */
export const Route = createFileRoute('/api/payments/preview')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'payments');
        if (limited) return limited;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 });
        }

        const input = body as Record<string, unknown>;
        const bookingId = typeof input.bookingId === 'string' ? input.bookingId.trim() : '';
        const phoneNumber = typeof input.phoneNumber === 'string' ? input.phoneNumber.trim() : '';
        const accessToken = typeof input.accessToken === 'string' ? input.accessToken.trim() : '';

        if (!UUID.test(bookingId)) {
          return Response.json({ error: 'invalid_booking' }, { status: 400 });
        }

        let tokenBookingId: string | null = null;
        try {
          tokenBookingId = readBookingAccessToken(accessToken)?.bookingId ?? null;
        } catch {
          return Response.json({ error: 'preview_unavailable' }, { status: 503 });
        }
        if (tokenBookingId !== bookingId) {
          return Response.json({ error: 'bad_access_token' }, { status: 403 });
        }

        try {
          const preview = await previewPayment({ bookingId, phoneNumber });
          return Response.json(
            { provider: PAYMENT_PROVIDER, ...preview },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          if (error instanceof BookingNotPayableError) {
            return Response.json(
              { error: 'booking_not_payable', reason: error.reason },
              { status: error.reason === 'not_found' ? 404 : 409 },
            );
          }
          if (error instanceof PaymentNotEnabledError) {
            return Response.json({ error: 'preview_unavailable', reason: 'not_enabled' }, { status: 502 });
          }
          if (error instanceof PaymentConfigurationError) {
            return Response.json({ error: 'preview_unavailable', reason: 'not_configured' }, { status: 502 });
          }
          console.error('[api/payments/preview] failed:', (error as Error).message);
          return Response.json({ error: 'preview_unavailable' }, { status: 503 });
        }
      },
    },
  },
});
