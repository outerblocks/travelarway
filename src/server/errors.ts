/**
 * Domain errors and driver-code helpers shared by more than one server module.
 *
 * Kept deliberately small: an error lives here only once two modules need the *same* error
 * (same meaning, same shape). Errors that merely share a name but carry different payloads —
 * e.g. the bus `SeatUnavailableError` (seat numbers) and the SGR one (coach/seat pairs) — stay
 * with their modules, because merging them would force one caller to understand the other's
 * data.
 */

/** The trip id does not exist. Route handlers map this to 404. */
export class TripNotFoundError extends Error {
  constructor() {
    super('trip_not_found');
    this.name = 'TripNotFoundError';
  }
}

/** PostgreSQL `unique_violation` (SQLSTATE 23505). */
export const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';

