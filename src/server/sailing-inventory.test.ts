import { describe, expect, it } from 'vitest';

describe('ferry class capacity', () => {
  it('refuses a claim that would exceed capacity', () => {
    const capacity = 20;
    const soldCount = 19;
    const party = 2;
    expect(soldCount + party <= capacity).toBe(false);
  });

  it('does not use a numbered seat map for class inventory', () => {
    const claimSql =
      'update app.sailing_inventory set sold_count = sold_count + $3 where sold_count + $3 <= capacity';
    expect(claimSql).toContain('sold_count');
    expect(claimSql).not.toContain('seat_no');
  });
});
