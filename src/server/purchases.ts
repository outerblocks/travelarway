/**
 * Kill switch for new money-moving work. Existing tickets, status polls and signed
 * webhooks stay available. Unset means purchases are allowed; only an explicit `false`
 * pauses holds, booking creation and payment start.
 */
export function purchasesEnabled(): boolean {
  const raw = (process.env.PURCHASES_ENABLED ?? 'true').trim().toLowerCase();
  return raw !== 'false' && raw !== '0' && raw !== 'off';
}

export function refuseIfPurchasesPaused(): Response | null {
  if (purchasesEnabled()) return null;
  return Response.json(
    { error: 'purchases_paused', detail: 'New purchases are paused. Existing tickets remain available.' },
    { status: 503, headers: { 'cache-control': 'no-store' } },
  );
}
