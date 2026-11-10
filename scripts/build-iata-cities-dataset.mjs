/**
 * Builds db/datasets/iata-cities.json from the OurAirports IATA airport dataset.
 *
 *   node scripts/build-iata-cities-dataset.mjs
 *
 * Stay search offers city/town rows, not airports. These names and codes are IATA
 * city vocabulary (SearchByCity), not hotel inventory.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const AIRPORTS = 'db/datasets/iata-airports.json';
const OUTPUT = 'db/datasets/iata-cities.json';

/** IATA city codes that are not the same as the main airport code. */
const METRO_CITY_CODE = {
  'AR:buenos aires': 'BUE',
  'BR:rio de janeiro': 'RIO',
  'BR:sao paulo': 'SAO',
  'CA:montreal': 'YMQ',
  'CA:toronto': 'YTO',
  'CN:beijing': 'BJS',
  'CN:shanghai': 'SHA',
  'DE:berlin': 'BER',
  'FR:paris': 'PAR',
  'GB:london': 'LON',
  'IT:milan': 'MIL',
  'IT:rome': 'ROM',
  'JP:osaka': 'OSA',
  'JP:tokyo': 'TYO',
  'KR:seoul': 'SEL',
  'RU:moscow': 'MOW',
  'SE:stockholm': 'STO',
  'US:chicago': 'CHI',
  'US:houston': 'HOU',
  'US:new york': 'NYC',
  'US:washington': 'WAS',
};

function foldSearchText(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function splitAliases(value) {
  return String(value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function pushAlias(seen, aliases, raw) {
  const text = String(raw ?? '').trim();
  if (!text) return;
  const folded = foldSearchText(text);
  if (!folded || seen.has(folded)) return;
  seen.add(folded);
  aliases.push(text);
  if (folded !== text.toLowerCase()) aliases.push(folded);
}

const CITY_NAME_BY_CODE = {
  DPS: 'Denpasar',
};

const airports = JSON.parse(readFileSync(AIRPORTS, 'utf8')).locations ?? [];
const groups = new Map();

for (const airport of airports) {
  const country = String(airport.country_code ?? '').trim().toUpperCase();
  const municipality = String(airport.municipality ?? '').trim();
  if (!/^[A-Z]{2}$/.test(country) || !municipality) continue;
  const key = `${country}:${foldSearchText(municipality)}`;
  const current = groups.get(key) ?? {
    country_code: country,
    name: municipality,
    code: String(airport.code).toUpperCase(),
    aliases: [],
    seen: new Set(),
  };
  pushAlias(current.seen, current.aliases, municipality);
  pushAlias(current.seen, current.aliases, airport.name);
  pushAlias(current.seen, current.aliases, airport.code);
  for (const alias of splitAliases(airport.aliases)) pushAlias(current.seen, current.aliases, alias);
  const metro = METRO_CITY_CODE[key];
  if (metro) current.code = metro;
  const named = CITY_NAME_BY_CODE[String(airport.code).toUpperCase()];
  if (named) {
    pushAlias(current.seen, current.aliases, current.name);
    current.name = named;
  }
  groups.set(key, current);
}

const usedCodes = new Set();
const locations = [...groups.values()]
  .sort((a, b) => a.country_code.localeCompare(b.country_code) || a.name.localeCompare(b.name) || a.code.localeCompare(b.code))
  .flatMap(({ seen: _seen, aliases, name, code, country_code }) => {
    const stamp = `${country_code}:${code}`;
    if (usedCodes.has(stamp)) return [];
    usedCodes.add(stamp);
    const filtered = aliases.filter((alias) => foldSearchText(alias) !== foldSearchText(name) && foldSearchText(alias) !== foldSearchText(code));
    return [{
      name,
      code,
      country_code,
      aliases: filtered.length ? filtered.join(', ') : null,
    }];
  });

writeFileSync(OUTPUT, `${JSON.stringify({
  source: 'Derived from OurAirports IATA airports (CC BY 4.0)',
  source_url: 'https://davidmegginson.github.io/ourairports-data/airports.csv',
  expectedCount: locations.length,
  locations,
}, null, 0)}\n`);

console.log(JSON.stringify({ ok: true, file: OUTPUT, count: locations.length }));
