import { createFileRoute } from '@tanstack/react-router';
import { guardMutation } from '@/server/request-guard';
import { requireOimsPermission } from '@/server/identity/staff-gate';
import { jsonError } from '@/server/oims/http';
import { saveCompliance } from '@/server/oims/repository';

export const Route = createFileRoute('/api/oims/compliance')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const limited = await guardMutation(request, 'oims');
        if (limited) return limited;
        try {
          const body = await request.json() as Record<string, unknown>;
          const mode = body.mode;
          if (mode !== 'bus' && mode !== 'ferry') return Response.json({ error: 'invalid_mode' }, { status: 400 });
          const { operatorId, userId } = await requireOimsPermission(request, 'oims.routes.manage');
          await saveCompliance(operatorId, mode, `user:${userId}`, {
            latraLicenceNumber: typeof body.latraLicenceNumber === 'string' ? body.latraLicenceNumber : undefined,
            tasacLicenceNumber: typeof body.tasacLicenceNumber === 'string' ? body.tasacLicenceNumber : undefined,
            electronicTicketingRegistered: typeof body.electronicTicketingRegistered === 'boolean'
              ? body.electronicTicketingRegistered
              : undefined,
            licenceValidTo: typeof body.licenceValidTo === 'string' ? body.licenceValidTo : undefined,
            passengerCertificateMax: typeof body.passengerCertificateMax === 'number'
              ? body.passengerCertificateMax
              : undefined,
          });
          return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});
