import type { ReactNode } from 'react';
import { useI18n } from '@/context/I18nContext';
import type { QueryStatus } from '@/hooks/query-status';
import { TravelarLoader, useRouteWaitHold } from '@/components/shared/TravelarLoader';

/**
 * Page-level waits reuse the Travelar journey scene. Spinners stay inside
 * buttons that are already in flight.
 */
export function LoadingState({
  message,
  inset = false,
}: {
  message?: string;
  count?: number;
  inset?: boolean;
}) {
  const { tp } = useI18n();
  const hosted = useRouteWaitHold();
  void inset;
  const copy = message ?? tp('searchingOptions');
  if (hosted) {
    return (
      <span className="sr-only" role="status" aria-live="polite">
        {copy}
      </span>
    );
  }
  return <TravelarLoader message={copy} />;
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

export function ConnectionNotice() {
  const { tp } = useI18n();
  return (
    <div className="bg-neutral-900 px-4 py-2 text-center text-meta text-white" role="status">
      {tp('youAreOffline')} — {tp('offlineSearchBody')}
    </div>
  );
}
