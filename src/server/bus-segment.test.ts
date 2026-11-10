import { describe, expect, it } from 'vitest';
import { intervalsOverlap, resolveBusSegment } from '@/server/bus-segment';
import { isExclusionViolation, isInventoryConflict, isUniqueViolation } from '@/server/errors';
import { SeatUnavailableError } from '@/server/holds';

describe('bus interval occupancy', () => {
  it('T01: adjacent A-C and C-E on the same seat do not overlap', () => {
    expect(intervalsOverlap(0, 2, 2, 4)).toBe(false);
  });

  it('T02: A-D and C-E on the same seat overlap', () => {
    expect(intervalsOverlap(0, 3, 2, 4)).toBe(true);
  });

  it('T06: a stop pair with no permitted pickup/drop-off is not a product', async () => {
    const client = {
      query: async () => ({ rows: [], rowCount: 0 }),
    };
    expect(await resolveBusSegment(client, 'trip', 'from', 'to')).toBeNull();
  });

  it('maps exclusion and unique violations to seat_unavailable', () => {
    const exclusion = Object.assign(new Error('overlap'), { code: '23P01' });
    const unique = Object.assign(new Error('duplicate'), { code: '23505' });
    expect(isExclusionViolation(exclusion)).toBe(true);
    expect(isUniqueViolation(unique)).toBe(true);
    expect(isInventoryConflict(exclusion)).toBe(true);
    const mapped = isInventoryConflict(exclusion) ? new SeatUnavailableError(['1A']) : exclusion;
    expect(mapped).toBeInstanceOf(SeatUnavailableError);
  });
});
