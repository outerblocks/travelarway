import { AlertCircle, RefreshCw, SearchX } from 'lucide-react';

export function LoadingState({ message = 'Searching for available options...' }: { message?: string }) {
  return (
    <div className="section-container py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-body text-neutral-500">{message}</p>
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
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function SearchSummaryBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="section-container py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}
