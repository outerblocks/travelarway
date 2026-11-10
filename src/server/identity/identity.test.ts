import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { codeChallenge, newCodeVerifier } from '@/server/identity/pkce';
import { identityLive, requireIdentityLive, IdentityNotConfiguredError } from '@/server/identity/live';
import { parseIntent, sanitizeLoginHint, sanitizeReturnTo } from '@/server/identity/return-to';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';
import {
  keycloakCreateUserBody,
  keycloakProfileUpdateBody,
  STAFF_OTP_ACTION,
} from '@/server/identity/admin';

const KEYS = [
  'KEYCLOAK_ISSUER',
  'KEYCLOAK_AUDIENCE',
  'KEYCLOAK_CLIENT_ID',
  'KEYCLOAK_CLIENT_SECRET',
  'KEYCLOAK_REDIRECT_URI',
  'AUTH_SESSION_SECRET',
  'APP_ENV',
] as const;

function clearIdentityEnv() {
  for (const key of KEYS) delete process.env[key];
}

beforeEach(() => {
  clearIdentityEnv();
});

afterEach(() => {
  clearIdentityEnv();
});

describe('identityLive', () => {
  it('is closed until every OIDC field and the session MAC are set', () => {
    expect(identityLive()).toBe(false);
    expect(() => requireIdentityLive()).toThrow(IdentityNotConfiguredError);
  });

  it('opens only with issuer, audience, client, secret, redirect and a long session key', () => {
    process.env.APP_ENV = 'test';
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/travelar';
    process.env.KEYCLOAK_AUDIENCE = 'travelar-bff';
    process.env.KEYCLOAK_CLIENT_ID = 'travelar-bff';
    process.env.KEYCLOAK_CLIENT_SECRET = 'travelar-dev-oidc-secret-change-me';
    process.env.KEYCLOAK_REDIRECT_URI = 'http://localhost:3000/api/auth/callback';
    process.env.AUTH_SESSION_SECRET = 'travelar-auth-session-dev';
    expect(identityLive()).toBe(true);
  });

  it('does not treat issuer alone as live', () => {
    process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/travelar';
    expect(identityLive()).toBe(false);
    expect(refuseStaffUntilIdentityConfigured().status).toBe(503);
  });
});

describe('PKCE', () => {
  it('emits an S256 challenge that is not the verifier', () => {
    const verifier = newCodeVerifier();
    const challenge = codeChallenge(verifier);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).not.toBe(verifier);
    expect(challenge).toHaveLength(43);
  });
});

describe('returnTo', () => {
  it('rejects open redirects', () => {
    expect(sanitizeReturnTo('https://evil.example/', 'passenger')).toBe('/');
    expect(sanitizeReturnTo('//evil.example', 'oims')).toBe('/operator/bus');
    expect(sanitizeReturnTo('/hq', 'passenger')).toBe('/');
    expect(parseIntent('hims')).toBe('hims');
    expect(sanitizeReturnTo('/operator/bus', 'oims')).toBe('/operator/bus');
  });
});

describe('staff OTP', () => {
  it('queues TOTP for staff users and not for passengers', () => {
    expect(keycloakCreateUserBody({ email: 'staff@example.com', enabled: false, requireOtp: true }).requiredActions).toEqual([
      STAFF_OTP_ACTION,
    ]);
    expect(keycloakCreateUserBody({ email: 'guest@example.com', enabled: true, requireOtp: false }).requiredActions).toEqual([]);
  });

  it('does not wipe requiredActions on profile update', () => {
    const next = keycloakProfileUpdateBody(
      { id: 'kc-1', requiredActions: [STAFF_OTP_ACTION], email: 'staff@example.com' },
      'Ada',
      'Lovelace',
    );
    expect(next).not.toHaveProperty('requiredActions');
    expect(next.firstName).toBe('Ada');
  });
});

describe('loginHint', () => {
  it('accepts a normal email and rejects header injection', () => {
    expect(sanitizeLoginHint('ada@example.com')).toBe('ada@example.com');
    expect(sanitizeLoginHint('not-an-email')).toBeUndefined();
    expect(sanitizeLoginHint('ada@example.com\nCc:evil@example.com')).toBeUndefined();
  });
});
