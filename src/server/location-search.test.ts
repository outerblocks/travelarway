import { describe, expect, it } from 'vitest';
import { foldSearchText, matchingCountryCodes } from '@/server/location-search';

describe('foldSearchText', () => {
  it('strips combining marks so Male matches Malé', () => {
    expect(foldSearchText('Malé')).toBe('male');
    expect(foldSearchText('  MALE ')).toBe('male');
  });
});

describe('matchingCountryCodes', () => {
  it('maps South Africa and Maldives from their English country names', () => {
    expect(matchingCountryCodes('South Africa')).toContain('ZA');
    expect(matchingCountryCodes('Maldives')).toContain('MV');
  });

  it('does not treat Bali as a country code', () => {
    expect(matchingCountryCodes('Bali')).toEqual([]);
  });

  it('does not treat mali as a prefix of Maldives', () => {
    expect(matchingCountryCodes('Mali')).toEqual(['ML']);
    expect(matchingCountryCodes('Mali')).not.toContain('MV');
  });
});
