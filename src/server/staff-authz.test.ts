import { describe, expect, it } from 'vitest';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';

describe('refuseStaffUntilIdentityConfigured', () => {
  it('fails closed with 503 and does not count as authorised', async () => {
    const response = refuseStaffUntilIdentityConfigured();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'staff_identity_not_configured',
      detail: 'Operator and HQ APIs stay closed until Keycloak is live and tokens are validated.',
    });
  });
});
