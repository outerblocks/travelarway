import { describe, expect, it } from 'vitest';
import {
  busExcludesCityCode,
  isOperatorCatalogCountry,
  isWorldwideStayCitySlug,
  locationCatalogForMode,
} from '@/server/location-catalog';

describe('worldwide stay-city slugs', () => {
  it('treats country-infix IATA stay rows as GDS-only and keeps East African bus city slugs', () => {
    expect(isWorldwideStayCitySlug('iata-city-es-mad')).toBe(true);
    expect(isWorldwideStayCitySlug('iata-city-id-dps')).toBe(true);
    expect(isWorldwideStayCitySlug('iata-city-nbo')).toBe(false);
    expect(isWorldwideStayCitySlug('iata-city-dar')).toBe(false);
    expect(isWorldwideStayCitySlug('dar-es-salaam')).toBe(false);
    expect(isWorldwideStayCitySlug(null)).toBe(false);
  });
});

describe('locationCatalogForMode', () => {
  it('keeps operator-direct modes off the worldwide stay catalog', () => {
    expect(locationCatalogForMode('bus')).toBe('operator');
    expect(locationCatalogForMode('train')).toBe('operator');
    expect(locationCatalogForMode('ferry')).toBe('operator');
    expect(locationCatalogForMode('experiences')).toBe('operator');
    expect(locationCatalogForMode('stays')).toBe('gds');
    expect(locationCatalogForMode('flights')).toBe('gds');
  });
});

describe('operator catalog countries', () => {
  it('keeps East African operator cities even when the stay seed rewrote their slugs', () => {
    expect(isOperatorCatalogCountry('TZ')).toBe(true);
    expect(isOperatorCatalogCountry('KE')).toBe(true);
    expect(isOperatorCatalogCountry('UG')).toBe(true);
    expect(isOperatorCatalogCountry('RW')).toBe(true);
    expect(isOperatorCatalogCountry('BI')).toBe(true);
    expect(isOperatorCatalogCountry('MW')).toBe(true);
    expect(isOperatorCatalogCountry('ES')).toBe(false);
    expect(isOperatorCatalogCountry('QA')).toBe(false);
    expect(isOperatorCatalogCountry('ZA')).toBe(false);
    expect(isWorldwideStayCitySlug('iata-city-tz-dar')).toBe(true);
    expect(isWorldwideStayCitySlug('iata-city-ke-nbo')).toBe(true);
  });

  it('keeps Zanzibar and Pemba city rows off the bus picker', () => {
    expect(busExcludesCityCode('ZNZ')).toBe(true);
    expect(busExcludesCityCode('PMA')).toBe(true);
    expect(busExcludesCityCode('DAR')).toBe(false);
  });
});
