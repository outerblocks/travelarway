import { createFileRoute } from '@tanstack/react-router';
import { IdentityNotConfiguredError } from '@/server/identity/live';
import { loginRedirect } from '@/server/identity/flow';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          return await loginRedirect(request);
        } catch (error) {
          if (error instanceof IdentityNotConfiguredError) return refuseStaffUntilIdentityConfigured();
          throw error;
        }
      },
    },
  },
});
