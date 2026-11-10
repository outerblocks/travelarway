import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireOimsPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/oims/http';
import { quoteOtc, reprintOtc, requestOtcVoid, sellOtc } from '@/server/oims/otc';

export const Route = createFileRoute('/api/oims/otc')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'oims');
        if (limited) return limited;
        try {
          const body = await request.json() as Record<string, unknown>;
          const { operatorId, userId, mode } = await requireOimsPermission(request, 'oims.otc.sell');
          if (body.mode && body.mode !== mode) {
            return Response.json({ error: 'invalid_mode' }, { status: 400 });
          }
          const actor = `user:${userId}`;
          if (body.action === 'quote') {
            const quote = await quoteOtc({
              operatorId,
              consoleMode: mode,
              tripId: String(body.tripId ?? ''),
              fromStopId: typeof body.fromStopId === 'string' ? body.fromStopId : undefined,
              toStopId: typeof body.toStopId === 'string' ? body.toStopId : undefined,
              vesselClassId: typeof body.vesselClassId === 'string' ? body.vesselClassId : undefined,
              adults: Number(body.adults ?? 1),
              children: Number(body.children ?? 0),
            });
            return Response.json(quote, { headers: { 'cache-control': 'no-store' } });
          }
          if (body.action === 'reprint') {
            const result = await reprintOtc({
              operatorId,
              actor,
              bookingId: String(body.bookingId ?? ''),
              reason: String(body.reason ?? ''),
            });
            return Response.json(result, { headers: { 'cache-control': 'no-store' } });
          }
          if (body.action === 'void') {
            const result = await requestOtcVoid({
              operatorId,
              actorUserId: userId,
              actor,
              bookingId: String(body.bookingId ?? ''),
              reason: String(body.reason ?? ''),
            });
            return Response.json(result, { headers: { 'cache-control': 'no-store' } });
          }
          const passengers = Array.isArray(body.passengers)
            ? body.passengers.map((row) => {
                const item = row as Record<string, unknown>;
                return {
                  fullName: String(item.fullName ?? ''),
                  category: item.category === 'child' ? 'child' as const : 'adult' as const,
                  seatNo: typeof item.seatNo === 'string' ? item.seatNo : undefined,
                };
              })
            : [];
          const result = await sellOtc({
            operatorId,
            actor,
            consoleMode: mode,
            tripId: String(body.tripId ?? ''),
            fromStopId: typeof body.fromStopId === 'string' ? body.fromStopId : undefined,
            toStopId: typeof body.toStopId === 'string' ? body.toStopId : undefined,
            vesselClassId: typeof body.vesselClassId === 'string' ? body.vesselClassId : undefined,
            seats: Array.isArray(body.seats) ? body.seats.map(String) : passengers.map((row) => row.seatNo).filter(Boolean) as string[],
            customerName: String(body.customerName ?? ''),
            customerPhone: String(body.customerPhone ?? ''),
            passengers,
            body,
          });
          return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});
