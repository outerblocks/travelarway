export interface PublicAirLeg {
  carrier: string;
  carrierName: string | null;
  operatingCarrier: string | null;
  operatingCarrierName: string | null;
  flightNumber: string;
  origin: string;
  originName: string | null;
  originCountry: string | null;
  originTerminal: string | null;
  destination: string;
  destinationName: string | null;
  destinationCountry: string | null;
  destinationTerminal: string | null;
  departure: string;
  arrival: string;
  duration: string | null;
  equipment: string | null;
  equipmentName: string | null;
}

export interface PublicAirOffer {
  id: string;
  itinerary: PublicAirLeg[];
  totalPrice: number;
  currency: string;
  cabinClass: string | null;
  fareBrand: string | null;
  baggageInfo: string | null;
  refundInfo: string | null;
  changeInfo: string | null;
  basePrice: number | null;
  taxPrice: number | null;
}

export function asPublicAirOffer(row: unknown): PublicAirOffer | null {
  const offer = row && typeof row === 'object' ? row as Record<string, unknown> : null;
  if (!offer) return null;
  const itinerary = Array.isArray(offer.itinerary) ? offer.itinerary.flatMap(asPublicAirLeg) : [];
  if (!itinerary.length) return null;
  const totalPrice = Number(offer.totalPrice);
  const currency = typeof offer.currency === 'string' ? offer.currency : '';
  if (!Number.isFinite(totalPrice) || !currency) return null;
  return {
    id: String(offer.id ?? ''),
    itinerary,
    totalPrice,
    currency,
    cabinClass: typeof offer.cabinClass === 'string' ? offer.cabinClass : null,
    fareBrand: typeof offer.fareBrand === 'string' ? offer.fareBrand : null,
    baggageInfo: typeof offer.baggageInfo === 'string' ? offer.baggageInfo : null,
    refundInfo: typeof offer.refundInfo === 'string' ? offer.refundInfo : null,
    changeInfo: typeof offer.changeInfo === 'string' ? offer.changeInfo : null,
    basePrice: moneyOf(offer.basePrice),
    taxPrice: moneyOf(offer.taxPrice),
  };
}

function moneyOf(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function asPublicAirLeg(row: unknown): PublicAirLeg[] {
  if (!row || typeof row !== 'object') return [];
  const leg = row as Record<string, unknown>;
  const origin = String(leg.origin ?? '');
  const destination = String(leg.destination ?? '');
  if (!origin || !destination) return [];
  return [{
    carrier: String(leg.carrier ?? ''),
    carrierName: typeof leg.carrierName === 'string' ? leg.carrierName : null,
    operatingCarrier: typeof leg.operatingCarrier === 'string' ? leg.operatingCarrier : null,
    operatingCarrierName: typeof leg.operatingCarrierName === 'string' ? leg.operatingCarrierName : null,
    flightNumber: String(leg.flightNumber ?? ''),
    origin,
    originName: typeof leg.originName === 'string' ? leg.originName : null,
    originCountry: typeof leg.originCountry === 'string' ? leg.originCountry : null,
    originTerminal: typeof leg.originTerminal === 'string' ? leg.originTerminal : null,
    destination,
    destinationName: typeof leg.destinationName === 'string' ? leg.destinationName : null,
    destinationCountry: typeof leg.destinationCountry === 'string' ? leg.destinationCountry : null,
    destinationTerminal: typeof leg.destinationTerminal === 'string' ? leg.destinationTerminal : null,
    departure: String(leg.departure ?? ''),
    arrival: String(leg.arrival ?? ''),
    duration: typeof leg.duration === 'string' ? leg.duration : null,
    equipment: typeof leg.equipment === 'string' ? leg.equipment : null,
    equipmentName: typeof leg.equipmentName === 'string' ? leg.equipmentName : null,
  }];
}
