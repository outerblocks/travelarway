import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  formatCurrency,
  formatDate,
  formatTime,
  generateBookingRef,
  generateId,
  nightsBetween,
  todayISO,
} from '@/utils/format';

// Characterization tests: these pin the CURRENT behaviour of format.ts.

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('formatCurrency', () => {
  it.each(['TZS', 'KES', 'UGX', 'RWF'])('%s uses "<symbol> <grouped amount>"', (cur) => {
    expect(formatCurrency(12000, cur, 'SYM')).toBe(`SYM ${(12000).toLocaleString()}`);
  });

  it('falls back to the currency code when no symbol is given', () => {
    expect(formatCurrency(500, 'TZS')).toBe(`TZS ${(500).toLocaleString()}`);
  });

  it('formats other currencies through Intl (en-US)', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
  });

  it('ignores the symbol argument for Intl currencies', () => {
    expect(formatCurrency(10, 'USD', 'XX')).toBe('$10.00');
  });
});

describe('formatDate / formatTime', () => {
  it('formats an ISO date as "Wkd, Mon D, YYYY" (en-US)', () => {
    expect(formatDate('2026-03-05')).toBe('Thu, Mar 5, 2026');
  });

  it('formatTime returns its input unchanged', () => {
    expect(formatTime('08:30')).toBe('08:30');
  });
});

describe('date helpers', () => {
  it('todayISO returns the current date as YYYY-MM-DD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-06T10:00:00Z'));
    expect(todayISO()).toBe('2026-05-06');
  });

  it('addDays adds across month boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
  });

  it('addDays supports negative offsets', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('nightsBetween counts whole nights', () => {
    expect(nightsBetween('2026-03-01', '2026-03-04')).toBe(3);
  });

  it('nightsBetween is 0 for the same day and negative when reversed', () => {
    expect(nightsBetween('2026-03-01', '2026-03-01')).toBe(0);
    expect(nightsBetween('2026-03-04', '2026-03-01')).toBe(-3);
  });
});

describe('id generators', () => {
  it('generateBookingRef has the form TRV-<6 digits>', () => {
    expect(generateBookingRef()).toMatch(/^TRV-\d{6}$/);
  });

  it('generateBookingRef spans 100000..999999', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(generateBookingRef()).toBe('TRV-100000');
    vi.spyOn(Math, 'random').mockReturnValue(0.9999999);
    expect(generateBookingRef()).toBe('TRV-999999');
  });

  it('generateId returns a short base36 string', () => {
    expect(generateId()).toMatch(/^[a-z0-9]{1,9}$/);
  });
});
