/**
 * Guest booking access tokens.
 *
 * Guest checkout is a product requirement, so there is no account to authorise against.
 * That leaves the question of what proves a caller may act on a booking. A UUID is
 * unguessable but not secret: it travels in URLs, referrers, logs and screenshots.
 *
 * So checkout issues a token that names exactly one booking, signed with a key the browser
 * never sees. Holding it proves you created the booking. It authorises reading the booking
 * and starting its payment — nothing else, and it expires with the booking.
 *
 * This is deliberately not an identity: it grants no account, no history and no other
 * booking. When Keycloak lands (ADR-AUTH-001), signed-in users get a session and this
 * token stays as the guest path rather than being replaced.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const secret = (): string => {
  const value = process.env.BOOKING_ACCESS_SECRET;
  // Fails closed: a short or missing key must never degrade into an unsigned token.
  if (!value || value.length < 32) {
    throw new Error('BOOKING_ACCESS_SECRET is missing or shorter than 32 characters');
  }
  return value;
};

const encode = (value: Buffer): string => value.toString('base64url');

/**
 * Fails before a booking is attempted when the key is not configured.
 *
 * Called at the top of the booking commit on purpose: without this, a missing secret would
 * surface as a 503 *after* the seats had been touched, which looks like a database fault
 * rather than the deployment mistake it is.
 */
export function assertBookingAccessConfigured(): void {
  secret();
}

export interface BookingAccessPayload {
  bookingId: string;
}

export function createBookingAccessToken(payload: BookingAccessPayload): string {
  const body = encode(Buffer.from(JSON.stringify({ b: payload.bookingId }), 'utf8'));
  const signature = encode(createHmac('sha256', secret()).update(body).digest());
  return `${body}.${signature}`;
}

/** Returns the payload only when the signature is valid; null otherwise. */
export function readBookingAccessToken(token: string): BookingAccessPayload | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  let provided: Buffer;
  try {
    provided = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }

  let expected: Buffer;
  try {
    expected = createHmac('sha256', secret()).update(body).digest();
  } catch {
    return null;
  }

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      b?: unknown;
    };
    if (typeof decoded.b !== 'string' || decoded.b.length === 0) return null;
    return { bookingId: decoded.b };
  } catch {
    return null;
  }
}
