import { describe, expect, it } from 'vitest';
import { stayAmenityCaption, stayAmenityKey } from '@/domain/stay-amenities';

describe('stay amenities', () => {
  it('maps lodging phrases onto known keys and leaves unknown text', () => {
    expect(stayAmenityKey('Free WiFi')).toBe('wifi');
    expect(stayAmenityKey('Swimming Pool')).toBe('pool');
    expect(stayAmenityKey('Free parking')).toBe('parking');
    expect(stayAmenityKey('Continental breakfast')).toBe('breakfast');
    expect(stayAmenityKey('Concierge')).toBeNull();
  });

  it('captions mapped keys and keeps unknown labels as stored', () => {
    expect(stayAmenityCaption('wireless internet', 'en')).toBe('Wi-Fi');
    expect(stayAmenityCaption('pool', 'sw')).toBe('Bwawa');
    expect(stayAmenityCaption('Concierge')).toBe('Concierge');
  });
});
