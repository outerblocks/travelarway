/**
 * Verifies Travelport pre-production credentials and the Stays v11 property search contract.
 *
 *   node scripts/probe-travelport-stays.mjs
 *
 * Request shape comes from the Hotel JSON API v11 DevKit (`SearchByAddress` / `SearchByAirport`),
 * not from SearchComplete v12. Booking, availability, rules and reservation are not called.
 *
 * Nothing secret is printed.
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
const currency = env('TRAVELPORT_CURRENCY');
const apiVersion = env('TRAVELPORT_API_VERSION') ?? '11';
const apiBase = env('TRAVELPORT_API_BASE') ?? (environment === 'PRODUCTION' ? 'https://api.travelport.net' : 'https://api.pp.travelport.net');
const authUrl = env('TRAVELPORT_AUTH_URL') ?? (environment === 'PRODUCTION' ? 'https://auth.travelport.net/oauth/token' : 'https://auth.pp.travelport.net/oauth/token');
const cityName = env('TRAVELPORT_PROBE_STAY_CITY') ?? 'Dar es Salaam';
const country = env('TRAVELPORT_PROBE_STAY_COUNTRY') ?? 'TZ';
const airport = env('TRAVELPORT_PROBE_STAY_AIRPORT') ?? 'DAR';

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

if (environment === 'PRODUCTION') {
  console.log('Refusing to probe PRODUCTION. Set TRAVELPORT_ENVIRONMENT=PREPROD.');
  process.exit(1);
}

console.log('TARGETS');
console.log('  authUrl      ', authUrl);
console.log('  apiBase      ', apiBase);
console.log('  apiVersion   ', apiVersion);
console.log('  accessGroup  ', mask(accessGroup));
console.log('  pcc          ', mask(pcc));
console.log('  identity     ', `username=${mask(username)} password=${mask(password)} client_id=${mask(clientId)}`);
console.log('  stay search  ', `${cityName}, ${country} / airport ${airport}`);

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
} catch { /* non-JSON */ }

if (!token) {
  console.log(`\nTOKEN FAILED → HTTP ${tokenResponse.status}`);
  console.log('  ', redact(tokenText.slice(0, 300)).trim());
  process.exitCode = 1;
  throw new Error('token_failed');
}
console.log(`\nTOKEN OK (HTTP ${tokenResponse.status})`);

const checkIn = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
const checkOut = new Date(Date.now() + 32 * 86_400_000).toISOString().slice(0, 10);
const searchUrl = `${apiBase.replace(/\/$/, '')}/${apiVersion}/hotel/search/properties/search`;
const branchHeaders = accessGroup
  ? { XAUTH_TRAVELPORT_ACCESSGROUP: accessGroup }
  : pcc
    ? { XAUTH_TRAVELPORT_ACCESSGROUP: pcc }
    : {};

async function probe(label, searchBy) {
  const search = {
    PropertiesQuerySearch: {
      '@type': 'PropertiesQuerySearch',
      CheckInDate: checkIn,
      CheckOutDate: checkOut,
      returnOnlyAvailablePropertiesInd: true,
      ...(currency ? { RequestedCurrency: currency } : {}),
      RoomStayCandidate: [{
        '@type': 'RoomStayCandidate',
        GuestCounts: {
          '@type': 'GuestCounts',
          GuestCount: [{ '@type': 'GuestCount', count: 1, ageQualifyingCode: '10' }],
        },
      }],
      SearchBy: searchBy,
    },
  };

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
  } catch { /* gateway */ }

  const envelope = parsed?.PropertiesResponse
    ?? parsed?.PropertiesSearchResponse
    ?? parsed?.ErrorResponse
    ?? null;
  const reached = Boolean(envelope) || parsed?.ErrorResponse !== undefined;
  const apiError = envelope?.Result?.Error?.[0] ?? parsed?.ErrorResponse?.Result?.Error?.[0];
  const properties = envelope?.Properties ?? envelope;
  const info = properties?.PropertyInfo ?? envelope?.PropertyInfo ?? envelope?.Property ?? [];
  const count = Number(properties?.totalProperties)
    || (Array.isArray(info) ? info.length : info ? 1 : 0);
  const sample = Array.isArray(info) ? info[0] : info;
  const sampleProperty = sample?.Property ?? sample;

  console.log(`\n${label} → HTTP ${response.status}  ${searchUrl}`);
  console.log('  ', reached ? 'REACHED THE STAYS API (token authenticated)' : 'STOPPED AT THE GATEWAY');
  if (reached) {
    console.log('   envelope keys :', JSON.stringify(Object.keys(envelope ?? parsed)));
    console.log('   transactionId :', envelope?.transactionId ?? properties?.Identifier?.value);
    if (apiError) {
      console.log('   error         :', JSON.stringify({
        category: apiError.category,
        Message: apiError.Message,
        SourceID: apiError.SourceID,
        SourceCode: apiError.SourceCode,
      }));
    } else {
      console.log('   properties    :', count);
      if (sampleProperty) {
        console.log('   sample keys   :', JSON.stringify(Object.keys(sampleProperty)));
        console.log('   sample rate   :', sample?.LowestAvailableRate ? JSON.stringify({
          value: sample.LowestAvailableRate.value,
          code: sample.LowestAvailableRate.code,
        }) : '(none)');
      }
    }
  } else {
    console.log('   body:', redact(body.slice(0, 400)).trim() || '(empty)');
  }
  return { reached, count, httpStatus: response.status, apiError };
}

const address = await probe('SEARCH BY ADDRESS', {
  '@type': 'SearchByAddress',
  SearchRadius: { value: 20, unitOfDistance: 'Miles' },
  SearchAddress: { '@type': 'SearchAddress', City: cityName, Country: country },
});
const city = await probe('SEARCH BY CITY', {
  '@type': 'SearchByCity',
  SearchRadius: { value: 25, unitOfDistance: 'Miles' },
  SearchCity: airport,
});
const air = await probe('SEARCH BY AIRPORT', {
  '@type': 'SearchByAirport',
  SearchRadius: { value: 25, unitOfDistance: 'Miles' },
  SearchAirport: airport,
});

const proven = [address, city, air].some((row) => row.reached && row.count > 0 && !row.apiError);
if (!proven) process.exitCode = 1;
console.log('\nBOOKING AND TICKETING WERE NOT CALLED.');
console.log(proven
  ? 'Search returned properties. Registry stays-v11/search can be marked PROVEN for PREPROD after this evidence is filed.'
  : 'Search did not return properties. Leave stays-v11/search READ_ONLY.');
