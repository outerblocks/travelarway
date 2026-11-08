/**
 * Our reference for one collection attempt.
 *
 * ClickPesa's documented limits: alphanumeric only, maximum 20 characters, and a reused
 * reference is rejected with 409. The attempt number therefore has to be part of the value:
 * `TRV-ABC123` becomes `TRVABC12301` on the first try and `TRVABC12302` on a retry, so a
 * customer who fails once and tries again is a new collection rather than a duplicate.
 *
 * It stays readable on purpose — a support agent reading a wallet statement should be able
 * to match it to a booking without a lookup table.
 */
export function orderReferenceFor(pnr: string, attempt: number): string {
  const base = pnr.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16);
  const suffix = String(Math.max(1, Math.trunc(attempt))).padStart(2, '0').slice(-2);
  return `${base}${suffix}`;
}
