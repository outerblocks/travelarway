import { IdentityAdminUnavailableError } from '@/server/identity/admin';
import { IdentityNotConfiguredError, SessionRequiredError } from '@/server/identity/live';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';
import { himsDeskFromRequest, type HimsDesk } from '@/server/hims/session';

export class HimsForbiddenError extends Error {
  constructor() {
    super('hims_forbidden');
  }
}

export class HimsConflictError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function requireHq(request: Request, desk?: HimsDesk): HimsDesk {
  const found = himsDeskFromRequest(request);
  if (!found) throw new HimsForbiddenError();
  if (desk && found !== desk) throw new HimsForbiddenError();
  return found;
}

export function jsonError(error: unknown): Response {
  if (error instanceof IdentityNotConfiguredError) {
    return refuseStaffUntilIdentityConfigured();
  }
  if (error instanceof IdentityAdminUnavailableError) {
    return Response.json(
      { error: 'identity_admin_unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
  if (error instanceof SessionRequiredError || error instanceof HimsForbiddenError) {
    return Response.json({ error: 'forbidden' }, { status: 403, headers: { 'cache-control': 'no-store' } });
  }
  if (error instanceof HimsConflictError) {
    return Response.json({ error: error.message }, { status: 409, headers: { 'cache-control': 'no-store' } });
  }
  const message = error instanceof Error ? error.message : 'hims_error';
  const status = message.startsWith('invalid_') || message.startsWith('revenue_rule') ? 400 : 500;
  return Response.json({ error: message }, { status, headers: { 'cache-control': 'no-store' } });
}

export async function hqAudit(
  actor: string,
  desk: string,
  action: string,
  objectType: string,
  objectId: string | null,
  mode: string | null,
  diff: unknown,
) {
  const { query } = await import('@/server/db');
  await query(
    `insert into app.hq_audit (actor, desk, action, object_type, object_id, mode, diff, reason, correlation_id)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
    [
      actor,
      desk,
      action,
      objectType,
      objectId,
      mode,
      JSON.stringify(diff ?? {}),
      typeof (diff as { reason?: unknown })?.reason === 'string' ? (diff as { reason: string }).reason : null,
      typeof (diff as { correlationId?: unknown })?.correlationId === 'string' ? (diff as { correlationId: string }).correlationId : null,
    ],
  );
}
