export type QueryStatus = 'loading' | 'ready' | 'error' | 'offline';

/**
 * Keep painted results while a refetch runs. If nothing is on screen yet, go back to
 * `loading` — an empty ready frame is the same blink as unmounting the list.
 */
export function stayReadyDuringRefetch<T extends string>(
  current: T,
  loading: T,
  ready: T,
  painted = true,
): T {
  return current === ready && painted ? current : loading;
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if (!('name' in error)) return false;
  return error.name === 'AbortError';
}

/** Network failures and an explicit offline flag share one UI. HTTP 4xx/5xx stay `error`. */
export function queryFailureStatus(error: unknown): Exclude<QueryStatus, 'loading' | 'ready'> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  if (error instanceof TypeError) return 'offline';
  return 'error';
}
