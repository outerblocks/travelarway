import { describe, expect, it } from 'vitest';
import {
  quoteBusTrip,
  quoteExperience,
  quoteFerrySailing,
  quoteFlight,
  quoteForBooking,
  quoteStay,
  quoteTrainRoundTrip,
  quoteTrainService,
} from '@/domain/pricing';
import {
  BUS_TRIPS,
  EXPERIENCES,
  FERRY_SAILINGS,
  FLIGHT_RESULTS,
  STAY_PROPERTIES,
  TRAIN_RETURN_SERVICES,
  TRAIN_SERVICES,
} from '@/data/mockData';
import type { SearchParams } from '@/types';

// Golden values pin the fare rules that used to be re-implemented inside each
// review page. Every surface (review, checkout, ticket) must read these.

const busTrip = BUS_TRIPS.find((trip) => trip.id === 'bus_001')!;
const ferrySailing = FERRY_SAILINGS.find((sailing) => sailing.id === 'ferry_001')!;
const ferryEconomy = ferrySailing.classes.find((c) => c.id === 'fc_econ')!;
const trainService = TRAIN_SERVICES.find((service) => service.id === 'sgr_001')!;
const trainBusiness = trainService.classes.find((c) => c.name === 'Business')!;
const stay = STAY_PROPERTIES.find((property) => property.id === 'stay_001')!;
const stayRoom = stay.rooms.find((room) => room.id === 'room_001')!;
const experience = EXPERIENCES.find((item) => item.id === 'exp_001')!;
const flight = FLIGHT_RESULTS.find((item) => item.id === 'flight_001')!;

describe('quoteBusTrip', () => {
  it('charges children half the adult fare', () => {
    const quote = quoteBusTrip(busTrip, 2, 1);

    expect(quote.currency).toBe('TZS');
    expect(quote.lines.map((line) => line.amount)).toEqual([24000, 6000, 0]);
    expect(quote.total).toBe(30000);
    expect(quote.lines[0].label).toContain('Adult fare');
    expect(quote.lines[1].label).toContain('Child fare');
    expect(quote.lines[2].label).toBe('Booking fee');
  });

  it('omits the child line when there are no children', () => {
    const quote = quoteBusTrip(busTrip, 1, 0);

    expect(quote.lines).toHaveLength(2);
    expect(quote.total).toBe(12000);
  });
});

describe('quoteFerrySailing', () => {
  it('uses published fares for non-residents', () => {
    const quote = quoteFerrySailing(ferryEconomy, 'non_resident', 2, 1);

    expect(quote.currency).toBe('USD');
    expect(quote.total).toBe(90);
    expect(quote.lines.map((line) => line.label)).toEqual(['Adult (2)', 'Child (1)', 'Booking fee']);
  });

  it('uses resident fares, quoted in TZS, for residents', () => {
    const quote = quoteFerrySailing(ferryEconomy, 'resident', 2, 1);

    expect(quote.currency).toBe('TZS');
    expect(quote.total).toBe(90000);
  });
});

describe('quoteTrainService', () => {
  it('multiplies the class fare by the passenger count', () => {
    const quote = quoteTrainService(trainBusiness, 2);

    expect(quote.total).toBe(161000);
    expect(quote.currency).toBe('TZS');
    expect(quote.lines[0].label).toBe('Fare (2 pax)');
  });
});

describe('quoteTrainRoundTrip', () => {
  it('quotes both directions for every passenger', () => {
    const returnClass = TRAIN_RETURN_SERVICES[0].classes.find((c) => c.name === 'Business')!;
    const quote = quoteTrainRoundTrip(trainBusiness, returnClass, 2);

    expect(quote.total).toBe(322000);
    expect(quote.currency).toBe('TZS');
    expect(quote.lines.map((line) => line.amount)).toEqual([161000, 161000]);
  });
});

describe('quoteStay', () => {
  it('multiplies nightly rate by nights and rooms, then adds 18% tax', () => {
    const quote = quoteStay(stayRoom, 2, 1);

    expect(quote.lines.map((line) => line.amount)).toEqual([360000, 64800]);
    expect(quote.total).toBe(424800);
    expect(quote.lines[1].label).toBe('Taxes (18%)');
  });
});

describe('quoteExperience', () => {
  it('multiplies the price by participants', () => {
    expect(quoteExperience(experience, 3).total).toBe(1050000);
  });
});

describe('quoteFlight', () => {
  it('uses the total fare as published, not per passenger', () => {
    const quote = quoteFlight(flight, 2);

    expect(quote.total).toBe(85000);
    expect(quote.currency).toBe('TZS');
  });
});

function params(overrides: Partial<SearchParams>): SearchParams {
  return { mode: 'bus', adults: 1, children: 0, infants: 0, extras: {}, ...overrides };
}

describe('quoteForBooking never invents a catalogue price', () => {
  it('returns null for every mode, including ids that used to live in fixtures', () => {
    expect(quoteForBooking({ params: params({ mode: 'bus', extras: { tripId: 'bus_001' } }), passengerCount: 1 })).toBeNull();
    expect(quoteForBooking({ params: params({ mode: 'ferry', extras: { sailingId: 'ferry_001' } }), passengerCount: 1 })).toBeNull();
    expect(quoteForBooking({ params: params({ mode: 'train', extras: { trainId: 'sgr_001' } }), passengerCount: 1 })).toBeNull();
    expect(quoteForBooking({ params: params({ mode: 'flights', extras: { flightId: 'flight_001' } }), passengerCount: 1 })).toBeNull();
    expect(quoteForBooking({ params: params({ mode: 'stays', extras: { propertyId: 'stay_001' } }), passengerCount: 1 })).toBeNull();
    expect(quoteForBooking({ params: params({ mode: 'experiences', extras: { experienceId: 'exp_001' } }), passengerCount: 1 })).toBeNull();
  });
});
