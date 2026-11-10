import { useCallback, useEffect, type AnchorHTMLAttributes } from 'react';
import {
  Link as TanStackLink,
  createRouter,
  useNavigate as useTanStackNavigate,
  useRouter,
} from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { RouteError, RoutePending } from '@/components/shared/RouteStates';

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultErrorComponent: RouteError,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
}

interface NavigateProps {
  to: string;
  replace?: boolean;
}

export function Link({ to, replace, ...props }: LinkProps) {
  return <TanStackLink to={to as never} replace={replace} {...props} />;
}

export function useNavigate() {
  const navigate = useTanStackNavigate();
  const router = useRouter();

  return useCallback((to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      router.history.go(to);
      return;
    }

    // Search-form URLs carry `?from=` and similar. Passing that whole string as
    // `to` does not match a file route, so the click looked like a no-op.
    if (to.includes('?') || to.includes('#')) {
      if (options?.replace) router.history.replace(to);
      else router.history.push(to);
      return;
    }

    void navigate({ to: to as never, replace: options?.replace });
  }, [navigate, router]);
}

export function Navigate({ to, replace }: NavigateProps) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
}
