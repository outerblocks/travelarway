/**
 * Durable jobs that must not live only on an HTTP thread: payment webhooks after ACK,
 * and maintenance (reconcile + expiry sweep).
 */
import type pg from 'pg';
import { query, withTransaction } from '@/server/db';
import { log } from '@/server/log';
import { countExpiredPending, sweepExpiredReservations } from '@/server/expiry';
import {
  confirmPayment,
  failPaymentByOrderReference,
  PAYMENT_PROVIDER,
  reconcileOpenPayments,
  reversePayment,
  UnknownPaymentError,
} from '@/server/payments';
import { CONFIRMING_COLLECTION_STATUSES } from '@/server/payments/clickpesa';

export type OutboxType = 'payment.clickpesa' | 'maintenance.sweep';

export async function enqueueOutbox(
  client: pg.PoolClient | { query: typeof query },
  type: OutboxType,
  payload: Record<string, unknown>,
  idempotencyKey: string,
): Promise<number> {
  const inserted = await client.query<{ id: string }>(
    `insert into app.outbox_event (type, payload, status, idempotency_key)
     values ($1, $2::jsonb, 'pending', $3)
     on conflict (idempotency_key) do nothing
     returning id`,
    [type, JSON.stringify(payload), idempotencyKey],
  );
  return inserted.rowCount ?? 0;
}

export async function enqueueOutboxStandalone(
  type: OutboxType,
  payload: Record<string, unknown>,
  idempotencyKey: string,
): Promise<void> {
  await withTransaction(async (client) => {
    await enqueueOutbox(client, type, payload, idempotencyKey);
  });
}

export interface OutboxBatchSummary {
  claimed: number;
  sent: number;
  failed: number;
}

export async function processOutboxBatch(limit = 25): Promise<OutboxBatchSummary> {
  const claimed = await withTransaction(async (client) => {
    const rows = await client.query<{
      id: string;
      type: string;
      payload: Record<string, unknown>;
      attempts: number;
    }>(
      `with next as (
         select id
           from app.outbox_event
          where status in ('pending', 'failed')
            and next_attempt_at <= now()
          order by id
          limit $1
          for update skip locked
       )
       update app.outbox_event o
          set status = 'processing',
              attempts = o.attempts + 1
         from next
        where o.id = next.id
       returning o.id, o.type, o.payload, o.attempts`,
      [limit],
    );
    return rows.rows;
  });

  let sent = 0;
  let failed = 0;
  for (const row of claimed) {
    try {
      await handleOutbox(row.type, row.payload);
      await query(
        `update app.outbox_event
            set status = 'sent', last_error = null
          where id = $1`,
        [row.id],
      );
      sent += 1;
    } catch (error) {
      const message = (error as Error).message.slice(0, 500);
      if (error instanceof UnknownPaymentError) {
        await query(
          `update app.outbox_event
              set status = 'sent', last_error = $2
            where id = $1`,
          [row.id, message],
        );
        sent += 1;
        continue;
      }
      const delaySeconds = Math.min(300, 2 ** Math.min(row.attempts, 8));
      await query(
        `update app.outbox_event
            set status = 'failed',
                last_error = $2,
                next_attempt_at = now() + ($3::text || ' seconds')::interval
          where id = $1`,
        [row.id, message, String(delaySeconds)],
      );
      failed += 1;
      log('error', 'outbox_handler_failed', { type: row.type, message });
    }
  }

  return { claimed: claimed.length, sent, failed };
}

async function handleOutbox(type: string, payload: Record<string, unknown>): Promise<void> {
  if (type === 'maintenance.sweep') {
    await reconcileOpenPayments();
    await sweepExpiredReservations();
    await countExpiredPending();
    return;
  }
  if (type === 'payment.clickpesa') {
    await handleClickpesaPayload(payload);
    return;
  }
  throw new Error(`unknown_outbox_type:${type}`);
}

async function handleClickpesaPayload(payload: Record<string, unknown>): Promise<void> {
  const event = typeof payload.event === 'string' ? payload.event : '';
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const orderReference = typeof data.orderReference === 'string' ? data.orderReference : '';
  if (!orderReference) throw new Error('invalid_webhook');
  const status = typeof data.status === 'string' ? data.status : '';

  if (status === 'REVERSED' || status === 'REFUNDED') {
    await reversePayment({
      provider: PAYMENT_PROVIDER,
      orderReference,
      kind: status === 'REVERSED' ? 'reversed' : 'refunded',
      reason: typeof data.message === 'string' ? data.message : undefined,
    });
    return;
  }

  if (event === 'PAYMENT RECEIVED') {
    if (!CONFIRMING_COLLECTION_STATUSES.has(status)) return;
    const amountMinor = Number(data.collectedAmount);
    const currency = String(data.collectedCurrency ?? '').toUpperCase();
    if (!Number.isFinite(amountMinor) || amountMinor < 0 || !/^[A-Z]{3}$/.test(currency)) {
      throw new Error('invalid_amount');
    }
    try {
      await confirmPayment({
        provider: PAYMENT_PROVIDER,
        orderReference,
        amountMinor,
        currency,
        paidAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
        raw: data,
      });
    } catch (error) {
      if (error instanceof UnknownPaymentError) throw error;
      throw error;
    }
    return;
  }

  if (event === 'PAYMENT FAILED') {
    await failPaymentByOrderReference({
      provider: PAYMENT_PROVIDER,
      orderReference,
      failureCode: String(data.message ?? 'provider_failed').slice(0, 200),
    });
  }
}
