import { describe, expect, it } from 'vitest';
import { cachedRead, clearReadCache } from '@/server/read-cache';

describe('cachedRead', () => {
  it('reuses a value within the TTL', async () => {
    clearReadCache();
    let loads = 0;
    const load = async () => {
      loads += 1;
      return loads;
    };
    expect(await cachedRead('k', 10_000, load)).toBe(1);
    expect(await cachedRead('k', 10_000, load)).toBe(1);
    expect(loads).toBe(1);
  });
});
