import type { BookingMode } from '@/types';

export type TripStatus = 'upcoming' | 'completed' | 'cancelled';

export interface TripRecord {
  id: string;
  reference: string;
  mode: BookingMode;
  title: string;
  route: string;
  date: string;
  passengers: number;
  amount: number;
  currency: string;
  status: TripStatus;
}

/** Traveller history is loaded from bookings. Nothing is fabricated when the account has none. */
export const TRIP_HISTORY: TripRecord[] = [];
