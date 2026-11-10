import { describe, expect, it, vi } from 'vitest';
import { enqueueOutbox } from '@/server/outbox';

describe('outbox enqueue', () => {
  it('uses an idempotency key so a replay insert is a no-op', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: '1' }] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const first = await enqueueOutbox(
      { query },
      'payment.clickpesa',
      { event: 'PAYMENT RECEIVED' },
      'clickpesa:REF:PAYMENT RECEIVED:SUCCESS',
    );
    const second = await enqueueOutbox(
      { query },
      'payment.clickpesa',
      { event: 'PAYMENT RECEIVED' },
      'clickpesa:REF:PAYMENT RECEIVED:SUCCESS',
    );
    expect(first).toBe(1);
    expect(second).toBe(0);
    expect(String(query.mock.calls[0][0])).toContain('on conflict (idempotency_key) do nothing');
  });
});
