import { describe, expect, it } from 'vitest';
import {
  amadeusFlightAdapter,
  amadeusStayAdapter,
  sabreFlightAdapter,
  sabreRailAdapter,
  sabreStayAdapter,
} from '@/server/providers/stubs';

const request = {
  originCode: 'JRO',
  destinationCode: 'DAR',
  departureDate: '2026-12-08',
  adults: 1,
  children: 0,
  infants: 0,
  contentSources: ['GDS'],
};

const stayRequest = {
  cityName: 'Dar es Salaam',
  countryCode: 'TZ',
  checkInDate: '2026-12-08',
  checkOutDate: '2026-12-10',
  adults: 1,
  children: 0,
  rooms: 1,
};

describe('sibling GDS adapters', () => {
  it('Sabre and Amadeus search refuse rather than inventing offers', async () => {
    const meta = { providerId: 'x', productId: 'y', correlationId: 'z' };
    const air = await Promise.all([
      sabreFlightAdapter.search(request, { ...meta, providerId: 'sabre' }),
      amadeusFlightAdapter.search(request, { ...meta, providerId: 'amadeus' }),
    ]);
    const stays = await Promise.all([
      sabreStayAdapter.search(stayRequest, { ...meta, providerId: 'sabre' }),
      amadeusStayAdapter.search(stayRequest, { ...meta, providerId: 'amadeus' }),
    ]);

    const rail = await sabreRailAdapter.search(
      { originCode: 'QQU', destinationCode: 'QQM', departureDate: '2026-12-08' },
      { ...meta, providerId: 'sabre', productId: 'rail' },
    );
    expect(air.every((result) => result.outcome === 'unsupported' && !result.data)).toBe(true);
    expect(stays.every((result) => result.outcome === 'unsupported' && !result.data)).toBe(true);
    expect(rail.outcome).toBe('unsupported');
    expect(rail.data).toBeUndefined();
  });
});
