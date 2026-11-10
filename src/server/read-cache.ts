/**
 * Process-local TTL cache for read models that change rarely (locations, published guides).
 * Not a substitute for Redis at fleet scale; it still cuts repeat origin load on one process.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();
const MAX_KEYS = 500;

export async function cachedRead<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.value;

  const value = await load();
  if (store.size >= MAX_KEYS) {
    const first = store.keys().next().value;
    if (first !== undefined) store.delete(first);
  }
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function clearReadCache(): void {
  store.clear();
}
