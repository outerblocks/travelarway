/**
 * Bounded PREPROD probe: hotel details + availability. Does not book.
 *   node scripts/probe-travelport-stay-availability.mjs
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
const apiBase = env('TRAVELPORT_API_BASE') ?? 'https://api.pp.travelport.net';
const authUrl = env('TRAVELPORT_AUTH_URL') ?? 'https://auth.pp.travelport.net/oauth/token';

if (environment === 'PRODUCTION') {
  console.log('Refusing PRODUCTION probe.');
  process.exit(1);
}

const tokenResponse = await fetch(authUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
  body: new URLSearchParams({ grant_type: 'password', username, password, client_id: clientId, client_secret: clientSecret }).toString(),
});
const token = (await tokenResponse.json())?.access_token;
if (!token) {
  console.log('TOKEN FAILED', tokenResponse.status);
  process.exit(1);
}

const headers = {
  accept: 'application/json',
  'content-type': 'application/json',
  authorization: `Bearer ${token}`,
  'Accept-Version': '11',
  'Content-Version': '11',
  ...(accessGroup || pcc ? { XAUTH_TRAVELPORT_ACCESSGROUP: accessGroup || pcc } : {}),
};

const checkIn = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
const checkOut = new Date(Date.now() + 32 * 86_400_000).toISOString().slice(0, 10);
const searchUrl = `${apiBase.replace(/\/$/, '')}/11/hotel/search/properties/search`;
const searchBody = {
  PropertiesQuerySearch: {
    '@type': 'PropertiesQuerySearch',
    CheckInDate: checkIn,
    CheckOutDate: checkOut,
    returnOnlyAvailablePropertiesInd: true,
    ImageSize: 'Medium',
    ...(currency ? { RequestedCurrency: currency } : {}),
    RoomStayCandidate: [{
      '@type': 'RoomStayCandidate',
      GuestCounts: { '@type': 'GuestCounts', GuestCount: [{ '@type': 'GuestCount', count: 1, ageQualifyingCode: '10' }] },
    }],
    SearchBy: { '@type': 'SearchByAirport', SearchRadius: { value: 25, unitOfDistance: 'Miles' }, SearchAirport: 'DAR' },
  },
};

const searchRes = await fetch(searchUrl, { method: 'POST', headers, body: JSON.stringify(searchBody) });
const searchJson = await searchRes.json();
const info = searchJson?.PropertiesResponse?.Properties?.PropertyInfo?.[0];
const property = info?.Property ?? {};
const key = property.PropertyKey ?? {};
console.log('SEARCH', searchRes.status, {
  name: property.name,
  chain: key.chainCode,
  code: key.propertyCode,
  imageCount: Array.isArray(property.Image) ? property.Image.length : 0,
  hasPolicy: Boolean(property.CheckInOutPolicy),
  amenityCount: Array.isArray(property.PropertyAmenity) ? property.PropertyAmenity.length : 0,
  descCount: Array.isArray(property.Description) ? property.Description.length : 0,
});

if (!key.chainCode || !key.propertyCode) process.exit(1);

const detailUrl = `${apiBase.replace(/\/$/, '')}/11/hotel/search/propertiesdetail?chainCode=${encodeURIComponent(key.chainCode)}&propertyCode=${encodeURIComponent(key.propertyCode)}&ImageSize=Medium`;
const detailRes = await fetch(detailUrl, { method: 'GET', headers });
const detailText = await detailRes.text();
let detailJson = null;
try { detailJson = JSON.parse(detailText); } catch { /* */ }
const detailProp = detailJson?.PropertiesResponse?.Properties?.PropertyInfo?.[0]?.Property
  ?? detailJson?.PropertiesResponse?.Property
  ?? detailJson?.PropertyDetail
  ?? null;
console.log('DETAILS', detailRes.status, {
  keys: detailJson && typeof detailJson === 'object' ? Object.keys(detailJson).slice(0, 12) : 'unparsed',
  imageCount: Array.isArray(detailProp?.Image) ? detailProp.Image.length : 0,
  hasPolicy: Boolean(detailProp?.CheckInOutPolicy),
  error: detailJson?.ErrorResponse?.Result?.Error?.[0]?.Message
    ?? detailJson?.PropertiesResponse?.Result?.Error?.[0]?.Message,
});

const availUrl = `${apiBase.replace(/\/$/, '')}/11/hotel/availability/catalogofferingshospitality`;
const availBody = {
  CatalogOfferingsQueryRequest: {
    CatalogOfferingsRequest: [{
      '@type': 'CatalogOfferingsRequestHospitality',
      verboseResponseInd: true,
      ...(currency ? { requestedCurrency: currency } : {}),
      StayDates: { start: checkIn, end: checkOut },
      HotelSearchCriterion: {
        '@type': 'HotelSearchCriterion',
        numberOfRooms: 1,
        PropertyRequest: [{
          '@type': 'PropertyRequest',
          PropertyKey: { '@type': 'PropertyKey', chainCode: key.chainCode, propertyCode: key.propertyCode },
        }],
        RoomStayCandidates: {
          '@type': 'RoomStayCandidates',
          RoomStayCandidate: [{
            '@type': 'RoomStayCandidate',
            GuestCounts: {
              '@type': 'GuestCounts',
              GuestCount: [{ count: 1, '@type': 'GuestCount', ageQualifyingCode: '10' }],
            },
          }],
        },
      },
    }],
  },
};
const availRes = await fetch(availUrl, { method: 'POST', headers, body: JSON.stringify(availBody) });
const availJson = await availRes.json().catch(() => null);
const offerings = availJson?.CatalogOfferingsHospitalityResponse?.CatalogOfferings?.CatalogOffering
  ?? availJson?.CatalogOfferings?.CatalogOffering;
const offeringCount = Array.isArray(offerings) ? offerings.length : offerings ? 1 : 0;
const sample = Array.isArray(offerings) ? offerings[0] : offerings;
console.log('AVAILABILITY', availRes.status, {
  keys: availJson && typeof availJson === 'object' ? Object.keys(availJson).slice(0, 12) : 'unparsed',
  offerings: offeringCount,
  sampleKeys: sample && typeof sample === 'object' ? Object.keys(sample).slice(0, 16) : null,
  error: availJson?.ErrorResponse?.Result?.Error?.[0]?.Message
    ?? availJson?.CatalogOfferingsHospitalityResponse?.Result?.Error?.[0]?.Message
    ?? availJson?.Result?.Error?.[0]?.Message,
});
