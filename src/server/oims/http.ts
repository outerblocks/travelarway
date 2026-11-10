import { IdentityNotConfiguredError, SessionRequiredError } from '@/server/identity/live';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';
import { operatorIdFromRequest } from '@/server/oims/session';
import { OimsConflictError, OimsForbiddenError, OimsNotReadyError } from '@/server/oims/repository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireOperator(request: Request, claimed?: string | null): string {
  const cookieId = operatorIdFromRequest(request);
  if (!cookieId) throw new OimsForbiddenError();
  if (claimed && claimed !== cookieId) throw new OimsForbiddenError();
  return cookieId;
}

export function readUuid(value: unknown): string | null {
  return typeof value === 'string' && UUID.test(value) ? value : null;
}

export function jsonError(error: unknown): Response {
  if (error instanceof IdentityNotConfiguredError) {
    return refuseStaffUntilIdentityConfigured();
  }
  if (error instanceof SessionRequiredError || error instanceof OimsForbiddenError || (error instanceof Error && error.message === 'forbidden')) {
    return Response.json({ error: 'forbidden' }, { status: 403, headers: { 'cache-control': 'no-store' } });
  }
  if (error instanceof OimsConflictError) {
    return Response.json({ error: error.message }, { status: 409, headers: { 'cache-control': 'no-store' } });
  }
  if (error instanceof OimsNotReadyError) {
    return Response.json(
      { error: 'not_ready', blocks: error.blocks },
      { status: 422, headers: { 'cache-control': 'no-store' } },
    );
  }
  const message = error instanceof Error ? error.message : 'oims_error';
  const status = message.startsWith('invalid_') || message.startsWith('quote_') || message.startsWith('revenue_rule') ? 400 : 500;
  return Response.json({ error: message }, { status, headers: { 'cache-control': 'no-store' } });
}
