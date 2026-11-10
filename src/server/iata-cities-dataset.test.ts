import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface CityRow {
  code: string;
  name: string;
  country_code: string;
  aliases: string | null;
}

interface Dataset {
  expectedCount: number;
  locations: CityRow[];
}

const dataset: Dataset = JSON.parse(readFileSync('db/datasets/iata-cities.json', 'utf8'));

function byName(country: string, name: string): CityRow | undefined {
  return dataset.locations.find((row) => row.country_code === country && row.name.toLowerCase() === name.toLowerCase());
}

describe('IATA city search dataset for stays', () => {
  it('holds the declared number of unique country-and-name settlements', () => {
    expect(dataset.locations).toHaveLength(dataset.expectedCount);
    const keys = dataset.locations.map((row) => `${row.country_code}:${row.name.toLowerCase()}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('covers Spain, Indonesia and other stay destinations travellers type', () => {
    expect(byName('ES', 'Madrid')?.code).toBe('MAD');
    expect(byName('ES', 'Barcelona')?.code).toBe('BCN');
    expect(byName('ID', 'Denpasar')?.code).toBe('DPS');
    expect(byName('ID', 'Denpasar')?.aliases?.toLowerCase()).toContain('bali');
    expect(byName('ES', 'Málaga')?.code).toBe('AGP');
    expect(byName('ES', 'Málaga')?.aliases?.toLowerCase()).toContain('malaga');
    expect(byName('ID', 'Jakarta')?.code).toBe('CGK');
    expect(byName('GB', 'London')?.code).toBe('LON');
    expect(byName('US', 'New York')?.code).toBe('NYC');
    expect(dataset.locations.filter((row) => row.country_code === 'ES').length).toBeGreaterThan(20);
    expect(dataset.locations.filter((row) => row.country_code === 'ID').length).toBeGreaterThan(20);
  });
});
