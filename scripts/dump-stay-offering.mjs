import { config as loadEnv } from 'dotenv';
loadEnv({ path: ['.env.local', '.env'], quiet: true });

const env = (name) => process.env[name]?.trim();
const tokenRes = await fetch(env('TRAVELPORT_AUTH_URL') ?? 'https://auth.pp.travelport.net/oauth/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
  body: new URLSearchParams({
    grant_type: 'password',
    username: env('TRAVELPORT_USERNAME'),
    password: env('TRAVELPORT_PASSWORD'),
    client_id: env('TRAVELPORT_CLIENT_ID'),
    client_secret: env('TRAVELPORT_CLIENT_SECRET'),
  }).toString(),
});
const token = (await tokenRes.json())?.access_token;
const headers = {
  accept: 'application/json',
  'content-type': 'application/json',
  authorization: `Bearer ${token}`,
  'Accept-Version': '11',
  'Content-Version': '11',
  XAUTH_TRAVELPORT_ACCESSGROUP: env('TRAVELPORT_ACCESS_GROUP') || env('TRAVELPORT_PCC'),
};
const checkIn = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
const checkOut = new Date(Date.now() + 32 * 86_400_000).toISOString().slice(0, 10);
const searchRes = await fetch('https://api.pp.travelport.net/11/hotel/search/properties/search', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    PropertiesQuerySearch: {
      '@type': 'PropertiesQuerySearch',
      CheckInDate: checkIn,
      CheckOutDate: checkOut,
      returnOnlyAvailablePropertiesInd: true,
      RoomStayCandidate: [{
        '@type': 'RoomStayCandidate',
        GuestCounts: { '@type': 'GuestCounts', GuestCount: [{ '@type': 'GuestCount', count: 1, ageQualifyingCode: '10' }] },
      }],
      SearchBy: { '@type': 'SearchByAirport', SearchRadius: { value: 25, unitOfDistance: 'Miles' }, SearchAirport: 'DAR' },
    },
  }),
});
const searchJson = await searchRes.json();
const property = searchJson?.PropertiesResponse?.Properties?.PropertyInfo?.[0]?.Property ?? {};
const key = property.PropertyKey ?? {};
const availRes = await fetch('https://api.pp.travelport.net/11/hotel/availability/catalogofferingshospitality', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    CatalogOfferingsQueryRequest: {
      CatalogOfferingsRequest: [{
        '@type': 'CatalogOfferingsRequestHospitality',
        verboseResponseInd: true,
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
  }),
});
const availJson = await availRes.json();
const offering = availJson?.CatalogOfferingsHospitalityResponse?.CatalogOfferings?.CatalogOffering?.[0];
const product = offering?.ProductOptions?.[0]?.Product?.[0] ?? offering?.ProductOptions?.[0]?.Product;
console.log(JSON.stringify({
  offeringKeys: offering && Object.keys(offering),
  id: offering?.id,
  price: offering?.Price,
  termsKeys: offering?.TermsAndConditions && Object.keys(offering.TermsAndConditions),
  meals: offering?.TermsAndConditions?.MealsIncluded,
  cancel: offering?.TermsAndConditions?.CancelPenalty?.[0],
  productType: product?.['@type'],
  productKeys: product && Object.keys(product),
  roomType: product?.RoomType,
  bookingCode: product?.bookingCode,
  guests: product?.guests,
}, null, 2));
