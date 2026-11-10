import { Outlet, useLocation } from '@tanstack/react-router';
import { Navigate, Link } from '@/router';
import { useAuth } from '@/context/AuthContext';
import { RoutePending } from '@/components/shared/RouteStates';
import { useRouteWaitHold } from '@/components/shared/TravelarLoader';
import { HqSessionContext, useHqSession, useHqSessionContext } from '@/hooks/useHqSession';

export function HqShell() {
  const value = useHqSession();
  return (
    <HqSessionContext.Provider value={value}>
      <HqShellInner />
    </HqSessionContext.Provider>
  );
}

function HqShellInner() {
  const { user, loading } = useAuth();
  const hq = useHqSessionContext();
  const location = useLocation();
  const waiting = loading || hq.status === 'loading';
  useRouteWaitHold(waiting && !hq.me);

  if (waiting && !hq.me) return <RoutePending />;
  if (!user) return <Navigate to="/operator/hims-signin" replace />;
  if (hq.status === 'error' || !hq.me) {
    return (
      <div className="mx-auto max-w-lg p-12 text-center">
        <p className="text-sm text-error-600">{hq.error || 'HIMS is unavailable.'}</p>
        {hq.bootstrap ? (
          <>
            <p className="mt-4 text-sm text-neutral-600">
              No HQ staff assignment exists yet. Claim the first HQ Admin role with this already-registered Travelar account.
            </p>
            <button
              type="button"
              className="btn-primary mt-4 text-xs"
              onClick={() => {
                void fetch('/api/hims/bootstrap', { method: 'POST', credentials: 'same-origin' }).then(() => window.location.reload());
              }}
            >
              Claim first HQ Admin assignment
            </button>
          </>
        ) : null}
      </div>
    );
  }

  const allowed = hq.nav.some((item) => item.to === location.pathname || (item.to !== '/hq' && location.pathname.startsWith(`${item.to}/`)));
  const onHqHome = location.pathname === '/hq';
  if (onHqHome && !hq.nav.some((item) => item.to === '/hq')) {
    return <Navigate to={hq.nav[0]?.to ?? '/hq/work'} replace />;
  }
  if (!onHqHome && !allowed) {
    return <Navigate to={hq.nav[0]?.to ?? '/hq'} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">Travelar HQ</p>
            <h1 className="text-xl font-bold text-neutral-900">Operating system</h1>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <p>Market TZ-ML · OuterBlocks Limited</p>
            <p>{hq.me.roles.map((role) => role.name).join(', ') || 'HQ staff'}</p>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-4 px-6 pb-3 text-sm">
          {hq.nav.map((item) => {
            const active = location.pathname === item.to || (item.to !== '/hq' && location.pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to} className={active ? 'font-semibold text-brand-700' : 'text-neutral-500'}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
