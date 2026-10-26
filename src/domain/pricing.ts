import {
  EXPERIENCES,
  FLIGHT_RESULTS,
  STAY_PROPERTIES,
  TRAIN_SERVICES,
} from '@/data/mockData';
import { getBusTrip, getFerrySailing } from '@/data/operations';
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
  const adultFare = residency === 'resident' ? fareClass.residentAdultFare : fareClass.adultFare;
  const childFare = residency === 'resident' ? fareClass.residentChildFare : fareClass.childFare;

  const lines: QuoteLine[] = [{ label: `Adult (${adults})`, amount: adultFare * adults }];
  if (children > 0) {
    lines.push({ label: `Child (${children})`, amount: childFare * children });
  }
  lines.push({ label: 'Booking fee', amount: 0 });

  return {
    mode: 'ferry',
    currency: fareClass.currency,
    total: adultFare * adults + childFare * children,
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
    lines: [{ label: `Base fare (${passengerCount} pax)`, amount: flight.totalPrice }],
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
 * Resolves the quote for the booking currently held in AppContext, using the
 * same lookups each review page performs. Returns null when the selected
 * service cannot be resolved (e.g. a reloaded page with no search state).
 */
export function quoteForBooking(input: {
  params: SearchParams;
  passengerCount: number;
  selectedServiceId?: string | null;
  selectedClassId?: string | null;
}): Quote | null {
  const { params, passengerCount, selectedServiceId, selectedClassId } = input;
  const extras = params.extras ?? {};

  switch (params.mode) {
    case 'bus': {
      const trip = getBusTrip(extras.tripId || selectedServiceId);
      return trip ? quoteBusTrip(trip, params.adults, params.children) : null;
    }

    case 'ferry': {
      const sailing = getFerrySailing(extras.sailingId);
      const fareClass = sailing?.classes.find(
        (candidate) => candidate.id === (extras.selectedClassId || selectedClassId),
      );
      return fareClass
        ? quoteFerrySailing(fareClass, residencyOf(params), params.adults, params.children)
        : null;
    }

    case 'train': {
      const service = TRAIN_SERVICES.find((candidate) => candidate.id === extras.trainId);
      const fareClass = service?.classes.find((candidate) => candidate.id === extras.classId);
      return fareClass ? quoteTrainService(fareClass, passengerCount) : null;
    }

    case 'flights': {
      const flight = FLIGHT_RESULTS.find((candidate) => candidate.id === extras.flightId);
      return flight ? quoteFlight(flight, passengerCount) : null;
    }

    case 'stays': {
      const property = STAY_PROPERTIES.find((candidate) => candidate.id === extras.propertyId);
      const room = property?.rooms.find((candidate) => candidate.id === extras.roomId);
      return room ? quoteStay(room, stayNightsOf(params), stayRoomsOf(params)) : null;
    }

    case 'experiences': {
      const experience = EXPERIENCES.find((candidate) => candidate.id === extras.experienceId);
      return experience ? quoteExperience(experience, params.adults) : null;
    }

    default:
      return null;
  }
}

function sumLines(lines: QuoteLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}
