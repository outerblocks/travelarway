/**
 * Sabre Mosaic / hotel / rail configuration.
 *
 * Mosaic air, hotel and rail are separate products (ADR-GDS-004). CERT and production
 * are separate environments. Absent or SABRE_ENABLED=false means the adapter never
 * leaves this process. Live shop/book remains off until a PROVEN registry row exists
 * and SABRE_LIVE_SHOP is explicitly true.
 */

const MIN_SECRET_LENGTH = 8;

export type SabreEnvironment = 'CERT' | 'PRODUCTION';

export interface SabreConfig {
  environment: SabreEnvironment;
  clientId: string;
  clientSecret: string;
  pcc?: string;
  epr?: string;
  authBaseUrl: string;
  restBaseUrl: string;
  liveShop: boolean;
}

const HOSTS: Record<SabreEnvironment, { auth: string; rest: string }> = {
  CERT: {
    auth: 'https://api.cert.platform.sabre.com',
    rest: 'https://api.cert.platform.sabre.com',
  },
  PRODUCTION: {
    auth: 'https://api.platform.sabre.com',
    rest: 'https://api.platform.sabre.com',
  },
};

function trimmed(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  return raw ? raw : undefined;
}

function secret(name: string): string | undefined {
  const raw = trimmed(name);
  return raw && raw.length >= MIN_SECRET_LENGTH ? raw : undefined;
}

export function readSabreConfig(): SabreConfig | null {
  const enabled = (trimmed('SABRE_ENABLED') ?? 'false').toLowerCase() === 'true';
  if (!enabled) return null;

  const clientId = trimmed('SABRE_CLIENT_ID');
  const clientSecret = secret('SABRE_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('SABRE_ENABLED is true but SABRE_CLIENT_ID or SABRE_CLIENT_SECRET is missing or too short');
  }

  const rawEnvironment = (trimmed('SABRE_ENVIRONMENT') ?? 'CERT').toUpperCase();
  if (rawEnvironment !== 'CERT' && rawEnvironment !== 'PRODUCTION') {
    throw new Error("SABRE_ENVIRONMENT must be exactly 'CERT' or 'PRODUCTION'");
  }
  const environment: SabreEnvironment = rawEnvironment;
  const hosts = HOSTS[environment];
  const liveShop = (trimmed('SABRE_LIVE_SHOP') ?? 'false').toLowerCase() === 'true';

  return {
    environment,
    clientId,
    clientSecret,
    pcc: trimmed('SABRE_PCC'),
    epr: trimmed('SABRE_EPR'),
    authBaseUrl: trimmed('SABRE_AUTH_BASE_URL') ?? hosts.auth,
    restBaseUrl: trimmed('SABRE_REST_BASE_URL') ?? hosts.rest,
    liveShop,
  };
}

export function sabreConfig(): SabreConfig | null {
  return readSabreConfig();
}
