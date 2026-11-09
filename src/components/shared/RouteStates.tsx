/**
 * Route-transition shells. They render outside page code, so they intentionally
 * avoid i18n hooks and show only shape and colour: a skeleton for pending
 * navigation and a recoverable error card for a failed route.
 */
export function RoutePending() {
  return (
    <div className="section-container py-10" role="status" aria-live="polite" aria-label="Loading page">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-72" />
        <div className="space-y-3 pt-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className="card flex items-center gap-4 p-5">
              <div className="skeleton h-12 w-12 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-3.5 w-2/5" />
                <div className="skeleton h-3 w-1/4" />
              </div>
              <div className="skeleton h-9 w-24 rounded-lg" />
            </div>
          ))}
        </div>
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
