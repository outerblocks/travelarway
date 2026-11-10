/**
 * Stay search seeded worldwide IATA cities as `iata-city-{iso}-{code}` (e.g. iata-city-es-mad).
 * East African bus endpoints from 0028/0007 used `iata-city-nbo` with no country infix.
 * A later worldwide seed rewrote several of those rows to the country-infix form, which
 * hid Dar es Salaam, Nairobi, Arusha and Mbeya from operator pickers that only excluded
 * the infix pattern. Operator modes therefore select by served country, not by slug.
 */
export function isWorldwideStayCitySlug(slug: string | null | undefined): boolean {
  return Boolean(slug && /^iata-city-[a-z]{2}-/i.test(slug));
}

export type LocationCatalog = 'operator' | 'gds';

/**
 * Countries with operator-direct geography (bus corridors, SGR/Madaraka stations,
 * LATRA towns, ferry ports). Not a licence to sell; inventory still has to exist.
 */
export const OPERATOR_LOCATION_COUNTRIES = ['BI', 'KE', 'MW', 'RW', 'TZ', 'UG'] as const;

/** IATA city rows for the Zanzibar archipelago. Bus From/To is mainland plus EA corridors. */
export const BUS_FERRY_ONLY_CITY_CODES = ['ZNZ', 'PMA'] as const;

export function locationCatalogForMode(mode: string): LocationCatalog | undefined {
  if (mode === 'flights' || mode === 'stays') return 'gds';
  if (mode === 'bus' || mode === 'train' || mode === 'ferry' || mode === 'experiences') return 'operator';
  return undefined;
}

export function isOperatorCatalogCountry(countryCode: string): boolean {
  return (OPERATOR_LOCATION_COUNTRIES as readonly string[]).includes(countryCode);
}

export function busExcludesCityCode(code: string): boolean {
  return (BUS_FERRY_ONLY_CITY_CODES as readonly string[]).includes(code);
}
