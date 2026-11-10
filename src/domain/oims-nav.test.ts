import { describe, expect, it } from 'vitest';
import { filterOimsNav } from '@/domain/oims-nav';

const SALES = ['oims.otc.sell', 'oims.manifest.view', 'oims.bookings.view'];
const FINANCE = ['oims.finance.view', 'oims.bookings.view'];

describe('OIMS navigation filter', () => {
  it('shows OTC and manifest for Operator Sales, not finance or staff', () => {
    const ids = filterOimsNav(SALES).map((item) => item.id);
    expect(ids).toEqual(['overview', 'manifest', 'otc', 'bookings']);
    expect(ids.includes('finance')).toBe(false);
    expect(ids.includes('staff')).toBe(false);
  });

  it('shows the statement for Operator Finance, not sell or staff', () => {
    const ids = filterOimsNav(FINANCE).map((item) => item.id);
    expect(ids).toEqual(['overview', 'bookings', 'finance']);
    expect(ids.includes('otc')).toBe(false);
    expect(ids.includes('staff')).toBe(false);
  });
});
