/**
 * IATA codes that have a Travelar-hosted identification mark under /airlines/{code}.png.
 * Travelport does not send logo files. Unknown codes keep the two-letter mark.
 */
const HOSTED = [
  'AA', 'BA', 'EK', 'ET', 'H1', 'KE', 'KL', 'KQ', 'LH', 'MS',
  'PW', 'QF', 'QR', 'SQ', 'UA', 'WB', 'WY',
] as const;

const HOSTED_SET = new Set<string>(HOSTED);

export function airlineLogoSrc(code: string | undefined | null): string | null {
  const id = (code ?? '').trim().toUpperCase();
  if (!HOSTED_SET.has(id)) return null;
  return `/airlines/${id}.png`;
}
