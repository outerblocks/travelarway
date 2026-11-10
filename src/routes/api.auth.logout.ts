import { createFileRoute } from '@tanstack/react-router';
import { logoutRedirect } from '@/server/identity/flow';

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => logoutRedirect(request),
      POST: async ({ request }: { request: Request }) => logoutRedirect(request),
    },
  },
});
