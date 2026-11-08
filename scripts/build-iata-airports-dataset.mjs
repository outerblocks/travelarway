/**
 * Builds db/datasets/iata-airports.json from OurAirports (CC BY 4.0).
 *
 *   node scripts/build-iata-airports-dataset.mjs
 *
 * These are IATA aerodromes, not flight inventory. A code in this file is searchable;
 * whether a shop returns an offer still depends on the GDS.
 */
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';

const SOURCE = 'db/datasets/ourairports-airports.csv';
const OUTPUT = 'db/datasets/iata-airports.json';
const TYPE_RANK = { large_airport: 0, medium_airport: 1, small_airport: 2 };

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

const stream = createReadStream(SOURCE, { encoding: 'utf8' });
const lines = createInterface({ input: stream, crlfDelay: Infinity });
let header = null;
const byCode = new Map();

for await (const line of lines) {
  if (!header) {
    header = splitCsvLine(line);
    continue;
  }
  if (!line.trim()) continue;
  const cells = splitCsvLine(line);
  const row = Object.fromEntries(header.map((key, index) => [key, cells[index] ?? '']));
  const iata = String(row.iata_code ?? '').trim().toUpperCase();
  const type = String(row.type ?? '');
  const scheduled = String(row.scheduled_service ?? '').toLowerCase() === 'yes';
  if (!/^[A-Z]{3}$/.test(iata)) continue;
  if (type === 'closed' || type === 'heliport' || type === 'seaplane_base' || type === 'balloonport') continue;
  if (type === 'small_airport' && !scheduled) continue;
  if (!TYPE_RANK.hasOwnProperty(type) && type !== 'small_airport') continue;
  const rank = TYPE_RANK[type] ?? 9;
  const current = byCode.get(iata);
  if (current && current.rank <= rank) continue;
  const name = String(row.name ?? '').trim();
  const country = String(row.iso_country ?? '').trim().toUpperCase();
  if (!name || !/^[A-Z]{2}$/.test(country)) continue;
  byCode.set(iata, {
    rank,
    code: iata,
    name,
    country_code: country,
    municipality: String(row.municipality ?? '').trim() || null,
    type,
  });
}

const locations = [...byCode.values()]
  .sort((a, b) => a.code.localeCompare(b.code))
  .map(({ rank: _rank, type: _type, ...rest }) => rest);

writeFileSync(OUTPUT, `${JSON.stringify({
  source: 'OurAirports airports.csv (CC BY 4.0)',
  source_url: 'https://davidmegginson.github.io/ourairports-data/airports.csv',
  expectedCount: locations.length,
  locations,
}, null, 0)}\n`);

console.log(JSON.stringify({ ok: true, file: OUTPUT, count: locations.length }));
