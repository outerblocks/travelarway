import { authorizeUrl, endSessionUrl, exchangeCode, verifyIdToken } from '@/server/identity/oidc';
import { newCodeVerifier, newStateNonce } from '@/server/identity/pkce';
import {
  clearCookieHeader,
  cookieHeader,
  OIDC_STATE_COOKIE,
  readSignedCookie,
  SESSION_COOKIE,
} from '@/server/identity/cookies';
import { identityConfig } from '@/server/identity/live';
import { parseIntent, sanitizeLoginHint, sanitizeReturnTo, type AuthIntent } from '@/server/identity/return-to';
import { createAppSession, revokeSession, sessionFromRequest, upsertUserFromIdp } from '@/server/identity/sessions';

interface OidcState {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
  intent: AuthIntent;
}

function encodeState(value: OidcState): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decodeState(raw: string): OidcState | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as OidcState;
    if (!parsed.state || !parsed.nonce || !parsed.verifier) return null;
    parsed.intent = parseIntent(parsed.intent);
    parsed.returnTo = sanitizeReturnTo(parsed.returnTo, parsed.intent);
    return parsed;
  } catch {
    return null;
  }
}

export async function loginRedirect(request: Request): Promise<Response> {
  identityConfig();
  const url = new URL(request.url);
  const intent = parseIntent(url.searchParams.get('intent'));
  const returnTo = sanitizeReturnTo(url.searchParams.get('returnTo'), intent);
  const loginHint = sanitizeLoginHint(url.searchParams.get('loginHint'));
  const register = url.searchParams.get('action') === 'register';
  const packed: OidcState = {
    state: newStateNonce(),
    nonce: newStateNonce(),
    verifier: newCodeVerifier(),
    returnTo,
    intent,
  };
  const location = await authorizeUrl({
    state: packed.state,
    nonce: packed.nonce,
    verifier: packed.verifier,
    intent,
    loginHint,
    register,
  });
  return new Response(null, {
    status: 302,
    headers: {
      location,
      'cache-control': 'no-store',
      'set-cookie': cookieHeader(OIDC_STATE_COOKIE, encodeState(packed), 600),
    },
  });
}

export async function callbackRedirect(request: Request): Promise<Response> {
  identityConfig();
  const url = new URL(request.url);
  if (url.searchParams.get('error')) {
    return Response.json({ error: 'oidc_denied' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  }
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const packedRaw = readSignedCookie(request, OIDC_STATE_COOKIE);
  const packed = packedRaw ? decodeState(packedRaw) : null;
  if (!code || !state || !packed || packed.state !== state) {
    return Response.json({ error: 'oidc_state_mismatch' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  }
  const tokens = await exchangeCode(code, packed.verifier);
  const claims = await verifyIdToken(tokens.id_token, packed.nonce);
  const email = typeof claims.email === 'string' ? claims.email : null;
  const userId = await upsertUserFromIdp(identityConfig().issuer, claims.sub, email);
  const created = await createAppSession(userId, tokens.id_token);
  const headers = new Headers({ location: packed.returnTo, 'cache-control': 'no-store' });
  headers.append('set-cookie', created.cookie);
  headers.append('set-cookie', clearCookieHeader(OIDC_STATE_COOKIE));
  return new Response(null, { status: 302, headers });
}

export async function logoutRedirect(request: Request): Promise<Response> {
  const session = await sessionFromRequest(request);
  if (session) await revokeSession(session.sessionId);
  const origin = new URL(request.url).origin;
  let location = `${origin}/`;
  if (session?.idTokenHint) {
    const end = await endSessionUrl(session.idTokenHint, `${origin}/`);
    if (end) location = end;
  }
  const headers = new Headers({ location, 'cache-control': 'no-store' });
  headers.append('set-cookie', clearCookieHeader(SESSION_COOKIE));
  headers.append('set-cookie', clearCookieHeader(OIDC_STATE_COOKIE));
  return new Response(null, { status: 302, headers });
}
