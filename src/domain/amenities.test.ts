import { describe, expect, it } from 'vitest';
import { amenityCaption, isAmenityKey, normalizeAmenityKey, parseAmenityKeys } from '@/domain/amenities';

describe('coach amenities', () => {
  it('maps stored keys and legacy display names onto the allow-list', () => {
    expect(normalizeAmenityKey('wifi')).toBe('wifi');
    expect(normalizeAmenityKey('Air Conditioning')).toBe('aircon');
    expect(normalizeAmenityKey('USB Charging')).toBe('charging');
    expect(isAmenityKey('vip')).toBe(false);
    expect(parseAmenityKeys(['wifi', 'Air Conditioning', 'bogus'])).toEqual(['wifi', 'aircon']);
  });

  it('captions known keys and leaves unknown values as stored text', () => {
    expect(amenityCaption('wifi', 'en')).toBe('Wi-Fi');
    expect(amenityCaption('toilet', 'sw')).toBe('Choo');
    expect(amenityCaption('not_a_real_amenity')).toBe('not a real amenity');
  });
});
