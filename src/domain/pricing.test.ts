import { describe, expect, it } from 'vitest';
import {
  quoteBusTrip,
  quoteExperience,
  quoteFerrySailing,
  quoteFlight,
  quoteForBooking,
  quoteStay,
  quoteTrainService,
} from '@/domain/pricing';
import {
  BUS_TRIPS,
  EXPERIENCES,
  FERRY_SAILINGS,
  FLIGHT_RESULTS,
  STAY_PROPERTIES,
  TRAIN_SERVICES,
} from '@/data/mockData';
import type { SearchParams } from '@/types';

// Golden values pin the fare rules that used to be re-implemented inside each
// review page. Every surface (review, checkout, ticket) must read these.

const busTrip = BUS_TRIPS.find((trip) => trip.id === 'bus_001')!;
const ferrySailing = FERRY_SAILINGS.find((sailing) => sailing.id === 'ferry_001')!;
const ferryEconomy = ferrySailing.classes.find((c) => c.id === 'fc_econ')!;
const trainService = TRAIN_SERVICES.find((service) => service.id === 'train_001')!;
const trainBusiness = trainService.classes.find((c) => c.id === 'tc_business')!;
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

  it('uses resident fares for residents', () => {
    const quote = quoteFerrySailing(ferryEconomy, 'resident', 2, 1);

    expect(quote.currency).toBe('USD');
    expect(quote.total).toBe(90000);
  });
});

describe('quoteTrainService', () => {
  it('multiplies the class fare by the passenger count', () => {
    const quote = quoteTrainService(trainBusiness, 2);

    expect(quote.total).toBe(46000);
    expect(quote.currency).toBe('TZS');
    expect(quote.lines[0].label).toBe('Fare (2 pax)');
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

describe('quoteForBooking resolves the same quote the review page shows', () => {
  it('bus: resolves by extras.tripId', () => {
    const search = params({ mode: 'bus', adults: 2, children: 1, extras: { tripId: 'bus_001' } });

    expect(quoteForBooking({ params: search, passengerCount: 3 })).toEqual(quoteBusTrip(busTrip, 2, 1));
  });

  it('bus: falls back to the selected service id', () => {
    const search = params({ mode: 'bus', adults: 1, extras: {} });

    expect(quoteForBooking({ params: search, passengerCount: 1, selectedServiceId: 'bus_001' })?.total).toBe(12000);
  });

  it('ferry: honours residency and the selected class', () => {
    const search = params({
      mode: 'ferry',
      adults: 2,
      children: 1,
      extras: { sailingId: 'ferry_001', selectedClassId: 'fc_econ', residency: 'non_resident' },
    });

    expect(quoteForBooking({ params: search, passengerCount: 3 })).toEqual(
      quoteFerrySailing(ferryEconomy, 'non_resident', 2, 1),
    );
  });

  it('ferry: defaults to resident pricing like the review page', () => {
    const search = params({
      mode: 'ferry',
      adults: 1,
      extras: { sailingId: 'ferry_001', selectedClassId: 'fc_econ' },
    });

    expect(quoteForBooking({ params: search, passengerCount: 1 })?.total).toBe(35000);
  });

  it('train: resolves by extras.trainId and classId', () => {
    const search = params({ mode: 'train', extras: { trainId: 'train_001', classId: 'tc_business' } });

    expect(quoteForBooking({ params: search, passengerCount: 2 })?.total).toBe(46000);
  });

  it('flights: resolves by extras.flightId', () => {
    const search = params({ mode: 'flights', extras: { flightId: 'flight_001' } });

    expect(quoteForBooking({ params: search, passengerCount: 2 })?.total).toBe(85000);
  });

  it('stays: derives nights and rooms from extras', () => {
    const search = params({
      mode: 'stays',
      date: '2026-10-25',
      extras: { propertyId: 'stay_001', roomId: 'room_001', checkOut: '2026-10-27', rooms: '1' },
    });

    expect(quoteForBooking({ params: search, passengerCount: 1 })?.total).toBe(424800);
  });

  it('experiences: multiplies by adults', () => {
    const search = params({ mode: 'experiences', adults: 3, extras: { experienceId: 'exp_001' } });

    expect(quoteForBooking({ params: search, passengerCount: 3 })?.total).toBe(1050000);
  });

  it('returns null when the selection cannot be resolved', () => {
    expect(quoteForBooking({ params: params({ mode: 'bus', extras: {} }), passengerCount: 1 })).toBeNull();
    expect(
      quoteForBooking({ params: params({ mode: 'ferry', extras: { sailingId: 'nope' } }), passengerCount: 1 }),
    ).toBeNull();
    expect(
      quoteForBooking({ params: params({ mode: 'flights', extras: {} }), passengerCount: 1 }),
    ).toBeNull();
  });
});
