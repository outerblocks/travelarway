import { Link } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { useDatabaseOffers } from '@/hooks/useDatabaseOffers';
import { EmptyResults, LoadingState, QueryFeedback, SearchSummaryBar } from '@/components/shared/States';
import { formatDate } from '@/utils/format';

export function FerryResultsPage() {
  const { tp } = useI18n();
  const { status, retry, params, unresolved } = useDatabaseOffers('ferry');

  return (
    <QueryFeedback
      status={status}
      onRetry={retry}
      errorMessage={tp('unableLoadSailings')}
      errorSubMessage={tp('bookingServiceProblem')}
      loading={<LoadingState />}
    >
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {params.origin || tp('departure')} → {params.destination || tp('arrival')}
        </span>
        <span className="text-body text-neutral-500">
          {params.date ? formatDate(params.date) : ''}
          {params.returnDate ? ` · ${tp('return')} ${formatDate(params.returnDate)}` : ''}
        </span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-1">
          {tp('sailingCount').replace('{count}', '0')}
        </h1>
        <EmptyResults
          message={unresolved.length ? tp('noSailingsFound') : tp('noSailingsFound')}
          subMessage={tp('tryDifferentDateRoute')}
        />
      </div>
    </>
    </QueryFeedback>
  );
}
