/**
 * ClickPesa payload checksums.
 *
 * From ClickPesa's documentation: canonicalise the payload (recursively sort object keys),
 * serialise it as compact JSON, HMAC-SHA256 with the checksum secret, return 64 hex
 * characters. The same algorithm signs their webhooks, which is why this is one function
 * used in both directions rather than two that can drift apart.
 *
 * Two rules that must not be broken:
 * - `checksum` and `checksumMethod` are excluded from the computation. Including them makes
 *   the digest self-referential and it can never match.
 * - Key order is irrelevant, so a payload that survived a JSON round trip still verifies.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const EXCLUDED = new Set(['checksum', 'checksumMethod']);

/** Recursively sort object keys; arrays keep their order, primitives pass through. */
function canonicalise(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalise);

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = canonicalise((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
}

function withoutSignatureFields(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(payload).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (!EXCLUDED.has(key)) acc[key] = value;
    return acc;
  }, {});
}

/** The digest ClickPesa expects in a request body or webhook payload. */
export function createChecksum(secret: string, payload: Record<string, unknown>): string {
  if (!secret) throw new Error('checksum_secret_missing');

  const canonical = JSON.stringify(canonicalise(withoutSignatureFields(payload)));
  return createHmac('sha256', secret).update(canonical).digest('hex');
}

/**
 * True only when the payload carries a checksum that matches its own contents.
 *
 * A payload with no checksum is not "valid but unsigned": it is refused. ClickPesa only
 * omits the field when the merchant has checksums switched off, and in that case this
 * deployment is misconfigured rather than the sender being untrustworthy.
 */
export function verifyChecksum(secret: string, payload: Record<string, unknown>): boolean {
  const provided = payload.checksum;
  if (typeof provided !== 'string' || provided.length === 0) return false;

  let expected: string;
  try {
    expected = createChecksum(secret, payload);
  } catch {
    return false;
  }

  const a = Buffer.from(provided.toLowerCase(), 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Adds the checksum to a request body without mutating the caller's object. */
export function withChecksum(
  secret: string | undefined,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (!secret) return payload;
  return { ...payload, checksum: createChecksum(secret, payload) };
}
