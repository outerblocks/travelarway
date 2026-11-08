import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  formatClock,
  formatClockMeridiem,
  formatCurrency,
  formatDate,
  formatDurationLong,
  formatDurationMinutes,
  formatIsoDuration,
  formatScheduleHeading,
  formatTime,
  generateBookingRef,
  generateId,
  minutesBetweenLocal,
  nightsBetween,
  parseIsoDate,
  toIsoDate,
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

  it('reads a local clock from a provider timestamp without shifting the hour', () => {
    expect(formatClock('2026-11-30T22:00:00')).toBe('22:00');
    expect(formatClock('2026-11-30 10:00:00')).toBe('10:00');
  });

  it('formats elapsed time from naive local stamps and ISO durations', () => {
    expect(minutesBetweenLocal('2026-11-30T22:00:00', '2026-12-01T10:20:00')).toBe(740);
    expect(formatDurationMinutes(740)).toBe('12h 20m');
    expect(formatIsoDuration('PT10H25M')).toBe('10h 25m');
    expect(formatDurationLong(465)).toBe('7 hrs 45 mins');
    expect(formatClockMeridiem('2026-11-30T20:15:00')).toBe('08:15 pm');
    expect(formatScheduleHeading('2026-11-23T20:15:00')).toBe('23 Nov, 08:15 pm');
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

  it('formats a local calendar day, never a UTC instant', () => {
    // Local midnight in Dar es Salaam is 21:00 UTC the day before. toISOString() would
    // have returned 2026-11-03 for this date.
    expect(toIsoDate(new Date(2026, 10, 4))).toBe('2026-11-04');
  });

  it('round-trips a calendar date without drifting', () => {
    expect(toIsoDate(parseIsoDate('2026-01-05'))).toBe('2026-01-05');
    expect(toIsoDate(parseIsoDate('2026-12-31'))).toBe('2026-12-31');
  });

  it('addDays crosses into a new year without drifting', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
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
