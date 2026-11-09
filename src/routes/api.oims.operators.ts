import { createFileRoute } from '@tanstack/react-router';
import { query } from '@/server/db';

export const Route = createFileRoute('/api/oims/operators')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const mode = new URL(request.url).searchParams.get('mode');
        if (mode !== 'bus' && mode !== 'ferry') {
          return Response.json({ error: 'invalid_mode' }, { status: 400 });
        }
        const { rows } = await query<{ id: string; name: string }>(
          `select id, name from app.operator where mode = $1 and status = 'active' order by name`,
          [mode],
        );
        return Response.json({ data: rows }, { headers: { 'cache-control': 'no-store' } });
      },
    },
  },
});
