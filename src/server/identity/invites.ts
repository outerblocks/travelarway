import { createHash, randomBytes } from 'node:crypto';
import { query, withTransaction } from '@/server/db';
import { isFinanceMode } from '@/domain/finance-modes';
import { sanitizeLoginHint } from '@/server/identity/return-to';
import { assertPasswordPolicy } from '@/server/identity/passwords';
import {
  createKeycloakUser,
  findKeycloakUser,
  getKeycloakUser,
  requireStaffOtp,
  setKeycloakEnabled,
  setKeycloakPassword,
  updateKeycloakProfile,
} from '@/server/identity/admin';
import { identityConfig } from '@/server/identity/live';
import { createAppSession, upsertUserFromIdp } from '@/server/identity/sessions';
import { loginWithPassword, verifyPassword } from '@/server/identity/password-login';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function splitName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/);
  return { firstName: parts[0] ?? 'Partner', lastName: parts.slice(1).join(' ') || 'Operator' };
}

export async function inviteOperatorAdmin(input: {
  actorUserId: string;
  email: string;
  displayName: string;
  operatorId?: string;
  operatorName?: string;
  mode: string;
  countryCode: string;
  currency: string;
}): Promise<{ inviteId: string; operatorId: string; acceptPath: string; email: string }> {
  const email = sanitizeLoginHint(input.email);
  if (!email) throw new Error('invalid_email');
  if (!isFinanceMode(input.mode)) throw new Error('invalid_mode');
  const country = input.countryCode.trim().toUpperCase();
  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z]{3}$/.test(currency)) throw new Error('invalid_geography');

  const existingId = await findKeycloakUser(email);
  let subject: string;
  if (existingId) {
    const existing = await getKeycloakUser(existingId);
    if (existing.enabled) throw new Error('invalid_already_registered');
    subject = existingId;
  } else {
    subject = await createKeycloakUser({
      email,
      ...splitName(input.displayName),
      enabled: false,
      requireOtp: true,
    });
  }

  const userId = await upsertUserFromIdp(identityConfig().issuer, subject, email);
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const result = await withTransaction(async (client) => {
    const operatorId = input.operatorId;
    if (!operatorId) throw new Error('invalid_operator_id');
    const found = await client.query(`select id, pipeline_status from app.operator where id = $1 and mode = $2`, [operatorId, input.mode]);
    if (!found.rowCount) throw new Error('invalid_operator_id');
    const { assertOperatorActiveForInvite } = await import('@/server/oims/permissions');
    assertOperatorActiveForInvite(String(found.rows[0]?.pipeline_status ?? ''));

    const existing = await client.query(
      `select status from app.staff_assignment
        where user_id = $1 and operator_id = $2 and kind = 'oims'`,
      [userId, operatorId],
    );
    const status = existing.rows[0]?.status;
    if (status === 'active') throw new Error('invalid_already_member');
    const roleId = 'c0000000-0000-4000-8000-000000000011';
    if (!status) {
      await client.query(
        `insert into app.staff_assignment (user_id, kind, operator_id, status, role_id)
         values ($1, 'oims', $2, 'pending', $3)`,
        [userId, operatorId, roleId],
      );
    }

    const invite = await client.query<{ id: string }>(
      `insert into app.staff_invite (
         email, kind, operator_id, user_id, keycloak_subject, token_hash, invited_by, expires_at, role_id
       ) values ($1, 'oims', $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [email, operatorId, userId, subject, tokenHash, input.actorUserId, expires.toISOString(), roleId],
    );
    return { inviteId: invite.rows[0]!.id, operatorId: operatorId! };
  });

  return {
    ...result,
    email,
    acceptPath: `/invite/accept?token=${token}`,
  };
}

export async function inviteOperatorStaff(input: {
  actorUserId: string;
  operatorId: string;
  email: string;
  displayName: string;
  roleId: string;
  mode: 'bus' | 'ferry';
}): Promise<{ inviteId: string; operatorId: string; acceptPath: string; email: string }> {
  const { isOimsRoleId } = await import('@/server/oims/permissions');
  if (!isOimsRoleId(input.roleId)) throw new Error('invalid_role');
  return inviteOperatorAdmin({
    actorUserId: input.actorUserId,
    email: input.email,
    displayName: input.displayName,
    operatorId: input.operatorId,
    mode: input.mode,
    countryCode: 'TZ',
    currency: input.mode === 'bus' ? 'TZS' : 'USD',
  }).then(async (result) => {
    await query(
      `update app.staff_assignment set role_id = $3
        where user_id = (select user_id from app.staff_invite where id = $1)
          and operator_id = $2 and kind = 'oims'`,
      [result.inviteId, result.operatorId, input.roleId],
    );
    await query(`update app.staff_invite set role_id = $2 where id = $1`, [result.inviteId, input.roleId]);
    return result;
  });
}

const TZ_MARKET = 'a0000000-0000-4000-8000-000000000001';

export async function inviteHimsStaff(input: {
  actorUserId: string;
  email: string;
  displayName: string;
  roleId: string;
  departmentId: string;
  marketId?: string;
}): Promise<{ inviteId: string; acceptPath: string; email: string }> {
  const email = sanitizeLoginHint(input.email);
  if (!email) throw new Error('invalid_email');
  const existingId = await findKeycloakUser(email);
  let subject: string;
  if (existingId) {
    const existing = await getKeycloakUser(existingId);
    if (existing.enabled) throw new Error('invalid_already_registered');
    subject = existingId;
  } else {
    subject = await createKeycloakUser({
      email,
      ...splitName(input.displayName),
      enabled: false,
      requireOtp: true,
    });
  }
  const userId = await upsertUserFromIdp(identityConfig().issuer, subject, email);
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const marketId = input.marketId || TZ_MARKET;
  const desk = await query<{ code: string }>(`select code from app.role where id = $1`, [input.roleId]);
  if (!desk.rowCount) throw new Error('invalid_role');
  const roleCode = desk.rows[0]?.code ?? '';
  const himsDesk = roleCode === 'hq_finance_analyst' ? 'finance' : roleCode === 'hq_finance_controller' || roleCode === 'hq_admin' ? 'admin' : null;

  const invite = await withTransaction(async (client) => {
    const existing = await client.query(
      `select status from app.staff_assignment where user_id = $1 and kind = 'hims'`,
      [userId],
    );
    const status = existing.rows[0]?.status;
    if (status === 'active') throw new Error('invalid_already_member');
    if (!status) {
      await client.query(
        `insert into app.staff_assignment (user_id, kind, hims_desk, status, role_id, department_id, market_id)
         values ($1, 'hims', $2, 'pending', $3, $4, $5)`,
        [userId, himsDesk, input.roleId, input.departmentId, marketId],
      );
    }
    const created = await client.query<{ id: string }>(
      `insert into app.staff_invite (
         email, kind, operator_id, hims_desk, user_id, keycloak_subject, token_hash, invited_by, expires_at, role_id, department_id, market_id
       ) values ($1, 'hims', null, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning id`,
      [email, himsDesk, userId, subject, tokenHash, input.actorUserId, expires.toISOString(), input.roleId, input.departmentId, marketId],
    );
    return created.rows[0]!.id;
  });
  return { inviteId: invite, email, acceptPath: `/invite/accept?token=${token}` };
}

export async function loadInvitePreview(token: string) {
  if (!/^[0-9a-f]{64}$/i.test(token)) throw new Error('invalid_invite');
  const found = await query<{
    email: string;
    operator_name: string | null;
    mode: string | null;
    kind: string;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
  }>(
    `select i.email, i.kind, o.name as operator_name, o.mode, i.expires_at::text, i.accepted_at::text, i.revoked_at::text
       from app.staff_invite i
       left join app.operator o on o.id = i.operator_id
      where i.token_hash = $1`,
    [hashToken(token)],
  );
  const row = found.rows[0];
  if (!row) throw new Error('invalid_invite');
  if (row.revoked_at) throw new Error('invite_revoked');
  if (row.accepted_at) throw new Error('invite_accepted');
  if (new Date(row.expires_at).getTime() <= Date.now()) throw new Error('invite_expired');
  return {
    email: row.email,
    operatorName: row.operator_name ?? (row.kind === 'hims' ? 'Travelar HQ' : ''),
    mode: row.mode ?? 'hq',
    kind: row.kind,
  };
}

export async function acceptInvite(input: {
  token: string;
  password: string;
  displayName: string;
}): Promise<{ cookie: string; operatorId: string; mode: string }> {
  assertPasswordPolicy(input.password, 'staff');
  if (!/^[0-9a-f]{64}$/i.test(input.token)) throw new Error('invalid_invite');
  const preview = await loadInvitePreview(input.token);
  const found = await query<{
    id: string;
    user_id: string;
    operator_id: string | null;
    kind: string;
    keycloak_subject: string;
    mode: string | null;
  }>(
    `select i.id, i.user_id, i.operator_id, i.kind, i.keycloak_subject, o.mode
       from app.staff_invite i
       left join app.operator o on o.id = i.operator_id
      where i.token_hash = $1`,
    [hashToken(input.token)],
  );
  const row = found.rows[0];
  if (!row) throw new Error('invalid_invite');
  const names = splitName(input.displayName || preview.email);
  await setKeycloakPassword(row.keycloak_subject, input.password);
  await updateKeycloakProfile(row.keycloak_subject, names.firstName, names.lastName);
  await requireStaffOtp(row.keycloak_subject);
  await setKeycloakEnabled(row.keycloak_subject, true);
  await withTransaction(async (client) => {
    await client.query(
      `update app.staff_invite set accepted_at = now() where id = $1 and accepted_at is null`,
      [row.id],
    );
    if (row.kind === 'oims' && row.operator_id) {
      await client.query(
        `update app.staff_assignment set status = 'active'
          where user_id = $1 and operator_id = $2 and kind = 'oims'`,
        [row.user_id, row.operator_id],
      );
    } else {
      await client.query(
        `update app.staff_assignment set status = 'active'
          where user_id = $1 and kind = 'hims'`,
        [row.user_id],
      );
    }
  });
  try {
    const session = await loginWithPassword(preview.email, input.password);
    return { cookie: session.cookie, operatorId: row.operator_id ?? '', mode: row.mode ?? 'hq' };
  } catch {
    const created = await createAppSession(row.user_id, null);
    return { cookie: created.cookie, operatorId: row.operator_id ?? '', mode: row.mode ?? 'hq' };
  }
}

export async function listInvites() {
  const { rows } = await query(
    `select i.id, i.email, i.kind, o.name as "operatorName", o.mode, i.expires_at as "expiresAt",
            i.accepted_at as "acceptedAt", i.revoked_at as "revokedAt", i.created_at as "createdAt"
       from app.staff_invite i
       left join app.operator o on o.id = i.operator_id
      order by i.created_at desc
      limit 100`,
  );
  return { data: rows };
}

export async function registerPassenger(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ cookie: string }> {
  const email = sanitizeLoginHint(input.email);
  if (!email) throw new Error('invalid_email');
  assertPasswordPolicy(input.password, 'passenger');
  const pendingInvite = await query(
    `select 1 from app.staff_invite
      where lower(email) = lower($1) and accepted_at is null and revoked_at is null and expires_at > now()`,
    [email],
  );
  if (pendingInvite.rowCount) throw new Error('invalid_use_invite');
  const names = splitName(input.displayName);
  const subject = await createKeycloakUser({ email, ...names, enabled: true, requireOtp: false });
  await setKeycloakPassword(subject, input.password);
  await updateKeycloakProfile(subject, names.firstName, names.lastName);
  return { cookie: (await loginWithPassword(email, input.password)).cookie };
}

export async function changePassword(userId: string, email: string, current: string, next: string): Promise<void> {
  assertPasswordPolicy(next, 'staff');
  await verifyPassword(email, current);
  const found = await query<{ subject: string }>(
    `select subject from app.external_identity where user_id = $1 order by created_at desc limit 1`,
    [userId],
  );
  const subject = found.rows[0]?.subject;
  if (!subject) throw new Error('identity_missing');
  await setKeycloakPassword(subject, next);
}
