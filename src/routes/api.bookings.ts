import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import {
  BookingNotConfiguredError,
  createBooking,
  SeatsNotHeldError,
  TripNotFoundError,
} from '@/server/bookings';
import { QuoteUnavailableError } from '@/server/quote';
import { isUuid, parseEmail, parsePersonName, parseSeatCode } from '@/domain/input-validation';

const CATEGORIES = new Set(['adult', 'child', 'infant']);

/**
 * POST /api/bookings
 *
 * Turns an existing hold into an issued booking. 409 when the seats are no longer held —
 * expired, released, or consumed by someone else — which is the honest answer rather than
 * silently selling a seat that is already taken.
 */
export const Route = createFileRoute('/api/bookings')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'bookings');
        if (limited) return limited;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 });
        }

        const input = body as Record<string, unknown>;
        const tripId = typeof input.tripId === 'string' ? input.tripId : '';
        const fromStopId = typeof input.fromStopId === 'string' ? input.fromStopId : '';
        const toStopId = typeof input.toStopId === 'string' ? input.toStopId : '';
        const adults = typeof input.adults === 'number' ? Math.trunc(input.adults) : -1;
        const children = typeof input.children === 'number' ? Math.trunc(input.children) : -1;
        const seats = Array.isArray(input.seats)
          ? input.seats.filter((seat): seat is string => typeof seat === 'string')
          : [];
        const passengersRaw = Array.isArray(input.passengers) ? input.passengers : [];

        if (!isUuid(tripId) || !isUuid(fromStopId) || !isUuid(toStopId)) {
          return Response.json({ error: 'invalid_trip_or_segment' }, { status: 400 });
        }
        const seatCodes = seats.map(parseSeatCode);
        if (seatCodes.length === 0 || seatCodes.some((seat) => !seat)) {
          return Response.json({ error: 'invalid_seats' }, { status: 400 });
        }
        if (adults < 0 || children < 0) {
          return Response.json({ error: 'invalid_party' }, { status: 400 });
        }

        // Passenger fares are deliberately not read from the request: the server prices
        // each passenger from the segment, so a client cannot choose what it owes.
        const passengers = passengersRaw
          .map((raw) => raw as Record<string, unknown>)
          .map((raw) => ({
            fullName: typeof raw.fullName === 'string' ? parsePersonName(raw.fullName) ?? '' : '',
            category: typeof raw.category === 'string' ? raw.category : '',
            seatNo: typeof raw.seatNo === 'string' ? parseSeatCode(raw.seatNo) ?? '' : '',
          }));

        if (
          passengers.length !== seatCodes.length ||
          passengers.length !== adults + children ||
          passengers.some(
            (passenger) =>
              !passenger.fullName ||
              !CATEGORIES.has(passenger.category) ||
              !passenger.seatNo,
          )
        ) {
          return Response.json({ error: 'invalid_passengers' }, { status: 400 });
        }

        // The declared party is checked against the fare mix the passengers actually state,
        // and the quote is then taken from the stated mix rather than the declared counts.
        // Without this, declaring `adults: 0, children: 2` behind two adult passengers would
        // book two adult seats at the child price: the counts and the rows would disagree,
        // and the disagreement would be in the customer's favour, which is our loss.
        const adultRows = passengers.filter((passenger) => passenger.category === 'adult').length;
        const childRows = passengers.filter((passenger) => passenger.category === 'child').length;
        if (adultRows !== adults || childRows !== children) {
          return Response.json(
            { error: 'party_changed', adults: adultRows, children: childRows },
            { status: 409, headers: { 'cache-control': 'no-store' } },
          );
        }

        try {
          const booking = await createBooking({
            tripId,
            fromStopId,
            toStopId,
            seats: seatCodes as string[],
            passengers: passengers as Parameters<typeof createBooking>[0]['passengers'],
            adults: adultRows,
            children: childRows,
            customerName: typeof input.customerName === 'string' ? parsePersonName(input.customerName) ?? '' : '',
            customerEmail: typeof input.customerEmail === 'string' ? parseEmail(input.customerEmail) ?? '' : '',
            customerPhone: typeof input.customerPhone === 'string' ? input.customerPhone.trim() : '',
          });

          return Response.json(booking, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          if (error instanceof SeatsNotHeldError) {
            return Response.json(
              { error: 'seats_not_held', seats: error.seats },
              { status: 409, headers: { 'cache-control': 'no-store' } },
            );
          }
          if (error instanceof TripNotFoundError) {
            return Response.json({ error: 'trip_not_found' }, { status: 404 });
          }
          if (error instanceof QuoteUnavailableError) {
            // The requested stop pair is not a priced segment of this route.
            return Response.json({ error: 'quote_unavailable', reason: error.reason }, { status: 409 });
          }
          if (error instanceof BookingNotConfiguredError) {
            // A deployment fault, not a user error: no booking can be signed, so say which
            // variable is missing instead of blaming the request.
            console.error(`[api/bookings] refused: ${error.variable} is not set`);
            return Response.json({ error: 'booking_unavailable' }, { status: 503 });
          }
          const message = error instanceof Error ? error.message : 'unknown error';
          console.error('[api/bookings] commit failed:', message);
          return Response.json({ error: 'booking_failed' }, { status: 503 });
        }
      },
    },
  },
});
