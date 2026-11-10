/**
 * Request rate limiting for public API endpoints.
 *
 * A sliding-window counter kept in process memory, keyed by client address and bucket name.
 *
 * When REDIS_URL is set, counters are shared across processes. Without it, each process
 * keeps its own window (still enough to stop a single client looping holds on one instance).
 */
import { getRedisWindowStore } from '@/server/redis-store';
import { log } from '@/server/log';

export interface RateLimitRule {
  /** Requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the oldest counted request leaves the window. */
  retryAfterSeconds: number;
}

/** Limits per endpoint family. Tuned for a human at a checkout, with room for retries. */
export const RATE_LIMITS = {
  /** Seat holds lock inventory for minutes; the main inventory-lockout vector (H-002). */
  holds: { limit: 20, windowMs: 60_000 },
  /** Booking creation writes rows and binds holds. */
  bookings: { limit: 10, windowMs: 60_000 },
  /** Each call may trigger a USSD push or a provider request that costs money. */
  payments: { limit: 10, windowMs: 60_000 },
  /** Read-only search surfaces: generous, but bounded. */
  search: { limit: 120, windowMs: 60_000 },
  /** Ticket QR verification. Tight so a guessed token cannot enumerate bookings. */
  tickets: { limit: 30, windowMs: 60_000 },
  oims: { limit: 60, windowMs: 60_000 },
  hims: { limit: 60, windowMs: 60_000 },
  auth: { limit: 20, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

/** Upper bound on tracked keys, so a flood of spoofed addresses cannot exhaust memory. */
const MAX_KEYS = 10_000;

export interface RateLimitStore {
  check(key: string, rule: RateLimitRule): RateLimitDecision | Promise<RateLimitDecision>;
}

export class MemoryStore implements RateLimitStore {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly now: () => number = Date.now) {}

  check(key: string, rule: RateLimitRule): RateLimitDecision {
    const now = this.now();
    const windowStart = now - rule.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((at) => at > windowStart);

    if (recent.length >= rule.limit) {
      this.hits.set(key, recent);
      const oldest = recent[0];
      return {
        allowed: false,
        limit: rule.limit,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000)),
      };
    }

    recent.push(now);
    // Re-insert so Map iteration order approximates least-recently-used.
    this.hits.delete(key);
    this.hits.set(key, recent);
    if (this.hits.size > MAX_KEYS) this.evict(windowStart);

    return {
      allowed: true,
      limit: rule.limit,
      remaining: rule.limit - recent.length,
      retryAfterSeconds: 0,
    };
  }

  private evict(windowStart: number): void {
    for (const [key, times] of this.hits) {
      if (times.every((at) => at <= windowStart)) this.hits.delete(key);
    }
    // Still over: drop the least recently used until back under the cap.
    while (this.hits.size > MAX_KEYS) {
      const first = this.hits.keys().next().value;
      if (first === undefined) break;
      this.hits.delete(first);
    }
  }

  reset(): void {
    this.hits.clear();
  }
}

const memoryStore = new MemoryStore();

async function resolveStore(): Promise<RateLimitStore> {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return memoryStore;
  return getRedisWindowStore(url);
}

/**
 * Best-effort client address.
 *
 * Vercel and most reverse proxies set `x-forwarded-for` with the client first. The value is
 * only used as a rate-limit key, never for authorisation, so a spoofed header can at worst
 * give an attacker a fresh bucket per instance — which is why the key cap above exists.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Returns a 429 response when the caller is over the limit for `bucket`, otherwise null.
 *
 *   const limited = await rateLimit(request, 'holds');
 *   if (limited) return limited;
 */
export async function rateLimit(
  request: Request,
  bucket: RateLimitBucket,
  memory: RateLimitStore = memoryStore,
): Promise<Response | null> {
  const rule = RATE_LIMITS[bucket];
  const store = memory === memoryStore ? await resolveStore() : memory;
  let decision: RateLimitDecision;
  try {
    decision = await store.check(`${bucket}:${clientKey(request)}`, rule);
  } catch (error) {
    log('warn', 'rate_limit_store_failed', { message: (error as Error).message });
    decision = memoryStore.check(`${bucket}:${clientKey(request)}`, rule);
  }
  if (decision.allowed) return null;

  return Response.json(
    { error: 'rate_limited', retryAfterSeconds: decision.retryAfterSeconds },
    {
      status: 429,
      headers: {
        'retry-after': String(decision.retryAfterSeconds),
        'x-ratelimit-limit': String(decision.limit),
        'x-ratelimit-remaining': '0',
        'cache-control': 'no-store',
      },
    },
  );
}

