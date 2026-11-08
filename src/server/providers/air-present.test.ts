import { describe, expect, it } from 'vitest';
import { presentAirOffers } from '@/server/providers/air-present';
import type { CanonicalAirOffer, CanonicalAirSegment } from '@/server/providers/types';

function segment(partial: Partial<CanonicalAirSegment>): CanonicalAirSegment {
  return {
    marketingCarrier: 'QR',
    flightNumber: '8',
    originCode: 'LHR',
    destinationCode: 'DOH',
    departureAt: '2026-11-30T17:30:00',
    arrivalAt: '2026-12-01T02:00:00',
    ...partial,
  };
}

function offer(partial: Partial<CanonicalAirOffer> & { totalAmount: number; travelarOfferId: string }): CanonicalAirOffer {
  return {
    sourceProviderId: 'travelport',
    sourceProductId: 'flights-v11',
    providerOfferReference: partial.travelarOfferId,
    contentSource: 'GDS',
    currency: 'GBP',
    itinerary: [segment({}), segment({ flightNumber: '1365', originCode: 'DOH', destinationCode: 'DAR', departureAt: '2026-12-01T08:00:00', arrivalAt: '2026-12-01T14:00:00' })],
    ...partial,
  };
}

describe('presentAirOffers', () => {
  it('keeps the cheaper fare when the itinerary is the same', () => {
    const listed = presentAirOffers([
      offer({ travelarOfferId: 'dear', totalAmount: 397.39 }),
      offer({ travelarOfferId: 'cheap', totalAmount: 395.49 }),
    ]);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.travelarOfferId).toBe('cheap');
    expect(listed[0]?.totalAmount).toBe(395.49);
  });

  it('sorts remaining itineraries by price then departure', () => {
    const listed = presentAirOffers([
      offer({
        travelarOfferId: 'later',
        totalAmount: 100,
        itinerary: [segment({ flightNumber: '16', departureAt: '2026-11-30T21:30:00' })],
      }),
      offer({
        travelarOfferId: 'earlier',
        totalAmount: 100,
        itinerary: [segment({ flightNumber: '6', departureAt: '2026-11-30T08:05:00' })],
      }),
      offer({
        travelarOfferId: 'ms',
        totalAmount: 489.89,
        itinerary: [segment({ marketingCarrier: 'MS', flightNumber: '780' })],
      }),
    ]);
    expect(listed.map((row) => row.travelarOfferId)).toEqual(['earlier', 'later', 'ms']);
  });
});
