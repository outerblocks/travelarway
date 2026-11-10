import { describe, expect, it } from 'vitest';
import { getCollectionAdapter } from '@/server/payments/registry';
import { PaymentNotEnabledError } from '@/server/payments/clickpesa';

describe('payment adapter registry', () => {
  it('returns ClickPesa for the licensed TZ vendor and refuses planned vendors', async () => {
    expect(getCollectionAdapter('clickpesa').name).toBe('clickpesa');
    expect(getCollectionAdapter('pesapal').name).toBe('pesapal');
    expect(getCollectionAdapter('dpo').name).toBe('dpo');
    await expect(getCollectionAdapter('pesapal').initiateCollection({
      orderReference: 'TRVTEST01',
      amountMinor: 100,
      currency: 'KES',
      phoneNumber: '254700000000',
    })).rejects.toBeInstanceOf(PaymentNotEnabledError);
    expect(() => getCollectionAdapter('unknown-psp')).toThrow(PaymentNotEnabledError);
  });
});
