/**
 * Ticketed carriers that are not the airline on the aircraft. Hahn Air (`H1`/`HR`)
 * and FlexFlight (`W2`) issue the ticket; Euroairlines (`Q4`) is a codeshare
 * designator on Tanzanian operators such as Auric Air. The card brands the
 * operating airline. Flight numbers keep the ticketed prefix the GDS returned.
 */
export const TICKETING_CARRIERS = new Set(['H1', 'HR', 'W2', 'Q4']);

export function isTicketingCarrier(code: string | null | undefined): boolean {
  return TICKETING_CARRIERS.has((code ?? '').trim().toUpperCase());
}
