import { describe, expect, it } from 'vitest';
import { airportLine, arrivesNextDay, cabinLine, displayAirline, iataFromPlace, isInternationalAirOffer, isNightDeparture, journeyDuration, layoverMinutes, marketingLabel, splitRoundTrip, viaAirports } from '@/domain/flight-results';
import type { PublicAirOffer } from '@/domain/air-offer';

function leg(partial: Pick<PublicAirOffer['itinerary'][number], 'carrier' | 'flightNumber' | 'origin' | 'destination' | 'departure' | 'arrival'> & Partial<PublicAirOffer['itinerary'][number]>): PublicAirOffer['itinerary'][number] {
  return {
    carrier: partial.carrier,
    carrierName: partial.carrierName ?? null,
    operatingCarrier: partial.operatingCarrier ?? null,
    operatingCarrierName: partial.operatingCarrierName ?? null,
    flightNumber: partial.flightNumber,
    origin: partial.origin,
    originName: partial.originName ?? null,
    originCountry: partial.originCountry ?? null,
    originCountryCode: partial.originCountryCode ?? null,
    originTerminal: partial.originTerminal ?? null,
    destination: partial.destination,
    destinationName: partial.destinationName ?? null,
    destinationCountry: partial.destinationCountry ?? null,
    destinationCountryCode: partial.destinationCountryCode ?? null,
    destinationTerminal: partial.destinationTerminal ?? null,
    departure: partial.departure,
    arrival: partial.arrival,
    duration: partial.duration ?? null,
    equipment: partial.equipment ?? null,
    equipmentName: partial.equipmentName ?? null,
  };
}

const offer: PublicAirOffer = {
  id: '1',
  totalPrice: 395.49,
  currency: 'GBP',
  cabinClass: 'Economy',
  fareBrand: null,
  baggageInfo: null,
  refundInfo: null,
  changeInfo: null,
  basePrice: null,
  taxPrice: null,
  itinerary: [
    leg({
      carrier: 'QR',
      flightNumber: '8',
      origin: 'LHR',
      destination: 'DOH',
      departure: '2026-11-30T17:30:00',
      arrival: '2026-12-01T02:00:00',
      duration: 'PT6H30M',
    }),
    leg({
      carrier: 'QR',
      flightNumber: '1365',
      origin: 'DOH',
      destination: 'DAR',
      departure: '2026-12-01T08:15:00',
      arrival: '2026-12-01T14:05:00',
      duration: 'PT5H50M',
    }),
  ],
};

describe('flight result labels', () => {
  it('lists every marketing flight and connection airport', () => {
    expect(marketingLabel(offer)).toBe('QR 8 · QR 1365');
    expect(viaAirports(offer)).toEqual(['DOH']);
    expect(arrivesNextDay(offer)).toBe(true);
  });

  it('brands the operating airline when Hahn Air tickets a Precision Air flight', () => {
    const hahn: PublicAirOffer = {
      ...offer,
      cabinClass: 'Economy',
      fareBrand: 'Precision Air',
      itinerary: [
        leg({
          carrier: 'H1',
          carrierName: 'Hahn Air',
          operatingCarrier: 'PW',
          operatingCarrierName: 'Precision Air',
          flightNumber: '1956',
          origin: 'JRO',
          destination: 'DAR',
          departure: '2026-12-08T09:00:00',
          arrival: '2026-12-08T10:15:00',
        }),
      ],
    };
    expect(marketingLabel(hahn)).toBe('Precision Air');
    expect(cabinLine(hahn)).toBe('Economy');
    expect(displayAirline(hahn.itinerary[0])).toEqual({ code: 'PW', name: 'Precision Air' });
    const auric: PublicAirOffer = {
      ...hahn,
      fareBrand: 'Auric Air',
      itinerary: [
        leg({
          carrier: 'Q4',
          carrierName: 'Euroairlines',
          operatingCarrier: 'UI',
          operatingCarrierName: 'Auric Air',
          flightNumber: '9700',
          origin: 'DAR',
          destination: 'MWZ',
          departure: '2026-12-08T15:30:00',
          arrival: '2026-12-08T18:35:00',
        }),
      ],
    };
    expect(marketingLabel(auric)).toBe('Auric Air');
    expect(displayAirline(auric.itinerary[0])).toEqual({ code: 'UI', name: 'Auric Air' });
    expect(marketingLabel({
      ...hahn,
      itinerary: hahn.itinerary.map((row) => ({
        ...row,
        operatingCarrier: null,
        operatingCarrierName: null,
      })),
    })).toBe('Precision Air');
  });

  it('uses the airline name when the GDS or IATA map returned one', () => {
    const named: PublicAirOffer = {
      ...offer,
      itinerary: offer.itinerary.map((row) => ({ ...row, carrierName: 'Qatar Airways' })),
    };
    expect(marketingLabel(named)).toBe('Qatar Airways');
    expect(viaAirports({
      ...named,
      itinerary: [
        { ...named.itinerary[0], destinationName: 'Hamad International Airport (DOH)' },
        named.itinerary[1],
      ],
    })).toEqual(['Hamad International Airport (DOH)']);
  });

  it('adds flying time and the layover at the connection airport', () => {
    // 6h30 + 6h15 layover in DOH + 5h50 = 18h 35m
    expect(journeyDuration(offer)).toBe('18h 35m');
    expect(layoverMinutes(offer.itinerary[0].arrival, offer.itinerary[1].departure)).toBe(375);
  });

  it('prints a stored airport name and country without inventing a city', () => {
    expect(airportLine('LHR', 'London Heathrow (LHR)', 'United Kingdom')).toBe(
      'London Heathrow (LHR), United Kingdom',
    );
    expect(airportLine('XYZ', null, null)).toBe('XYZ');
  });

  it('treats 20:15 as a night departure and 15:30 as not', () => {
    expect(isNightDeparture('2026-11-23T20:15:00')).toBe(true);
    expect(isNightDeparture('2026-11-30T15:30:00')).toBe(false);
  });

  it('splits a return itinerary at the searched destination', () => {
    const outbound = offer.itinerary;
    const inbound = [
      leg({
        carrier: 'QR',
        flightNumber: '1364',
        origin: 'DAR',
        destination: 'DOH',
        departure: '2026-12-15T01:35:00',
        arrival: '2026-12-15T07:10:00',
        duration: 'PT5H35M',
      }),
      leg({
        carrier: 'QR',
        flightNumber: '9',
        origin: 'DOH',
        destination: 'LHR',
        departure: '2026-12-15T09:00:00',
        arrival: '2026-12-15T13:40:00',
        duration: 'PT7H40M',
      }),
    ];
    const split = splitRoundTrip([...outbound, ...inbound], iataFromPlace('Julius Nyerere International Airport (DAR)'));
    expect(split.outbound.map((row) => row.flightNumber)).toEqual(['8', '1365']);
    expect(split.inbound.map((row) => row.flightNumber)).toEqual(['1364', '9']);
  });
});

describe('international itinerary', () => {
  it('is international when airport countries differ', () => {
    expect(isInternationalAirOffer({
      ...offer,
      itinerary: [
        { ...offer.itinerary[0], originCountryCode: 'GB', destinationCountryCode: 'QA' },
        { ...offer.itinerary[1], originCountryCode: 'QA', destinationCountryCode: 'TZ' },
      ],
    })).toBe(true);
  });

  it('is domestic when every airport is in one country', () => {
    expect(isInternationalAirOffer({
      ...offer,
      itinerary: [
        { ...offer.itinerary[0], origin: 'JNB', destination: 'CPT', originCountryCode: 'ZA', destinationCountryCode: 'ZA' },
      ],
    })).toBe(false);
  });

  it('requires passport when country codes are missing', () => {
    expect(isInternationalAirOffer(offer)).toBe(true);
  });
});
