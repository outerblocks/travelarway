import { randomUUID } from 'node:crypto';
import { asPublicStayOffer, type PublicStayOffer, type PublicStayRoom } from '@/domain/stay-offer';
import { query } from '@/server/db';
import {
  splitPropertyReference,
  travelportStayAvailability,
  travelportStayDetails,
} from '@/server/providers/travelport/stays';

const OFFER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getStayOffer(id: string): Promise<PublicStayOffer | null> {
  const row = await loadStayOfferRow(id);
  return row ? asPublicStayOffer(row.offer) : null;
}

export async function getStayOfferDetail(id: string): Promise<PublicStayOffer | null> {
  const row = await loadStayOfferRow(id);
  if (!row) return null;

  const codes = splitPropertyReference(row.providerPropertyRef);
  const meta = { providerId: 'travelport', productId: 'stays-v11', correlationId: randomUUID() };
  let photoUrls = row.offer.photoUrls as string[];
  let amenities = row.offer.amenities as string[];
  let description = row.offer.description as string | null;
  let reviews = row.offer.reviews;

  if (codes) {
    const details = await travelportStayDetails(codes, meta).catch(() => null);
    if (details?.outcome === 'success' && details.data) {
      if (details.data.photoUrls.length) photoUrls = details.data.photoUrls;
      if (details.data.amenities.length) amenities = details.data.amenities;
      if (details.data.description) description = details.data.description;
      if (details.data.reviews.length) reviews = details.data.reviews;
    }
  }

  const rooms = await roomsForOffer(row, codes, meta);
  return asPublicStayOffer({
    ...row.offer,
    photoUrls,
    amenities,
    description,
    reviews,
    rooms,
  });
}

async function roomsForOffer(
  row: StayOfferRow,
  codes: { chainCode: string; propertyCode: string } | null,
  meta: { providerId: string; productId: string; correlationId: string },
): Promise<PublicStayRoom[]> {
  if (codes && row.checkIn && row.checkOut) {
    const availability = await travelportStayAvailability({
      chainCode: codes.chainCode,
      propertyCode: codes.propertyCode,
      checkInDate: row.checkIn,
      checkOutDate: row.checkOut,
      adults: row.adults,
      children: row.children,
      rooms: row.rooms,
      currency: row.currency ?? undefined,
    }, meta).catch(() => null);
    if (availability?.outcome === 'success' && availability.data?.length) {
      return availability.data.map((room) => ({
        id: room.providerOfferingId,
        name: room.name,
        description: room.description ?? null,
        board: room.board ?? null,
        cancellation: room.cancellation ?? null,
        refundable: room.refundable ?? null,
        occupancy: room.occupancy ?? null,
        totalPrice: room.totalAmount ?? null,
        currency: room.currency ?? null,
      }));
    }
  }

  if (row.offer.totalPrice != null && row.offer.currency) {
    return [{
      id: 'search-rate',
      name: row.offer.name as string,
      description: null,
      board: null,
      cancellation: null,
      refundable: null,
      occupancy: null,
      totalPrice: row.offer.totalPrice as number,
      currency: row.offer.currency as string,
    }];
  }
  return [];
}

interface StayOfferRow {
  providerPropertyRef: string;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  children: number;
  rooms: number;
  currency: string | null;
  offer: Record<string, unknown>;
}

async function loadStayOfferRow(id: string): Promise<StayOfferRow | null> {
  if (!OFFER_ID.test(id)) return null;
  const { rows } = await query<{
    id: string;
    property_name: string;
    location_label: string | null;
    currency_provider: string | null;
    price_provider: string | number | null;
    product_refs: unknown;
    provider_property_ref: string;
    request_summary: unknown;
  }>(
    `select o.id, o.property_name, o.location_label, o.currency_provider, o.price_provider,
            o.product_refs, o.provider_property_ref, s.request_summary
       from app.stay_offers o
       left join app.stay_search_sessions s on s.id = o.session_id
      where o.id = $1
      limit 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const refs = row.product_refs && typeof row.product_refs === 'object'
    ? row.product_refs as Record<string, unknown>
    : {};
  const summary = row.request_summary && typeof row.request_summary === 'object'
    ? row.request_summary as Record<string, unknown>
    : {};
  const price = row.price_provider == null ? null : Number(row.price_provider);
  return {
    providerPropertyRef: row.provider_property_ref,
    checkIn: typeof summary.checkIn === 'string' ? summary.checkIn : null,
    checkOut: typeof summary.checkOut === 'string' ? summary.checkOut : null,
    adults: positiveInt(summary.adults, 1),
    children: positiveInt(summary.children, 0),
    rooms: positiveInt(summary.rooms, 1),
    currency: row.currency_provider,
    offer: {
      id: row.id,
      name: row.property_name,
      location: row.location_label ?? '',
      address: typeof refs.addressLine === 'string' ? refs.addressLine : null,
      photoUrls: refs.photoUrls,
      starRating: refs.starRating,
      amenities: refs.amenities,
      distance: refs.distanceLabel,
      description: refs.description,
      reviews: refs.reviews,
      totalPrice: Number.isFinite(price) ? price : null,
      currency: row.currency_provider,
      rooms: [],
    },
  };
}

function positiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
