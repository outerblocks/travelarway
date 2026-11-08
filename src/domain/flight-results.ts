import type { PublicAirOffer } from '@/domain/air-offer';
import {
  calendarDayOf,
  formatClock,
  formatDurationMinutes,
  isoDurationMinutes,
  minutesBetweenLocal,
} from '@/utils/format';

export function marketingLabel(offer: PublicAirOffer): string {
  const names = [...new Set(
    offer.itinerary.map((leg) => (leg.carrierName || '').trim()).filter(Boolean),
  )];
  if (names.length) return names.join(' · ');
  return flightNumbers(offer);
}

export function flightNumbers(offer: PublicAirOffer): string {
  return offer.itinerary
    .map((leg) => `${leg.carrier} ${leg.flightNumber}`.trim())
    .filter(Boolean)
    .join(' · ');
}

export function iataFromPlace(value: string | undefined): string | undefined {
  const match = value?.trim().match(/\(([A-Z]{3})\)\s*$/);
  return match?.[1];
}

export function splitRoundTrip(
  legs: PublicAirOffer['itinerary'],
  destinationCode?: string,
): { outbound: PublicAirOffer['itinerary']; inbound: PublicAirOffer['itinerary'] } {
  if (legs.length < 2) return { outbound: legs, inbound: [] };
  const dest = destinationCode?.toUpperCase();
  if (dest) {
    for (let i = 0; i < legs.length - 1; i += 1) {
      if (legs[i].destination === dest && legs[i + 1].origin === dest) {
        return { outbound: legs.slice(0, i + 1), inbound: legs.slice(i + 1) };
      }
    }
  }
  const home = legs[0]?.origin;
  const last = legs[legs.length - 1];
  if (!home || last?.destination !== home) return { outbound: legs, inbound: [] };
  for (let i = 0; i < legs.length - 1; i += 1) {
    if (legs[i].destination === home) continue;
    if (legs[i + 1].origin !== legs[i].destination) continue;
    const inbound = legs.slice(i + 1);
    if (inbound[inbound.length - 1]?.destination === home) {
      return { outbound: legs.slice(0, i + 1), inbound };
    }
  }
  return { outbound: legs, inbound: [] };
}

export function viaAirports(offer: PublicAirOffer): string[] {
  return viaAirportsOf(offer.itinerary);
}

export function viaAirportsOf(legs: PublicAirOffer['itinerary']): string[] {
  return legs.slice(0, -1).map((leg) => {
    const name = leg.destinationName?.trim();
    return name || leg.destination;
  }).filter(Boolean);
}

export function journeyDuration(offer: PublicAirOffer): string | null {
  return journeyDurationOf(offer.itinerary);
}

export function journeyDurationOf(legs: PublicAirOffer['itinerary']): string | null {
  const flown = legs.reduce<number | null>((sum, leg) => {
    if (sum == null) return null;
    const parsed = leg.duration ? isoDurationMinutes(leg.duration) : null;
    return parsed == null ? null : sum + parsed;
  }, 0);
  if (flown != null && flown > 0) {
    let total = flown;
    for (let i = 0; i < legs.length - 1; i += 1) {
      const layover = minutesBetweenLocal(legs[i].arrival, legs[i + 1].departure);
      if (layover == null) return formatDurationMinutes(flown);
      total += layover;
    }
    return formatDurationMinutes(total);
  }
  const first = legs[0];
  const last = legs[legs.length - 1] ?? first;
  if (!first?.departure || !last?.arrival) return null;
  const elapsed = minutesBetweenLocal(first.departure, last.arrival);
  return elapsed == null ? null : formatDurationMinutes(elapsed);
}

export function arrivesNextDay(offer: PublicAirOffer): boolean {
  return arrivesNextDayOf(offer.itinerary);
}

export function arrivesNextDayOf(legs: PublicAirOffer['itinerary']): boolean {
  const first = legs[0];
  const last = legs[legs.length - 1] ?? first;
  const start = calendarDayOf(first?.departure ?? '');
  const end = calendarDayOf(last?.arrival ?? '');
  return Boolean(start && end && end > start);
}

export function segmentArrivesNextDay(departure: string, arrival: string): boolean {
  const start = calendarDayOf(departure);
  const end = calendarDayOf(arrival);
  return Boolean(start && end && end > start);
}

export function layoverMinutes(previousArrival: string, nextDeparture: string): number | null {
  return minutesBetweenLocal(previousArrival, nextDeparture);
}

export function airportLine(code: string, name: string | null | undefined, country: string | null | undefined): string {
  const label = name?.trim() || code;
  return country ? `${label}, ${country}` : label;
}

export function airportShort(code: string, name: string | null | undefined): string {
  const label = name?.trim();
  if (!label) return code;
  const withoutCode = label.replace(new RegExp(`\\s*\\(${code}\\)\\s*$`, 'i'), '').trim();
  return withoutCode || label;
}

/** Local departure from 20:00 through 05:59. */
export function isNightDeparture(value: string): boolean {
  const hour = Number(formatClock(value).slice(0, 2));
  return Number.isFinite(hour) && (hour >= 20 || hour < 6);
}
