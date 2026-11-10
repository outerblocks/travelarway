/**
 * Host Simple Icons (CC0) marks for IATA carriers we display but did not previously file.
 *
 *   node scripts/fetch-airline-marks.mjs
 */
import { writeFileSync } from 'node:fs';

const MARKS = {
  A3: 'aegeanairlines',
  AC: 'aircanada',
  AF: 'airfrance',
  AI: 'airindia',
  AT: 'royalairmaroc',
  AY: 'finnair',
  AZ: 'ita',
  B6: 'jetblue',
  CX: 'cathaypacific',
  DL: 'delta',
  EY: 'etihadairways',
  FZ: 'flydubai',
  G9: 'airarabia',
  GF: 'gulfair',
  IB: 'iberia',
  JL: 'japanairlines',
  LO: 'lot',
  LX: 'swiss',
  LY: 'elal',
  MK: 'airmauritius',
  NH: 'ana',
  OS: 'austrianairlines',
  PC: 'pegasusairlines',
  RJ: 'royaljordanian',
  SA: 'southafricanairways',
  SK: 'sas',
  SN: 'brusselsairlines',
  SV: 'saudia',
  TK: 'turkishairlines',
  TP: 'tapairportugal',
  UL: 'srilankanairlines',
  VN: 'vietnamairlines',
  VS: 'virginatlantic',
  WK: 'edelweiss',
  WS: 'westjet',
};

const BASE = 'https://cdn.jsdelivr.net/npm/simple-icons@15.20.0/icons';

const hosted = [];
const missing = [];

for (const [code, slug] of Object.entries(MARKS)) {
  const url = `${BASE}/${slug}.svg`;
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'Travelar/1.0' } });
    if (!response.ok) {
      missing.push({ code, slug, status: response.status });
      continue;
    }
    const body = await response.text();
    if (!body.includes('<svg')) {
      missing.push({ code, slug, status: 'not-svg' });
      continue;
    }
    writeFileSync(`public/airlines/${code}.svg`, body);
    hosted.push(code);
  } catch (error) {
    missing.push({ code, slug, error: error.message });
  }
}

console.log(JSON.stringify({ ok: missing.length === 0, hosted, missing }, null, 2));
if (!hosted.length) process.exit(1);
