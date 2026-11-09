import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface AirportRow {
  code: string;
  name: string;
  country_code: string;
  municipality: string | null;
  aliases: string | null;
}

interface Dataset {
  expectedCount: number;
  locations: AirportRow[];
}

const dataset: Dataset = JSON.parse(readFileSync('db/datasets/iata-airports.json', 'utf8'));

function byCode(code: string): AirportRow | undefined {
  return dataset.locations.find((row) => row.code === code);
}

describe('IATA airport search dataset', () => {
  it('holds the declared number of unique IATA codes', () => {
    expect(dataset.locations).toHaveLength(dataset.expectedCount);
    expect(new Set(dataset.locations.map((row) => row.code)).size).toBe(dataset.locations.length);
  });

  it('keeps South African, Balinese and Maldivian gateways from OurAirports', () => {
    expect(byCode('JNB')?.country_code).toBe('ZA');
    expect(byCode('CPT')?.country_code).toBe('ZA');
    expect(byCode('DUR')?.municipality).toBe('Durban');
    expect(byCode('DPS')?.name).toMatch(/Ngurah Rai/i);
    expect(byCode('MLE')?.name).toMatch(/Velana/i);
    expect(dataset.locations.filter((row) => row.country_code === 'ZA').length).toBeGreaterThan(20);
    expect(dataset.locations.filter((row) => row.country_code === 'MV').length).toBeGreaterThan(5);
  });

  it('stores OurAirports aliases so Bali, Durban and Male can be typed', () => {
    expect(byCode('DPS')?.aliases?.toLowerCase()).toContain('bali');
    expect(byCode('DUR')?.aliases?.toLowerCase()).toContain('durban');
    expect(byCode('MLE')?.aliases?.toLowerCase()).toContain('male');
  });
});
