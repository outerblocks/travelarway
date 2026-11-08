import { createFileRoute } from '@tanstack/react-router';
import { getServerConfig } from '@/server/config';
import { verifyChecksum } from '@/server/payments/checksum';
import { CONFIRMING_COLLECTION_STATUSES } from '@/server/payments/clickpesa';
import {
  confirmPayment,
  failPaymentByOrderReference,
  PAYMENT_PROVIDER,
  reversePayment,
  UnknownPaymentError,
} from '@/server/payments';

/**
 * POST /api/payments/clickpesa
 *
 * ClickPesa's own webhook, in their shape. The generic `/api/payments/callback` exists for
 * simulators and tests; this is the production path and must not be merged with it, because
 * it authenticates a different way: their payload carries `checksum`, computed over its own
 * contents. No checksum → refuse. A payload we cannot check is not evidence that money
 * arrived, and treating it as such is a free ticket.
 *
 * Their documented events used here:
 *   PAYMENT RECEIVED -> data.status SUCCESS | SETTLED -> the sale exists
 *   PAYMENT FAILED   -> mark the attempt failed, leave the booking's window open for a retry
 *
 * Everything else is acknowledged and ignored, so ClickPesa stops retrying without us
 * inventing behaviour for events we have not implemented (payouts, deposits, reversals).
 */
interface ClickPesaWebhookBody {
  event?: string;
  data?: {
    status?: string;
    orderReference?: string;
    collectedAmount?: string | number;
    collectedCurrency?: string;
    paymentReference?: string;
    updatedAt?: string;
    message?: string;
    channel?: string;
  };
  checksum?: string;
  checksumMethod?: string;
}

export const Route = createFileRoute('/api/payments/clickpesa')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { clickpesaChecksumSecret } = getServerConfig();
        if (!clickpesaChecksumSecret) {
          console.error('[api/payments/clickpesa] refused: CLICKPESA_CHECKSUM_SECRET not configured');
          return Response.json({ error: 'webhook_not_configured' }, { status: 503 });
        }

        // Read the body once, as text: the checksum is over the payload's contents, and a
        // second parse of a consumed stream would throw.
        const rawBody = await request.text();
        let body: ClickPesaWebhookBody;
        try {
          body = JSON.parse(rawBody) as ClickPesaWebhookBody;
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 });
        }

        if (!verifyChecksum(clickpesaChecksumSecret, body as Record<string, unknown>)) {
          console.error('[api/payments/clickpesa] checksum verification failed');
          return Response.json({ error: 'bad_checksum' }, { status: 401 });
        }

        const data = body.data ?? {};
        const orderReference = typeof data.orderReference === 'string' ? data.orderReference : '';
        if (!orderReference) {
          return Response.json({ error: 'invalid_webhook' }, { status: 400 });
        }

        try {
          // A reversal is decided by status, not by the event name: money can go back to the
          // customer after we have issued, and a void ticket in a conductor's hands is worse
          // than a refunded booking.
          const reversal =
            data.status === 'REVERSED' ? 'reversed' : data.status === 'REFUNDED' ? 'refunded' : null;
          if (reversal) {
            const result = await reversePayment({
              provider: PAYMENT_PROVIDER,
              orderReference,
              kind: reversal,
              reason: typeof data.message === 'string' ? data.message : undefined,
            });
            if (!result) {
              console.error('[api/payments/clickpesa] reversal for unknown reference', orderReference);
              return Response.json({ error: 'unknown_order_reference' }, { status: 404 });
            }
            return Response.json({ ...result, acknowledged: true });
          }

          if (body.event === 'PAYMENT RECEIVED') {
            // One gate, shared with the reconciliation poll: PENDING, PROCESSING and
            // ON-HOLD never issue a ticket, however promising they sound.
            if (!data.status || !CONFIRMING_COLLECTION_STATUSES.has(data.status)) {
              return Response.json({ acknowledged: true, ignored: `status:${data.status ?? 'unknown'}` });
            }

            const amountMinor = Number(data.collectedAmount);
            const currency = (data.collectedCurrency ?? '').toUpperCase();
            if (!Number.isFinite(amountMinor) || amountMinor < 0 || !/^[A-Z]{3}$/.test(currency)) {
              return Response.json({ error: 'invalid_amount' }, { status: 400 });
            }

            const result = await confirmPayment({
              provider: PAYMENT_PROVIDER,
              orderReference,
              amountMinor,
              currency,
              paidAt: data.updatedAt,
              raw: data,
            });

            return Response.json(result, {
              // A mismatch is a real answer: stop retrying, reconcile by hand.
              status: result.paymentStatus === 'failed' ? 409 : 200,
              headers: { 'cache-control': 'no-store' },
            });
          }

          if (body.event === 'PAYMENT FAILED') {
            const failed = await failPaymentByOrderReference({
              provider: PAYMENT_PROVIDER,
              orderReference,
              failureCode: (data.message ?? 'provider_failed').slice(0, 200),
            });
            return Response.json({ acknowledged: true, recorded: failed });
          }

          // Received, understood, not ours to act on yet.
          return Response.json({ acknowledged: true, ignored: body.event ?? 'unknown' });
        } catch (error) {
          if (error instanceof UnknownPaymentError) {
            // A reference we never issued. Do not acknowledge as processed; it needs a
            // human, because it means either a misconfiguration or someone probing.
            console.error('[api/payments/clickpesa] unknown order reference', orderReference);
            return Response.json({ error: 'unknown_order_reference' }, { status: 404 });
          }
          console.error('[api/payments/clickpesa] failed:', (error as Error).message);
          // 5xx so ClickPesa retries: a transient database failure must not lose a sale.
          return Response.json({ error: 'webhook_failed' }, { status: 500 });
        }
      },
    },
  },
});
