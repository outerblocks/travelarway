import type { IdType } from '@/types';

const DOMESTIC_ID_TYPES: IdType[] = ['national_id', 'passport', 'driving_licence', 'voter_card'];
const INTERNATIONAL_ID_TYPES: IdType[] = ['passport'];

export interface FlightIdentityPolicy {
  requireId: boolean;
  allowedIdTypes: IdType[];
}

/**
 * Identity collected on the flight passenger form.
 *
 * Travelport Add Traveler (`TravelDocument`) is optional and converted to SSR DOCS/FOID
 * only when sent; some carriers require documents on some routes (international is the
 * documented example). That is not a rule that domestic bookings omit ID.
 *
 * Check-in and boarding do require photo ID on the domestic markets we verified:
 * - Tanzania: Air Tanzania CoC 3.1.3 (passport, national ID, driving licence, voters ID);
 *   Flightlink FAQs citing Tanzanian civil aviation law (national ID, passport or driving
 *   licence domestically; passport internationally).
 * - Kenya: Kenya Airports Authority FAQs (government-issued photo ID or passport to enter
 *   the terminal).
 * - South Africa: Civil Aviation Regulations 2011 Part 112.00.1 (identification at the
 *   boarding gate for scheduled flights, domestic or international, age 18+).
 *
 * Travelar therefore requires an ID on every flight passenger row. International itineraries
 * accept passport only. Domestic itineraries accept the photo ID types used at those
 * airports. We do not invent a per-carrier FOID matrix until reservation is enabled.
 */
export function flightIdentityPolicy(international: boolean): FlightIdentityPolicy {
  if (international) {
    return { requireId: true, allowedIdTypes: INTERNATIONAL_ID_TYPES };
  }
  return { requireId: true, allowedIdTypes: DOMESTIC_ID_TYPES };
}
