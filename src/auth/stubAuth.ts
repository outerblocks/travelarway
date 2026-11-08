/**
 * Passenger and staff “sign in” is a UI stub until an identity provider is live
 * (ADR-AUTH-001 / audit C-001). The stub may run in Vite dev so design and e2e
 * keep working. A production bundle must not accept a password or trust
 * localStorage as a session.
 */
export const stubAuthPolicy = {
  isAllowed(): boolean {
    return Boolean(import.meta.env.DEV);
  },
};
