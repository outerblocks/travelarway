import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { quoteSgrClass } from '@/server/sgr/services';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute('/api/sgr/trips/$tripId/quote')({
  server: {
    handlers: {
      /**
       *   GET /api/sgr/trips/:tripId/quote?class=ROYAL&adults=2&children=0&from=5&to=11
       *
       * The server's price for a party **over the interval they are travelling**, asked again
       * at review rather than carried over from the results list. A fare read off a search page
       * is a display value: prices change, and a total that travelled through the client is one
       * a passenger could edit.
       *
       * `from`/`to` are required. Pricing every journey as the train's whole running would
       * charge a passenger joining at Morogoro for the Dar es Salaam journey they did not take.
       *
       * A party containing a child is refused when no child fare is on file, rather than
       * charged the adult price. Over-charging to complete a booking is not a trade we make.
       */
      GET: async ({ params, request }) => {
        const limited = await rateLimit(request, 'search');
        if (limited) return limited;

        const url = new URL(request.url);
        const seatClassCode = (url.searchParams.get('class') ?? '').trim().toUpperCase();
        const adults = Number(url.searchParams.get('adults') ?? '1');
        const children = Number(url.searchParams.get('children') ?? '0');
        const fromSeq = Number(url.searchParams.get('from'));
        const toSeq = Number(url.searchParams.get('to'));

        if (!UUID.test(params.tripId)) {
          return Response.json({ error: 'invalid_trip' }, { status: 400 });
        }
        if (!seatClassCode) {
          return Response.json({ error: 'missing_class' }, { status: 400 });
        }
        if (!Number.isInteger(fromSeq) || !Number.isInteger(toSeq) || toSeq <= fromSeq || fromSeq < 0) {
          return Response.json({ error: 'invalid_range' }, { status: 400 });
        }
        if (!Number.isInteger(adults) || !Number.isInteger(children) || adults < 0 || children < 0 || adults + children === 0) {
          return Response.json({ error: 'invalid_party' }, { status: 400 });
        }

        try {
          const quote = await quoteSgrClass({ tripId: params.tripId, seatClassCode, adults, children, fromSeq, toSeq });
          if ('error' in quote) {
            const status = quote.error === 'trip_not_found' ? 404 : 409;
            return Response.json({ error: quote.error }, { status, headers: { 'cache-control': 'no-store' } });
          }
          return Response.json(quote, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'unknown error';
          if (message.includes('DATABASE_URL')) {
            return Response.json({ error: 'database_unconfigured' }, { status: 503 });
          }
          console.error('[api/sgr/trips/quote] failed:', message);
          return Response.json({ error: 'quote_failed' }, { status: 500 });
        }
      },
    },
  },
});
