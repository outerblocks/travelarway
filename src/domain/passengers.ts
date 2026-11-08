import type { PassengerInfo } from '@/types';

/**
 * The fare mix a set of travellers has declared for itself.
 *
 * The booking server prices each passenger from the category that traveller states, and it
 * refuses a booking whose mix does not match the party that was searched. Computing the same
 * two numbers here lets the form say so while the customer can still act on it, instead of
 * letting them discover a 409 at checkout.
 */
export function declaredParty(passengers: PassengerInfo[]): { adults: number; children: number } {
  return {
    adults: passengers.filter((passenger) => passenger.category === 'adult').length,
    children: passengers.filter((passenger) => passenger.category === 'child').length,
  };
}

/** True when the declared mix differs from the searched party. */
export function partyMismatched(
  passengers: PassengerInfo[],
  adults: number,
  children: number,
): boolean {
  const declared = declaredParty(passengers);
  return declared.adults !== adults || declared.children !== children;
}
