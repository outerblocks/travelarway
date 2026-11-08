import { describe, expect, it } from 'vitest';
import { createChecksum, verifyChecksum, withChecksum } from './checksum';
import { orderReferenceFor } from './order-reference';

const SECRET = 'test-checksum-secret';

describe('ClickPesa checksum', () => {
  it('is independent of key order, at every nesting level', () => {
    const a = {
      amount: 100,
      currency: 'TZS',
      exchange: { fromCurrency: 'TZS', rate: '1', toCurrency: 'USD' },
    };
    const b = {
      exchange: { toCurrency: 'USD', rate: '1', fromCurrency: 'TZS' },
      currency: 'TZS',
      amount: 100,
    };

    expect(createChecksum(SECRET, a)).toBe(createChecksum(SECRET, b));
  });

  it('excludes the checksum fields, so a signed payload stays verifiable', () => {
    const payload = { event: 'PAYMENT RECEIVED', data: { status: 'SUCCESS' } };
    const signed = withChecksum(SECRET, payload);

    expect(signed.checksum).toMatch(/^[0-9a-f]{64}$/);
    // Recomputing over the signed payload must produce the same digest, not a new one.
    expect(createChecksum(SECRET, signed)).toBe(createChecksum(SECRET, payload));
    expect(verifyChecksum(SECRET, signed)).toBe(true);
  });

  it('rejects a payload whose contents changed after signing', () => {
    const signed = withChecksum(SECRET, {
      event: 'PAYMENT RECEIVED',
      data: { orderReference: 'TRVABC12301', collectedAmount: '58000' },
    });

    const tampered = {
      ...signed,
      data: { orderReference: 'TRVABC12301', collectedAmount: '1' },
    };

    expect(verifyChecksum(SECRET, tampered)).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    const signed = withChecksum('another-secret-entirely', { orderReference: 'X1' });
    expect(verifyChecksum(SECRET, signed)).toBe(false);
  });

  it('refuses a payload with no checksum at all', () => {
    expect(verifyChecksum(SECRET, { orderReference: 'X1' })).toBe(false);
    expect(verifyChecksum(SECRET, { orderReference: 'X1', checksum: '' })).toBe(false);
  });
});

describe('order reference', () => {
  it('strips punctuation and upper-cases the PNR', () => {
    expect(orderReferenceFor('TRV-abc123', 1)).toBe('TRVABC12301');
  });

  it('differs per attempt, so a retry is a new collection', () => {
    expect(orderReferenceFor('TRV-ABC123', 1)).not.toBe(orderReferenceFor('TRV-ABC123', 2));
  });

  it('stays alphanumeric and within the 20-character provider limit', () => {
    const reference = orderReferenceFor('TRV-ABCDEFGHJKLMNPQRSTUV', 99);
    expect(reference).toMatch(/^[A-Za-z0-9]{1,20}$/);
    expect(reference.length).toBeLessThanOrEqual(20);
  });
});
