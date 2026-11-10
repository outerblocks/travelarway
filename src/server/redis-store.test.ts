import { describe, expect, it } from 'vitest';
import {
  RedisWindowStore,
  countFromTransaction,
  rateLimitCommands,
  rateLimitKey,
  redisEndpoint,
} from '@/server/redis-store';

describe('redis endpoint', () => {
  it('reads TLS, ACL credentials, and the database from the URL', () => {
    expect(redisEndpoint('rediss://app:s%2Fecret@cache.internal:6380/2')).toEqual({
      host: 'cache.internal',
      port: 6380,
      tls: true,
      database: 2,
      username: 'app',
      password: 's/ecret',
    });
  });

  it('defaults to plaintext port 6379 on database 0', () => {
    expect(redisEndpoint('redis://127.0.0.1:6379')).toMatchObject({
      host: '127.0.0.1',
      port: 6379,
      tls: false,
      database: 0,
      username: undefined,
      password: undefined,
    });
  });
});

describe('rate limit transaction', () => {
  it('names a window key and commits INCR with EXPIRE', () => {
    const key = rateLimitKey('holds:203.0.113.9', 17);
    expect(key).toBe('travelar:rl:holds:203.0.113.9:17');
    expect(rateLimitCommands(key, 61).map((command) => command[0])).toEqual([
      'MULTI',
      'INCR',
      'EXPIRE',
      'EXEC',
    ]);
  });

  it('reads the INCR result from an EXEC reply and rejects a missing TTL', () => {
    expect(countFromTransaction(['+OK', '+QUEUED', '+QUEUED', '*2', ':4', ':1'])).toBe(4);
    expect(() => countFromTransaction(['+OK', '+QUEUED', '+QUEUED', '*2', ':4', '-ERR'])).toThrow(
      'redis_unexpected',
    );
  });
});

describe('RedisWindowStore connect', () => {
  it('stops waiting when Redis never accepts', async () => {
    const store = new RedisWindowStore('redis://192.0.2.1:6379');
    const started = Date.now();
    await expect(
      store.check('holds:203.0.113.9', { limit: 20, windowMs: 60_000 }),
    ).rejects.toThrow('redis_timeout');
    expect(Date.now() - started).toBeLessThan(1_500);
  });
});
