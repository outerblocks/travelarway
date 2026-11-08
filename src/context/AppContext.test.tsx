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
      activeBooking: null,
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
      result.current.setActiveBooking({
        bookingId: 'bk-1',
        pnr: 'TRV-123456',
        totalMinor: 1800000,
        currency: 'TZS',
        status: 'pending_payment',
        paymentDueAt: '2026-10-30T21:15:00.000Z',
        collectionStarted: false,
        collectionFailure: null,
        collectionDetail: null,
        accessToken: 'payload.signature',
      });
    });
    const s = result.current.bookingState;
    expect(s.selectedServiceId).toBe('trip-1');
    expect(s.passengers).toHaveLength(1);
    expect(s.selectedSeats).toEqual(['1A']);
    expect(s.boardingPointId).toBe('b1');
    expect(s.dropOffPointId).toBe('d1');
    expect(s.selectedClassId).toBe('c1');
    expect(s.activeBooking?.pnr).toBe('TRV-123456');
    expect(s.activeBooking?.status).toBe('pending_payment');
    expect(s.mode).toBe('bus');
  });

  it('a booking carries the server state, not a guessed one', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      result.current.setActiveBooking({
        bookingId: 'bk-2',
        pnr: 'TRV-PENDING',
        totalMinor: 5800000,
        currency: 'TZS',
        status: 'pending_payment',
        paymentDueAt: '2026-10-30T21:15:00.000Z',
        collectionStarted: false,
        collectionFailure: null,
        collectionDetail: null,
        accessToken: 'payload.signature',
      });
    });

    // Creating a booking is not a sale: the status says so, and no ticket exists here.
    expect(result.current.bookingState.activeBooking).toMatchObject({
      pnr: 'TRV-PENDING',
      status: 'pending_payment',
      collectionStarted: false,
    });
  });

  it('resetBooking restores defaults for the requested mode', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.setSelectedServiceId('trip-1'));
    act(() => result.current.resetBooking('ferry'));
    expect(result.current.bookingState.mode).toBe('ferry');
    expect(result.current.bookingState.searchParams.mode).toBe('ferry');
    expect(result.current.bookingState.selectedServiceId).toBeNull();
    expect(result.current.bookingState.activeBooking).toBeNull();
  });

  it('useApp throws outside AppProvider', () => {
    expect(() => renderHook(() => useApp())).toThrow('useApp must be used within AppProvider');
  });
});
