import { describe, expect, it } from 'vitest';
import {
  buildStayAvailabilityRequest,
  buildStaySearchRequest,
  normalizeStayAvailability,
  normalizeStaySearch,
} from '@/server/providers/travelport/stays';
import type { TravelportConfig } from '@/server/travelport/config';

const meta = { providerId: 'travelport', productId: 'stays-v11', correlationId: 'c1' };

const config: TravelportConfig = {
  environment: 'PREPROD',
  clientId: 'id',
  clientSecret: 'secret-secret',
  contentSources: ['GDS'],
  gdsCarriers: [],
  ndcCarriers: [],
  authBaseUrl: 'https://auth.pp.travelport.net',
  flightsBaseUrl: 'https://api.pp.travelport.net/11/air',
  staysV11BaseUrl: 'https://api.pp.travelport.net/11/hotel',
  currency: 'GBP',
  pointOfSale: 'GB',
};

describe('buildStaySearchRequest', () => {
  it('repeats RoomStayCandidate for the requested room count and uses SearchByCity when a city code is present', () => {
    const body = buildStaySearchRequest({
      cityName: 'Dar es Salaam',
      countryCode: 'TZ',
      cityCode: 'DAR',
      checkInDate: '2026-12-10',
      checkOutDate: '2026-12-12',
      adults: 2,
      children: 1,
      rooms: 2,
    }, config);
    const query = body.PropertiesQuerySearch as Record<string, unknown>;
    expect(query['@type']).toBe('PropertiesQuerySearch');
    expect(query.RequestedCurrency).toBe('GBP');
    expect(query.returnOnlyAvailablePropertiesInd).toBe(true);
    expect(query.ImageSize).toBe('Medium');
    expect(query.recommendedPropertyAmenitiesInd).toBe(true);
    expect(query.RoomStayCandidate).toHaveLength(2);
    expect(query.SearchBy).toMatchObject({ '@type': 'SearchByCity', SearchCity: 'DAR' });
  });
});

describe('normalizeStaySearch', () => {
  it('maps PropertyInfo and LowestAvailableRate from the v11 schema', () => {
    const offers = normalizeStaySearch({
      PropertiesSearchResponse: {
        PropertyInfo: [{
          Property: {
            name: 'Harbour View',
            PropertyKey: { chainCode: 'HH', propertyCode: '95075' },
            Address: { City: 'Dar es Salaam' },
          },
          LowestAvailableRate: { value: 184.5, code: 'GBP' },
        }],
      },
    }, meta);

    expect(offers[0]).toMatchObject({
      propertyName: 'Harbour View',
      locationLabel: 'Dar es Salaam',
      providerPropertyReference: 'HH:95075',
      totalAmount: 184.5,
      currency: 'GBP',
    });
  });

  it('maps PropertiesResponse.Properties.PropertyInfo from the live v11 envelope', () => {
    const offers = normalizeStaySearch({
      PropertiesResponse: {
        transactionId: '49f58f5f-c443-43b4-9f5d-be405fd00a01',
        Properties: {
          '@type': 'Properties',
          Identifier: { value: 'e46099ee-4dff-4207-a099-ee4dff52073e' },
          totalProperties: 1,
          PropertyInfo: [{
            '@type': 'PropertyInfo',
            id: 'FP-F4564',
            availability: 'Open',
            Distance: { value: 4, unitOfDistance: 'Miles' },
            Property: {
              '@type': 'PropertyDetail',
              id: 'FP-F4564',
              name: 'Harbour View',
              PropertyKey: { chainCode: 'HH', propertyCode: '95075' },
              Address: { City: 'DAR ES SALAAM', Country: 'TANZANIA' },
              Rating: [{ value: 4, provider: 'AA' }],
              Image: [
                { value: 'https://images.example.com/lobby.jpg', pictureOf: 'Lobby' },
                { value: 'https://images.example.com/front.jpg', pictureOf: 'Exterior' },
                { value: 'http://insecure.example.com/skip.jpg', pictureOf: 'Exterior' },
              ],
              Description: ['Harbour-facing rooms in the city centre.'],
              PropertyAmenity: [{ description: 'WiFi' }, { Name: 'Pool' }],
            },
            LowestAvailableRate: { value: 184.5, code: 'GBP' },
          }],
        },
      },
    }, meta);

    expect(offers[0]).toMatchObject({
      propertyName: 'Harbour View',
      locationLabel: 'Dar Es Salaam',
      addressLine: 'Dar Es Salaam, Tanzania',
      providerPropertyReference: 'HH:95075',
      totalAmount: 184.5,
      currency: 'GBP',
      starRating: 4,
      distanceLabel: '4 mi',
      description: 'Harbour-facing rooms in the city centre.',
      amenities: ['WiFi', 'Pool'],
      photoUrls: ['https://images.example.com/front.jpg', 'https://images.example.com/lobby.jpg'],
      reviews: undefined,
    });
  });

  it('maps guest reviews only when the GDS returned review text', () => {
    const offers = normalizeStaySearch({
      PropertiesResponse: {
        Properties: {
          PropertyInfo: [{
            Property: {
              name: 'Harbour View',
              PropertyKey: { chainCode: 'HH', propertyCode: '95075' },
              Address: { City: 'Dar es Salaam' },
              Rating: [{ value: 4, provider: 'AA' }],
              Review: [{
                text: 'Quiet rooms near the harbour.',
                author: 'Amina',
                score: 8.4,
                date: '2026-08-12',
              }],
            },
          }],
        },
      },
    }, meta);
    expect(offers[0]?.reviews).toEqual([{
      text: 'Quiet rooms near the harbour.',
      author: 'Amina',
      score: 8.4,
      date: '2026-08-12',
    }]);
  });

  it('maps property keys without inventing a rate', () => {
    const offers = normalizeStaySearch({
      PropertiesSearchResponse: {
        Property: [{
          Name: 'Harbour View',
          PropertyKey: { chainCode: 'HH', propertyCode: '95075' },
          Address: { City: 'Dar es Salaam' },
        }],
      },
    }, meta);

    expect(offers[0]).toMatchObject({
      propertyName: 'Harbour View',
      locationLabel: 'Dar es Salaam',
      providerPropertyReference: 'HH:95075',
    });
    expect(offers[0]?.totalAmount).toBeUndefined();
  });
});

describe('normalizeStayAvailability', () => {
  it('maps CatalogOfferingHospitality room name, stay total and cancellation text', () => {
    const rooms = normalizeStayAvailability({
      CatalogOfferingsHospitalityResponse: {
        CatalogOfferings: {
          CatalogOffering: [{
            id: 'offering-1',
            Price: { TotalPrice: 317.65, CurrencyCode: { value: 'USD' } },
            TermsAndConditions: {
              CancelPenalty: [{
                Description: 'If you cancel you will be charged 100% of the total stay.',
                Refundable: 'No',
              }],
            },
            ProductOptions: [{
              Product: [{
                '@type': 'ProductHospitality',
                bookingCode: 'E00SM3E',
                RoomType: {
                  Description: { value: 'Deluxe Guest Room, 2 Twin, City View' },
                  RoomCharacteristics: { viewDescription: 'City Views' },
                },
              }],
            }],
          }],
        },
      },
    });

    expect(rooms[0]).toMatchObject({
      providerOfferingId: 'offering-1',
      name: 'Deluxe Guest Room, 2 Twin, City View',
      description: 'City Views',
      cancellation: 'If you cancel you will be charged 100% of the total stay.',
      refundable: false,
      totalAmount: 317.65,
      currency: 'USD',
    });
  });
});

describe('buildStayAvailabilityRequest', () => {
  it('asks for verbose ProductHospitality on the requested property', () => {
    const body = buildStayAvailabilityRequest({
      chainCode: 'FP',
      propertyCode: 'F4564',
      checkInDate: '2026-12-08',
      checkOutDate: '2026-12-10',
      adults: 2,
      children: 0,
      rooms: 1,
      currency: 'USD',
    }, config);
    const request = (body.CatalogOfferingsQueryRequest as { CatalogOfferingsRequest: Record<string, unknown>[] })
      .CatalogOfferingsRequest[0];
    expect(request['@type']).toBe('CatalogOfferingsRequestHospitality');
    expect(request.verboseResponseInd).toBe(true);
    expect(request.requestedCurrency).toBe('USD');
  });
});
