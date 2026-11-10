/**
 * Short-lived proof that the caller just ran a search or opened a seat map.
 * Holds still have no passenger login; this stops a bot that never looked at inventory
 * from locking seats. Same HMAC secret as booking access.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_TTL_SECONDS = 15 * 60;

function secret(): string {
  const value = process.env.BOOKING_ACCESS_SECRET;
  if (!value || value.length < 32) {
    throw new Error('BOOKING_ACCESS_SECRET is missing or shorter than 32 characters');
  }
  return value;
}

function encode(value: Buffer): string {
  return value.toString('base64url');
}

export function createSearchIntent(tripIds: string[], ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const trips = [...new Set(tripIds.filter((id) => UUID.test(id)))].sort();
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds);
  const body = encode(Buffer.from(JSON.stringify({ v: 1, exp, trips }), 'utf8'));
  const signature = encode(createHmac('sha256', secret()).update(body).digest());
  return `${body}.${signature}`;
}

export function readSearchIntent(token: string): { exp: number; trips: string[] } | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  let provided: Buffer;
  let expected: Buffer;
  try {
    provided = Buffer.from(signature, 'base64url');
    expected = createHmac('sha256', secret()).update(body).digest();
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      exp?: unknown;
      trips?: unknown;
    };
    if (typeof decoded.exp !== 'number' || decoded.exp * 1000 < Date.now()) return null;
    if (!Array.isArray(decoded.trips)) return null;
    const trips = decoded.trips.filter((id): id is string => typeof id === 'string' && UUID.test(id));
    return { exp: decoded.exp, trips };
  } catch {
    return null;
  }
}

export function searchIntentFromRequest(request: Request): string {
  return request.headers.get('x-search-intent')?.trim() || '';
}

/** 403 when the intent is missing, expired, or for a different trip. */
export function refuseHoldWithoutIntent(request: Request, tripId: string): Response | null {
  const token = searchIntentFromRequest(request);
  const parsed = token ? readSearchIntent(token) : null;
  if (!parsed || !parsed.trips.includes(tripId)) {
    return Response.json(
      { error: 'search_intent_required' },
      { status: 403, headers: { 'cache-control': 'no-store' } },
    );
  }
  return null;
}
