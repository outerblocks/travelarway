import { isAbortError } from '@/hooks/query-status';
import { TravelarLoader, useRouteWaitHold } from '@/components/shared/TravelarLoader';

/**
 * Route-transition shells. They render outside page code, so they intentionally
 * avoid i18n hooks. When the root wait overlay is present, this only holds it
 * so a second scene cannot mount and blink.
 */
export function RoutePending() {
  const hosted = useRouteWaitHold();
  if (hosted) return null;
  return <TravelarLoader message="Preparing your journey" />;
}

/**
 * Shown only when the route itself failed to load or render. In-page search/booking
 * failures keep their own ErrorState. A cancelled navigation is not a failed page.
 */
export function RouteError({ error, reset }: { error?: unknown; reset: () => void }) {
  if (isAbortError(error)) return <RoutePending />;

  return (
    <div className="section-container py-16 text-center">
      <div className="mx-auto max-w-md">
        <h1 className="text-listing font-bold text-neutral-900">This page could not be loaded</h1>
        <p className="mt-2 text-body text-neutral-500">
          Something interrupted the request. Try again, or go back to the previous page.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
          <button type="button" onClick={() => window.history.back()} className="btn-secondary">
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
