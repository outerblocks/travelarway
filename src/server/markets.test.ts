import { describe, expect, it } from 'vitest';
import { marketIsCollecting, pickMerchant } from '@/server/markets';

describe('market POS registry', () => {
  it('treats licensed and legacy active as collecting, planned as not', () => {
    expect(marketIsCollecting('licensed')).toBe(true);
    expect(marketIsCollecting('active')).toBe(true);
    expect(marketIsCollecting('planned')).toBe(false);
    expect(marketIsCollecting('suspended')).toBe(false);
  });

  it('prefers a licensed merchant for the method and otherwise returns the planned row', () => {
    const rows = [
      { providerCode: 'pesapal', status: 'planned', methods: ['mobile_money', 'card'] },
      { providerCode: 'clickpesa', status: 'licensed', methods: ['mobile_money', 'card'] },
      { providerCode: 'dpo', status: 'planned', methods: ['card'] },
    ];
    expect(pickMerchant(rows, 'mobile_money')?.providerCode).toBe('clickpesa');
    expect(pickMerchant(rows.filter((row) => row.providerCode !== 'clickpesa'), 'card')?.providerCode).toBe(
      'pesapal',
    );
    expect(pickMerchant(rows, 'bank_transfer')).toBeNull();
  });
});
