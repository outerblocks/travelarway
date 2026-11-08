import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { findClassSeatCounts, findPublishedTrainset } from '@/server/sgr/layout-repository';

/**
 * GET /api/sgr/layouts?trainset=TRC_SGR_EMU_8CAR
 *
 * The published seat layout of a trainset, one entry per car, read from the database.
 *
 * This is the endpoint that makes the layouts reachable without a deploy: the geometry lives
 * in `sgr_coach_layouts` and its cells and seats, so an operator correcting a coach changes
 * what every client renders. Nothing here calls the generator — if it did, the tables would
 * be a copy of the code and the correction would have nowhere to go.
 *
 * A trainset that has no published layout answers 404 rather than an empty map, because an
 * empty grid would look like a coach with no seats to whomever is drawing it.
 */
export const Route = createFileRoute('/api/sgr/layouts')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = rateLimit(request, 'search');
        if (limited) return limited;

        const code = new URL(request.url).searchParams.get('trainset')?.trim();
        if (!code) {
          return Response.json(
            { error: 'missing_trainset', detail: 'trainset is required, e.g. TRC_SGR_EMU_8CAR' },
            { status: 400 },
          );
        }

        try {
          const [trainset, classCounts] = await Promise.all([
            findPublishedTrainset(code),
            findClassSeatCounts(code),
          ]);

          if (!trainset) {
            return Response.json({ error: 'trainset_not_found', trainset: code }, { status: 404 });
          }

          return Response.json(
            {
              data: {
                code: trainset.code,
                coaches: trainset.coaches,
                classes: classCounts,
                // Null means the operator has not confirmed an allowance, which is not the
                // same as none. A client must not print "0 kg" from it.
                seatClasses: trainset.seatClassByCode,
              },
            },
            { headers: { 'cache-control': 'no-store' } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'unknown error';
          console.error('[api/sgr/layouts] read failed:', message);
          return Response.json(
            { error: message.includes('DATABASE_URL') ? 'database_unconfigured' : 'layout_unavailable' },
            { status: 503 },
          );
        }
      },
    },
  },
});
