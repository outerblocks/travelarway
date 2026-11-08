import { createHmac, timingSafeEqual } from 'node:crypto';
import { createFileRoute } from '@tanstack/react-router';
import { getServerConfig } from '@/server/config';
import { confirmPayment, PAYMENT_PROVIDER, UnknownPaymentError } from '@/server/payments';

/**
 * POST /api/payments/callback
 *
 * Where money becomes a booking. This is the only path that can issue a ticket, which is
 * why it authenticates the sender instead of believing a request body.
 *
 * The body contract below is Travelar's, not any provider's. It exists for simulators and
 * for the provider adapter to normalise into; ClickPesa posts its own shape to
 * `/api/payments/clickpesa`, which authenticates with their checksum instead.
 *
 *   { orderReference, amountMinor, currency, paidAt?, raw? }
 *
 * Signed with HMAC-SHA256 over the raw request bytes in `x-travelar-signature`. Without a
 * configured secret every request is refused: an unsigned "payment succeeded" is a free
 * ticket.
 */
export const Route = createFileRoute('/api/payments/callback')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { paymentCallbackSecret } = getServerConfig();
        if (!paymentCallbackSecret) {
          console.error('[api/payments/callback] refused: PAYMENT_CALLBACK_SECRET not configured');
          return Response.json({ error: 'callback_not_configured' }, { status: 503 });
        }

        // The signature covers the exact bytes received, so it must be read as text before
        // any parsing. JSON.parse then re-serialising would change key order and spacing.
        const rawBody = await request.text();
        const provided = request.headers.get('x-travelar-signature')?.trim() ?? '';
        const expected = createHmac('sha256', paymentCallbackSecret).update(rawBody).digest('hex');

        const providedBytes = Buffer.from(provided, 'utf8');
        const expectedBytes = Buffer.from(expected, 'utf8');
        if (
          providedBytes.length !== expectedBytes.length ||
          !timingSafeEqual(providedBytes, expectedBytes)
        ) {
          return Response.json({ error: 'bad_signature' }, { status: 401 });
        }

        let body: unknown;
        try {
          body = JSON.parse(rawBody);
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 });
        }

        const input = body as Record<string, unknown>;
        const orderReference =
          typeof input.orderReference === 'string' ? input.orderReference.trim() : '';
        const currency = typeof input.currency === 'string' ? input.currency.trim().toUpperCase() : '';
        const amountMinor =
          typeof input.amountMinor === 'number' && Number.isSafeInteger(input.amountMinor)
            ? input.amountMinor
            : -1;
        const paidAt = typeof input.paidAt === 'string' ? input.paidAt : undefined;

        // ClickPesa's own limit: alphanumeric, at most 20 characters. Enforced here so a
        // simulator cannot mint a reference the real provider would reject.
        if (!/^[A-Za-z0-9]{1,20}$/.test(orderReference) || amountMinor < 0 || !/^[A-Z]{3}$/.test(currency)) {
          return Response.json({ error: 'invalid_callback' }, { status: 400 });
        }

        try {
          const result = await confirmPayment({
            provider: PAYMENT_PROVIDER,
            orderReference,
            amountMinor,
            currency,
            paidAt,
            raw: input.raw,
          });

          return Response.json(result, {
            // A mismatch is a real answer, not a transport failure: the sender must stop
            // retrying and a human must reconcile it.
            status: result.paymentStatus === 'failed' ? 409 : 200,
            headers: { 'cache-control': 'no-store' },
          });
        } catch (error) {
          if (error instanceof UnknownPaymentError) {
            return Response.json({ error: 'unknown_payment' }, { status: 404 });
          }
          console.error('[api/payments/callback] failed:', (error as Error).message);
          return Response.json({ error: 'callback_failed' }, { status: 503 });
        }
      },
    },
  },
});
