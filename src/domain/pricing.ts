import { formatMoney } from '@/domain/money';
import { nightsBetween } from '@/utils/format';
import type {
  BookingMode,
  BusTrip,
  Experience,
  FerryVesselClass,
  FlightResult,
  SearchParams,
  StayRoom,
  TrainClass,
} from '@/types';

// Single source of truth for what a booking costs and which currency it is in.
// Every surface that shows or charges money (review, checkout, ticket) reads a
// Quote produced here instead of re-deriving the arithmetic locally.

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface Quote {
  mode: BookingMode;
  currency: string;
  total: number;
  lines: QuoteLine[];
}

export type Residency = 'resident' | 'non_resident';

/** Resident passengers are charged in TZS, non-residents in the class currency (USD). */
export const RESIDENT_CURRENCY = 'TZS';

/**
 * The fare pair that applies to a residency. Single source of truth so the search
 * card, the class picker, the review and the ticket can never disagree.
 */
export function ferryFares(fareClass: FerryVesselClass, residency: Residency) {
  return residency === 'resident'
    ? {
        currency: RESIDENT_CURRENCY,
        adultFare: fareClass.residentAdultFare,
        childFare: fareClass.residentChildFare,
      }
    : {
        currency: fareClass.currency,
        adultFare: fareClass.adultFare,
        childFare: fareClass.childFare,
      };
}

/** Children pay half the adult bus fare. */
const CHILD_FARE_RATE = 0.5;

/** Accommodation tax applied on top of the room rate. */
const STAY_TAX_RATE = 0.18;

export function quoteBusTrip(trip: BusTrip, adults: number, children: number): Quote {
  const lines: QuoteLine[] = [
    {
      label: `Adult fare (${adults} × ${formatMoney(trip.segmentFare, trip.currency)})`,
      amount: trip.segmentFare * adults,
    },
  ];

  if (children > 0) {
    const childFare = Math.round(trip.segmentFare * CHILD_FARE_RATE);
    lines.push({
      label: `Child fare (${children} × ${formatMoney(childFare, trip.currency)})`,
      amount: childFare * children,
    });
  }

  lines.push({ label: 'Booking fee', amount: 0 });

  return { mode: 'bus', currency: trip.currency, total: sumLines(lines), lines };
}

export function quoteFerrySailing(
  fareClass: FerryVesselClass,
  residency: Residency,
  adults: number,
  children: number,
): Quote {
  const { currency, adultFare, childFare } = ferryFares(fareClass, residency);

  const lines: QuoteLine[] = [
    { label: `Adult (${adults})`, amount: adultFare * adults },
  ];
  if (children > 0) {
    lines.push({ label: `Child (${children})`, amount: childFare * children });
  }
  lines.push({ label: 'Booking fee', amount: 0 });

  return {
    mode: 'ferry',
    currency,
    // Derived from the lines so the total can never disagree with what the customer sees.
    total: sumLines(lines),
    lines,
  };
}

export function quoteTrainService(fareClass: TrainClass, passengerCount: number): Quote {
  const total = fareClass.fare * passengerCount;

  return {
    mode: 'train',
    currency: fareClass.currency,
    total,
    lines: [{ label: `Fare (${passengerCount} pax)`, amount: total }],
  };
}

export function quoteTrainRoundTrip(
  departureClass: TrainClass,
  returnClass: TrainClass,
  passengerCount: number,
): Quote {
  const departureTotal = departureClass.fare * passengerCount;
  const returnTotal = returnClass.fare * passengerCount;

  return {
    mode: 'train',
    currency: departureClass.currency,
    total: departureTotal + returnTotal,
    lines: [
      { label: `Departure fare (${passengerCount} pax)`, amount: departureTotal },
      { label: `Return fare (${passengerCount} pax)`, amount: returnTotal },
    ],
  };
}

export function quoteStay(room: StayRoom, nights: number, rooms: number): Quote {
  const accommodation = room.pricePerNight * nights * rooms;
  const taxes = Math.round(accommodation * STAY_TAX_RATE);

  return {
    mode: 'stays',
    currency: room.currency,
    total: accommodation + taxes,
    lines: [
      { label: `${room.name} × ${nights} night${nights > 1 ? 's' : ''}`, amount: accommodation },
      { label: 'Taxes (18%)', amount: taxes },
    ],
  };
}

export function quoteExperience(experience: Experience, participants: number): Quote {
  return {
    mode: 'experiences',
    currency: experience.currency,
    total: experience.price * participants,
    lines: [{ label: experience.name, amount: experience.price }],
  };
}

export function quoteFlight(flight: FlightResult, passengerCount: number): Quote {
  return {
    mode: 'flights',
    currency: flight.currency,
    total: flight.totalPrice,
    lines: [{ label: `Fare (${passengerCount} pax, all segments)`, amount: flight.totalPrice }],
  };
}

export function residencyOf(params: SearchParams): Residency {
  return (params.extras?.residency || 'resident') as Residency;
}

export function stayNightsOf(params: SearchParams): number {
  return params.date && params.extras?.checkOut ? nightsBetween(params.date, params.extras.checkOut) : 1;
}

export function stayRoomsOf(params: SearchParams): number {
  return parseInt(params.extras?.rooms || '1', 10) || 1;
}

/**
 * Client-side catalogue quotes are gone. Bus and train price from the server;
 * unmodelled modes have no inventory, so there is nothing to quote.
 */
export function quoteForBooking(_input: {
  params: SearchParams;
  passengerCount: number;
  selectedServiceId?: string | null;
  selectedClassId?: string | null;
}): Quote | null {
  return null;
}

function sumLines(lines: QuoteLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}
