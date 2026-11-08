/**
 * Mobile money numbers, in the only shape a provider accepts.
 *
 * ClickPesa requires the international format without a plus: `255712345678`. The checkout
 * form shows a fixed `+255` next to the field, so the browser holds the national part
 * (`712345678`) — sending that verbatim is rejected with "Invalid / unsupported phone
 * number", which surfaced as a generic provider failure. The customer had done nothing
 * wrong; the number simply never left the country.
 *
 * Normalisation lives on the server because a client can send anything, and because the
 * dial code belongs to the operator's country, not to the form.
 */

/** Dial codes for the markets Travelar operates in today. */
export const DIAL_CODES: Record<string, string> = {
  TZ: '255',
  KE: '254',
  UG: '256',
  RW: '250',
};

export class InvalidPhoneError extends Error {
  constructor(public readonly value: string) {
    super('invalid_phone_number');
  }
}

/**
 * Returns the number in E.164 without the plus.
 *
 * Accepts what people and forms actually produce: `+255 712 345 678`, `255712345678`,
 * `0712345678`, `712345678`. Throws rather than guessing when the result cannot be a
 * subscriber number, so the customer is told instead of the provider rejecting it later.
 */
export function normaliseMsisdn(raw: string, countryCode: string): string {
  const dialCode = DIAL_CODES[countryCode.toUpperCase()];
  const digits = (raw ?? '').replace(/\D/g, '');

  if (!dialCode || digits.length === 0) throw new InvalidPhoneError(raw);

  let national = digits;

  // 00<dial>… is the international prefix written the long way.
  if (national.startsWith('00')) national = national.slice(2);

  if (national.startsWith(dialCode) && national.length > 9) {
    return national;
  }

  // A local number written with a trunk zero: 0712… → 712…
  if (national.startsWith('0')) national = national.slice(1);

  // Somebody typed a different country's number: keep it if it is plausibly complete.
  if (national.length >= 11) return national;

  if (national.length !== 9) throw new InvalidPhoneError(raw);

  return `${dialCode}${national}`;
}
