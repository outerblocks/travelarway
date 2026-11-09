import { describe, expect, it } from 'vitest';
import { flightIdentityPolicy } from '@/domain/flight-identity';

describe('flightIdentityPolicy', () => {
  it('requires a photo ID on domestic itineraries and does not lock to passport', () => {
    const policy = flightIdentityPolicy(false);
    expect(policy.requireId).toBe(true);
    expect(policy.allowedIdTypes).toEqual(['national_id', 'passport', 'driving_licence', 'voter_card']);
  });

  it('requires a passport on international itineraries', () => {
    const policy = flightIdentityPolicy(true);
    expect(policy.requireId).toBe(true);
    expect(policy.allowedIdTypes).toEqual(['passport']);
  });
});
