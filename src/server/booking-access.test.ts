import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createBookingAccessToken, readBookingAccessToken } from './booking-access';

const SECRET = 'test-booking-access-secret-at-least-32chars';
const previous = process.env.BOOKING_ACCESS_SECRET;

beforeAll(() => {
  process.env.BOOKING_ACCESS_SECRET = SECRET;
});

afterAll(() => {
  if (previous === undefined) delete process.env.BOOKING_ACCESS_SECRET;
  else process.env.BOOKING_ACCESS_SECRET = previous;
});

describe('booking access token', () => {
  it('round-trips the booking it was issued for', () => {
    const token = createBookingAccessToken({ bookingId: 'b-123' });
    expect(readBookingAccessToken(token)).toEqual({ bookingId: 'b-123' });
  });

  it('names one booking only — no way to widen it', () => {
    const token = createBookingAccessToken({ bookingId: 'b-123' });
    const decoded = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
    expect(Object.keys(decoded)).toEqual(['b']);
  });

  it('rejects a token whose payload was swapped', () => {
    const genuine = createBookingAccessToken({ bookingId: 'b-123' });
    const forged = createBookingAccessToken({ bookingId: 'b-999' });
    // Keep the originating signature, swap the body: the classic tamper.
    const tampered = `${forged.split('.')[0]}.${genuine.split('.')[1]}`;
    expect(readBookingAccessToken(tampered)).toBeNull();
  });

  it('rejects a token signed with another key', () => {
    const token = createBookingAccessToken({ bookingId: 'b-123' });
    process.env.BOOKING_ACCESS_SECRET = 'a-completely-different-secret-32chars';
    try {
      expect(readBookingAccessToken(token)).toBeNull();
    } finally {
      process.env.BOOKING_ACCESS_SECRET = SECRET;
    }
  });

  it('rejects a bare booking id', () => {
    expect(readBookingAccessToken('b-123')).toBeNull();
    expect(readBookingAccessToken('')).toBeNull();
  });

  it('fails closed without a configured secret', () => {
    delete process.env.BOOKING_ACCESS_SECRET;
    try {
      expect(() => createBookingAccessToken({ bookingId: 'b-123' })).toThrow();
      // Reading also refuses rather than returning an unverified payload.
      expect(readBookingAccessToken('anything.anything')).toBeNull();
    } finally {
      process.env.BOOKING_ACCESS_SECRET = SECRET;
    }
  });
});
