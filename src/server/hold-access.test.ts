import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createBookingAccessToken } from './booking-access';
import { createHoldReleaseToken, readHoldReleaseToken } from './hold-access';

const SECRET = 'test-booking-access-secret-at-least-32chars';
const previous = process.env.BOOKING_ACCESS_SECRET;

beforeAll(() => {
  process.env.BOOKING_ACCESS_SECRET = SECRET;
});

afterAll(() => {
  if (previous === undefined) delete process.env.BOOKING_ACCESS_SECRET;
  else process.env.BOOKING_ACCESS_SECRET = previous;
});

describe('hold release token', () => {
  it('round-trips the hold it was issued for', () => {
    const token = createHoldReleaseToken('hold-1');
    expect(readHoldReleaseToken(token)).toEqual({ holdId: 'hold-1' });
  });

  it('does not accept a booking-access token as a hold release', () => {
    const booking = createBookingAccessToken({ bookingId: 'hold-1' });
    expect(readHoldReleaseToken(booking)).toBeNull();
  });

  it('rejects a token for a different hold', () => {
    const token = createHoldReleaseToken('hold-1');
    expect(readHoldReleaseToken(token)?.holdId).not.toBe('hold-2');
  });
});
