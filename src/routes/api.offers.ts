import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { decorateAirOffers, presentAirOffers } from '@/server/providers/air-present';
import { presentStayOffers } from '@/server/providers/stay-present';
import { publicAirFromCanonical } from '@/server/flights';
import { searchFlightOffers, searchStayOffers } from '@/server/providers/orchestrate';
import { iataCodeOf, resolveLocation } from '@/server/resolve-location';
import { LOCAL_COUNTRY_MODES, MODE_LOCATION_KINDS } from '@/server/search';
import { searchFerrySailings } from '@/server/ferry-results';
import { todayISO } from '@/utils/format';

/**
 * GET /api/offers?mode=flights|stays|ferry|experiences&from=&to=&date=
 *
 * Bus stays Tanzania-local. Train search for TRC SGR uses /api/sgr/services; Madaraka
 * Express is operator-direct once inventory exists; international rail is GDS-blocked.
 * Flights and stays resolve worldwide IATA geography through GDS adapters.
 */
export const Route = createFileRoute('/api/offers')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = rateLimit(request, 'search');
        if (limited) return limited;

        const params = new URL(request.url).searchParams;
        const mode = params.get('mode')?.trim() ?? '';
        const from = params.get('from')?.trim() ?? '';
        const to = params.get('to')?.trim() ?? '';
        const date = params.get('date')?.trim() ?? '';
        const returnDate = params.get('returnDate')?.trim() ?? '';
        const checkOut = params.get('checkOut')?.trim() ?? '';
        const adults = positiveInt(params.get('adults'), 1);
        const children = positiveInt(params.get('children'), 0);
        const infants = positiveInt(params.get('infants'), 0);
        const rooms = positiveInt(params.get('rooms'), 1);

        if (!(mode in MODE_LOCATION_KINDS)) {
          return Response.json({ error: 'unknown_mode' }, { status: 400 });
        }
        if (mode === 'bus' || mode === 'train') {
          return Response.json(
            { error: 'use_dedicated_search', detail: mode === 'bus' ? '/api/bus/results' : '/api/sgr/services' },
            { status: 400 },
          );
        }
        if (!from || (mode !== 'experiences' && mode !== 'stays' && !to)) {
          return Response.json({ error: 'missing_places' }, { status: 400 });
        }
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return Response.json({ error: 'invalid_date' }, { status: 400 });
        }
        if (returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
          return Response.json({ error: 'invalid_date' }, { status: 400 });
        }
        if (checkOut && !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
          return Response.json({ error: 'invalid_date' }, { status: 400 });
        }

        try {
          const kinds = MODE_LOCATION_KINDS[mode];
          const country = (LOCAL_COUNTRY_MODES as readonly string[]).includes(mode) ? 'TZ' : undefined;
          const origin = await resolveLocation(from, { kinds, country });
          const destination = to ? await resolveLocation(to, { kinds, country }) : origin;
          const unresolved = [
            !origin ? from : null,
            to && !destination ? to : null,
          ].filter((name): name is string => Boolean(name));

          const places = {
            from: origin ? { id: origin.id, name: origin.name, kind: origin.kind } : null,
            to: destination ? { id: destination.id, name: destination.name, kind: destination.kind } : null,
          };

          if (unresolved.length) {
            return Response.json(
              { data: [], count: 0, source: 'gds', inventory: 'unresolved_places', places, unresolved_places: unresolved },
              { headers: { 'cache-control': 'no-store' } },
            );
          }

          if (mode === 'flights' && origin && destination && date) {
            const originCode = iataCodeOf(origin);
            const destinationCode = iataCodeOf(destination);
            if (!originCode || !destinationCode) {
              return Response.json(
                {
                  data: [],
                  count: 0,
                  source: 'gds',
                  inventory: 'missing_iata',
                  places,
                  unresolved_places: [],
                },
                { headers: { 'cache-control': 'no-store' } },
              );
            }

            const offers = await decorateAirOffers(presentAirOffers(await searchFlightOffers({
              originCode,
              destinationCode,
              departureDate: date,
              returnDate: returnDate || undefined,
              adults,
              children,
              infants,
            })));

            return Response.json(
              {
                data: offers.map(publicAirFromCanonical),
                count: offers.length,
                source: 'gds',
                inventory: 'adapter',
                places,
                unresolved_places: [],
                bookable: false,
              },
              { headers: { 'cache-control': 'no-store' } },
            );
          }

          if (mode === 'ferry' && origin && destination) {
            const sailDate = date || todayISO();
            const sailings = await searchFerrySailings({
              from: origin.id,
              to: destination.id,
              date: sailDate,
            });
            return Response.json(
              {
                data: sailings,
                count: sailings.length,
                source: 'database',
                inventory: 'operator_published',
                places,
                unresolved_places: [],
                bookable: sailings.length > 0,
              },
              { headers: { 'cache-control': 'no-store' } },
            );
          }

          if (mode === 'stays' && origin && date && checkOut) {
            const originCode = iataCodeOf(origin);
            const offers = presentStayOffers(await searchStayOffers({
              cityName: origin.name,
              countryCode: origin.countryCode,
              cityCode: origin.kind === 'airport' ? undefined : originCode ?? undefined,
              airportCode: origin.kind === 'airport' ? originCode ?? undefined : undefined,
              checkInDate: date,
              checkOutDate: checkOut,
              adults,
              children,
              rooms,
            }));

            return Response.json(
              {
                data: offers.map((offer) => ({
                  id: offer.travelarOfferId,
                  name: offer.propertyName,
                  location: offer.locationLabel,
                  address: offer.addressLine ?? null,
                  photoUrls: offer.photoUrls ?? [],
                  starRating: offer.starRating ?? null,
                  amenities: offer.amenities ?? [],
                  distance: offer.distanceLabel ?? null,
                  description: offer.description ?? null,
                  reviews: (offer.reviews ?? []).map((review) => ({
                    text: review.text,
                    author: review.author ?? null,
                    score: review.score ?? null,
                    date: review.date ?? null,
                  })),
                  totalPrice: offer.totalAmount ?? null,
                  currency: offer.currency ?? null,
                })),
                count: offers.length,
                source: 'gds',
                inventory: 'adapter',
                places,
                unresolved_places: [],
                bookable: false,
              },
              { headers: { 'cache-control': 'no-store' } },
            );
          }

          return Response.json(
            {
              data: [],
              count: 0,
              source: mode === 'flights' || mode === 'stays' ? 'gds' : 'database',
              inventory: mode === 'flights' || mode === 'stays' ? 'adapter' : 'unmodelled',
              places,
              unresolved_places: [],
              bookable: false,
            },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'unknown';
          if (message.includes('DATABASE_URL')) {
            return Response.json({ error: 'database_unconfigured' }, { status: 503 });
          }
          console.error('[api/offers] failed:', message);
          return Response.json({ error: 'search_unavailable' }, { status: 503 });
        }
      },
    },
  },
});

function positiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}
