/**
 * Ticket verification tokens.
 *
 * A QR that encodes only the booking reference is not verifiable — anyone can print
 * `TRV-ABC123` on a slip of paper. The token below is an HMAC over the booking id and
 * reference, so a conductor can distinguish a ticket this system issued from a ticket
 * somebody typed.
 *
 * Design notes:
 * - The secret is read per call and the module **fails closed** without it. A missing
 *   secret must never degrade into unsigned tokens.
 * - Verification uses a constant-time comparison; timing leaks on a signature check are
 *   the classic way to forge tokens byte by byte.
 * - The token is a bearer credential. It grants read-only boarding information, nothing
 *   else, and must never be accepted as proof of identity or as authorisation to change
 *   a booking.
 * - This is Travelar-side validity only. It cannot assert anything LATRA/MOTS requires;
 *   see the regulator note in the audit trail before the marshal feature is built.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const secret = (): string => {
  const value = process.env.TICKET_VERIFY_SECRET;
  if (!value || value.length < 16) {
    throw new Error('TICKET_VERIFY_SECRET is missing or too short (minimum 16 characters)');
  }
  return value;
};

const encode = (value: Buffer): string => value.toString('base64url');

export interface TicketTokenPayload {
  bookingId: string;
  pnr: string;
}

export function createTicketToken(payload: TicketTokenPayload): string {
  const body = encode(Buffer.from(JSON.stringify({ b: payload.bookingId, p: payload.pnr }), 'utf8'));
  const signature = encode(createHmac('sha256', secret()).update(body).digest());
  return `${body}.${signature}`;
}

/** Returns the payload only when the signature is valid; null otherwise. */
export function readTicketToken(token: string): TicketTokenPayload | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  let provided: Buffer;
  try {
    provided = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }

  const expected = createHmac('sha256', secret()).update(body).digest();
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { b?: unknown; p?: unknown };
    if (typeof decoded.b !== 'string' || typeof decoded.p !== 'string') return null;
    return { bookingId: decoded.b, pnr: decoded.p };
  } catch {
    return null;
  }
}
