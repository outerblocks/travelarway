import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/redis-store', () => ({
  getRedisWindowStore: async () => ({
    check: async () => {
      throw new Error('redis_down');
    },
  }),
}));

afterEach(() => {
  delete process.env.REDIS_URL;
});

describe('rate limit Redis-down fallback', () => {
  it('still applies an in-process window so Redis being down does not skip holds', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:1';
    const { rateLimit } = await import('@/server/rate-limit');
    const req = () =>
      new Request('https://travelar.test/api/holds', {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.77' },
      });
    for (let i = 0; i < 20; i += 1) {
      expect(await rateLimit(req(), 'holds')).toBeNull();
    }
    expect((await rateLimit(req(), 'holds'))?.status).toBe(429);
  });
});
