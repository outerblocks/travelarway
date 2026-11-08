import { describe, expect, it } from 'vitest';
import { findBookingByPnr, normalizePnr, recordOnlineBooking } from '@/data/operations';

describe('normalizePnr', () => {
  it('accepts the ways a traveller actually types a PNR', () => {
    expect(normalizePnr('TRV-AB12CD')).toBe('TRV-AB12CD');
    expect(normalizePnr('trv ab12cd')).toBe('TRV-AB12CD');
    expect(normalizePnr('ab12cd')).toBe('TRV-AB12CD');
    expect(normalizePnr('  TRVAB12CD  ')).toBe('TRV-AB12CD');
  });

  it('rejects anything that cannot be a PNR', () => {
    expect(normalizePnr('')).toBeNull();
    expect(normalizePnr('TRV')).toBeNull();
    expect(normalizePnr('not a pnr at all')).toBeNull();
  });
});

describe('findBookingByPnr', () => {
  it('returns null when no booking has been recorded', () => {
    expect(findBookingByPnr('TRV-ZZZZZZ')).toBeNull();
    expect(findBookingByPnr('short')).toBeNull();
  });

  it('finds a booking by its PNR whichever way it is typed', () => {
    const created = recordOnlineBooking({
      operatorId: 'op_test',
      mode: 'bus',
      scheduleId: 'sch_test',
      routeLabel: 'Dar es Salaam → Arusha',
      date: '2026-11-08',
      passengers: 1,
      seats: ['1A'],
      amount: 25000,
      currency: 'TZS',
      reference: 'REF-TEST',
      customerName: 'Test Traveller',
      customerPhone: '0712345678',
      customerEmail: 'test@example.com',
    });

    expect(findBookingByPnr(created.pnr)).toEqual(created);
    expect(findBookingByPnr(created.pnr.toLowerCase())).toEqual(created);
    expect(findBookingByPnr(created.pnr.replace('TRV-', ''))).toEqual(created);
  });

  it('issues a unique PNR per recorded booking', () => {
    const first = recordOnlineBooking({
      operatorId: 'op_test',
      mode: 'bus',
      scheduleId: 'sch_a',
      routeLabel: 'A → B',
      date: '2026-11-08',
      passengers: 1,
      seats: ['1'],
      amount: 1,
      currency: 'TZS',
      reference: 'R1',
      customerName: 'A',
      customerPhone: '1',
      customerEmail: 'a@example.com',
    });
    const second = recordOnlineBooking({
      operatorId: 'op_test',
      mode: 'bus',
      scheduleId: 'sch_b',
      routeLabel: 'B → C',
      date: '2026-11-08',
      passengers: 1,
      seats: ['2'],
      amount: 1,
      currency: 'TZS',
      reference: 'R2',
      customerName: 'B',
      customerPhone: '2',
      customerEmail: 'b@example.com',
    });
    expect(first.pnr).not.toBe(second.pnr);
    expect(first.pnr).toMatch(/^TRV-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    expect(second.pnr).toMatch(/^TRV-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
});
