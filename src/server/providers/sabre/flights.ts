import { CapabilityRefusedError, assertRunnable } from '@/server/providers/registry';
import { sabreConfig } from '@/server/providers/sabre/config';
import type {
  AdapterResult,
  AirSearchRequest,
  CanonicalAirOffer,
  FlightSupplierAdapter,
  ProviderOperationMeta,
} from '@/server/providers/types';
import { unsupported } from '@/server/providers/types';

/**
 * Sabre Mosaic air. Current documented shop flow is Flight Shop → Flight Check →
 * createBooking → fulfillFlightTickets (ADR-GDS-004). This adapter does not mix
 * that flow with legacy SOAP/REST or NDC Order Management schemas.
 *
 * Search does not invent offers. It refuses until the capability is PROVEN and
 * SABRE_LIVE_SHOP is on. Booking and ticketing are separate operations.
 */
export const sabreFlightAdapter: FlightSupplierAdapter = {
  providerId: 'sabre',
  productId: 'mosaic-air',

  async search(request, meta): Promise<AdapterResult<CanonicalAirOffer[]>> {
    const config = sabreConfig();
    if (!config) return unsupported(meta, 'air.search');

    try {
      await assertRunnable({
        provider: 'sabre',
        product: 'mosaic-air',
        operation: 'search',
        environment: config.environment === 'PRODUCTION' ? 'PRODUCTION' : 'PREPROD',
      });
    } catch (error) {
      if (error instanceof CapabilityRefusedError) {
        return unsupported(meta, 'air.search');
      }
      throw error;
    }

    if (!config.liveShop) {
      return {
        outcome: 'unsupported',
        meta,
        errorCode: 'sabre_shop_unproven',
        safeMessage: 'Flights are not available.',
      };
    }

    void request;
    return unsupported(meta, 'air.search');
  },
};

/** Canonical shop fields only. Exact Mosaic JSON is recorded when CERT shop is proven. */
export function mosaicShopIntent(request: AirSearchRequest) {
  return {
    origin: request.originCode,
    destination: request.destinationCode,
    departureDate: request.departureDate,
    returnDate: request.returnDate ?? null,
    adults: request.adults,
    children: request.children,
    infants: request.infants,
    cabinPreference: request.cabinPreference ?? null,
  };
}
