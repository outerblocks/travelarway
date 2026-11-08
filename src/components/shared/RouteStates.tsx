/**
 * Route-transition shells. They render outside page code, so they intentionally
 * avoid i18n hooks and show only shape and colour: a skeleton for pending
 * navigation and a recoverable error card for a failed route.
 */
export function RoutePending() {
  return (
    <div className="section-container py-12" role="status" aria-live="polite" aria-label="Loading page">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="h-8 w-56 animate-pulse rounded-md bg-neutral-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-neutral-200/80" />
        <div className="space-y-3 pt-4">
          {[0, 1, 2].map((row) => (
            <div key={row} className="card flex items-center gap-4 p-5">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-neutral-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/5 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-neutral-200/80" />
              </div>
              <div className="h-9 w-24 animate-pulse rounded-lg bg-neutral-200" />
            </div>
          ))}
        </div>
        <p className="pt-2 text-center text-meta text-neutral-500">Loading</p>
      </div>
    </div>
  );
}

export function RouteError({ reset }: { reset: () => void }) {
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
