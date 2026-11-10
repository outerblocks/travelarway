import { amenityCaption, isAmenityKey, type AmenityKey } from '@/domain/amenities';

export const STAY_AMENITY_KEYS = [
  'wifi',
  'aircon',
  'charging',
  'parking',
  'pool',
  'breakfast',
] as const;

export type StayAmenityKey = (typeof STAY_AMENITY_KEYS)[number];

const STAY_LABELS: Record<Exclude<StayAmenityKey, AmenityKey>, { en: string; sw: string; fr: string }> = {
  parking: { en: 'Parking', sw: 'Maegesho', fr: 'Parking' },
  pool: { en: 'Pool', sw: 'Bwawa', fr: 'Piscine' },
  breakfast: { en: 'Breakfast', sw: 'Kiamsha kinywa', fr: 'Petit-déjeuner' },
};

const STAY_ALIASES: Record<string, StayAmenityKey> = {
  wifi: 'wifi',
  'wi-fi': 'wifi',
  'wi fi': 'wifi',
  wireless: 'wifi',
  'wireless internet': 'wifi',
  'wireless internet connection in public areas': 'wifi',
  'free wifi': 'wifi',
  internet: 'wifi',
  'internet services': 'wifi',
  'high speed internet access': 'wifi',
  aircon: 'aircon',
  'air conditioning': 'aircon',
  'air-conditioning': 'aircon',
  'air conditioner': 'aircon',
  ac: 'aircon',
  charging: 'charging',
  parking: 'parking',
  'free parking': 'parking',
  'car park': 'parking',
  garage: 'parking',
  pool: 'pool',
  'swimming pool': 'pool',
  'outdoor pool': 'pool',
  'indoor pool': 'pool',
  breakfast: 'breakfast',
  'free breakfast': 'breakfast',
  'continental breakfast': 'breakfast',
};

export function isStayAmenityKey(value: string): value is StayAmenityKey {
  return (STAY_AMENITY_KEYS as readonly string[]).includes(value);
}

export function stayAmenityKey(value: string): StayAmenityKey | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (isStayAmenityKey(trimmed)) return trimmed;
  return STAY_ALIASES[trimmed] ?? null;
}

export function stayAmenityCaption(
  value: string,
  lang: 'en' | 'sw' | 'fr' = 'en',
): string {
  const key = stayAmenityKey(value);
  if (!key) return value.trim();
  if (isAmenityKey(key)) return amenityCaption(key, lang);
  return STAY_LABELS[key][lang];
}
