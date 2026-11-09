import type { ReactNode } from 'react';
import { useI18n } from '@/context/I18nContext';
import type { QueryStatus } from '@/hooks/query-status';

/**
 * Page-level loading uses skeleton blocks. Spinners stay inside buttons that are
 * already in flight, so a screen never shows two loading idioms at once.
 */
export function LoadingState({
  message,
  count = 3,
  inset = false,
}: {
  message?: string;
  count?: number;
  inset?: boolean;
}) {
  const { tp } = useI18n();
  return (
    <div className={inset ? 'py-6' : 'section-container py-10'} role="status" aria-live="polite">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-8 w-56" />
        {Array.from({ length: count }, (_, row) => (
          <div key={row} className="card flex items-center gap-4 p-5">
            <div className="skeleton h-12 w-12 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-3.5 w-2/5" />
              <div className="skeleton h-3 w-1/4" />
            </div>
            <div className="skeleton h-9 w-24 rounded-lg" />
          </div>
        ))}
        <p className="pt-1 text-center text-meta text-neutral-500">{message ?? tp('searchingOptions')}</p>
      </div>
    </div>
  );
}

export function EmptyResults({ message, subMessage }: { message: string; subMessage?: string }) {
  return (
    <div className="section-container py-16">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
        <p className="mb-4 text-[2rem] leading-none text-neutral-300" aria-hidden="true">—</p>
        <h3 className="mb-2 text-listing font-bold text-neutral-900">{message}</h3>
        {subMessage && <p className="text-body text-neutral-500">{subMessage}</p>}
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  subMessage,
  onRetry,
}: {
  message: string;
  subMessage?: string;
  onRetry?: () => void;
}) {
  const { tp } = useI18n();
  return (
    <div className="section-container py-16">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
        <h3 className="mb-2 text-listing font-bold text-neutral-900">{message}</h3>
        {subMessage && <p className="mb-4 text-body text-neutral-500">{subMessage}</p>}
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-secondary">
            {tp('tryAgain')}
          </button>
        )}
      </div>
    </div>
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  const { tp } = useI18n();
  return (
    <ErrorState
      message={tp('youAreOffline')}
      subMessage={tp('offlineSearchBody')}
      onRetry={onRetry}
    />
  );
}

export function SuccessState({ message, subMessage }: { message: string; subMessage?: string }) {
  return (
    <div className="section-container py-16" role="status">
      <div className="mx-auto max-w-md text-center">
        <h3 className="mb-2 text-listing font-bold text-neutral-900">{message}</h3>
        {subMessage && <p className="text-body text-neutral-500">{subMessage}</p>}
      </div>
    </div>
  );
}

export function QueryFeedback({
  status,
  onRetry,
  errorMessage,
  errorSubMessage,
  loading,
  children,
}: {
  status: QueryStatus;
  onRetry?: () => void;
  errorMessage: string;
  errorSubMessage?: string;
  loading?: ReactNode;
  children: ReactNode;
}) {
  if (status === 'loading') return <>{loading ?? <LoadingState />}</>;
  if (status === 'offline') return <OfflineState onRetry={onRetry} />;
  if (status === 'error') {
    return <ErrorState message={errorMessage} subMessage={errorSubMessage} onRetry={onRetry} />;
  }
  return <>{children}</>;
}

export function SearchSummaryBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="search-summary-bar border-b border-white/10 bg-ink text-white [&_.btn-ghost]:text-white [&_.btn-ghost:hover]:bg-white/10 [&_.text-neutral-500]:text-white/65 [&_.text-neutral-900]:text-white">
      <div className="section-container py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConnectionNotice() {
  const { tp } = useI18n();
  return (
    <div className="bg-neutral-900 px-4 py-2 text-center text-meta text-white" role="status">
      {tp('youAreOffline')} — {tp('offlineSearchBody')}
    </div>
  );
}
