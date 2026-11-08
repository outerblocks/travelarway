import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { BookingMode, MarketConfig, SearchParams, PassengerInfo } from '@/types';
import { MARKETS } from '@/data/locations';

interface BookingState {
  mode: BookingMode;
  searchParams: SearchParams;
  selectedServiceId: string | null;
  passengers: PassengerInfo[];
  selectedSeats: string[];
  boardingPointId: string | null;
  dropOffPointId: string | null;
  selectedClassId: string | null;
  /**
   * The booking created in this session, as the server recorded it.
   *
   * There is no demo ticket beside it: a booking either exists in the database or the
   * checkout failed. `status` is the server's state, not this component's opinion — the
   * confirmation page re-reads it, so a payment confirmed minutes later shows correctly.
   */
  activeBooking: {
    bookingId: string;
    pnr: string;
    totalMinor: number;
    currency: string;
    status: string;
    paymentDueAt: string | null;
    /** True only when a collection request actually reached the provider. */
    collectionStarted: boolean;
    /** Why it did not, when it did not. Shown to the customer verbatim by reason code. */
    collectionFailure: string | null;
    /** The provider's own words, when it refused. Development only. */
    collectionDetail: string | null;
    /** Signed proof that this browser created the booking; required to read or pay it. */
    accessToken: string;
  } | null;
}

interface AppContextValue {
  market: MarketConfig;
  setMarket: (countryCode: string) => void;
  activeMode: BookingMode;
  setActiveMode: (mode: BookingMode) => void;
  bookingState: BookingState;
  setSearchParams: (params: SearchParams) => void;
  setSelectedServiceId: (id: string | null) => void;
  setPassengers: (p: PassengerInfo[]) => void;
  setSelectedSeats: (seats: string[]) => void;
  setBoardingPointId: (id: string | null) => void;
  setDropOffPointId: (id: string | null) => void;
  setSelectedClassId: (id: string | null) => void;
  setActiveBooking: (booking: BookingState['activeBooking']) => void;
  resetBooking: (mode: BookingMode) => void;
}

const defaultMarket = MARKETS.TZ;

const defaultBookingState = (mode: BookingMode): BookingState => ({
  mode,
  searchParams: {
    mode,
    adults: 1,
    children: 0,
    infants: 0,
  },
  selectedServiceId: null,
  passengers: [],
  selectedSeats: [],
  boardingPointId: null,
  dropOffPointId: null,
  selectedClassId: null,
  activeBooking: null,
});

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [market, setMarketState] = useState<MarketConfig>(defaultMarket);
  const [activeMode, setActiveMode] = useState<BookingMode>('bus');
  const [bookingState, setBookingState] = useState<BookingState>(defaultBookingState('bus'));

  const setMarket = useCallback((countryCode: string) => {
    const m = MARKETS[countryCode];
    if (m) setMarketState(m);
  }, []);

  const setSearchParams = useCallback((params: SearchParams) => {
    // `mode` is part of the booking, not just of the query: the ticket header and
    // the mode-specific labels read it, so keep it in step with every search.
    setBookingState((prev) => ({ ...prev, mode: params.mode, searchParams: params }));
  }, []);

  const setSelectedServiceId = useCallback((id: string | null) => {
    setBookingState((prev) => ({ ...prev, selectedServiceId: id }));
  }, []);

  const setPassengers = useCallback((p: PassengerInfo[]) => {
    setBookingState((prev) => ({ ...prev, passengers: p }));
  }, []);

  const setSelectedSeats = useCallback((seats: string[]) => {
    setBookingState((prev) => ({ ...prev, selectedSeats: seats }));
  }, []);

  const setBoardingPointId = useCallback((id: string | null) => {
    setBookingState((prev) => ({ ...prev, boardingPointId: id }));
  }, []);

  const setDropOffPointId = useCallback((id: string | null) => {
    setBookingState((prev) => ({ ...prev, dropOffPointId: id }));
  }, []);

  const setSelectedClassId = useCallback((id: string | null) => {
    setBookingState((prev) => ({ ...prev, selectedClassId: id }));
  }, []);

  const setActiveBooking = useCallback((booking: BookingState['activeBooking']) => {
    setBookingState((prev) => ({ ...prev, activeBooking: booking }));
  }, []);

  const resetBooking = useCallback((mode: BookingMode) => {
    setBookingState(defaultBookingState(mode));
  }, []);

  return (
    <AppContext.Provider
      value={{
        market,
        setMarket,
        activeMode,
        setActiveMode,
        bookingState,
        setSearchParams,
        setSelectedServiceId,
        setPassengers,
        setSelectedSeats,
        setBoardingPointId,
        setDropOffPointId,
        setSelectedClassId,
        setActiveBooking,
        resetBooking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
