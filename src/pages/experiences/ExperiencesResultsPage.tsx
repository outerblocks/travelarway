import { Link } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { useDatabaseOffers } from '@/hooks/useDatabaseOffers';
import { EmptyResults, LoadingState, QueryFeedback, SearchSummaryBar } from '@/components/shared/States';

export function ExperiencesResultsPage() {
  const { tp } = useI18n();
  const { status, retry } = useDatabaseOffers('experiences');

  return (
    <QueryFeedback
      status={status}
      onRetry={retry}
      errorMessage={tp('unableLoadExperiences')}
      loading={(
        <>
          <SearchSummaryBar>
            <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
          </SearchSummaryBar>
          <LoadingState count={4} />
        </>
      )}
    >
    <>
      <SearchSummaryBar>
        <Link to="/" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('modifySearch')}</Link>
        <span className="text-body font-medium text-neutral-900">{tp('experiences')}</span>
      </SearchSummaryBar>
      <div className="section-container py-6">
        <h1 className="text-page font-bold text-neutral-900 mb-6">
          {tp('experienceCount').replace('{count}', '0')}
        </h1>
        <EmptyResults message={tp('noExperiencesFound')} subMessage={tp('tryDifferentDestinationDate')} />
      </div>
    </>
    </QueryFeedback>
  );
}
