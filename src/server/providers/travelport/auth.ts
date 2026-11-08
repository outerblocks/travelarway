import { readTravelportConfig, type TravelportConfig } from '@/server/travelport/config';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cache: CachedToken | null = null;
let inflight: Promise<string> | null = null;

export function resetTravelportAuthCache(): void {
  cache = null;
  inflight = null;
}

/**
 * Password grant with all four identity fields in the body, matching the v11 DevKit.
 * client_credentials mints a token that the shopping API then refuses.
 */
export async function getTravelportToken(
  config: TravelportConfig = requiredConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const now = Date.now();
  if (cache && cache.expiresAt - now > 0) return cache.accessToken;
  if (inflight) return inflight;

  inflight = mint(config, fetchImpl).finally(() => {
    inflight = null;
  });
  return inflight;
}

async function mint(config: TravelportConfig, fetchImpl: typeof fetch): Promise<string> {
  if (!config.username || !config.password) {
    throw new Error('Travelport password grant needs TRAVELPORT_USERNAME and TRAVELPORT_PASSWORD');
  }

  const response = await fetchImpl(`${config.authBaseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
      'cache-control': 'no-cache',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: config.username,
      password: config.password,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString(),
    cache: 'no-store',
  });

  const text = await response.text();
  let parsed: { access_token?: string; expires_in?: number } | null = null;
  try {
    parsed = JSON.parse(text) as { access_token?: string; expires_in?: number };
  } catch {
    parsed = null;
  }
  if (!response.ok || !parsed?.access_token) {
    throw new Error('travelport_token_failed');
  }

  const expiresInMs = Math.max(60, Number(parsed.expires_in) || 86_400) * 1000;
  cache = {
    accessToken: parsed.access_token,
    expiresAt: Date.now() + Math.floor(expiresInMs * 0.9),
  };
  return cache.accessToken;
}

function requiredConfig(): TravelportConfig {
  const config = readTravelportConfig();
  if (!config) throw new Error('travelport_disabled');
  return config;
}
