import {
  TANZANIA_AIRPORTS,
  TANZANIA_LOCATIONS,
  TANZANIA_PORTS,
  TANZANIA_STATIONS,
} from '@/data/locations';
import type { Location } from '@/types';

// The search form persists the selected Location *id* (e.g. `port_dar`), while the
// inventory datasets store *display names* (e.g. "Dar es Salaam Port"). Matching the
// raw id against a name never succeeds, so resolve ids to their names here, once.
const ALL_LOCATIONS: Location[] = [
  ...TANZANIA_LOCATIONS,
  ...TANZANIA_PORTS,
  ...TANZANIA_AIRPORTS,
  ...TANZANIA_STATIONS,
];

const AIRPORT_CODE = /\(([A-Z]{3})\)/;

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Every string a stored search value may reasonably be compared against. */
export function aliasesFor(locationId: string): string[] {
  const location = ALL_LOCATIONS.find((candidate) => candidate.id === locationId);
  if (!location) return [locationId];

  const aliases = [location.name, location.id];
  // Airport display names carry their IATA code, e.g. "... Airport (DAR)".
  const code = AIRPORT_CODE.exec(location.name)?.[1];
  if (code) aliases.push(code);
  return aliases;
}

/**
 * Bidirectional containment, so a partial query such as "dar" still matches
 * "Dar es Salaam" and vice versa.
 */
export function textMatches(left: string, right: string): boolean {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

/** True when any candidate matches any alias of the queried location. */
export function locationMatches(
  query: string | undefined,
  candidates: (string | undefined)[],
): boolean {
  if (!query) return false;
  const aliases = aliasesFor(query);

  return candidates.some(
    (candidate) =>
      candidate !== undefined &&
      candidate !== '' &&
      aliases.some((alias) => textMatches(alias, candidate)),
  );
}

/** Position of the queried location within an ordered stop list, or -1. */
export function findLocationIndex(query: string | undefined, candidates: string[]): number {
  if (!query) return -1;
  const aliases = aliasesFor(query);

  return candidates.findIndex((candidate) => aliases.some((alias) => textMatches(alias, candidate)));
}
