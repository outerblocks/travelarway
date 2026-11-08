/**
 * Hold-release tokens.
 *
 * A hold UUID is unguessable but not a credential: it can leak in logs and screenshots.
 * DELETE of a hold must present a token signed for that hold id. Same secret as booking
 * access (BOOKING_ACCESS_SECRET); payload key is `h` so a booking token cannot release seats.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const secret = (): string => {
  const value = process.env.BOOKING_ACCESS_SECRET;
  if (!value || value.length < 32) {
    throw new Error('BOOKING_ACCESS_SECRET is missing or shorter than 32 characters');
  }
  return value;
};

const encode = (value: Buffer): string => value.toString('base64url');

export function assertHoldAccessConfigured(): void {
  secret();
}

export function createHoldReleaseToken(holdId: string): string {
  const body = encode(Buffer.from(JSON.stringify({ h: holdId }), 'utf8'));
  const signature = encode(createHmac('sha256', secret()).update(body).digest());
  return `${body}.${signature}`;
}

export function readHoldReleaseToken(token: string): { holdId: string } | null {
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
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { h?: unknown };
    if (typeof decoded.h !== 'string' || decoded.h.length === 0) return null;
    return { holdId: decoded.h };
  } catch {
    return null;
  }
}

export function holdReleaseTokenFromRequest(request: Request): string {
  return (
    request.headers.get('x-hold-release')?.trim() ||
    new URL(request.url).searchParams.get('token')?.trim() ||
    ''
  );
}
