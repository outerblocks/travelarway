import { describe, expect, it } from 'vitest';
import { parseCarrierCodes, parseContentSources, parseTravelportMarket } from '@/server/travelport/config';

describe('Travelport market from welcome mail', () => {
  it('maps Region EMEA:UK to ISO GB and keeps the region label', () => {
    expect(parseTravelportMarket('EMEA:UK', undefined)).toEqual({
      region: 'EMEA:UK',
      pointOfSale: 'GB',
    });
  });

  it('accepts EMEA:UK pasted into the point-of-sale field', () => {
    expect(parseTravelportMarket(undefined, 'EMEA:UK')).toEqual({
      region: 'EMEA:UK',
      pointOfSale: 'GB',
    });
  });

  it('keeps an explicit ISO country', () => {
    expect(parseTravelportMarket(undefined, 'TZ')).toEqual({
      region: undefined,
      pointOfSale: 'TZ',
    });
  });
});

describe('Travelport content and carrier lists', () => {
  it('accepts GDS and NDC together', () => {
    expect(parseContentSources('GDS,NDC')).toEqual(['GDS', 'NDC']);
  });

  it('parses the spaced GDS carrier list including host code 1G', () => {
    const codes = parseCarrierCodes('AA BA 1G QF SQ');
    expect(codes).toEqual(['AA', 'BA', '1G', 'QF', 'SQ']);
  });
});
