import { query } from '@/server/db';
import { aircraftName, airlineName, countryName } from '@/server/reference/iata-display';
import type { CanonicalAirOffer, CanonicalAirSegment } from '@/server/providers/types';

/** Same flights and times, different fare rows. */
export function itineraryKey(offer: CanonicalAirOffer): string {
  return offer.itinerary
    .map((leg) => [
      leg.marketingCarrier,
      leg.flightNumber,
      leg.originCode,
      leg.destinationCode,
      leg.departureAt,
      leg.arrivalAt,
    ].join('~'))
    .join('|');
}

/**
 * Public search lists one row per itinerary (cheapest fare) and cheapest-first.
 * All fare rows remain in the search session for later booking work.
 */
export function presentAirOffers(offers: CanonicalAirOffer[]): CanonicalAirOffer[] {
  const winners = new Map<string, CanonicalAirOffer>();
  for (const offer of offers) {
    if (!offer.itinerary.length) continue;
    const key = itineraryKey(offer);
    const current = winners.get(key);
    if (!current || offer.totalAmount < current.totalAmount) {
      winners.set(key, offer);
    }
  }
  return [...winners.values()].sort((a, b) => {
    const price = a.totalAmount - b.totalAmount;
    if (price !== 0) return price;
    return (a.itinerary[0]?.departureAt ?? '').localeCompare(b.itinerary[0]?.departureAt ?? '');
  });
}

export async function decorateAirOffers(offers: CanonicalAirOffer[]): Promise<CanonicalAirOffer[]> {
  if (!offers.length) return offers;
  const codes = [...new Set(offers.flatMap((offer) => (
    offer.itinerary.flatMap((leg) => [leg.originCode, leg.destinationCode])
  )))].filter(Boolean);
  const places = await loadAirports(codes);
  return offers.map((offer) => ({
    ...offer,
    itinerary: offer.itinerary.map((leg) => decorateSegment(leg, places)),
  }));
}

function decorateSegment(
  leg: CanonicalAirSegment,
  places: Map<string, { name: string; countryCode: string }>,
): CanonicalAirSegment {
  const origin = places.get(leg.originCode.toUpperCase());
  const destination = places.get(leg.destinationCode.toUpperCase());
  return {
    ...leg,
    marketingCarrierName: leg.marketingCarrierName || airlineName(leg.marketingCarrier),
    operatingCarrierName: leg.operatingCarrierName
      || airlineName(leg.operatingCarrier)
      || leg.marketingCarrierName
      || airlineName(leg.marketingCarrier),
    originName: origin?.name,
    originCountry: countryName(origin?.countryCode),
    destinationName: destination?.name,
    destinationCountry: countryName(destination?.countryCode),
    equipmentName: aircraftName(leg.equipment),
  };
}

async function loadAirports(codes: string[]): Promise<Map<string, { name: string; countryCode: string }>> {
  const map = new Map<string, { name: string; countryCode: string }>();
  if (!codes.length) return map;
  const { rows } = await query<{ code: string; name: string; countryCode: string }>(
    `select upper(code) as code, name, country_code as "countryCode"
       from app.location
      where kind = 'airport'
        and is_active
        and upper(code) = any($1::text[])`,
    [codes.map((code) => code.toUpperCase())],
  );
  for (const row of rows) map.set(row.code, { name: row.name, countryCode: row.countryCode });
  return map;
}
