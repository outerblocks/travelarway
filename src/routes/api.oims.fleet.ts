import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { jsonError, requireOperator } from '@/server/oims/http';
import { createVehicle, createVessel, createVesselClass } from '@/server/oims/repository';

export const Route = createFileRoute('/api/oims/fleet')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = guardMutation(request, 'oims');
        if (limited) return limited;
        try {
          const body = await request.json() as Record<string, unknown>;
          const mode = body.mode;
          if (mode !== 'bus' && mode !== 'ferry') return Response.json({ error: 'invalid_mode' }, { status: 400 });
          const operatorId = requireOperator(request);
          if (mode === 'ferry') {
            if (body.action === 'class') {
              const vesselClass = await createVesselClass(operatorId, 'oims-operator', {
                vesselId: String(body.vesselId ?? ''),
                name: String(body.name ?? ''),
                capacity: Number(body.capacity ?? 0),
                adultFareMinor: Number(body.adultFareMinor ?? 0),
                currency: 'USD',
              });
              return Response.json(vesselClass, { status: 201, headers: { 'cache-control': 'no-store' } });
            }
            const vessel = await createVessel(operatorId, 'oims-operator', {
              name: String(body.name ?? ''),
              passengerCertificateMax: Number(body.passengerCertificateMax ?? 0),
              registration: typeof body.registration === 'string' ? body.registration : undefined,
            });
            return Response.json(vessel, { status: 201, headers: { 'cache-control': 'no-store' } });
          }
          const vehicle = await createVehicle(operatorId, 'oims-operator', {
            registration: String(body.registration ?? ''),
            model: typeof body.model === 'string' ? body.model : undefined,
            serviceClass: body.serviceClass === 'ordinary' || body.serviceClass === 'semi_luxury' || body.serviceClass === 'luxury'
              ? body.serviceClass
              : undefined,
            totalSeats: typeof body.totalSeats === 'number' ? body.totalSeats : undefined,
          });
          return Response.json(vehicle, { status: 201, headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});
