export type QueryStatus = 'loading' | 'ready' | 'error' | 'offline';

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** Network failures and an explicit offline flag share one UI. HTTP 4xx/5xx stay `error`. */
export function queryFailureStatus(error: unknown): Exclude<QueryStatus, 'loading' | 'ready'> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  if (error instanceof TypeError) return 'offline';
  return 'error';
}
