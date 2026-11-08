/**
 * Provider-neutral envelopes for GDS adapters.
 *
 * Travelport, Sabre and Amadeus implement these contracts. Public pages never import a
 * vendor module: they read Travelar offers. A capability that is not PROVEN and enabled
 * is refused before a network call.
 */

export type OperationOutcome =
  | 'success'
  | 'pending'
  | 'rejected'
  | 'retryable_failure'
  | 'unsupported'
  | 'unknown_requires_reconciliation';

export type CapabilityStatus = 'PROVEN' | 'READ_ONLY' | 'BLOCKED' | 'DISABLED';

export interface ProviderOperationMeta {
  providerId: string;
  productId: string;
  correlationId: string;
  providerRequestId?: string;
}

export interface AdapterResult<T> {
  outcome: OperationOutcome;
  data?: T;
  meta: ProviderOperationMeta;
  errorCode?: string;
  safeMessage?: string;
}

export interface CanonicalAirSegment {
  marketingCarrier: string;
  marketingCarrierName?: string;
  operatingCarrier?: string;
  operatingCarrierName?: string;
  flightNumber: string;
  originCode: string;
  originName?: string;
  originCountry?: string;
  originTerminal?: string;
  destinationCode: string;
  destinationName?: string;
  destinationCountry?: string;
  destinationTerminal?: string;
  departureAt: string;
  arrivalAt: string;
  duration?: string;
  equipment?: string;
  equipmentName?: string;
}

export interface CanonicalAirOffer {
  travelarOfferId: string;
  sourceProviderId: string;
  sourceProductId: string;
  providerOfferReference: string;
  contentSource: string;
  currency: string;
  totalAmount: number;
  baseAmount?: number;
  taxAmount?: number;
  cabinClass?: string;
  fareBrand?: string;
  baggageSummary?: string;
  refundSummary?: string;
  changeSummary?: string;
  itinerary: CanonicalAirSegment[];
}

export interface AirSearchRequest {
  originCode: string;
  destinationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabinPreference?: string;
  pointOfSaleCountry?: string;
  currency?: string;
  contentSources?: string[];
}

export interface CanonicalStayOffer {
  travelarOfferId: string;
  sourceProviderId: string;
  sourceProductId: string;
  providerPropertyReference: string;
  providerRateReference?: string;
  propertyName: string;
  locationLabel: string;
  addressLine?: string;
  photoUrls?: string[];
  starRating?: number;
  amenities?: string[];
  distanceLabel?: string;
  description?: string;
  reviews?: Array<{ text: string; author?: string; score?: number; date?: string }>;
  currency?: string;
  totalAmount?: number;
}

export interface CanonicalStayRoom {
  providerOfferingId: string;
  name: string;
  description?: string;
  board?: string;
  cancellation?: string;
  refundable?: boolean;
  occupancy?: number;
  currency?: string;
  totalAmount?: number;
}

export interface StaySearchRequest {
  cityName: string;
  countryCode: string;
  cityCode?: string;
  airportCode?: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  rooms: number;
  pointOfSaleCountry?: string;
  currency?: string;
}

export interface FlightSupplierAdapter {
  readonly providerId: string;
  readonly productId: string;
  search(request: AirSearchRequest, meta: ProviderOperationMeta): Promise<AdapterResult<CanonicalAirOffer[]>>;
}

export interface StaySupplierAdapter {
  readonly providerId: string;
  readonly productId: string;
  search(request: StaySearchRequest, meta: ProviderOperationMeta): Promise<AdapterResult<CanonicalStayOffer[]>>;
}

export function unsupported<T>(meta: ProviderOperationMeta, operation: string): AdapterResult<T> {
  return {
    outcome: 'unsupported',
    meta,
    errorCode: 'capability_unavailable',
    safeMessage: `${operation} is not available on this provider.`,
  };
}
