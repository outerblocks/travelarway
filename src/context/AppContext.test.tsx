import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AppProvider, useApp } from '@/context/AppContext';
import { MARKETS } from '@/data/locations';
import type { PassengerInfo } from '@/types';

const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>;

const passenger = (id: string): PassengerInfo => ({
  id,
  category: 'adult',
  fullName: 'A B',
  email: 'a@b.c',
  phone: '1',
  phoneCountryCode: '+255',
  gender: 'male',
  countryOfResidence: 'TZ',
});

describe('AppContext', () => {
  it('defaults to Tanzania market, bus mode, and an empty booking', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.market).toBe(MARKETS.TZ);
    expect(result.current.activeMode).toBe('bus');
    expect(result.current.bookingState).toEqual({
      mode: 'bus',
      searchParams: { mode: 'bus', adults: 1, children: 0, infants: 0 },
      selectedServiceId: null,
      passengers: [],
      selectedSeats: [],
      boardingPointId: null,
      dropOffPointId: null,
      selectedClassId: null,
      bookingReference: null,
      paidAmount: null,
      demoTicket: null,
    });
  });

  it('setMarket switches to a known market and ignores unknown codes', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.setMarket('KE'));
    expect(result.current.market).toBe(MARKETS.KE);
    act(() => result.current.setMarket('XX'));
    expect(result.current.market).toBe(MARKETS.KE);
  });

  it('booking setters update only their own field', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      result.current.setSelectedServiceId('trip-1');
      result.current.setPassengers([passenger('p1')]);
      result.current.setSelectedSeats(['1A']);
      result.current.setBoardingPointId('b1');
      result.current.setDropOffPointId('d1');
      result.current.setSelectedClassId('c1');
      result.current.setBookingReference('TRV-123456');
      result.current.setPaidAmount(18000);
    });
    const s = result.current.bookingState;
    expect(s.selectedServiceId).toBe('trip-1');
    expect(s.passengers).toHaveLength(1);
    expect(s.selectedSeats).toEqual(['1A']);
    expect(s.boardingPointId).toBe('b1');
    expect(s.dropOffPointId).toBe('d1');
    expect(s.selectedClassId).toBe('c1');
    expect(s.bookingReference).toBe('TRV-123456');
    expect(s.paidAmount).toBe(18000);
    expect(s.demoTicket).toBeNull();
    expect(s.mode).toBe('bus');
  });

  it('keeps simulated ticket data separate from confirmed payment data', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      result.current.setBookingReference('TRV-REAL');
      result.current.setPaidAmount(18000);
      result.current.setDemoTicket({ reference: 'DEMO-123', amount: 18000 });
    });

    expect(result.current.bookingState.bookingReference).toBeNull();
    expect(result.current.bookingState.paidAmount).toBeNull();
    expect(result.current.bookingState.demoTicket).toEqual({ reference: 'DEMO-123', amount: 18000 });
  });

  it('resetBooking restores defaults for the requested mode', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.setSelectedServiceId('trip-1'));
    act(() => result.current.resetBooking('ferry'));
    expect(result.current.bookingState.mode).toBe('ferry');
    expect(result.current.bookingState.searchParams.mode).toBe('ferry');
    expect(result.current.bookingState.selectedServiceId).toBeNull();
    expect(result.current.bookingState.paidAmount).toBeNull();
    expect(result.current.bookingState.demoTicket).toBeNull();
  });

  it('useApp throws outside AppProvider', () => {
    expect(() => renderHook(() => useApp())).toThrow('useApp must be used within AppProvider');
  });
});
