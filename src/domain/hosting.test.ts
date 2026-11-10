import { describe, expect, it } from 'vitest';
import {
  AWS_CONTROL_PLANE_REGION,
  PASSENGER_SOR_EDGE_REFUSED,
  assertControlPlaneRegion,
  assertPassengerDatabaseAccess,
  assertPiiPlane,
  detectAppRuntime,
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

describe('passenger SoR runtime', () => {
  it('treats the test process as the local Node origin', () => {
    expect(detectAppRuntime()).toBe('local_node');
  });

  it('allows Node origin without an edge transfer file', () => {
    expect(() => assertPassengerDatabaseAccess('local_node', false)).not.toThrow();
  });

  it('refuses a Worker from opening the passenger database until the edge is named', () => {
    expect(() => assertPassengerDatabaseAccess('cloudflare_worker', false)).toThrow(
      PASSENGER_SOR_EDGE_REFUSED,
    );
  });

  it('allows a Worker only after the edge transfer is recorded', () => {
    expect(() => assertPassengerDatabaseAccess('cloudflare_worker', true)).not.toThrow();
  });
});
