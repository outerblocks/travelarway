import { timingSafeEqual } from 'node:crypto';
import { createFileRoute } from '@tanstack/react-router';
import { getServerConfig } from '@/server/config';
import { processOutboxBatch } from '@/server/outbox';
import { log } from '@/server/log';

export const Route = createFileRoute('/api/internal/outbox')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { maintenanceSecret } = getServerConfig();
        if (!maintenanceSecret) {
          return Response.json({ error: 'outbox_not_configured' }, { status: 503 });
        }
        const provided = Buffer.from(request.headers.get('x-sweep-secret') ?? '', 'utf8');
        const expected = Buffer.from(maintenanceSecret, 'utf8');
        if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
          return Response.json({ error: 'unauthorized' }, { status: 401 });
        }
        try {
          const summary = await processOutboxBatch();
          return Response.json(summary, { headers: { 'cache-control': 'no-store' } });
        } catch (error) {
          log('error', 'outbox_drain_failed', { message: (error as Error).message });
          return Response.json({ error: 'outbox_failed' }, { status: 503 });
        }
      },
    },
  },
});
