import { describe, expect, it } from 'vitest';
import { clientKey, MemoryStore, rateLimit } from '@/server/rate-limit';

const request = (headers: Record<string, string> = {}) =>
  new Request('https://travelar.test/api/holds', { method: 'POST', headers });

describe('MemoryStore', () => {
  it('allows up to the limit, then refuses with a retry hint', () => {
    let now = 1_000_000;
    const store = new MemoryStore(() => now);
    const rule = { limit: 3, windowMs: 60_000 };

    expect(store.check('k', rule)).toMatchObject({ allowed: true, remaining: 2 });
    expect(store.check('k', rule)).toMatchObject({ allowed: true, remaining: 1 });
    expect(store.check('k', rule)).toMatchObject({ allowed: true, remaining: 0 });

    now += 10_000;
    const refused = store.check('k', rule);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBe(50);
  });

  it('frees capacity once requests slide out of the window', () => {
    let now = 0;
    const store = new MemoryStore(() => now);
    const rule = { limit: 1, windowMs: 1_000 };

    expect(store.check('k', rule).allowed).toBe(true);
    expect(store.check('k', rule).allowed).toBe(false);
    now += 1_001;
    expect(store.check('k', rule).allowed).toBe(true);
  });

  it('keeps separate keys independent', () => {
    const store = new MemoryStore(() => 0);
    const rule = { limit: 1, windowMs: 1_000 };
    expect(store.check('a', rule).allowed).toBe(true);
    expect(store.check('b', rule).allowed).toBe(true);
    expect(store.check('a', rule).allowed).toBe(false);
  });
});

describe('clientKey', () => {
  it('takes the first x-forwarded-for address', () => {
    expect(clientKey(request({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, then to a shared bucket', () => {
    expect(clientKey(request({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
    expect(clientKey(request())).toBe('unknown');
  });
});

describe('rateLimit', () => {
  it('returns null while allowed and a 429 with Retry-After when exceeded', async () => {
    const store = new MemoryStore(() => 0);
    const req = () => request({ 'x-forwarded-for': '203.0.113.9' });

    for (let i = 0; i < 10; i += 1) {
      expect(rateLimit(req(), 'payments', store)).toBeNull();
    }
    const limited = rateLimit(req(), 'payments', store);
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get('retry-after')).toBe('60');
    expect(await limited?.json()).toMatchObject({ error: 'rate_limited' });
  });

  it('counts buckets separately for the same client', () => {
    const store = new MemoryStore(() => 0);
    const req = () => request({ 'x-forwarded-for': '203.0.113.10' });
    for (let i = 0; i < 10; i += 1) rateLimit(req(), 'payments', store);
    expect(rateLimit(req(), 'payments', store)?.status).toBe(429);
    expect(rateLimit(req(), 'holds', store)).toBeNull();
  });
});

