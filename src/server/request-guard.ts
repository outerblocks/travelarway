/**
 * Guards for state-changing public endpoints.
 *
 * The API serves only its own front end, so it sends no CORS headers: browsers already refuse
 * to let another origin *read* a response. What they do not refuse is a cross-site "simple"
 * request — a `text/plain` POST from an attacker's page — and our handlers parse the body with
 * `request.json()` regardless of content type. Without this check, any website could make its
 * visitors' browsers hold seats or start payments on Travelar (audit H-007 / CSRF).
 *
 * Provider webhooks must NOT use this: they come from servers, carry no Origin, and are
 * authenticated by signature instead.
 */
import { rateLimit, type RateLimitBucket } from '@/server/rate-limit';

function splitOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

/** Extra origins allowed to call mutations, e.g. a staging front end. Comma-separated. */
function configuredOrigins(): string[] {
  return splitOrigins(process.env.ALLOWED_ORIGINS);
}

/**
 * Canonical public site origin(s). When set, CSRF same-origin is this list — not the
 * Host / X-Forwarded-Host headers, which a browser can set on a cross-site POST.
 */
function publicOrigins(): string[] {
  return splitOrigins(process.env.APP_PUBLIC_ORIGIN);
}

function requestHost(request: Request): string {
  return (request.headers.get('host')?.trim() || new URL(request.url).host).toLowerCase();
}

/**
 * True when the request comes from a page on another origin.
 *
 * Browsers attach `Origin` to every cross-origin POST/DELETE (and to same-origin ones in all
 * current engines). A request with no Origin at all is not from a browser page — curl, a
 * server, a test — and CSRF is a browser attack, so it is allowed through; rate limiting and
 * the booking access token still apply to it.
 */
export function isCrossOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  if (origin === 'null') return true;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return true;
  }

  const allowed = new Set([...publicOrigins(), ...configuredOrigins()]);
  if (allowed.size > 0) {
    return !allowed.has(originUrl.origin);
  }

  return originUrl.host.toLowerCase() !== requestHost(request);
}

/**
 * Run at the top of every browser-facing mutation handler:
 *
 *   const refused = await guardMutation(request, 'holds');
 *   if (refused) return refused;
 */
function isProduction(): boolean {
  return (process.env.APP_ENV ?? '').toLowerCase() === 'production';
}

function isJsonContentType(request: Request): boolean {
  const type = request.headers.get('content-type') ?? '';
  return type.toLowerCase().startsWith('application/json');
}

export async function guardMutation(
  request: Request,
  bucket: RateLimitBucket,
): Promise<Response | null> {
  if (isCrossOrigin(request)) {
    return Response.json(
      { error: 'cross_origin_forbidden' },
      { status: 403, headers: { 'cache-control': 'no-store' } },
    );
  }
  // Browser POSTs always send Origin. In production a missing Origin is not a page on this
  // site — refuse it rather than treating curl-shaped requests as first-party.
  if (isProduction() && !request.headers.get('origin')) {
    return Response.json(
      { error: 'origin_required' },
      { status: 403, headers: { 'cache-control': 'no-store' } },
    );
  }
  if (request.method !== 'GET' && request.method !== 'HEAD' && !isJsonContentType(request)) {
    return Response.json(
      { error: 'invalid_content_type' },
      { status: 415, headers: { 'cache-control': 'no-store' } },
    );
  }
  return await rateLimit(request, bucket);
}

