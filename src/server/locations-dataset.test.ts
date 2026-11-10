import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isOperatorCatalogCountry, locationCatalogForMode } from '@/server/location-catalog';
import { MODE_LOCATION_KINDS } from '@/server/search';

/**
 * The bus From/To dataset and the rule that decides which places each mode may offer.
 *
 * These tests read the same JSON file the seed imports, so a change to the dataset is a
 * change to what is asserted. A test that carried its own copy of the list would pass while
 * the import ran on something else, which is the failure mode worth avoiding here.
 */

interface DatasetLocation {
  code: string;
  name: string;
  country_code?: string;
}

interface Dataset {
  country: string;
  expectedCount: number;
  locations: DatasetLocation[];
}

const dataset: Dataset = JSON.parse(readFileSync('db/datasets/tanzania-bus-search-locations.json', 'utf8'));

/** Zanzibar is reached by ferry; it must never appear as a bus endpoint. */
const ZANZIBAR_NAMES = [
  'zanzibar', 'unguja', 'pemba', 'kjachazi', 'wete', 'mkanyakoni', 'chake chake',
  'kaskazini pemba', 'kaskazini unguja', 'kusini pemba', 'kusini unguja',
  'mjini magharibi', 'mkoani',
];

function slugOf(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

describe('Tanzania bus search location dataset', () => {
  it('holds exactly the declared number of unique locations', () => {
    expect(dataset.locations).toHaveLength(dataset.expectedCount);
    expect(dataset.expectedCount).toBe(52);
  });

  it('has no duplicate code and no duplicate name', () => {
    const codes = dataset.locations.map((entry) => entry.code);
    const names = dataset.locations.map((entry) => entry.name.toLowerCase());

    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('is Tanzania Mainland only, with no Zanzibar locations', () => {
    for (const entry of dataset.locations) {
      expect(entry.country_code ?? dataset.country).toBe('TZ');
      expect(ZANZIBAR_NAMES).not.toContain(entry.name.toLowerCase());
    }
  });

  it('carries a code that matches its own name, so an import key cannot drift from the label', () => {
    const mismatched = dataset.locations
      .filter((entry) => slugOf(entry.name) !== entry.code)
      .map((entry) => `${entry.code} vs ${slugOf(entry.name)}`);

    expect(mismatched).toEqual([]);
  });

  it('lists every location with a non-empty canonical name', () => {
    for (const entry of dataset.locations) {
      expect(entry.name.trim().length).toBeGreaterThan(1);
    }
  });
});

describe('mode to location-kind mapping', () => {
  it('offers settlements to bus, stations to train and ports to ferry', () => {
    expect(MODE_LOCATION_KINDS.bus).toEqual(['city', 'town']);
    expect(MODE_LOCATION_KINDS.train).toEqual(['station']);
    expect(MODE_LOCATION_KINDS.ferry).toEqual(['port', 'terminal']);
    expect(MODE_LOCATION_KINDS.flights).toEqual(['airport']);
    expect(MODE_LOCATION_KINDS.stays).toEqual(['city', 'town']);
    expect(MODE_LOCATION_KINDS.stays).not.toContain('airport');
  });

  it('keeps the two Zanzibar islands out of bus by kind, not by a name blocklist', () => {
    // Zanzibar, Pemba and Unguja exist as `port` rows. Bus asks for city/town, so they are
    // absent by construction — which is why the ferry picker can offer them and bus cannot.
    expect(MODE_LOCATION_KINDS.bus).not.toContain('port');
    expect(MODE_LOCATION_KINDS.ferry).toContain('port');
  });

  it('does not put worldwide stay cities on bus, train, ferry or experiences pickers', () => {
    expect(locationCatalogForMode('bus')).toBe('operator');
    expect(locationCatalogForMode('stays')).toBe('gds');
    expect(isOperatorCatalogCountry('TZ')).toBe(true);
    expect(isOperatorCatalogCountry('ES')).toBe(false);
  });

  it('gives every booking mode a kind list, so none can silently offer nothing', () => {
    for (const mode of ['bus', 'train', 'ferry', 'flights', 'stays', 'experiences']) {
      expect(MODE_LOCATION_KINDS[mode], mode).toBeInstanceOf(Array);
      expect(MODE_LOCATION_KINDS[mode].length, mode).toBeGreaterThan(0);
    }
  });
});
