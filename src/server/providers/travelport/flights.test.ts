import { describe, expect, it } from 'vitest';
import { buildAirCatalogRequest, normalizeAirSearch } from '@/server/providers/travelport/flights';
import type { TravelportConfig } from '@/server/travelport/config';

const meta = { providerId: 'travelport', productId: 'flights-v11', correlationId: 'c1' };

describe('Travelport air reference join', () => {
  it('joins offering refs onto flights and records provider currency without converting it', () => {
    const offers = normalizeAirSearch({
      CatalogProductOfferingsResponse: {
        CatalogProductOfferings: {
          CatalogProductOffering: [{
            id: 'o0',
            contentSource: 'GDS',
            productRef: [{ value: 'p0' }],
            BestCombinablePrice: {
              Base: '66',
              TotalTaxes: '26.1',
              TotalPrice: '92.1',
              CurrencyCode: { value: 'GBP', decimalPlace: 2 },
            },
          }],
        },
        ReferenceList: [
          {
            '@type': 'ReferenceListProduct',
            Product: [{ id: 'p0', flightRefs: ['s0'], cabin: 'Economy' }],
          },
          {
            '@type': 'ReferenceListFlight',
            Flight: [{
              id: 's0',
              carrier: 'PW',
              number: '718',
              Departure: { location: 'JRO', date: '2026-12-08', time: '09:00' },
              Arrival: { location: 'DAR', date: '2026-12-08', time: '10:15' },
            }],
          },
        ],
      },
    }, meta);

    expect(offers).toHaveLength(1);
    expect(offers[0]?.currency).toBe('GBP');
    expect(offers[0]?.totalAmount).toBe(92.1);
    expect(offers[0]?.itinerary[0]).toMatchObject({
      originCode: 'JRO',
      destinationCode: 'DAR',
      flightNumber: '718',
      marketingCarrier: 'PW',
    });
    expect(offers[0]?.itinerary[0]?.operatingCarrier).toBeUndefined();
  });

  it('keeps Hahn Air as the ticketed carrier until an operating airline is present', () => {
    const offers = normalizeAirSearch({
      CatalogProductOfferingsResponse: {
        CatalogProductOfferings: {
          CatalogProductOffering: [{
            id: 'oH1',
            contentSource: 'GDS',
            productRef: [{ value: 'pH1' }],
            BestCombinablePrice: {
              TotalPrice: '92.1',
              CurrencyCode: { value: 'GBP' },
            },
          }],
        },
        ReferenceList: [
          {
            '@type': 'ReferenceListProduct',
            Product: [{ id: 'pH1', flightRefs: ['sH1'], cabin: 'Y' }],
          },
          {
            '@type': 'ReferenceListFlight',
            Flight: [{
              id: 'sH1',
              carrier: 'H1',
              number: '1956',
              Departure: { location: 'JRO', date: '2026-12-08', time: '09:00' },
              Arrival: { location: 'DAR', date: '2026-12-08', time: '10:15' },
            }],
          },
        ],
      },
    }, meta);
    expect(offers[0]?.cabinClass).toBe('Economy');
    expect(offers[0]?.itinerary[0]).toMatchObject({
      marketingCarrier: 'H1',
      flightNumber: '1956',
    });
    expect(offers[0]?.itinerary[0]?.operatingCarrier).toBeUndefined();
  });

  it('joins ProductBrandOptions flightRefs from the live TripServices envelope', () => {
    const offers = normalizeAirSearch({
      CatalogProductOfferingsResponse: {
        CatalogProductOfferings: {
          CatalogProductOffering: [{
            id: 'o1',
            ProductBrandOptions: {
              flightRefs: ['s1'],
              ProductBrandOffering: [{
                ContentSource: 'GDS',
                Product: [{ productRef: 'p0' }],
                Brand: { BrandRef: 'b0' },
                TermsAndConditions: { termsAndConditionsRef: 't0' },
                BestCombinablePrice: {
                  Base: '66',
                  TotalTaxes: '26.1',
                  TotalPrice: '92.1',
                  CurrencyCode: { value: 'GBP', decimalPlace: 2 },
                },
              }],
            },
          }],
        },
        ReferenceList: [
          {
            '@type': 'ReferenceListProduct',
            Product: [{
              id: 'p0',
              FlightSegment: [{ Flight: { FlightRef: 's1' } }],
              PassengerFlight: [{ FlightProduct: [{ cabin: 'Economy' }] }],
            }],
          },
          {
            '@type': 'ReferenceListFlight',
            Flight: [{
              id: 's1',
              carrier: { value: 'QR', name: 'Qatar Airways' },
              OperatingAirline: { value: 'QR', name: 'Qatar Airways' },
              number: '718',
              equipment: '351',
              Departure: { location: 'JRO', date: '2026-12-08', time: '09:00', terminal: '2' },
              Arrival: { location: 'DAR', date: '2026-12-08', time: '10:15', terminal: '1' },
            }],
          },
          {
            '@type': 'ReferenceListBrand',
            Brand: [{ id: 'b0', name: 'Economy' }],
          },
          {
            '@type': 'ReferenceListTermsAndConditions',
            TermsAndConditions: [{
              id: 't0',
              BaggageAllowance: { Description: '1 x 23kg' },
              Penalties: {
                Change: { Description: 'Changes permitted with a fee' },
                Cancel: { Description: 'Non-refundable' },
              },
            }],
          },
        ],
      },
    }, meta);

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      currency: 'GBP',
      totalAmount: 92.1,
      contentSource: 'GDS',
      cabinClass: 'Economy',
      baggageSummary: '1 x 23kg',
      refundSummary: 'Non-refundable',
      changeSummary: 'Changes permitted with a fee',
      itinerary: [{
        originCode: 'JRO',
        destinationCode: 'DAR',
        marketingCarrier: 'QR',
        marketingCarrierName: 'Qatar Airways',
        flightNumber: '718',
        equipment: '351',
        originTerminal: '2',
        destinationTerminal: '1',
      }],
    });
  });

  it('summarises structured baggage items when Description is absent', () => {
    const offers = normalizeAirSearch({
      CatalogProductOfferingsResponse: {
        CatalogProductOfferings: {
          CatalogProductOffering: [{
            id: 'o2',
            ProductBrandOptions: {
              flightRefs: ['s1'],
              ProductBrandOffering: [{
                ContentSource: 'GDS',
                Product: [{ productRef: 'p0' }],
                TermsAndConditions: { termsAndConditionsRef: 't1' },
                BestCombinablePrice: {
                  Base: '66',
                  TotalTaxes: '26.1',
                  TotalPrice: '92.1',
                  CurrencyCode: { value: 'GBP', decimalPlace: 2 },
                },
              }],
            },
          }],
        },
        ReferenceList: [
          {
            '@type': 'ReferenceListProduct',
            Product: [{ id: 'p0', FlightSegment: [{ Flight: { FlightRef: 's1' } }] }],
          },
          {
            '@type': 'ReferenceListFlight',
            Flight: [{
              id: 's1',
              carrier: 'QR',
              number: '718',
              Departure: { location: 'JRO', date: '2026-12-08', time: '09:00' },
              Arrival: { location: 'DAR', date: '2026-12-08', time: '10:15' },
            }],
          },
          {
            '@type': 'ReferenceListTermsAndConditions',
            TermsAndConditions: [{
              id: 't1',
              BaggageAllowance: {
                BaggageItem: [{
                  Quantity: 1,
                  BaggageType: 'Checked',
                  Measurement: [{ value: 23, unit: 'KG' }],
                }],
              },
            }],
          },
        ],
      },
    }, meta);

    expect(offers[0]?.baggageSummary).toBe('1 pc · 23KG · Checked');
  });
});

const ukPosConfig: TravelportConfig = {
  environment: 'PREPROD',
  clientId: 'id',
  clientSecret: 'secret-value',
  contentSources: ['GDS', 'NDC'],
  authBaseUrl: 'https://auth.pp.travelport.net',
  flightsBaseUrl: 'https://api.pp.travelport.net/11/air',
  staysV11BaseUrl: 'https://api.pp.travelport.net/11/hotel',
  region: 'EMEA:UK',
  pointOfSale: 'GB',
  currency: 'GBP',
  gdsCarriers: ['BA', 'AA', '1G'],
  ndcCarriers: ['AA', 'UA', 'QF', 'SQ'],
};

describe('Travelport air catalog request', () => {
  it('shops GDS and NDC together and does not send carrier filters by default', () => {
    const body = buildAirCatalogRequest({
      originCode: 'LHR',
      destinationCode: 'JFK',
      departureDate: '2026-12-08',
      adults: 1,
      children: 0,
      infants: 0,
    }, ukPosConfig);
    const request = body.CatalogProductOfferingsRequest as Record<string, unknown>;
    expect(request.contentSourceList).toEqual(['GDS', 'NDC']);
    expect(request.SearchModifiersAir).toBeUndefined();
  });

  it('sends DevKit CarrierPreference only when preference type is configured', () => {
    const body = buildAirCatalogRequest({
      originCode: 'LHR',
      destinationCode: 'JFK',
      departureDate: '2026-12-08',
      adults: 1,
      children: 0,
      infants: 0,
    }, { ...ukPosConfig, carrierPreferenceType: 'Preferred' });
    const modifiers = (body.CatalogProductOfferingsRequest as Record<string, unknown>).SearchModifiersAir as {
      CarrierPreference: { preferenceType: string; carriers: string[] }[];
    };
    expect(modifiers.CarrierPreference[0]?.preferenceType).toBe('Preferred');
    expect(modifiers.CarrierPreference[0]?.carriers).toEqual(['BA', 'AA', '1G', 'UA', 'QF', 'SQ']);
  });

  it('sends a second SearchCriteriaFlight when a return date is set', () => {
    const body = buildAirCatalogRequest({
      originCode: 'LHR',
      destinationCode: 'DAR',
      departureDate: '2026-12-08',
      returnDate: '2026-12-15',
      adults: 1,
      children: 0,
      infants: 0,
    }, ukPosConfig);
    const request = body.CatalogProductOfferingsRequest as Record<string, unknown>;
    expect(request.SearchCriteriaFlight).toEqual([
      {
        '@type': 'SearchCriteriaFlight',
        departureDate: '2026-12-08',
        From: { value: 'LHR' },
        To: { value: 'DAR' },
      },
      {
        '@type': 'SearchCriteriaFlight',
        departureDate: '2026-12-15',
        From: { value: 'DAR' },
        To: { value: 'LHR' },
      },
    ]);
  });
});
