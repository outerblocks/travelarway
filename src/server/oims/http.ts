import { operatorIdFromRequest } from '@/server/oims/session';
import { OimsForbiddenError, OimsNotReadyError } from '@/server/oims/repository';

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
  if (error instanceof OimsForbiddenError) {
    return Response.json({ error: 'forbidden' }, { status: 403, headers: { 'cache-control': 'no-store' } });
  }
  if (error instanceof OimsNotReadyError) {
    return Response.json(
      { error: 'not_ready', blocks: error.blocks },
      { status: 422, headers: { 'cache-control': 'no-store' } },
    );
  }
  const message = error instanceof Error ? error.message : 'oims_error';
  const status = message.startsWith('invalid_') ? 400 : 500;
  return Response.json({ error: message }, { status, headers: { 'cache-control': 'no-store' } });
}
