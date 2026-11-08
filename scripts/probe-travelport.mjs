/**
 * Verifies Travelport pre-production credentials and the Flights shopping contract.
 *
 *   node scripts/probe-travelport.mjs
 *
 * Request shapes come from the **v11 GDS Full Payload DevKit** in `docs/travelport_devkits/`,
 * not from inference. That matters: an earlier version of this probe sent an invented body
 * (`searchRequests` / `travelerTypeCounts`) and used HTTP Basic for the token, and the
 * provider's answers were therefore hard to interpret. The DevKit says:
 *
 *   POST https://auth.pp.travelport.net/oauth/token
 *     Content-Type: application/x-www-form-urlencoded
 *     grant_type=password  username=…  password=…  client_id=…  client_secret=…
 *   (all four identity fields in the body — no Basic header)
 *
 *   POST https://{baseURL}/{version}/air/catalog/search/catalogproductofferings
 *     XAUTH_TRAVELPORT_ACCESSGROUP: …      ← underscores, as the brief spells it
 *     Accept-Version: {version}
 *     Content-Version: {version}
 *
 * **Nothing secret is printed.** Values are masked to shape only.
 *
 * A 401 is not one signal but two, and reading them as the same thing sent earlier discovery
 * the wrong way: plain text `1012100 - Credentials invalid or missing.` means the **gateway**
 * refused, while a JSON `CatalogProductOfferingsResponse … Result.Error` means the **API**
 * answered and the token authenticated.
 */
import { config as loadEnv } from 'dotenv';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const env = (name) => process.env[name]?.trim();

const clientId = env('TRAVELPORT_CLIENT_ID');
const clientSecret = env('TRAVELPORT_CLIENT_SECRET');
const username = env('TRAVELPORT_USERNAME');
const password = env('TRAVELPORT_PASSWORD');
const accessGroup = env('TRAVELPORT_ACCESS_GROUP');
const pcc = env('TRAVELPORT_PCC');
const environment = (env('TRAVELPORT_ENVIRONMENT') ?? 'PREPROD').toUpperCase();
/**
 * The DevKit parameterises both the URL segment and the version headers from one variable,
 * so it is configured here the same way. Confirm against the values you enter into the DevKit
 * as `baseURL` and `version` — a wrong version is a plausible cause of a gateway rejection.
 */
const region = env('TRAVELPORT_REGION');
const pointOfSale = env('TRAVELPORT_POINT_OF_SALE');
const currency = env('TRAVELPORT_CURRENCY');
const contentSources = (env('TRAVELPORT_CONTENT_SOURCES') ?? 'GDS')
  .split(/[,\s]+/)
  .map((source) => source.trim().toUpperCase())
  .filter(Boolean);
const fromAirport = env('TRAVELPORT_PROBE_FROM') ?? 'LHR';
const toAirport = env('TRAVELPORT_PROBE_TO') ?? 'JFK';
const apiVersion = env('TRAVELPORT_API_VERSION') ?? '11';
const apiBase = env('TRAVELPORT_API_BASE') ?? (environment === 'PRODUCTION' ? 'https://api.travelport.net' : 'https://api.pp.travelport.net');
const authUrl = env('TRAVELPORT_AUTH_URL') ?? (environment === 'PRODUCTION' ? 'https://auth.travelport.net/oauth/token' : 'https://auth.pp.travelport.net/oauth/token');

function mask(value) {
  const text = String(value ?? '');
  if (!text) return '(empty)';
  return text.length <= 6 ? `(len ${text.length})` : `${text.slice(0, 2)}… (len ${text.length})`;
}

function redact(text) {
  return String(text)
    .replace(/(bearer\s+)[a-z0-9._~+/=-]{10,}/gi, '$1[REDACTED]')
    .replace(/((?:access_token|refresh_token|client_secret|password)"?\s*[:=]\s*"?)[^"\s,}&]{4,}/gi, '$1[REDACTED]')
    .replace(/[A-Za-z0-9._~+/=-]{60,}/g, (m) => (/\d/.test(m) && /[A-Za-z]/.test(m) ? '[REDACTED]' : m));
}

console.log('TARGETS');
console.log('  authUrl      ', authUrl);
console.log('  apiBase      ', apiBase);
console.log('  apiVersion   ', apiVersion);
console.log('  accessGroup  ', mask(accessGroup));
console.log('  pcc          ', mask(pcc), '(sent as the access-group header when no access group is configured)');
console.log('  identity     ', `username=${mask(username)} password=${mask(password)} client_id=${mask(clientId)}`);
console.log('  region/POS   ', region ?? '(unset)', pointOfSale ?? '(unset)', currency ?? '(unset)');
console.log('  sources      ', contentSources.join(',') || '(empty)');
console.log('  city pair    ', `${fromAirport} → ${toAirport}`);

// ── Step 1: the token, in the shape the DevKit documents ─────────────────────────
const tokenResponse = await fetch(authUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', 'cache-control': 'no-cache', accept: 'application/json' },
  body: new URLSearchParams({ grant_type: 'password', username, password, client_id: clientId, client_secret: clientSecret }).toString(),
  cache: 'no-store',
});
const tokenText = await tokenResponse.text();
let token = null;
try {
  token = JSON.parse(tokenText)?.access_token;
} catch { /* non-JSON token responses are reported below */ }

if (!token) {
  console.log(`\nTOKEN FAILED → HTTP ${tokenResponse.status}`);
  console.log('  ', redact(tokenText.slice(0, 300)).trim());
  console.log('\nThis is a credential problem, not a request-shape problem: the body now matches the DevKit.');
  process.exitCode = 1;
  throw new Error('token_failed');
}
console.log(`\nTOKEN OK (HTTP ${tokenResponse.status}) — grant_type=password with all four identity fields in the body`);

// ── Step 2: the search, in the DevKit's documented envelope ─────────────────────
const departureDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
const search = {
  '@type': 'CatalogProductOfferingsQueryRequest',
  CatalogProductOfferingsRequest: {
    '@type': 'CatalogProductOfferingsRequestAir',
    contentSourceList: contentSources,
    PassengerCriteria: [{ '@type': 'PassengerCriteria', number: 1, passengerTypeCode: 'ADT' }],
    SearchCriteriaFlight: [{
      '@type': 'SearchCriteriaFlight',
      departureDate,
      From: { value: fromAirport },
      To: { value: toAirport },
    }],
  },
};

const searchUrl = `${apiBase.replace(/\/$/, '')}/${apiVersion}/air/catalog/search/catalogproductofferings`;

/**
 * Which branch header this endpoint actually reads, established by experiment rather than by
 * the documentation's wording:
 *
 *   no header              → 2501 AUTHORIZATION IS NOT CONFIGURED
 *   TVP-PCC-CORE: <value>  → 2501 AUTHORIZATION IS NOT CONFIGURED  ← identical, so ignored
 *   XAUTH_TRAVELPORT_ACCESSGROUP: <value> → 2500 AUTHORIZATION ERROR ← a different error
 *
 * A different error means the header was read and the value was rejected, so only the
 * access-group header reaches the authoriser. Sending the PCC under `TVP-PCC-CORE` looks like
 * it is doing nothing, and the two 2501s are easy to misread as "entitlement is missing" when
 * the real cause is that the branch was never transmitted at all.
 *
 * The header name uses **underscores**, as the brief and the DevKit both spell it.
 */
const branchHeaders = accessGroup
  ? { XAUTH_TRAVELPORT_ACCESSGROUP: accessGroup }
  : pcc
    ? { XAUTH_TRAVELPORT_ACCESSGROUP: pcc }
    : {};

const response = await fetch(searchUrl, {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'cache-control': 'no-cache',
    authorization: `Bearer ${token}`,
    'Accept-Version': apiVersion,
    'Content-Version': apiVersion,
    ...branchHeaders,
  },
  body: JSON.stringify(search),
  cache: 'no-store',
});
const body = await response.text();

let parsed = null;
try {
  parsed = JSON.parse(body);
} catch { /* gateway responses are plain text */ }

const reachedApplication = parsed?.CatalogProductOfferingsResponse !== undefined;
const apiError = parsed?.CatalogProductOfferingsResponse?.Result?.Error?.[0];
/**
 * The offering list and the data it points at are in different places: offerings carry refs
 * (`s1`, `p0`, `b0`, `T0`) and `ReferenceList` holds the flights, products, brands and terms
 * those refs name. Counting anything else reports zero against a successful search, which is
 * how this probe first misread twelve real offers as none.
 */
const offerings = parsed?.CatalogProductOfferingsResponse?.CatalogProductOfferings?.CatalogProductOffering ?? [];
const referenceSections = parsed?.CatalogProductOfferingsResponse?.ReferenceList ?? [];
const offers = offerings.length;

console.log(`\nSEARCH → HTTP ${response.status}  ${searchUrl}`);
console.log('  ', reachedApplication ? 'REACHED THE FLIGHTS API (token authenticated)' : 'STOPPED AT THE GATEWAY');
if (reachedApplication) {
  console.log('   top-level keys:', JSON.stringify(Object.keys(parsed.CatalogProductOfferingsResponse)));
  console.log('   transactionId :', parsed.CatalogProductOfferingsResponse.transactionId);
  if (apiError) {
    console.log('   error         :', JSON.stringify({ category: apiError.category, Message: apiError.Message, SourceID: apiError.SourceID, SourceCode: apiError.SourceCode }));
  } else {
    console.log('   offerings      :', offers);
    // Each reference section is `{ '@type': …, Flight | Product | Brand | TermsAndConditions: [] }`.
    console.log('   reference data :', referenceSections.map((section) => {
      const named = Object.entries(section ?? {}).find(([key]) => key !== '@type');
      return named ? `${named[0]}=${Array.isArray(named[1]) ? named[1].length : '?'}` : '?';
    }).join(' '));
    const currency = offerings[0]?.ProductBrandOptions?.[0]?.ProductBrandOffering?.[0]?.BestCombinablePrice?.CurrencyCode?.value;
    console.log('   currency       :', currency ?? 'unknown');
    console.log('   NOTE quotes use the Travelport branch POS. This preprod mail is EMEA:UK / GBP;',
      'Travelar records that currency and does not convert it.');
  }
} else {
  console.log('   body:', redact(body.slice(0, 300)).trim() || '(empty)');
}
