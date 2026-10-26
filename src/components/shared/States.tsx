import { AlertCircle, RefreshCw, SearchX } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export function LoadingState({ message }: { message?: string }) {
  const { tp } = useI18n();
  return (
    <div className="section-container py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-body text-neutral-500">{message ?? tp('searchingOptions')}</p>
      </div>
    </div>
  );
}

export function EmptyResults({ message, subMessage }: { message: string; subMessage?: string }) {
  return (
    <div className="section-container py-16">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <SearchX size={32} className="text-neutral-400" />
        </div>
        <h3 className="text-listing font-bold text-neutral-900 mb-2">{message}</h3>
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
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-error-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-error-600" />
        </div>
        <h3 className="text-listing font-bold text-neutral-900 mb-2">{message}</h3>
        {subMessage && <p className="text-body text-neutral-500 mb-4">{subMessage}</p>}
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary">
            <RefreshCw size={16} />
            {tp('tryAgain')}
          </button>
        )}
      </div>
    </div>
  );
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
