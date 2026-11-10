/**
 * The localStorage password stub is retired. Sign-in goes through Keycloak
 * via the BFF. This module remains only so older imports fail closed.
 */
export const stubAuthPolicy = {
  isAllowed(): boolean {
    return false;
  },
};
