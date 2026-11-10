import { afterEach, describe, expect, it } from 'vitest';
import { createSearchIntent, readSearchIntent, refuseHoldWithoutIntent } from '@/server/search-intent';

const TRIP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

afterEach(() => {
  delete process.env.BOOKING_ACCESS_SECRET;
});

describe('search intent', () => {
  it('accepts a hold for a trip that was just searched', () => {
    process.env.BOOKING_ACCESS_SECRET = 'a'.repeat(32);
    const token = createSearchIntent([TRIP, OTHER]);
    const parsed = readSearchIntent(token);
    expect(parsed?.trips).toContain(TRIP);
    const request = new Request('https://travelar.test/api/holds', {
      method: 'POST',
      headers: { 'x-search-intent': token },
    });
    expect(refuseHoldWithoutIntent(request, TRIP)).toBeNull();
  });

  it('refuses a hold for a trip that is not in the intent', () => {
    process.env.BOOKING_ACCESS_SECRET = 'a'.repeat(32);
    const token = createSearchIntent([TRIP]);
    const request = new Request('https://travelar.test/api/holds', {
      method: 'POST',
      headers: { 'x-search-intent': token },
    });
    expect(refuseHoldWithoutIntent(request, OTHER)?.status).toBe(403);
  });

  it('refuses a missing header', () => {
    process.env.BOOKING_ACCESS_SECRET = 'a'.repeat(32);
    const request = new Request('https://travelar.test/api/holds', { method: 'POST' });
    expect(refuseHoldWithoutIntent(request, TRIP)?.status).toBe(403);
  });
});
