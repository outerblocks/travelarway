import { describe, expect, it } from 'vitest';
import { airlineLogoSrc } from '@/domain/airline-logos';

describe('airlineLogoSrc', () => {
  it('returns a hosted path for a catalog carrier and nothing for an unknown code', () => {
    expect(airlineLogoSrc('et')).toBe('/airlines/ET.png');
    expect(airlineLogoSrc('QR')).toBe('/airlines/QR.png');
    expect(airlineLogoSrc('ZZ')).toBeNull();
    expect(airlineLogoSrc('')).toBeNull();
  });
});
