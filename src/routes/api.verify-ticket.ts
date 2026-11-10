import { createFileRoute } from '@tanstack/react-router';
import { rateLimit } from '@/server/rate-limit';
import { readTicketToken } from '@/server/ticket-token';
import { query } from '@/server/db';

/**
 * GET /api/verify-ticket?token=<qr payload>
 *
 * The boarding check. The token is the only accepted input: a bare PNR is guessable and
 * would turn this endpoint into a passenger database. Manual entry by reference is a
 * separate decision that needs a second factor (email or phone) before it exists.
 *
 * Returns only what a conductor needs to let someone board. It does not accept a
 * check-in: writing "boarded" is an OIMS action with its own authorisation and audit.
 */
export const Route = createFileRoute('/api/verify-ticket')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const limited = await rateLimit(request, 'tickets');
        if (limited) return limited;

        const token = new URL(request.url).searchParams.get('token')?.trim() ?? '';
        if (!token) {
          return Response.json({ error: 'token_required' }, { status: 400, headers: { 'cache-control': 'no-store' } });
        }

        let payload;
        try {
          payload = readTicketToken(token);
        } catch {
          // Missing or short secret: fail closed rather than serve unverified tickets.
          console.error('[api/verify-ticket] verification unavailable: secret not configured');
          return Response.json({ error: 'verification_unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
        }

        if (!payload) {
          return Response.json({ valid: false, reason: 'bad_signature' }, { status: 403, headers: { 'cache-control': 'no-store' } });
        }

        try {
          const { rows } = await query<{
            pnr: string;
            status: string;
            service_date: string;
            operator_name: string;
            route_name: string;
            passengers: { name: string; seat: string | null; category: string }[];
          }>(
            `select b.pnr, b.status::text as status,
                    to_char(t.service_date, 'YYYY-MM-DD') as service_date,
                    o.name as operator_name, r.name as route_name,
                    coalesce(
                      json_agg(json_build_object('name', bp.full_name, 'seat', bp.seat_no, 'category', bp.category))
                        filter (where bp.id is not null),
                      '[]'::json
                    ) as passengers
               from app.booking b
               join app.trip t on t.id = b.trip_id
               join app.operator o on o.id = b.operator_id
               join app.route r on r.id = t.route_id
               left join app.booking_passenger bp on bp.booking_id = b.id
              where b.id = $1 and b.pnr = $2
              group by b.pnr, b.status, t.service_date, o.name, r.name, b.id`,
            [payload.bookingId, payload.pnr],
          );

          if (rows.length === 0) {
            return Response.json({ valid: false, reason: 'unknown_booking' }, { status: 404, headers: { 'cache-control': 'no-store' } });
          }

          const booking = rows[0];
          // Only an issued booking is valid for travel; held, cancelled and refunded are
          // all refused, with the status echoed so the conductor can explain why.
          return Response.json(
            {
              valid: booking.status === 'issued',
              status: booking.status,
              pnr: booking.pnr,
              serviceDate: booking.service_date,
              operator: booking.operator_name,
              route: booking.route_name,
              passengers: booking.passengers,
              checkedAt: new Date().toISOString(),
            },
            { status: 200, headers: { 'cache-control': 'no-store' } },
          );
        } catch {
          return Response.json({ error: 'verification_unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
        }
      },
    },
  },
});
