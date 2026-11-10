import { randomUUID } from 'node:crypto';
import { query } from '@/server/db';
import { cookieHeader, readSignedCookie, SESSION_COOKIE } from '@/server/identity/cookies';
import { identityConfig } from '@/server/identity/live';

export interface AppSession {
  sessionId: string;
  userId: string;
  email: string | null;
  idTokenHint: string | null;
}

export async function upsertUserFromIdp(issuer: string, subject: string, email: string | null): Promise<string> {
  const existing = await query<{ user_id: string }>(
    `select user_id from app.external_identity where issuer = $1 and subject = $2`,
    [issuer, subject],
  );
  if (existing.rows[0]) return existing.rows[0].user_id;

  const created = await query<{ id: string }>(
    `insert into app.internal_user (status) values ('active') returning id`,
    [],
  );
  const userId = created.rows[0]!.id;
  await query(
    `insert into app.external_identity (user_id, issuer, subject, email) values ($1, $2, $3, $4)`,
    [userId, issuer, subject, email],
  );
  return userId;
}

export async function createAppSession(userId: string, idTokenHint: string | null): Promise<{ cookie: string; sessionId: string }> {
  const sessionId = randomUUID();
  const expires = new Date(Date.now() + 12 * 60 * 60 * 1000);
  await query(
    `insert into app.app_session (id, user_id, id_token_hint, expires_at) values ($1, $2, $3, $4)`,
    [sessionId, userId, idTokenHint, expires.toISOString()],
  );
  return { sessionId, cookie: cookieHeader(SESSION_COOKIE, sessionId, 12 * 60 * 60) };
}

export async function sessionFromRequest(request: Request): Promise<AppSession | null> {
  try {
    identityConfig();
  } catch {
    return null;
  }
  const sessionId = readSignedCookie(request, SESSION_COOKIE);
  if (!sessionId) return null;
  const found = await query<{
    user_id: string;
    id_token_hint: string | null;
    email: string | null;
  }>(
    `select s.user_id, s.id_token_hint, e.email
       from app.app_session s
       join app.internal_user u on u.id = s.user_id
       left join lateral (
         select email from app.external_identity x
          where x.user_id = u.id
          order by x.created_at desc
          limit 1
       ) e on true
      where s.id = $1
        and s.revoked_at is null
        and s.expires_at > now()
        and u.status = 'active'
      limit 1`,
    [sessionId],
  );
  const row = found.rows[0];
  if (!row) return null;
  return { sessionId, userId: row.user_id, email: row.email, idTokenHint: row.id_token_hint };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await query(`update app.app_session set revoked_at = now() where id = $1 and revoked_at is null`, [sessionId]);
}

export async function oimsOperatorsForUser(userId: string, mode: 'bus' | 'ferry') {
  const { rows } = await query<{ id: string; name: string }>(
    `select o.id, o.name
       from app.staff_assignment a
       join app.operator o on o.id = a.operator_id
      where a.user_id = $1
        and a.kind = 'oims'
        and a.status = 'active'
        and o.mode = $2
        and o.status = 'active'
        and o.pipeline_status = 'active'
      order by o.name`,
    [userId, mode],
  );
  return rows;
}

export async function hasOimsAssignment(userId: string, operatorId: string): Promise<boolean> {
  const found = await query(
    `select 1 from app.staff_assignment a
       join app.operator o on o.id = a.operator_id
      where a.user_id = $1 and a.kind = 'oims' and a.operator_id = $2 and a.status = 'active'
        and o.pipeline_status = 'active' and o.mode in ('bus', 'ferry')`,
    [userId, operatorId],
  );
  return Boolean(found.rowCount);
}

export async function hasHimsDesk(userId: string, desk: 'finance' | 'admin'): Promise<boolean> {
  const found = await query(
    `select 1 from app.staff_assignment
      where user_id = $1 and kind = 'hims' and hims_desk = $2 and status = 'active'`,
    [userId, desk],
  );
  if (found.rowCount) return true;
  const { hasHqPermission } = await import('@/server/hims/org');
  if (desk === 'admin') return hasHqPermission(userId, 'hq.approvals.decide');
  return hasHqPermission(userId, 'hq.finance.propose') || hasHqPermission(userId, 'hq.finance.view');
}

export async function hasHimsAssignment(userId: string): Promise<boolean> {
  const found = await query(
    `select 1 from app.staff_assignment where user_id = $1 and kind = 'hims' and status = 'active'`,
    [userId],
  );
  return Boolean(found.rowCount);
}
