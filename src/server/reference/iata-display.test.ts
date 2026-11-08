import { describe, expect, it } from 'vitest';
import { aircraftName, airlineName, countryName } from '@/server/reference/iata-display';

describe('IATA display names', () => {
  it('maps observed airline and aircraft codes and leaves unknown codes blank', () => {
    expect(airlineName('ET')).toBe('Ethiopian Airlines');
    expect(airlineName('QR')).toBe('Qatar Airways');
    expect(airlineName('KL')).toBe('KLM');
    expect(airlineName('KQ')).toBe('Kenya Airways');
    expect(airlineName('WB')).toBe('RwandAir');
    expect(aircraftName('351')).toBe('Airbus A350-1000');
    expect(aircraftName('7M8')).toBe('Boeing 737 MAX 8');
    expect(airlineName('ZZ')).toBeUndefined();
    expect(aircraftName('XXX')).toBeUndefined();
  });

  it('uses the locale region name for a country code', () => {
    expect(countryName('GB')).toBe('United Kingdom');
    expect(countryName('TZ')).toBe('Tanzania');
  });
});
