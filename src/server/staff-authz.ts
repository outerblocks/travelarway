/**
 * Staff (OIMS / HIMS) authorisation boundary.
 *
 * There is no identity provider in this process yet. Until one exists, every
 * staff mutation must fail closed — there is no demo header that grants
 * inventory, fare, or payout rights. Guest booking uses booking-access tokens
 * instead; those are not staff credentials.
 */
export function refuseStaffUntilIdentityConfigured(): Response {
  return Response.json(
    {
      error: 'staff_identity_not_configured',
      detail: 'Operator and HQ APIs stay closed until the identity provider is live.',
    },
    { status: 503, headers: { 'cache-control': 'no-store' } },
  );
}
