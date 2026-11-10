import { passwordGrant, verifyBearerToken, verifyIdToken } from '@/server/identity/oidc';
import { identityConfig } from '@/server/identity/live';
import { createAppSession, upsertUserFromIdp } from '@/server/identity/sessions';
import { query } from '@/server/db';

export async function verifyPassword(email: string, password: string): Promise<{
  sub: string;
  email: string | null;
  idToken: string | null;
}> {
  const tokens = await passwordGrant(email, password);
  let sub: string;
  let tokenEmail: string | null = email;
  try {
    if (tokens.id_token) {
      const claims = await verifyIdToken(tokens.id_token, '');
      sub = claims.sub;
      if (typeof claims.email === 'string') tokenEmail = claims.email;
    } else {
      const claims = await verifyBearerToken(tokens.access_token);
      sub = claims.sub;
      if (typeof claims.email === 'string') tokenEmail = claims.email;
    }
  } catch {
    const claims = await verifyBearerToken(tokens.access_token);
    sub = claims.sub;
  }
  return { sub, email: tokenEmail, idToken: tokens.id_token ?? null };
}

export async function loginWithPassword(email: string, password: string): Promise<{ cookie: string; userId: string; email: string | null }> {
  const verified = await verifyPassword(email, password);
  const userId = await upsertUserFromIdp(identityConfig().issuer, verified.sub, verified.email);
  const pending = await query(
    `select 1 from app.staff_invite
      where user_id = $1 and accepted_at is null and revoked_at is null and expires_at > now()
      limit 1`,
    [userId],
  );
  if (pending.rowCount) throw new Error('invite_not_accepted');
  const created = await createAppSession(userId, verified.idToken);
  return { cookie: created.cookie, userId, email: verified.email };
}
