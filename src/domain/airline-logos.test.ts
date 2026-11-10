import { describe, expect, it } from 'vitest';
import { airlineLogoCandidates, airlineLogoSrc } from '@/domain/airline-logos';

describe('airlineLogoSrc', () => {
  it('returns a hosted path for a filed mark including Precision Air and Auric Air', () => {
    expect(airlineLogoSrc('et')).toBe('/airlines/ET.png');
    expect(airlineLogoSrc('TC', 'svg')).toBe('/airlines/TC.svg');
    expect(airlineLogoSrc('PW')).toBe('/airlines/PW.png');
    expect(airlineLogoSrc('UI', 'svg')).toBe('/airlines/UI.svg');
    expect(airlineLogoSrc('TK', 'svg')).toBe('/airlines/TK.svg');
    expect(airlineLogoSrc('FZ')).toBe('/airlines/FZ.png');
    expect(airlineLogoSrc('AF', 'svg')).toBe('/airlines/AF.svg');
    expect(airlineLogoSrc('H1')).toBe('/airlines/H1.png');
    expect(airlineLogoSrc('ZZ')).toBeNull();
    expect(airlineLogoSrc('')).toBeNull();
  });
});

describe('airlineLogoCandidates', () => {
  it('uses the Precision Air and Auric Air marks and does not borrow Hahn Air or Euroairlines artwork', () => {
    expect(airlineLogoCandidates('PW', 'H1')).toEqual(['/airlines/PW.png']);
    expect(airlineLogoCandidates('UI', 'Q4')).toEqual(['/airlines/UI.svg']);
  });

  it('shows Hahn Air only when Hahn is the branded carrier', () => {
    expect(airlineLogoCandidates('H1', 'H1')).toEqual(['/airlines/H1.png']);
  });

  it('tries operating then marketing across the files we actually host', () => {
    expect(airlineLogoCandidates('KQ', 'KQ')).toEqual(['/airlines/KQ.png']);
    expect(airlineLogoCandidates('KQ', 'H1')).toEqual(['/airlines/KQ.png']);
    expect(airlineLogoCandidates('TC', 'KQ')).toEqual(['/airlines/TC.svg', '/airlines/KQ.png']);
  });
});
