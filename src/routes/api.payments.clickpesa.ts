import { createFileRoute } from '@tanstack/react-router';
import { getServerConfig } from '@/server/config';
import { verifyChecksum } from '@/server/payments/checksum';
import { CONFIRMING_COLLECTION_STATUSES } from '@/server/payments/clickpesa';
import { enqueueOutboxStandalone, processOutboxBatch } from '@/server/outbox';
import { log } from '@/server/log';

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

        if (
          body.event === 'PAYMENT RECEIVED' &&
          typeof data.status === 'string' &&
          CONFIRMING_COLLECTION_STATUSES.has(data.status)
        ) {
          const amountMinor = Number(data.collectedAmount);
          const currency = String(data.collectedCurrency ?? '').toUpperCase();
          if (!Number.isFinite(amountMinor) || amountMinor < 0 || !/^[A-Z]{3}$/.test(currency)) {
            return Response.json({ error: 'invalid_amount' }, { status: 400 });
          }
        }

        const idempotencyKey = `clickpesa:${orderReference}:${body.event ?? ''}:${data.status ?? ''}`;
        try {
          await enqueueOutboxStandalone(
            'payment.clickpesa',
            { event: body.event ?? '', data },
            idempotencyKey,
          );
          const processed = await processOutboxBatch();
          return Response.json(
            { acknowledged: true, queued: true, processed },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          log('error', 'clickpesa_enqueue_failed', { message: (error as Error).message });
          return Response.json({ error: 'webhook_failed' }, { status: 500 });
        }
      },
    },
  },
});
