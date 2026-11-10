/**
 * Staff (OIMS / HIMS) authorisation boundary.
 *
 * Keycloak authenticates; Travelar authorizes from app.staff_assignment.
 * Until Keycloak is fully configured, every staff API fails closed. Guest
 * booking-access tokens are not staff credentials.
 */
export function refuseStaffUntilIdentityConfigured(): Response {
  return Response.json(
    {
      error: 'staff_identity_not_configured',
      detail: 'Operator and HQ APIs stay closed until Keycloak is live and tokens are validated.',
    },
    { status: 503, headers: { 'cache-control': 'no-store' } },
  );
}
