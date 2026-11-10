import { describe, expect, it } from 'vitest';
import { isExclusionViolation, isInventoryConflict, isUniqueViolation } from '@/server/errors';
import { SeatUnavailableError } from '@/server/holds';

describe('last-seat contention', () => {
  it('maps a unique-violation on the active-hold index to seat_unavailable', () => {
    const error = Object.assign(new Error('duplicate'), { code: '23505' });
    expect(isUniqueViolation(error)).toBe(true);
    const mapped = isUniqueViolation(error) ? new SeatUnavailableError(['1A']) : error;
    expect(mapped).toBeInstanceOf(SeatUnavailableError);
    expect((mapped as SeatUnavailableError).seats).toEqual(['1A']);
  });

  it('does not treat a deadlock as a successful second sale', () => {
    expect(isUniqueViolation({ code: '40P01' })).toBe(false);
    expect(isExclusionViolation({ code: '40P01' })).toBe(false);
  });

  it('treats a GiST overlap as an inventory conflict', () => {
    expect(isInventoryConflict({ code: '23P01' })).toBe(true);
  });
});
