import { describe, expect, it } from 'vitest';
import { destinationToken, originToken } from './search-tokens';
import type { SearchParams } from '@/types';

const base: SearchParams = {
  mode: 'bus',
  origin: 'Dar es Salaam',
  destination: 'Arusha',
  date: '2026-11-10',
  adults: 1,
  children: 0,
  infants: 0,
  extras: { originId: 'loc-from', destinationId: 'loc-to' },
};

describe('search tokens', () => {
  it('prefers the database row id from extras', () => {
    expect(originToken(base)).toBe('loc-from');
    expect(destinationToken(base)).toBe('loc-to');
  });

  it('falls back to the display name when no id was stored', () => {
    expect(originToken({ ...base, extras: {} })).toBe('Dar es Salaam');
  });
});
