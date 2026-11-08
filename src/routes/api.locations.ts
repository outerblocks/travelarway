import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { isGdsLocationMode, listLocations, LOCAL_COUNTRY_MODES, MODE_LOCATION_KINDS } from '@/server/search';

/** GET /api/locations?q=dar&mode=train — the places a given mode can be searched between. */
export const Route = createFileRoute('/api/locations')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = rateLimit(request, 'search');
        if (limited) return limited;

        const url = new URL(request.url);
        const term = url.searchParams.get('q')?.trim() || undefined;
        const mode = url.searchParams.get('mode')?.trim();
        const requestedCountry = url.searchParams.get('country')?.trim() || undefined;

        // An unknown mode is refused rather than answered with every kind: a typo in a
        // deployment would otherwise quietly offer ferry ports as bus terminals.
        if (mode && !(mode in MODE_LOCATION_KINDS)) {
          return Response.json(
            { error: 'unknown_mode', known_modes: Object.keys(MODE_LOCATION_KINDS) },
            { status: 400 },
          );
        }

        try {
          if (isGdsLocationMode(mode ?? '') && (!term || term.length < 2)) {
            return Response.json(
              { data: [], count: 0 },
              { headers: { 'cache-control': 'public, max-age=60' } },
            );
          }
          const localCountry = mode && (LOCAL_COUNTRY_MODES as readonly string[]).includes(mode)
            ? 'TZ'
            : undefined;
          const locations = await listLocations(term, {
            kinds: mode ? MODE_LOCATION_KINDS[mode] : undefined,
            country: requestedCountry || localCountry,
            limit: isGdsLocationMode(mode ?? '') ? 40 : 200,
          });
          return Response.json(
            { data: locations, count: locations.length },
            { headers: { 'cache-control': 'public, max-age=300' } },
          );
        } catch {
          // The message is deliberately generic: a driver error can echo the query.
          return Response.json({ error: 'locations_unavailable' }, { status: 503 });
        }
      },
    },
  },
});
