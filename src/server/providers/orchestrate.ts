import { randomUUID } from 'node:crypto';
import { amadeusFlightAdapter, amadeusStayAdapter, sabreFlightAdapter, sabreStayAdapter } from '@/server/providers/stubs';
import { travelportFlightAdapter } from '@/server/providers/travelport/flights';
import { travelportStayAdapter } from '@/server/providers/travelport/stays';
import type {
  AirSearchRequest,
  CanonicalAirOffer,
  CanonicalStayOffer,
  StaySearchRequest,
} from '@/server/providers/types';

/**
 * Concurrent GDS search. Each adapter is asked independently. Failures on one vendor
 * do not invent offers from another, and a booking is never moved between providers.
 */
export async function searchFlightOffers(request: AirSearchRequest): Promise<CanonicalAirOffer[]> {
  const adapters = [travelportFlightAdapter, sabreFlightAdapter, amadeusFlightAdapter];
  const collected: CanonicalAirOffer[] = [];

  for (const adapter of adapters) {
    try {
      const result = await adapter.search(request, {
        providerId: adapter.providerId,
        productId: adapter.productId,
        correlationId: randomUUID(),
      });
      if (result.outcome === 'success' && result.data?.length) {
        collected.push(...result.data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      console.error(`[gds] ${adapter.providerId} air search failed:`, message);
    }
  }

  return collected;
}

export async function searchStayOffers(request: StaySearchRequest): Promise<CanonicalStayOffer[]> {
  const adapters = [travelportStayAdapter, sabreStayAdapter, amadeusStayAdapter];
  const collected: CanonicalStayOffer[] = [];

  for (const adapter of adapters) {
    try {
      const result = await adapter.search(request, {
        providerId: adapter.providerId,
        productId: adapter.productId,
        correlationId: randomUUID(),
      });
      if (result.outcome === 'success' && result.data?.length) {
        collected.push(...result.data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      console.error(`[gds] ${adapter.providerId} stay search failed:`, message);
    }
  }

  return collected;
}
