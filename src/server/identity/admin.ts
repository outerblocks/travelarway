/**
 * Keycloak Admin REST, used only from the BFF. Browsers never call this.
 * Partner passwords chosen on Travelar forms are set here; Travelar does not store hashes.
 */
import { identityConfig } from '@/server/identity/live';

export class IdentityAdminUnavailableError extends Error {
  constructor() {
    super('identity_admin_unavailable');
  }
}

function masterIssuer(travelarIssuer: string): string {
  const fromEnv = process.env.KEYCLOAK_ADMIN_ISSUER?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const origin = travelarIssuer.split('/realms/')[0];
  return origin ? `${origin}/realms/master` : '';
}

function adminClient() {
  const id = process.env.KEYCLOAK_ADMIN_CLIENT_ID?.trim() || process.env.KEYCLOAK_CLIENT_ID?.trim();
  const secret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET?.trim() || process.env.KEYCLOAK_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new IdentityAdminUnavailableError();
  return { id, secret };
}

let cached: { token: string; exp: number } | null = null;

async function tokenRequest(url: string, body: URLSearchParams): Promise<string | null> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { access_token?: string };
  return payload.access_token ?? null;
}

async function adminToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 15_000) return cached.token;
  const { issuer } = identityConfig();
  const user = process.env.KEYCLOAK_ADMIN?.trim();
  const password = process.env.KEYCLOAK_ADMIN_PASSWORD?.trim();
  const master = masterIssuer(issuer);
  let access: string | null = null;
  if (user && password && master) {
    access = await tokenRequest(`${master}/protocol/openid-connect/token`, new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: user,
      password,
    }));
  }
  if (!access) {
    const { id, secret } = adminClient();
    access = await tokenRequest(`${issuer}/protocol/openid-connect/token`, new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    }));
  }
  if (!access) throw new IdentityAdminUnavailableError();
  cached = { token: access, exp: Date.now() + 50_000 };
  return access;
}

function adminBase(): string {
  const { issuer } = identityConfig();
  const parts = issuer.split('/realms/');
  const realm = parts[1];
  if (!parts[0] || !realm) throw new IdentityAdminUnavailableError();
  return `${parts[0]}/admin/realms/${realm}`;
}

async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await adminToken();
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${token}`);
  headers.set('accept', 'application/json');
  if (init.body) headers.set('content-type', 'application/json');
  return fetch(`${adminBase()}${path}`, { ...init, headers });
}

export async function findKeycloakUser(email: string): Promise<string | null> {
  const response = await adminFetch(`/users?email=${encodeURIComponent(email)}&exact=true`);
  if (!response.ok) throw new IdentityAdminUnavailableError();
  const rows = (await response.json()) as { id?: string }[];
  return rows[0]?.id ?? null;
}

export async function getKeycloakUser(id: string): Promise<{ id: string; enabled: boolean; email?: string }> {
  const response = await adminFetch(`/users/${id}`);
  if (!response.ok) throw new IdentityAdminUnavailableError();
  return (await response.json()) as { id: string; enabled: boolean; email?: string };
}

export const STAFF_OTP_ACTION = 'CONFIGURE_TOTP';

export function keycloakCreateUserBody(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  requireOtp?: boolean;
}): Record<string, unknown> {
  return {
    username: input.email,
    email: input.email,
    enabled: input.enabled,
    emailVerified: false,
    firstName: input.firstName ?? '',
    lastName: input.lastName ?? '',
    requiredActions: input.requireOtp ? [STAFF_OTP_ACTION] : [],
  };
}

/** Profile writes must not clear CONFIGURE_TOTP or an enrolled OTP credential. */
export function keycloakProfileUpdateBody(
  user: Record<string, unknown>,
  firstName: string,
  lastName: string,
): Record<string, unknown> {
  const { requiredActions: _ignored, ...rest } = user;
  return { ...rest, firstName, lastName, emailVerified: true };
}

export async function createKeycloakUser(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  requireOtp?: boolean;
}): Promise<string> {
  const response = await adminFetch('/users', {
    method: 'POST',
    body: JSON.stringify(keycloakCreateUserBody(input)),
  });
  if (response.status === 409) {
    const existing = await findKeycloakUser(input.email);
    if (existing) return existing;
    throw new Error('duplicate_email');
  }
  if (response.status !== 201) throw new IdentityAdminUnavailableError();
  const id = (response.headers.get('location') ?? '').split('/').pop();
  if (!id) throw new IdentityAdminUnavailableError();
  return id;
}

export async function setKeycloakPassword(userId: string, password: string): Promise<void> {
  const response = await adminFetch(`/users/${userId}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ type: 'password', value: password, temporary: false }),
  });
  if (!response.ok) throw new IdentityAdminUnavailableError();
}

export async function setKeycloakEnabled(userId: string, enabled: boolean): Promise<void> {
  const current = await adminFetch(`/users/${userId}`);
  if (!current.ok) throw new IdentityAdminUnavailableError();
  const user = (await current.json()) as Record<string, unknown>;
  const response = await adminFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...user, enabled }),
  });
  if (!response.ok) throw new IdentityAdminUnavailableError();
}

export async function updateKeycloakProfile(userId: string, firstName: string, lastName: string): Promise<void> {
  const current = await adminFetch(`/users/${userId}`);
  if (!current.ok) throw new IdentityAdminUnavailableError();
  const user = (await current.json()) as Record<string, unknown>;
  const response = await adminFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(keycloakProfileUpdateBody(user, firstName, lastName)),
  });
  if (!response.ok) throw new IdentityAdminUnavailableError();
}

export async function requireStaffOtp(userId: string): Promise<void> {
  const current = await adminFetch(`/users/${userId}`);
  if (!current.ok) throw new IdentityAdminUnavailableError();
  const user = (await current.json()) as Record<string, unknown>;
  const actions = Array.isArray(user.requiredActions)
    ? user.requiredActions.map((item) => String(item))
    : [];
  if (!actions.includes(STAFF_OTP_ACTION)) actions.push(STAFF_OTP_ACTION);
  const response = await adminFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...user, requiredActions: actions }),
  });
  if (!response.ok) throw new IdentityAdminUnavailableError();
}
