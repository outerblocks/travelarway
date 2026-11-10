import { describe, expect, it } from 'vitest';
import {
  AWS_CONTROL_PLANE_REGION,
  assertControlPlaneRegion,
  assertPiiPlane,
  personalDataAllowedOnControlPlane,
} from '@/domain/hosting';

describe('control plane region', () => {
  it('locks Ireland', () => {
    expect(AWS_CONTROL_PLANE_REGION).toBe('eu-west-1');
    expect(() => assertControlPlaneRegion('eu-west-1')).not.toThrow();
  });

  it('refuses Cape Town', () => {
    expect(() => assertControlPlaneRegion('af-south-1')).toThrow(/cannot be af-south-1/);
  });
});

describe('pii plane', () => {
  it('keeps passenger data local by default', () => {
    expect(assertPiiPlane('local', false, 'production')).toBe('local');
    expect(personalDataAllowedOnControlPlane('local')).toBe(false);
  });

  it('refuses Ireland PII in production without a recorded transfer file', () => {
    expect(() => assertPiiPlane('aws_ireland', false, 'production')).toThrow(/eu-west-1/);
  });
});
