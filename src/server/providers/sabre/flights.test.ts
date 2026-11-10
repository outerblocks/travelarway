import { describe, expect, it } from 'vitest';
import { mosaicShopIntent, sabreFlightAdapter } from '@/server/providers/sabre/flights';
import { sabreRailAdapter } from '@/server/providers/sabre/rail';
import { sabreStayAdapter } from '@/server/providers/sabre/stays';

const meta = { providerId: 'sabre', productId: 'mosaic-air', correlationId: 'test' };

describe('Sabre Mosaic adapters', () => {
  it('refuses air, hotel and rail search when Sabre is not enabled', async () => {
    const air = await sabreFlightAdapter.search({
      originCode: 'DAR',
      destinationCode: 'JRO',
      departureDate: '2026-12-08',
      adults: 1,
      children: 0,
      infants: 0,
    }, meta);
    const stays = await sabreStayAdapter.search({
      cityName: 'Madrid',
      countryCode: 'ES',
      checkInDate: '2026-12-08',
      checkOutDate: '2026-12-10',
      adults: 1,
      children: 0,
      rooms: 1,
    }, { ...meta, productId: 'hotel' });
    const rail = await sabreRailAdapter.search(
      { originCode: 'QQU', destinationCode: 'QQM', departureDate: '2026-12-08' },
      { ...meta, productId: 'rail' },
    );

    expect(air.outcome).toBe('unsupported');
    expect(air.data).toBeUndefined();
    expect(stays.outcome).toBe('unsupported');
    expect(stays.data).toBeUndefined();
    expect(rail.outcome).toBe('unsupported');
    expect(rail.data).toBeUndefined();
  });

  it('records shop intent from Travelar fields without inventing Sabre JSON', () => {
    expect(mosaicShopIntent({
      originCode: 'DAR',
      destinationCode: 'MAD',
      departureDate: '2026-12-08',
      adults: 1,
      children: 0,
      infants: 0,
    })).toEqual({
      origin: 'DAR',
      destination: 'MAD',
      departureDate: '2026-12-08',
      returnDate: null,
      adults: 1,
      children: 0,
      infants: 0,
      cabinPreference: null,
    });
  });
});
