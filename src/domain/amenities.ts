/**
 * Operator-declared coach amenities.
 *
 * Keys are what vehicles store. Labels are for travellers and the operator console.
 * Unknown keys stay as the stored string and never get a guessed icon.
 */

export const AMENITY_KEYS = [
  'wifi',
  'aircon',
  'charging',
  'toilet',
  'reclining',
  'reading_light',
  'snacks',
  'blanket',
] as const;

export type AmenityKey = (typeof AMENITY_KEYS)[number];

export const AMENITY_LABELS: Record<AmenityKey, { en: string; sw: string; fr: string }> = {
  wifi: { en: 'Wi-Fi', sw: 'Wi-Fi', fr: 'Wi-Fi' },
  aircon: { en: 'Air conditioning', sw: 'Kiyoyozi', fr: 'Climatisation' },
  charging: { en: 'USB charging', sw: 'Chaji ya USB', fr: 'Charge USB' },
  toilet: { en: 'Toilet', sw: 'Choo', fr: 'Toilettes' },
  reclining: { en: 'Reclining seats', sw: 'Viti vinavyoinama', fr: 'Sièges inclinables' },
  reading_light: { en: 'Reading light', sw: 'Taa ya kusomea', fr: 'Lampe de lecture' },
  snacks: { en: 'Snack service', sw: 'Huduma ya chakula kidogo', fr: 'Collation' },
  blanket: { en: 'Blanket', sw: 'Blanketi', fr: 'Couverture' },
};

const ALIASES: Record<string, AmenityKey> = {
  wifi: 'wifi',
  'wi-fi': 'wifi',
  'wi‑fi': 'wifi',
  aircon: 'aircon',
  air_conditioning: 'aircon',
  'air conditioning': 'aircon',
  charging: 'charging',
  usb: 'charging',
  'usb charging': 'charging',
  toilet: 'toilet',
  reclining: 'reclining',
  'reclining seats': 'reclining',
  reading_light: 'reading_light',
  'reading light': 'reading_light',
  snacks: 'snacks',
  'snack service': 'snacks',
  blanket: 'blanket',
};

export function isAmenityKey(value: string): value is AmenityKey {
  return (AMENITY_KEYS as readonly string[]).includes(value);
}

export function normalizeAmenityKey(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

export function amenityCaption(key: string, lang: 'en' | 'sw' | 'fr' = 'en'): string {
  const canonical = normalizeAmenityKey(key);
  if (isAmenityKey(canonical)) return AMENITY_LABELS[canonical][lang];
  return key.replaceAll('_', ' ');
}

export function parseAmenityKeys(values: unknown): AmenityKey[] {
  if (!Array.isArray(values)) return [];
  const next: AmenityKey[] = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const key = normalizeAmenityKey(value);
    if (isAmenityKey(key) && !next.includes(key)) next.push(key);
  }
  return next;
}
