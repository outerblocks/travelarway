/**
 * Keycloak is live only when issuer, audience, client, redirect and a session
 * MAC key are all present. The issuer URL alone does not open staff APIs.
 */
export class IdentityNotConfiguredError extends Error {
  constructor() {
    super('staff_identity_not_configured');
  }
}

export class SessionRequiredError extends Error {
  constructor() {
    super('session_required');
  }
}

export function identityLive(): boolean {
  const issuer = process.env.KEYCLOAK_ISSUER?.trim();
  const audience = process.env.KEYCLOAK_AUDIENCE?.trim();
  const clientId = process.env.KEYCLOAK_CLIENT_ID?.trim();
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET?.trim();
  const redirect = process.env.KEYCLOAK_REDIRECT_URI?.trim();
  const session = process.env.AUTH_SESSION_SECRET?.trim() ?? '';
  const min = (process.env.APP_ENV ?? 'development') === 'production' ? 32 : 16;
  return Boolean(issuer && audience && clientId && clientSecret && redirect && session.length >= min);
}

export function requireIdentityLive(): void {
  if (!identityLive()) throw new IdentityNotConfiguredError();
}

export function identityConfig() {
  requireIdentityLive();
  return {
    issuer: process.env.KEYCLOAK_ISSUER!.trim().replace(/\/$/, ''),
    audience: process.env.KEYCLOAK_AUDIENCE!.trim(),
    clientId: process.env.KEYCLOAK_CLIENT_ID!.trim(),
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!.trim(),
    redirectUri: process.env.KEYCLOAK_REDIRECT_URI!.trim(),
    sessionSecret: process.env.AUTH_SESSION_SECRET!.trim(),
    appEnv: (process.env.APP_ENV ?? 'development').toLowerCase(),
  };
}
