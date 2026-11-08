/**
 * IATA designator and SSIM aircraft names. Used only to label codes the GDS already
 * returned. Unknown codes stay blank so a card never invents a carrier.
 */

const AIRLINES: Record<string, string> = {
  '4Z': 'Airlink',
  A3: 'Aegean Airlines',
  AA: 'American Airlines',
  AC: 'Air Canada',
  AF: 'Air France',
  AI: 'Air India',
  AT: 'Royal Air Maroc',
  AY: 'Finnair',
  AZ: 'ITA Airways',
  BA: 'British Airways',
  B6: 'JetBlue',
  CX: 'Cathay Pacific',
  DL: 'Delta Air Lines',
  EK: 'Emirates',
  ET: 'Ethiopian Airlines',
  EY: 'Etihad Airways',
  FZ: 'flydubai',
  G9: 'Air Arabia',
  GF: 'Gulf Air',
  IB: 'Iberia',
  JL: 'Japan Airlines',
  KE: 'Korean Air',
  KL: 'KLM',
  KQ: 'Kenya Airways',
  LH: 'Lufthansa',
  LO: 'LOT Polish Airlines',
  LX: 'SWISS',
  LY: 'El Al',
  ME: 'Middle East Airlines',
  MK: 'Air Mauritius',
  MS: 'Egyptair',
  NH: 'All Nippon Airways',
  OS: 'Austrian Airlines',
  PC: 'Pegasus Airlines',
  PW: 'Precision Air',
  QF: 'Qantas',
  QR: 'Qatar Airways',
  RJ: 'Royal Jordanian',
  SA: 'South African Airways',
  SK: 'SAS',
  SN: 'Brussels Airlines',
  SQ: 'Singapore Airlines',
  SV: 'Saudia',
  TK: 'Turkish Airlines',
  TP: 'TAP Air Portugal',
  UA: 'United Airlines',
  UL: 'SriLankan Airlines',
  UR: 'Uganda Airlines',
  VN: 'Vietnam Airlines',
  VS: 'Virgin Atlantic',
  WB: 'RwandAir',
  WK: 'Edelweiss Air',
  WS: 'WestJet',
  WY: 'Oman Air',
  W2: 'FlexFlight',
};

const AIRCRAFT: Record<string, string> = {
  '319': 'Airbus A319',
  '320': 'Airbus A320',
  '321': 'Airbus A321',
  '32A': 'Airbus A320',
  '32B': 'Airbus A321',
  '32N': 'Airbus A320neo',
  '32Q': 'Airbus A321neo',
  '332': 'Airbus A330-200',
  '333': 'Airbus A330-300',
  '339': 'Airbus A330-900neo',
  '343': 'Airbus A340-300',
  '346': 'Airbus A340-600',
  '351': 'Airbus A350-1000',
  '359': 'Airbus A350-900',
  '388': 'Airbus A380-800',
  '738': 'Boeing 737-800',
  '739': 'Boeing 737-900',
  '73G': 'Boeing 737-700',
  '73H': 'Boeing 737-800',
  '73J': 'Boeing 737-900',
  '744': 'Boeing 747-400',
  '763': 'Boeing 767-300',
  '772': 'Boeing 777-200',
  '773': 'Boeing 777-300',
  '777': 'Boeing 777',
  '77L': 'Boeing 777-200LR',
  '77W': 'Boeing 777-300ER',
  '781': 'Boeing 787-10',
  '787': 'Boeing 787',
  '788': 'Boeing 787-8',
  '789': 'Boeing 787-9',
  '7M8': 'Boeing 737 MAX 8',
  '7M9': 'Boeing 737 MAX 9',
  AT7: 'ATR 72',
  AT4: 'ATR 42',
  DH4: 'Dash 8-400',
  E90: 'Embraer 190',
  E95: 'Embraer 195',
};

export function airlineName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return AIRLINES[code.toUpperCase()];
}

export function aircraftName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return AIRCRAFT[code.toUpperCase()];
}

export function countryName(code: string | undefined, locale = 'en'): string | undefined {
  if (!code || !/^[A-Z]{2}$/i.test(code)) return undefined;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? undefined;
  } catch {
    return undefined;
  }
}
