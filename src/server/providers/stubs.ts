import { unsupported, type FlightSupplierAdapter, type StaySupplierAdapter } from '@/server/providers/types';

/**
 * Sabre and Amadeus sit behind the same contracts as Travelport so a later entitlement
 * is a new adapter file, not a rewrite of search or checkout. Until a PROVEN registry
 * row exists they never leave this process.
 */

export const sabreFlightAdapter: FlightSupplierAdapter = {
  providerId: 'sabre',
  productId: 'mosaic-air',
  async search(_request, meta) {
    return unsupported(meta, 'air.search');
  },
};

export const sabreStayAdapter: StaySupplierAdapter = {
  providerId: 'sabre',
  productId: 'hotel',
  async search(_request, meta) {
    return unsupported(meta, 'stay.search');
  },
};

export const amadeusFlightAdapter: FlightSupplierAdapter = {
  providerId: 'amadeus',
  productId: 'enterprise-air',
  async search(_request, meta) {
    return unsupported(meta, 'air.search');
  },
};

export const amadeusStayAdapter: StaySupplierAdapter = {
  providerId: 'amadeus',
  productId: 'enterprise-hotel',
  async search(_request, meta) {
    return unsupported(meta, 'stay.search');
  },
};
