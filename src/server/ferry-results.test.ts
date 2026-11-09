import { describe, expect, it } from 'vitest';
import { presentFerryClass } from '@/server/ferry-results';

describe('presentFerryClass', () => {
  it('does not invent a resident TZS fare when the operator left it blank', () => {
    const presented = presentFerryClass({
      class_id: 'c0000000-0000-4000-8000-000000000099',
      name: 'Economy',
      capacity: 40,
      adult_fare_minor: 35,
      child_fare_minor: 20,
      resident_adult_minor: null,
      resident_child_minor: null,
      currency: 'USD',
      sold: 3,
    });
    expect(presented.hasResidentFare).toBe(false);
    expect(presented.availableCapacity).toBe(37);
    expect(presented.adultFare).toBe(35);
  });
});
