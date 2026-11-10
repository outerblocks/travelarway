import { randomUUID } from 'node:crypto';
import { withTransaction } from '@/server/db';
import { CapabilityRefusedError, assertRunnable } from '@/server/providers/registry';
import type {
  AdapterResult,
  CanonicalStayOffer,
  CanonicalStayRoom,
  ProviderOperationMeta,
  StaySearchRequest,
  StaySupplierAdapter,
} from '@/server/providers/types';
import { travelportConfig, travelportGet, travelportJson } from '@/server/providers/travelport/client';
import { asArray, asRecord } from '@/server/providers/travelport/errors';
import { countryName } from '@/server/reference/iata-display';
import {
  displayLodgingText,
  imageSizeRank,
  lodgingDisplayUrl,
  looksLikeHumanRoomName,
  pictureRank,
  type LodgingPicture,
} from '@/domain/lodging-images';
import type { TravelportConfig } from '@/server/travelport/config';

const PRODUCT = 'stays-v11';
const MAX_ROOMS = 10;
const MAX_DISPLAY_ROOMS = 20;

export const travelportStayAdapter: StaySupplierAdapter = {
  providerId: 'travelport',
  productId: PRODUCT,

  async search(request, meta): Promise<AdapterResult<CanonicalStayOffer[]>> {
    const config = travelportConfig();
    if (!config) {
      return { outcome: 'unsupported', meta, errorCode: 'travelport_disabled', safeMessage: 'Stays are not available.' };
    }

    try {
      await assertRunnable({
        provider: 'travelport',
        product: PRODUCT,
        operation: 'search',
        environment: config.environment,
      });
    } catch (error) {
      if (error instanceof CapabilityRefusedError) {
        return { outcome: 'unsupported', meta, errorCode: 'capability_unavailable', safeMessage: 'Stays are not available.' };
      }
      throw error;
    }

    const payload = buildStaySearchRequest(request, config);
    const result = await travelportJson('hotel', 'search/properties/search', payload);
    if (result.errors.length) {
      return {
        outcome: result.errors.some((item) => item.category === 'TERMINAL') ? 'rejected' : 'retryable_failure',
        meta: { ...meta, providerRequestId: transactionIdOf(result.body) },
        errorCode: result.errors[0]?.sourceCode ?? 'travelport_search_failed',
        safeMessage: 'No stays are available for this search.',
      };
    }
    if (result.httpStatus < 200 || result.httpStatus >= 300) {
      return {
        outcome: 'retryable_failure',
        meta,
        errorCode: `http_${result.httpStatus}`,
        safeMessage: 'No stays are available for this search.',
      };
    }

    const tagged: StaySearchRequest = {
      ...request,
      currency: request.currency ?? config.currency,
      pointOfSaleCountry: request.pointOfSaleCountry ?? config.pointOfSale,
    };
    const offers = normalizeStaySearch(result.body, meta);
    const providerRequestId = transactionIdOf(result.body);
    const persisted = await persistStaySearch(tagged, result.body, offers, providerRequestId);
    return {
      outcome: 'success',
      data: persisted,
      meta: { ...meta, providerRequestId },
    };
  },
};

export function buildStaySearchRequest(request: StaySearchRequest, config: TravelportConfig) {
  const rooms = Math.min(MAX_ROOMS, Math.max(1, request.rooms || 1));
  const currency = request.currency ?? config.currency;
  const candidate = {
    '@type': 'RoomStayCandidate',
    GuestCounts: {
      '@type': 'GuestCounts',
      GuestCount: guestCounts(request),
    },
  };
  return {
    PropertiesQuerySearch: {
      '@type': 'PropertiesQuerySearch',
      CheckInDate: request.checkInDate,
      CheckOutDate: request.checkOutDate,
      RoomStayCandidate: Array.from({ length: rooms }, () => candidate),
      SearchBy: searchBy(request),
      returnOnlyAvailablePropertiesInd: true,
      ImageSize: 'Large',
      returnAllImagesInd: true,
      recommendedPropertyAmenitiesInd: true,
      ...(currency ? { RequestedCurrency: currency } : {}),
    },
  };
}

function guestCounts(request: StaySearchRequest) {
  const rows: Record<string, unknown>[] = [];
  if (request.adults > 0) {
    rows.push({ '@type': 'GuestCount', count: request.adults, ageQualifyingCode: '10' });
  }
  if (request.children > 0) {
    rows.push({ '@type': 'GuestCount', count: request.children, ageQualifyingCode: '8' });
  }
  return rows.length ? rows : [{ '@type': 'GuestCount', count: 1, ageQualifyingCode: '10' }];
}

function searchBy(request: StaySearchRequest) {
  if (request.airportCode) {
    return {
      '@type': 'SearchByAirport',
      SearchRadius: { value: 25, unitOfDistance: 'Miles' },
      SearchAirport: request.airportCode,
    };
  }
  if (request.cityCode) {
    return {
      '@type': 'SearchByCity',
      SearchRadius: { value: 25, unitOfDistance: 'Miles' },
      SearchCity: request.cityCode,
    };
  }
  return {
    '@type': 'SearchByAddress',
    SearchRadius: { value: 20, unitOfDistance: 'Miles' },
    SearchAddress: {
      '@type': 'SearchAddress',
      City: request.cityName,
      Country: request.countryCode,
    },
  };
}

function stayResponseEnvelope(body: unknown): Record<string, unknown> {
  const root = asRecord(body) ?? {};
  return asRecord(root.PropertiesResponse)
    ?? asRecord(root.PropertiesSearchResponse)
    ?? asRecord(root.ErrorResponse)
    ?? root;
}

export function normalizeStaySearch(body: unknown, meta: ProviderOperationMeta): CanonicalStayOffer[] {
  const response = stayResponseEnvelope(body);
  const infoList = asArray(
    response.PropertyInfo
    ?? asRecord(response.Properties)?.PropertyInfo
    ?? response.Property
    ?? asRecord(response.PropertyList)?.Property,
  );

  return infoList.flatMap((raw, index) => {
    const info = asRecord(raw);
    if (!info) return [];
    const property = asRecord(info.Property) ?? info;
    const key = asRecord(property.PropertyKey) ?? asRecord(info.PropertyKey) ?? property;
    const chain = String(key.chainCode ?? key.ChainCode ?? '');
    const code = String(
      key.propertyCode ?? key.PropertyCode ?? property.id ?? info.id ?? `property_${index}`,
    );
    const name = displayLodgingText(String(property.name ?? property.Name ?? property.HotelName ?? ''));
    if (!name) return [];
    const address = asRecord(property.Address) ?? asRecord(property.HotelAddress);
    const city = displayPlace(textOf(address?.City ?? address?.city));
    const rate = asRecord(info.LowestAvailableRate)
      ?? asRecord(property.LowestAvailableRate)
      ?? asRecord(property.LowestRate)
      ?? asRecord(info.LowestRate);
    const amount = rate ? Number(rate.value ?? rate.Amount ?? rate.TotalPrice) : undefined;
    const currency = rate
      ? String(rate.code ?? asRecord(rate.CurrencyCode)?.value ?? rate.currency ?? '')
      : '';
    const photoUrls = imageUrlsOf(property, MAX_SEARCH_PHOTOS, info);
    const amenities = amenitiesOf(property, MAX_SEARCH_AMENITIES);
    const description = descriptionOf(property);
    const starRating = starRatingOf(property);
    const addressLine = addressLineOf(address);
    const distanceLabel = distanceLabelOf(asRecord(info.Distance));
    const reviews = guestReviewsOf(property);
    return [{
      travelarOfferId: '',
      sourceProviderId: meta.providerId,
      sourceProductId: meta.productId,
      providerPropertyReference: [chain, code].filter(Boolean).join(':') || code,
      providerRateReference: rate ? String(rate.id ?? rate.RatePlanCode ?? '') || undefined : undefined,
      propertyName: name,
      locationLabel: city,
      addressLine: addressLine || undefined,
      photoUrls: photoUrls.length ? photoUrls : undefined,
      starRating,
      amenities: amenities.length ? amenities : undefined,
      distanceLabel,
      description,
      reviews: reviews.length ? reviews : undefined,
      currency: currency || undefined,
      totalAmount: Number.isFinite(amount) ? amount : undefined,
    }];
  });
}

const MAX_SEARCH_PHOTOS = 24;
const MAX_SEARCH_AMENITIES = 12;
const MAX_DETAIL_PHOTOS = 80;
const MAX_DETAIL_AMENITIES = 80;
const MAX_DESCRIPTION = 4000;
const MAX_REVIEWS = 20;

function textOf(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  const record = asRecord(value);
  if (record && typeof record.value === 'string') return record.value.trim();
  return '';
}

function displayPlace(value: string): string {
  return displayLodgingText(value);
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(lodgingDisplayUrl(value.trim()));
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function lodgingPicturesOf(...nodes: Array<Record<string, unknown> | null | undefined>): LodgingPicture[] {
  const images = nodes.filter((node): node is Record<string, unknown> => Boolean(node)).flatMap((node) => [
    ...asArray(node.Image),
    ...asArray(node.Images),
    ...asArray(asRecord(node.Multimedia)?.Image),
    ...asArray(asRecord(node.Media)?.Image),
  ]);
  const ranked = images.flatMap((raw) => {
    const image = asRecord(raw);
    const href = httpsUrl(image?.value ?? image?.url ?? image?.href);
    if (!href) return [];
    const pictureOf = String(image?.pictureOf ?? '');
    const rank = pictureRank(pictureOf);
    if (rank == null) return [];
    const width = Number(image?.width);
    return [{
      picture: {
        url: lodgingDisplayUrl(href),
        pictureOf: String(image?.pictureOf ?? ''),
        caption: textOf(image?.caption ?? image?.title ?? image?.name),
      },
      rank,
      size: imageSizeRank(
        typeof image?.imageSize === 'string' ? image.imageSize : undefined,
        Number.isFinite(width) ? width : undefined,
      ),
    }];
  });
  ranked.sort((left, right) => left.rank - right.rank || right.size - left.size);
  const unique: LodgingPicture[] = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    if (seen.has(row.picture.url)) continue;
    seen.add(row.picture.url);
    unique.push(row.picture);
  }
  return unique;
}

function imageUrlsOf(
  property: Record<string, unknown>,
  limit: number,
  extra?: Record<string, unknown> | null,
): string[] {
  return lodgingPicturesOf(property, extra).map((picture) => picture.url).slice(0, limit);
}

function starRatingOf(property: Record<string, unknown>): number | undefined {
  for (const raw of asArray(property.Rating)) {
    const rating = asRecord(raw);
    const value = Number(rating?.value ?? raw);
    if (Number.isFinite(value) && value >= 1 && value <= 5) return Math.round(value * 10) / 10;
  }
  return undefined;
}

function amenitiesOf(property: Record<string, unknown>, limit: number): string[] {
  const names: string[] = [];
  for (const raw of asArray(property.PropertyAmenity)) {
    const amenity = asRecord(raw);
    const name = textOf(amenity?.description ?? amenity?.Name ?? amenity?.name);
    if (name && !names.includes(name)) names.push(name);
    if (names.length >= limit) break;
  }
  return names;
}

function guestReviewsOf(property: Record<string, unknown>): Array<{
  text: string;
  author?: string;
  score?: number;
  date?: string;
}> {
  const nested = asRecord(property.Reviews);
  const rows = [
    ...asArray(property.Review),
    ...asArray(property.GuestReview),
    ...asArray(property.UserReview),
    ...asArray(property.CustomerReview),
    ...asArray(nested?.Review ?? nested?.GuestReview),
  ];
  const reviews: Array<{ text: string; author?: string; score?: number; date?: string }> = [];
  for (const raw of rows) {
    const item = asRecord(raw) ?? (typeof raw === 'string' ? { text: raw } : null);
    if (!item) continue;
    const text = textOf(item.text ?? item.comment ?? item.Comment ?? item.description ?? item.body);
    if (!text) continue;
    const author = textOf(item.author ?? item.reviewer ?? item.name ?? item.reviewerName);
    const scoreRaw = Number(item.score ?? item.rating ?? item.value);
    const score = Number.isFinite(scoreRaw) && scoreRaw >= 0 && scoreRaw <= 10 ? scoreRaw : undefined;
    const date = textOf(item.date ?? item.reviewDate ?? item.publishedAt);
    reviews.push({
      text: text.length > 2000 ? `${text.slice(0, 2000).trim()}…` : text,
      author: author || undefined,
      score,
      date: date || undefined,
    });
    if (reviews.length >= MAX_REVIEWS) break;
  }
  return reviews;
}

function descriptionOf(property: Record<string, unknown>): string | undefined {
  const first = asArray(property.Description).map(textOf).find(Boolean);
  if (!first) return undefined;
  return first.length > MAX_DESCRIPTION ? `${first.slice(0, MAX_DESCRIPTION).trim()}…` : first;
}

function addressLineOf(address: Record<string, unknown> | null): string {
  if (!address) return '';
  const city = displayPlace(textOf(address.City ?? address.city));
  const countryRaw = textOf(address.Country ?? address.country);
  const country = countryName(countryRaw) ?? displayPlace(countryRaw);
  const stateRaw = textOf(address.StateProv ?? address.state);
  const state = /^[A-Z]{2}$/.test(stateRaw) && (countryName(stateRaw) || stateRaw === countryRaw)
    ? ''
    : displayPlace(stateRaw);
  return [
    textOf(address.Street ?? address.AddressLine ?? address.street),
    city,
    state,
    textOf(address.PostalCode ?? address.postalCode),
    country,
  ].filter((part, index, parts) => Boolean(part) && parts.indexOf(part) === index).join(', ');
}

function distanceLabelOf(distance: Record<string, unknown> | null): string | undefined {
  if (!distance) return undefined;
  const value = Number(distance.value);
  if (!Number.isFinite(value) || value < 0) return undefined;
  const unit = String(distance.unitOfDistance ?? '');
  if (unit === 'Kilometers') return `${value} km`;
  if (unit === 'Miles') return `${value} mi`;
  return String(value);
}

function transactionIdOf(body: unknown): string | undefined {
  const response = stayResponseEnvelope(body);
  const identifier = asRecord(response.Identifier) ?? asRecord(asRecord(response.Properties)?.Identifier);
  const id = response.transactionId ?? response.TransactionId ?? identifier?.value;
  return id != null ? String(id) : undefined;
}

async function persistStaySearch(
  request: StaySearchRequest,
  raw: unknown,
  offers: CanonicalStayOffer[],
  transactionId?: string,
): Promise<CanonicalStayOffer[]> {
  return withTransaction(async (client) => {
    const sessionId = randomUUID();
    await client.query(
      `insert into app.stay_search_sessions
         (id, provider, product, point_of_sale, currency, transaction_id, request_summary, raw_response)
       values ($1, 'travelport', $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
      [
        sessionId,
        PRODUCT,
        request.pointOfSaleCountry ?? null,
        request.currency ?? null,
        transactionId ?? null,
        JSON.stringify({
          city: request.cityName,
          cityCode: request.cityCode,
          country: request.countryCode,
          airport: request.airportCode,
          checkIn: request.checkInDate,
          checkOut: request.checkOutDate,
          rooms: request.rooms,
          adults: request.adults,
          children: request.children,
        }),
        JSON.stringify(raw ?? {}),
      ],
    );

    const stamped: CanonicalStayOffer[] = [];
    for (const offer of offers) {
      const id = randomUUID();
      await client.query(
        `insert into app.stay_offers
           (id, session_id, provider_property_ref, provider_rate_ref, property_name,
            location_label, currency_provider, price_provider, product_refs)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
        [
          id,
          sessionId,
          offer.providerPropertyReference,
          offer.providerRateReference ?? null,
          offer.propertyName,
          offer.locationLabel,
          offer.currency ?? null,
          offer.totalAmount ?? null,
          JSON.stringify({
            photoUrls: offer.photoUrls ?? [],
            starRating: offer.starRating ?? null,
            addressLine: offer.addressLine ?? null,
            amenities: offer.amenities ?? [],
            distanceLabel: offer.distanceLabel ?? null,
            description: offer.description ?? null,
            reviews: offer.reviews ?? [],
          }),
        ],
      );
      stamped.push({ ...offer, travelarOfferId: id });
    }
    return stamped;
  });
}

export interface StayPropertyCodes {
  chainCode: string;
  propertyCode: string;
}

export function splitPropertyReference(reference: string): StayPropertyCodes | null {
  const [chainCode, propertyCode] = reference.split(':');
  if (!chainCode || !propertyCode) return null;
  return { chainCode, propertyCode };
}

export async function travelportStayDetails(
  codes: StayPropertyCodes,
  meta: ProviderOperationMeta,
): Promise<AdapterResult<{
  photoUrls: string[];
  propertyPictures: LodgingPicture[];
  amenities: string[];
  description?: string;
  reviews: Array<{ text: string; author?: string; score?: number; date?: string }>;
}>> {
  const config = travelportConfig();
  if (!config) {
    return { outcome: 'unsupported', meta, errorCode: 'travelport_disabled', safeMessage: 'Stay details are not available.' };
  }
  try {
    await assertRunnable({
      provider: 'travelport',
      product: PRODUCT,
      operation: 'property_detail',
      environment: config.environment,
    });
  } catch (error) {
    if (error instanceof CapabilityRefusedError) {
      return { outcome: 'unsupported', meta, errorCode: 'capability_unavailable', safeMessage: 'Stay details are not available.' };
    }
    throw error;
  }

  const path = `search/propertiesdetail?chainCode=${encodeURIComponent(codes.chainCode)}&propertyCode=${encodeURIComponent(codes.propertyCode)}&ImageSize=ExtraLarge`;
  const result = await travelportGet('hotel', path);
  if (result.errors.length || result.httpStatus < 200 || result.httpStatus >= 300) {
    return {
      outcome: 'retryable_failure',
      meta,
      errorCode: result.errors[0]?.sourceCode ?? `http_${result.httpStatus}`,
      safeMessage: 'Stay details are not available.',
    };
  }
  const offers = normalizeStaySearch(result.body, meta);
  const property = offers[0];
  const envelope = stayResponseEnvelope(result.body);
  const info = asRecord(asArray(
    envelope.PropertyInfo
    ?? asRecord(envelope.Properties)?.PropertyInfo
    ?? envelope.Property,
  )[0]);
  const rawProperty = asRecord(info?.Property) ?? info ?? {};
  const propertyPictures = lodgingPicturesOf(rawProperty, info);
  return {
    outcome: 'success',
    meta,
    data: {
      photoUrls: propertyPictures.map((picture) => picture.url).slice(0, MAX_DETAIL_PHOTOS),
      propertyPictures,
      amenities: amenitiesOf(rawProperty, MAX_DETAIL_AMENITIES),
      description: property?.description ?? descriptionOf(rawProperty),
      reviews: guestReviewsOf(rawProperty),
    },
  };
}

export interface StayAvailabilityRequest {
  chainCode: string;
  propertyCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  rooms: number;
  currency?: string;
}

export function buildStayAvailabilityRequest(request: StayAvailabilityRequest, config: { currency?: string }) {
  const rooms = Math.min(MAX_ROOMS, Math.max(1, request.rooms || 1));
  const currency = request.currency ?? config.currency;
  return {
    CatalogOfferingsQueryRequest: {
      CatalogOfferingsRequest: [{
        '@type': 'CatalogOfferingsRequestHospitality',
        verboseResponseInd: true,
        ...(currency ? { requestedCurrency: currency } : {}),
        StayDates: { start: request.checkInDate, end: request.checkOutDate },
        HotelSearchCriterion: {
          '@type': 'HotelSearchCriterion',
          numberOfRooms: rooms,
          PropertyRequest: [{
            '@type': 'PropertyRequest',
            PropertyKey: {
              '@type': 'PropertyKey',
              chainCode: request.chainCode,
              propertyCode: request.propertyCode,
            },
          }],
          RoomStayCandidates: {
            '@type': 'RoomStayCandidates',
            RoomStayCandidate: [{
              '@type': 'RoomStayCandidate',
              GuestCounts: {
                '@type': 'GuestCounts',
                GuestCount: guestCounts({
                  cityName: '',
                  countryCode: '',
                  checkInDate: request.checkInDate,
                  checkOutDate: request.checkOutDate,
                  adults: request.adults,
                  children: request.children,
                  rooms,
                }),
              },
            }],
          },
        },
      }],
    },
  };
}

export async function travelportStayAvailability(
  request: StayAvailabilityRequest,
  meta: ProviderOperationMeta,
): Promise<AdapterResult<CanonicalStayRoom[]>> {
  const config = travelportConfig();
  if (!config) {
    return { outcome: 'unsupported', meta, errorCode: 'travelport_disabled', safeMessage: 'Stay rates are not available.' };
  }
  try {
    await assertRunnable({
      provider: 'travelport',
      product: PRODUCT,
      operation: 'availability',
      environment: config.environment,
    });
  } catch (error) {
    if (error instanceof CapabilityRefusedError) {
      return { outcome: 'unsupported', meta, errorCode: 'capability_unavailable', safeMessage: 'Stay rates are not available.' };
    }
    throw error;
  }

  const payload = buildStayAvailabilityRequest(request, config);
  const result = await travelportJson('hotel', 'availability/catalogofferingshospitality', payload);
  if (result.errors.length || result.httpStatus < 200 || result.httpStatus >= 300) {
    return {
      outcome: 'retryable_failure',
      meta,
      errorCode: result.errors[0]?.sourceCode ?? `http_${result.httpStatus}`,
      safeMessage: 'Stay rates are not available.',
    };
  }
  return {
    outcome: 'success',
    meta: { ...meta, providerRequestId: hospitalityTransactionId(result.body) },
    data: normalizeStayAvailability(result.body),
  };
}

export function normalizeStayAvailability(body: unknown): CanonicalStayRoom[] {
  const root = asRecord(body) ?? {};
  const envelope = asRecord(root.CatalogOfferingsHospitalityResponse)
    ?? asRecord(root.CatalogOfferingsResponse)
    ?? root;
  const offerings = asArray(
    asRecord(envelope.CatalogOfferings)?.CatalogOffering ?? envelope.CatalogOffering,
  );
  const rooms: CanonicalStayRoom[] = [];
  const seen = new Set<string>();

  for (const raw of offerings) {
    const offering = asRecord(raw);
    if (!offering) continue;
    const id = String(offering.id ?? asRecord(offering.Identifier)?.value ?? '');
    const product = firstProduct(offering);
    const roomType = asRecord(product?.RoomType);
    const characteristics = asRecord(roomType?.RoomCharacteristics);
    const name = lodgingRoomName(
      textOf(roomType?.Description),
      textOf(characteristics?.shortRoomDescription),
      textOf(roomType?.Name ?? roomType?.name),
      textOf(product?.bookingCode),
    );
    if (!id || !name) continue;
    const photos = lodgingPicturesOf(offering, product, roomType, characteristics).map((picture) => picture.url).slice(0, 8);
    const price = asRecord(offering.Price);
    const amount = Number(price?.TotalPrice ?? price?.value);
    const currency = textOf(asRecord(price?.CurrencyCode)?.value ?? price?.currencyCode ?? price?.code);
    const terms = asRecord(offering.TermsAndConditions);
    const penalty = asRecord(asArray(terms?.CancelPenalty)[0]);
    const meals = asRecord(terms?.MealsIncluded);
    const board = textOf(meals?.description ?? meals?.mealPlan);
    const occupancy = Number(product?.guests);
    const key = `${name}|${Number.isFinite(amount) ? amount : ''}|${currency}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rooms.push({
      providerOfferingId: id,
      name,
      photoUrls: photos.length ? photos : undefined,
      description: textOf(characteristics?.viewDescription) || undefined,
      board: board || undefined,
      cancellation: textOf(penalty?.Description) || undefined,
      refundable: penalty?.Refundable === 'Yes' ? true : penalty?.Refundable === 'No' ? false : undefined,
      occupancy: Number.isFinite(occupancy) && occupancy > 0 ? occupancy : undefined,
      currency: currency || undefined,
      totalAmount: Number.isFinite(amount) ? amount : undefined,
    });
    if (rooms.length >= MAX_DISPLAY_ROOMS) break;
  }

  return rooms.sort((left, right) => {
    if (left.totalAmount == null && right.totalAmount == null) return left.name.localeCompare(right.name);
    if (left.totalAmount == null) return 1;
    if (right.totalAmount == null) return -1;
    return left.totalAmount - right.totalAmount;
  });
}

function lodgingRoomName(...candidates: string[]): string {
  for (const candidate of candidates) {
    const text = displayLodgingText(candidate);
    if (looksLikeHumanRoomName(text)) return text;
  }
  return 'Guest room';
}

function firstProduct(offering: Record<string, unknown>): Record<string, unknown> | null {
  const options = asArray(offering.ProductOptions);
  for (const option of options) {
    const products = asArray(asRecord(option)?.Product ?? option);
    for (const product of products) {
      const record = asRecord(product);
      if (record) return record;
    }
  }
  return asRecord(offering.Product);
}

function hospitalityTransactionId(body: unknown): string | undefined {
  const root = asRecord(body) ?? {};
  const envelope = asRecord(root.CatalogOfferingsHospitalityResponse) ?? root;
  const identifier = asRecord(envelope.Identifier) ?? asRecord(asRecord(envelope.CatalogOfferings)?.Identifier);
  const id = envelope.transactionId ?? identifier?.value;
  return id != null ? String(id) : undefined;
}
