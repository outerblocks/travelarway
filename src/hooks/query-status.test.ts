import { describe, expect, it } from 'vitest';
import { isAbortError, queryFailureStatus } from '@/hooks/query-status';

describe('queryFailureStatus', () => {
  it('treats TypeError as offline', () => {
    expect(queryFailureStatus(new TypeError('Failed to fetch'))).toBe('offline');
  });

  it('treats HTTP-shaped errors as error', () => {
    expect(queryFailureStatus(new Error('503'))).toBe('error');
  });

  it('recognises abort', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    expect(isAbortError(Object.assign(new Error('Aborted'), { name: 'AbortError' }))).toBe(true);
    expect(isAbortError(new Error('search failed: 500'))).toBe(false);
  });
});
