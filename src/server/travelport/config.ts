/**
 * Travelport TripServices configuration.
 *
 * Endpoints and variable names here come from the integration brief, not from recollection of
 * Travelport's marketing pages — the difference matters, because the pre-production hosts are
 * `*.pp.travelport.net` and a wrong host returns an authentication failure that looks like a
 * bad credential.
 *
 * **Nothing secret is logged.** A provider secret that reaches a log line has reached a log
 * aggregator, a support ticket and a terminal scrollback, and cannot be un-sent.
 *
 * **Absent means disabled.** When the provider is not configured, flights and stays answer
 * "not available". There is no fallback to sample data anywhere behind this gate.
 *
 * Two readiness levels are checked separately, because they genuinely differ:
 *
 *   - getting a token needs the client credentials only;
 *   - calling an API needs a PCC or access group on top, since that is what Travelport
 *     resolves inventory entitlement, forms of payment and ticketing authority from.
 *
 * Conflating them would mean either the token probe cannot run without a PCC, or a request
 * goes out with no branch and gets someone else's content.
 */

const MIN_SECRET_LENGTH = 8;

export type TravelportEnvironment = 'PREPROD' | 'PRODUCTION';

export interface TravelportConfig {
  environment: TravelportEnvironment;
  clientId: string;
  clientSecret: string;
  /** Supplied for some provisioning models; not every grant needs it. */
  username?: string;
  password?: string;
  /** Pseudo city code — the branch a reservation or ticket is issued against. */
  pcc?: string;
  accessGroup?: string;
  gds?: string;
  /** GDS, NDC, or both. Content source changes pricing and servicing rules, not just data. */
  contentSources: string[];
  authBaseUrl: string;
  flightsBaseUrl: string;
  staysV11BaseUrl: string;
  /** SearchComplete v12 is a gated capability, not an assumed default. */
  staysV12BaseUrl?: string;
  /** Provisioning label from Travelport, e.g. EMEA:UK. Not a request field. */
  region?: string;
  /** ISO country of the agency point of sale. UK in Travelport mail maps to GB. */
  pointOfSale?: string;
  currency?: string;
  gdsCarriers: string[];
  ndcCarriers: string[];
  /** Preferred | Permitted. Unset means do not send CarrierPreference. */
  carrierPreferenceType?: 'Preferred' | 'Permitted';
}

const HOSTS: Record<TravelportEnvironment, { auth: string; api: string }> = {
  PREPROD: { auth: 'https://auth.pp.travelport.net', api: 'https://api.pp.travelport.net' },
  PRODUCTION: { auth: 'https://auth.travelport.net', api: 'https://api.travelport.net' },
};

function trimmed(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  return raw ? raw : undefined;
}

function secret(name: string): string | undefined {
  const raw = trimmed(name);
  // A placeholder like "changeme" is worse than an empty value: it looks configured and
  // will fail at the worst moment, so short values are treated as not set.
  return raw && raw.length >= MIN_SECRET_LENGTH ? raw : undefined;
}

/**
 * Returns null when the provider is disabled or absent, and throws when it is half-configured.
 *
 * Half-configured is the dangerous state. A client id with no secret, or an unrecognised
 * environment string, produces confident-looking wrong answers rather than an obvious failure.
 */
export function readTravelportConfig(): TravelportConfig | null {
  const enabled = (trimmed('TRAVELPORT_ENABLED') ?? 'false').toLowerCase() === 'true';
  if (!enabled) return null;

  const clientId = trimmed('TRAVELPORT_CLIENT_ID');
  const clientSecret = secret('TRAVELPORT_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error(
      'TRAVELPORT_ENABLED is true but TRAVELPORT_CLIENT_ID or TRAVELPORT_CLIENT_SECRET is missing or too short',
    );
  }

  const rawEnvironment = (trimmed('TRAVELPORT_ENVIRONMENT') ?? '').toUpperCase();
  if (rawEnvironment !== 'PREPROD' && rawEnvironment !== 'PRODUCTION') {
    throw new Error("TRAVELPORT_ENVIRONMENT must be exactly 'PREPROD' or 'PRODUCTION'");
  }
  const environment: TravelportEnvironment = rawEnvironment;
  const hosts = HOSTS[environment];

  const market = parseTravelportMarket(trimmed('TRAVELPORT_REGION'), trimmed('TRAVELPORT_POINT_OF_SALE'));
  const currency = trimmed('TRAVELPORT_CURRENCY')?.toUpperCase();
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    throw new Error('TRAVELPORT_CURRENCY must be a 3-letter currency code');
  }
  const preferenceRaw = trimmed('TRAVELPORT_CARRIER_PREFERENCE');
  const carrierPreferenceType =
    preferenceRaw === undefined
      ? undefined
      : preferenceRaw.toLowerCase() === 'preferred'
        ? 'Preferred'
        : preferenceRaw.toLowerCase() === 'permitted'
          ? 'Permitted'
          : (() => {
              throw new Error('TRAVELPORT_CARRIER_PREFERENCE must be Preferred or Permitted');
            })();

  const staysV12 = trimmed('TRAVELPORT_STAYS_V12_BASE_URL');

  return {
    environment,
    clientId,
    clientSecret,
    username: trimmed('TRAVELPORT_USERNAME'),
    password: trimmed('TRAVELPORT_PASSWORD'),
    pcc: trimmed('TRAVELPORT_PCC'),
    accessGroup: trimmed('TRAVELPORT_ACCESS_GROUP'),
    gds: trimmed('TRAVELPORT_GDS'),
    contentSources: parseContentSources(trimmed('TRAVELPORT_CONTENT_SOURCES')),
    gdsCarriers: parseCarrierCodes(trimmed('TRAVELPORT_GDS_CARRIERS')),
    ndcCarriers: parseCarrierCodes(trimmed('TRAVELPORT_NDC_CARRIERS')),
    carrierPreferenceType,
    authBaseUrl: (trimmed('TRAVELPORT_AUTH_BASE_URL') ?? hosts.auth).replace(/\/$/, ''),
    flightsBaseUrl: (trimmed('TRAVELPORT_FLIGHTS_BASE_URL') ?? `${hosts.api}/11/air`).replace(/\/$/, ''),
    staysV11BaseUrl: (trimmed('TRAVELPORT_STAYS_V11_BASE_URL') ?? `${hosts.api}/11/hotel`).replace(/\/$/, ''),
    staysV12BaseUrl: staysV12?.replace(/\/$/, ''),
    region: market.region,
    pointOfSale: market.pointOfSale,
    currency,
  };
}

const CONTENT_SOURCES = new Set(['GDS', 'NDC']);

export function parseContentSources(raw?: string): string[] {
  const sources = (raw ?? 'GDS')
    .split(/[,\s]+/)
    .map((source) => source.trim().toUpperCase())
    .filter(Boolean);
  for (const source of sources) {
    if (!CONTENT_SOURCES.has(source)) {
      throw new Error('TRAVELPORT_CONTENT_SOURCES may only include GDS and NDC');
    }
  }
  return sources.length ? [...new Set(sources)] : ['GDS'];
}

/** IATA airline codes as supplied in the Travelport test mail. Host codes such as 1G are kept if listed. */
export function parseCarrierCodes(raw?: string): string[] {
  if (!raw) return [];
  const codes = raw
    .split(/[,\s]+/)
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z0-9]{2}$/.test(code));
  return [...new Set(codes)];
}

/**
 * Travelport's test welcome mail uses Region EMEA:UK, not an ISO country.
 * The agency POS country is GB; the region string is retained as entitlement evidence.
 */
export function parseTravelportMarket(regionRaw?: string, pointOfSaleRaw?: string): {
  region?: string;
  pointOfSale?: string;
} {
  const region = regionRaw?.trim().toUpperCase();
  const fromPos = countryFromMarketToken(pointOfSaleRaw);
  const fromRegion = countryFromMarketToken(region?.includes(':') ? region.split(':').pop() : region);
  const pointOfSale = fromPos ?? fromRegion;
  if (pointOfSaleRaw && !pointOfSale) {
    throw new Error('TRAVELPORT_POINT_OF_SALE must be a 2-letter country or a region such as EMEA:UK');
  }
  return {
    region: region || (pointOfSaleRaw?.includes(':') ? pointOfSaleRaw.trim().toUpperCase() : undefined),
    pointOfSale,
  };
}

function countryFromMarketToken(token?: string): string | undefined {
  if (!token) return undefined;
  const value = token.trim().toUpperCase();
  const country = value.includes(':') ? value.split(':').pop() : value;
  if (!country) return undefined;
  if (country === 'UK' || country === 'GB') return 'GB';
  if (/^[A-Z]{2}$/.test(country)) return country;
  return undefined;
}

/**
 * Throws unless a request can actually be attributed to a branch.
 *
 * Called by the API layer, not the auth layer. Travelport accepts a token from a client with no
 * PCC header and then returns nothing useful, which reads like an empty market rather than a
 * misconfiguration — so this is stated as an error before the call is made.
 */
export function assertRequestReady(config: TravelportConfig): void {
  if (!config.pcc && !config.accessGroup) {
    throw new Error(
      'No branch configured: set TRAVELPORT_PCC or TRAVELPORT_ACCESS_GROUP. ' +
        'Travelport resolves content entitlement, forms of payment and ticketing authority from one of them.',
    );
  }
}

/**
 * True when the request is going to a live, financially real endpoint.
 *
 * Used to label every issued document. A pre-production ticket that is recorded without this
 * marker becomes an unexplained document at reconciliation.
 */
export function isTravelportProduction(config: TravelportConfig): boolean {
  return config.environment === 'PRODUCTION';
}
