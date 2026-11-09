import { describe, expect, it } from 'vitest';
import { occurrenceDates } from '@/server/oims/calendar';

describe('occurrenceDates', () => {
  it('lists weekdays in the range without duplicating extras', () => {
    const dates = occurrenceDates('2026-11-09', '2026-11-15', [1, 3, 5], [
      { serviceDate: '2026-11-11', kind: 'blackout' },
      { serviceDate: '2026-11-14', kind: 'extra' },
    ]);
    expect(dates).toEqual(['2026-11-09', '2026-11-13', '2026-11-14']);
  });

  it('rejects an inverted range', () => {
    expect(() => occurrenceDates('2026-12-01', '2026-11-01', [1])).toThrow('invalid_date_range');
  });

  it('rejects a rule with no operating days', () => {
    expect(() => occurrenceDates('2026-11-09', '2026-11-15', [])).toThrow('invalid_operating_days');
  });
});
