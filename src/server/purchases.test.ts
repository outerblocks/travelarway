import { afterEach, describe, expect, it } from 'vitest';
import { purchasesEnabled, refuseIfPurchasesPaused } from '@/server/purchases';

afterEach(() => {
  delete process.env.PURCHASES_ENABLED;
});

describe('purchases kill switch', () => {
  it('allows purchases when unset', () => {
    expect(purchasesEnabled()).toBe(true);
    expect(refuseIfPurchasesPaused()).toBeNull();
  });

  it('pauses holds and payments when set false', async () => {
    process.env.PURCHASES_ENABLED = 'false';
    expect(purchasesEnabled()).toBe(false);
    const refused = refuseIfPurchasesPaused();
    expect(refused?.status).toBe(503);
    expect(await refused?.json()).toMatchObject({ error: 'purchases_paused' });
  });
});
