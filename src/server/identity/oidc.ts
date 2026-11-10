import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { identityConfig } from '@/server/identity/live';
import { codeChallenge } from '@/server/identity/pkce';

interface Discovery {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
}

let discoveryCache: { at: number; doc: Discovery } | null = null;
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export async function oidcDiscovery(): Promise<Discovery> {
  const { issuer } = identityConfig();
  if (discoveryCache && Date.now() - discoveryCache.at < 300_000) return discoveryCache.doc;
  const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error('oidc_discovery_failed');
  const doc = (await response.json()) as Discovery;
  if (!doc.authorization_endpoint || !doc.token_endpoint || !doc.jwks_uri) {
    throw new Error('oidc_discovery_incomplete');
  }
  discoveryCache = { at: Date.now(), doc };
  jwks = createRemoteJWKSet(new URL(doc.jwks_uri));
  return doc;
}

export function authorizeUrl(input: {
  state: string;
  nonce: string;
  verifier: string;
  intent: string;
  loginHint?: string;
  register?: boolean;
}): Promise<string> {
  return oidcDiscovery().then((doc) => {
    const { clientId, redirectUri } = identityConfig();
    const url = new URL(doc.authorization_endpoint);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid profile email');
    url.searchParams.set('state', input.state);
    url.searchParams.set('nonce', input.nonce);
    url.searchParams.set('code_challenge', codeChallenge(input.verifier));
    url.searchParams.set('code_challenge_method', 'S256');
    if (input.loginHint) url.searchParams.set('login_hint', input.loginHint);
    if (input.register) url.searchParams.set('kc_action', 'register');
    void input.intent;
    return url.toString();
  });
}

export async function passwordGrant(username: string, password: string): Promise<{
  access_token: string;
  id_token?: string;
}> {
  const doc = await oidcDiscovery();
  const { clientId, clientSecret } = identityConfig();
  const response = await fetch(doc.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'openid profile email',
    }),
  });
  if (response.status === 401 || response.status === 400) throw new Error('invalid_credentials');
  if (!response.ok) throw new Error('oidc_token_exchange_failed');
  const tokens = (await response.json()) as { access_token?: string; id_token?: string };
  if (!tokens.access_token) throw new Error('oidc_tokens_missing');
  return { access_token: tokens.access_token, id_token: tokens.id_token };
}

export async function verifyBearerToken(token: string): Promise<JWTPayload & { email?: string; sub: string }> {
  const { issuer, audience } = identityConfig();
  if (!jwks) await oidcDiscovery();
  const { payload } = await jwtVerify(token, jwks!, { issuer, clockTolerance: 5 });
  const aud = payload.aud;
  const azp = payload.azp;
  const audOk = aud === audience
    || (Array.isArray(aud) && aud.includes(audience))
    || azp === audience;
  if (!audOk) throw new Error('oidc_aud_mismatch');
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('oidc_sub_missing');
  return payload as JWTPayload & { email?: string; sub: string };
}

export async function exchangeCode(code: string, verifier: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
}> {
  const doc = await oidcDiscovery();
  const { clientId, clientSecret, redirectUri } = identityConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: verifier,
  });
  const response = await fetch(doc.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body,
  });
  if (!response.ok) throw new Error('oidc_token_exchange_failed');
  const tokens = (await response.json()) as { access_token?: string; id_token?: string; refresh_token?: string };
  if (!tokens.access_token || !tokens.id_token) throw new Error('oidc_tokens_missing');
  return { access_token: tokens.access_token, id_token: tokens.id_token, refresh_token: tokens.refresh_token };
}

export async function verifyIdToken(idToken: string, nonce: string): Promise<JWTPayload & { email?: string; sub: string }> {
  const { issuer, audience } = identityConfig();
  if (!jwks) await oidcDiscovery();
  const { payload } = await jwtVerify(idToken, jwks!, {
    issuer,
    audience,
  });
  if (nonce && payload.nonce !== nonce) throw new Error('oidc_nonce_mismatch');
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('oidc_sub_missing');
  return payload as JWTPayload & { email?: string; sub: string };
}

export async function endSessionUrl(idTokenHint: string, postLogout: string): Promise<string | null> {
  const doc = await oidcDiscovery();
  if (!doc.end_session_endpoint) return null;
  const { clientId } = identityConfig();
  const url = new URL(doc.end_session_endpoint);
  url.searchParams.set('id_token_hint', idTokenHint);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('post_logout_redirect_uri', postLogout);
  return url.toString();
}
