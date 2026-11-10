import { isTicketingCarrier } from '@/domain/air-ticketing';

/**
 * Travelport does not send airline artwork. Only files under /public/airlines are served.
 * Precision Air `PW.png` is the wordmark from precisionairtz.com. Auric Air is `UI.svg`.
 */
const HOSTED_PNG = new Set([
  '4Z', '5H', '8N', 'A3', 'AA', 'AT', 'AY', 'AZ', 'BA', 'CQ',
  'CX', 'EK', 'ET', 'F2', 'FA', 'FN', 'FZ', 'G9', 'GF', 'H1',
  'JM', 'KE', 'KL', 'KQ', 'LH', 'LX', 'LY', 'MK', 'MS', 'OS',
  'OW', 'P0', 'P2', 'PW', 'QF', 'QR', 'RJ', 'SA', 'SK', 'SN',
  'SQ', 'TM', 'TP', 'UA', 'UL', 'UM', 'UR', 'VN', 'WB', 'WK', 'WS',
  'WY',
]);
const HOSTED_SVG = new Set([
  'AC', 'AF', 'AI', 'B6', 'DL', 'EY', 'IB', 'JL', 'LO',
  'NH', 'PC', 'SV', 'TC', 'TK', 'UI', 'VS',
]);

export function airlineLogoSrc(code: string | undefined | null, ext: 'png' | 'svg' = 'png'): string | null {
  const id = (code ?? '').trim().toUpperCase();
  if (ext === 'png' && HOSTED_PNG.has(id)) return `/airlines/${id}.png`;
  if (ext === 'svg' && HOSTED_SVG.has(id)) return `/airlines/${id}.svg`;
  return null;
}

/**
 * Operating then marketing, PNG then SVG. A ticketed consolidator (Hahn Air, FlexFlight,
 * Euroairlines) is never used as artwork for a different operating airline.
 */
export function airlineLogoCandidates(
  code: string | undefined | null,
  fallbackCode?: string | undefined | null,
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const add = (next: string | undefined | null) => {
    for (const ext of ['png', 'svg'] as const) {
      const src = airlineLogoSrc(next, ext);
      if (!src || seen.has(src)) continue;
      seen.add(src);
      urls.push(src);
    }
  };
  add(code);
  const primary = (code ?? '').trim().toUpperCase();
  const fallback = (fallbackCode ?? '').trim().toUpperCase();
  if (fallback && fallback !== primary && isTicketingCarrier(fallback) && !isTicketingCarrier(primary)) {
    return urls;
  }
  add(fallbackCode);
  return urls;
}
