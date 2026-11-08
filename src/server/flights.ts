import { asPublicAirOffer, type PublicAirOffer } from '@/domain/air-offer';
import { query } from '@/server/db';
import { decorateAirOffers } from '@/server/providers/air-present';
import type { CanonicalAirOffer, CanonicalAirSegment } from '@/server/providers/types';

const OFFER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getFlightOffer(id: string): Promise<PublicAirOffer | null> {
  if (!OFFER_ID.test(id)) return null;
  const { rows } = await query<{
    id: string;
    currency_provider: string | null;
    price_provider: string | number | null;
    price_breakdown: unknown;
    itinerary: unknown;
    product_refs: unknown;
  }>(
    `select id, currency_provider, price_provider, price_breakdown, itinerary, product_refs
       from app.air_offers
      where id = $1
      limit 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const refs = row.product_refs && typeof row.product_refs === 'object' && !Array.isArray(row.product_refs)
    ? row.product_refs as Record<string, unknown>
    : {};
  const breakdown = row.price_breakdown && typeof row.price_breakdown === 'object' && !Array.isArray(row.price_breakdown)
    ? row.price_breakdown as Record<string, unknown>
    : {};
  const price = row.price_provider == null ? null : Number(row.price_provider);
  if (price == null || !Number.isFinite(price) || !row.currency_provider) return null;
  const canonical: CanonicalAirOffer = {
    travelarOfferId: row.id,
    sourceProviderId: 'travelport',
    sourceProductId: 'flights-v11',
    providerOfferReference: row.id,
    contentSource: 'GDS',
    currency: row.currency_provider,
    totalAmount: price,
    baseAmount: numberOrUndefined(breakdown.base),
    taxAmount: numberOrUndefined(breakdown.tax),
    cabinClass: typeof refs.cabinClass === 'string' ? refs.cabinClass : undefined,
    fareBrand: typeof refs.fareBrand === 'string' ? refs.fareBrand : undefined,
    baggageSummary: typeof refs.baggageSummary === 'string' ? refs.baggageSummary : undefined,
    refundSummary: typeof refs.refundSummary === 'string' ? refs.refundSummary : undefined,
    changeSummary: typeof refs.changeSummary === 'string' ? refs.changeSummary : undefined,
    itinerary: Array.isArray(row.itinerary) ? row.itinerary.flatMap(asCanonicalSegment) : [],
  };
  if (!canonical.itinerary.length) return null;
  const [decorated] = await decorateAirOffers([canonical]);
  if (!decorated) return null;
  return asPublicAirOffer(publicAirFromCanonical(decorated));
}

export function publicAirFromCanonical(offer: CanonicalAirOffer) {
  return {
    id: offer.travelarOfferId,
    itinerary: offer.itinerary.map((leg) => ({
      carrier: leg.marketingCarrier,
      carrierName: leg.marketingCarrierName ?? null,
      operatingCarrier: leg.operatingCarrier ?? null,
      operatingCarrierName: leg.operatingCarrierName ?? null,
      flightNumber: leg.flightNumber,
      origin: leg.originCode,
      originName: leg.originName ?? null,
      originCountry: leg.originCountry ?? null,
      originTerminal: leg.originTerminal ?? null,
      destination: leg.destinationCode,
      destinationName: leg.destinationName ?? null,
      destinationCountry: leg.destinationCountry ?? null,
      destinationTerminal: leg.destinationTerminal ?? null,
      departure: leg.departureAt,
      arrival: leg.arrivalAt,
      duration: leg.duration ?? null,
      equipment: leg.equipment ?? null,
      equipmentName: leg.equipmentName ?? null,
    })),
    totalPrice: offer.totalAmount,
    currency: offer.currency,
    cabinClass: offer.cabinClass ?? null,
    fareBrand: offer.fareBrand ?? null,
    baggageInfo: offer.baggageSummary ?? null,
    refundInfo: offer.refundSummary ?? null,
    changeInfo: offer.changeSummary ?? null,
    basePrice: offer.baseAmount ?? null,
    taxPrice: offer.taxAmount ?? null,
  };
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : undefined;
}

function asCanonicalSegment(row: unknown): CanonicalAirSegment[] {
  if (!row || typeof row !== 'object') return [];
  const leg = row as Record<string, unknown>;
  const originCode = String(leg.originCode ?? '');
  const destinationCode = String(leg.destinationCode ?? '');
  const marketingCarrier = String(leg.marketingCarrier ?? '');
  const flightNumber = String(leg.flightNumber ?? '');
  const departureAt = String(leg.departureAt ?? '');
  const arrivalAt = String(leg.arrivalAt ?? '');
  if (!originCode || !destinationCode || !departureAt || !arrivalAt) return [];
  return [{
    marketingCarrier,
    marketingCarrierName: typeof leg.marketingCarrierName === 'string' ? leg.marketingCarrierName : undefined,
    operatingCarrier: typeof leg.operatingCarrier === 'string' ? leg.operatingCarrier : undefined,
    operatingCarrierName: typeof leg.operatingCarrierName === 'string' ? leg.operatingCarrierName : undefined,
    flightNumber,
    originCode,
    originName: typeof leg.originName === 'string' ? leg.originName : undefined,
    originCountry: typeof leg.originCountry === 'string' ? leg.originCountry : undefined,
    originTerminal: typeof leg.originTerminal === 'string' ? leg.originTerminal : undefined,
    destinationCode,
    destinationName: typeof leg.destinationName === 'string' ? leg.destinationName : undefined,
    destinationCountry: typeof leg.destinationCountry === 'string' ? leg.destinationCountry : undefined,
    destinationTerminal: typeof leg.destinationTerminal === 'string' ? leg.destinationTerminal : undefined,
    departureAt,
    arrivalAt,
    duration: typeof leg.duration === 'string' ? leg.duration : undefined,
    equipment: typeof leg.equipment === 'string' ? leg.equipment : undefined,
    equipmentName: typeof leg.equipmentName === 'string' ? leg.equipmentName : undefined,
  }];
}
