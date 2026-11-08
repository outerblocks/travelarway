import { describe, expect, it } from 'vitest';
import { aliasesFor, findLocationIndex, locationMatches, textMatches } from '@/domain/search';
import { FERRY_SAILINGS, FLIGHT_RESULTS, TRAIN_SERVICES } from '@/data/mockData';

// Regression cover for F3: the search form stores Location ids while the
// inventory stores display names, so a real search returned zero results.

describe('aliasesFor', () => {
  it('resolves a city id to its display name', () => {
    expect(aliasesFor('dar')).toContain('Dar es Salaam');
  });

  it('resolves a port, station and airport id to their display names', () => {
    expect(aliasesFor('port_dar')).toContain('Dar es Salaam Port');
    expect(aliasesFor('stn_dar_sgr')).toContain('Dar es Salaam SGR Station');
    expect(aliasesFor('air_dar')).toContain('Julius Nyerere International Airport (DAR)');
  });

  it('exposes the IATA code carried in an airport display name', () => {
    expect(aliasesFor('air_znz')).toContain('ZNZ');
  });

  it('falls back to the raw value for an unknown id', () => {
    expect(aliasesFor('unknown_place')).toEqual(['unknown_place']);
  });
});

describe('textMatches', () => {
  it('matches in both directions', () => {
    expect(textMatches('dar', 'Dar es Salaam')).toBe(true);
    expect(textMatches('Dar es Salaam', 'dar')).toBe(true);
  });

  it('is case and whitespace insensitive', () => {
    expect(textMatches('  DAR   ES SALAAM ', 'dar es salaam')).toBe(true);
  });

  it('does not match unrelated places', () => {
    expect(textMatches('morogoro', 'Dar es Salaam')).toBe(false);
  });

  it('never matches an empty value', () => {
    expect(textMatches('', 'Dar es Salaam')).toBe(false);
    expect(textMatches('dar', '')).toBe(false);
  });
});

describe('locationMatches', () => {
  it('matches a port id against the port name stored on a sailing', () => {
    expect(locationMatches('port_dar', ['Dar es Salaam Port'])).toBe(true);
    expect(locationMatches('port_znz', ['Zanzibar Port'])).toBe(true);
  });

  it('still matches a bare city id (legacy behaviour)', () => {
    expect(locationMatches('dar', ['Dar es Salaam'])).toBe(true);
    expect(locationMatches('morogoro', ['Morogoro'])).toBe(true);
  });

  it('ignores unrelated candidates', () => {
    expect(locationMatches('port_dar', ['Zanzibar Port'])).toBe(false);
    expect(locationMatches('dar', ['Dodoma'])).toBe(false);
  });

  it('treats an absent query as no match', () => {
    expect(locationMatches(undefined, ['Dar es Salaam'])).toBe(false);
  });

  it('skips undefined and empty candidates', () => {
    expect(locationMatches('dar', [undefined, '', 'Dar es Salaam'])).toBe(true);
    expect(locationMatches('dar', [undefined, ''])).toBe(false);
  });
});

describe('findLocationIndex', () => {
  const stops = ['Dar es Salaam', 'Morogoro', 'Dodoma', 'Iringa', 'Mbeya'];

  it('returns the position of the matched stop', () => {
    expect(findLocationIndex('dar', stops)).toBe(0);
    expect(findLocationIndex('morogoro', stops)).toBe(1);
    expect(findLocationIndex('mbeya', stops)).toBe(4);
  });

  it('returns -1 when the stop is not on the route', () => {
    expect(findLocationIndex('arusha', stops)).toBe(-1);
  });
});

describe('search now returns results for every mode (F3 regression)', () => {
  it('ferry: Dar es Salaam Port -> Zanzibar Port', () => {
    const results = FERRY_SAILINGS.filter(
      (sailing) =>
        locationMatches('port_dar', [sailing.departurePort]) &&
        locationMatches('port_znz', [sailing.arrivalPort]),
    );

    expect(results.map((sailing) => sailing.id)).toEqual(['ferry_001', 'ferry_002']);
  });

  it('train: Dar Es Salaam -> Dodoma on the SGR corridor', () => {
    const results = TRAIN_SERVICES.filter(
      (service) =>
        locationMatches('Dar Es Salaam', [service.departureStation]) &&
        locationMatches('Dodoma', [service.arrivalStation]),
    );

    expect(results.map((service) => service.id)).toEqual(['sgr_001', 'sgr_002', 'sgr_003', 'sgr_004', 'sgr_005']);
  });

  it('flights: Dar es Salaam -> Zanzibar', () => {
    const results = FLIGHT_RESULTS.filter((flight) =>
      flight.segments.some(
        (segment) =>
          locationMatches('air_dar', [segment.origin, segment.originCity]) &&
          locationMatches('air_znz', [segment.destination, segment.destinationCity]),
      ),
    );

    expect(results.map((flight) => flight.id)).toEqual(['flight_001', 'flight_002']);
  });
});
