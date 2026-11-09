/**
 * How the flights (and other) place pickers match a typed query to a location row.
 *
 * Matching is on IATA/code, official name, OurAirports aliases, and ISO country
 * names — not on invented nicknames. Folding strips combining marks so "Male"
 * reaches Malé.
 */

export function foldSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * ISO 3166-1 alpha-2 codes whose English, Swahili or French display name equals
 * the query, or (from five characters) is prefixed by it. Shorter strings stay on
 * airport names/codes so "mali" is Mali and not a prefix of Maldives.
 */
function isoRegionCodes(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      const values = Intl.supportedValuesOf('region').filter((code) => /^[A-Z]{2}$/.test(code));
      if (values.length > 0) return values;
    }
  } catch {
    // jsdom and some runtimes omit supportedValuesOf; fall through.
  }
  const codes: string[] = [];
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      try {
        const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
        if (name && name !== code) codes.push(code);
      } catch {
        // Not an assigned region code.
      }
    }
  }
  return codes;
}

export function matchingCountryCodes(term: string, locales: readonly string[] = ['en', 'sw', 'fr']): string[] {
  const needle = foldSearchText(term);
  if (needle.length < 4) return [];

  const regions = isoRegionCodes();
  if (regions.length === 0) return [];

  const hits: string[] = [];
  for (const code of regions) {
    for (const locale of locales) {
      let name: string | undefined;
      try {
        name = new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? undefined;
      } catch {
        name = undefined;
      }
      if (!name) continue;
      const folded = foldSearchText(name);
      if (folded === needle || (needle.length >= 5 && folded.startsWith(needle))) {
        hits.push(code);
        break;
      }
    }
  }
  return hits;
}
