export function BusResultsSkeleton() {
  return (
    <div className="section-container py-6">
      <div className="skeleton h-8 w-64 mb-6" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-sm" />
              <div>
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
            <div className="skeleton h-10 w-24 rounded-sm" />
          </div>
          <div className="flex gap-8">
            <div className="flex-1">
              <div className="skeleton h-4 w-20 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="flex-1">
              <div className="skeleton h-4 w-20 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="flex-1">
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FerryResultsSkeleton() {
  return (
    <div className="section-container py-6">
      <div className="skeleton h-8 w-64 mb-6" />
      {[1, 2].map((i) => (
        <div key={i} className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-sm" />
              <div>
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((j) => (
              <div key={j} className="border border-neutral-200 rounded-sm p-4">
                <div className="skeleton h-4 w-20 mb-2" />
                <div className="skeleton h-3 w-16 mb-2" />
                <div className="skeleton h-8 w-24 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GenericResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="section-container py-6">
      <div className="skeleton h-8 w-64 mb-6" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-12 w-12 rounded-sm" />
              <div>
                <div className="skeleton h-4 w-40 mb-2" />
                <div className="skeleton h-3 w-28" />
              </div>
            </div>
            <div className="skeleton h-10 w-28 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
