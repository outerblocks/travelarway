/**
 * Shared input checks for booking, payment and ticket surfaces.
 *
 * These refuse values the database or a ticket QR should never store: control characters,
 * markup, oversized strings. They do not invent fares or invent identity.
 */

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,64}$/;
const SEAT_RE = /^[A-Z0-9]{1,8}$/;
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,78}[\p{L}\p{M}.]$/u;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function hasControlChars(value: string): boolean {
  return /[\u0000-\u001F\u007F<>]/.test(value);
}

/** Traveller names as printed on a ticket: letters, marks, spaces, hyphen, apostrophe. */
export function parsePersonName(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, ' ');
  if (value.length < 2 || value.length > 80) return null;
  if (hasControlChars(value)) return null;
  if (!NAME_RE.test(value)) return null;
  return value;
}

export function parseEmail(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (!value || value.length > 254 || hasControlChars(value)) return null;
  if (!EMAIL_RE.test(value)) return null;
  return value;
}

export function parseSeatCode(raw: string): string | null {
  const value = raw.trim().toUpperCase();
  if (!SEAT_RE.test(value)) return null;
  return value;
}

export function parseIsoDate(raw: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return raw;
}
