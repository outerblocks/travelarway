import { useCallback, useEffect, type AnchorHTMLAttributes } from 'react';
import {
  Link as TanStackLink,
  createRouter,
  useNavigate as useTanStackNavigate,
  useRouter,
} from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
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
