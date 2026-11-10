import { describe, expect, it } from 'vitest';
import { HQ_PERMISSIONS, ROLE_IDS } from '@/server/hims/permissions';
import {
  assertModeMatch,
  assertOperatorActiveForInvite,
  assertTripTenant,
  isOimsRoleId,
  OIMS_PERMISSIONS,
  OIMS_ROLE_IDS,
  rejectClientTotal,
} from '@/server/oims/permissions';

describe('OIMS tenant and quote policy', () => {
  it('refuses operator B’s trip on operator A’s session', () => {
    expect(() => assertTripTenant('operator-b', 'operator-a')).toThrow('forbidden');
    expect(() => assertTripTenant('operator-a', 'operator-a')).not.toThrow();
  });

  it('refuses a bus trip on the ferry console', () => {
    expect(() => assertModeMatch('bus', 'ferry')).toThrow('invalid_mode');
    expect(() => assertModeMatch('ferry', 'ferry')).not.toThrow();
  });

  it('rejects a client-typed total', () => {
    expect(() => rejectClientTotal({ totalMinor: 1 })).toThrow('invalid_client_total');
    expect(() => rejectClientTotal({ amount: 50 })).toThrow('invalid_client_total');
    expect(() => rejectClientTotal({ tripId: 'x' })).not.toThrow();
  });

  it('refuses OIMS invite until the pipeline is Active', () => {
    expect(() => assertOperatorActiveForInvite('lead')).toThrow('invalid_operator_not_active');
    expect(() => assertOperatorActiveForInvite('approved')).toThrow('invalid_operator_not_active');
    expect(() => assertOperatorActiveForInvite('active')).not.toThrow();
  });

  it('cannot assign HQ roles through OIMS', () => {
    expect(isOimsRoleId(ROLE_IDS.hq_admin)).toBe(false);
    expect(isOimsRoleId(OIMS_ROLE_IDS.oims_sales)).toBe(true);
  });

  it('does not grant HQ settlement from operator roles', () => {
    expect((OIMS_PERMISSIONS as readonly string[]).includes('hq.finance.settle')).toBe(false);
    expect(HQ_PERMISSIONS.includes('hq.finance.settle')).toBe(true);
  });
});
