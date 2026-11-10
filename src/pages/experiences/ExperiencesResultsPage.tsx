import { useI18n } from '@/context/I18nContext';
import { useDatabaseOffers } from '@/hooks/useDatabaseOffers';
import { EmptyResults, LoadingState, QueryFeedback } from '@/components/shared/States';

export function ExperiencesResultsPage() {
  const { tp } = useI18n();
  const { status, retry } = useDatabaseOffers('experiences');

  return (
    <QueryFeedback
      status={status}
      onRetry={retry}
      errorMessage={tp('unableLoadExperiences')}
      loading={<LoadingState count={4} />}
    >
      <div className="section-container py-6">
        <h1 className="mb-6 text-page font-bold text-neutral-900">
          {tp('experienceCount').replace('{count}', '0')}
        </h1>
        <EmptyResults message={tp('noExperiencesFound')} subMessage={tp('tryDifferentDestinationDate')} />
      </div>
    </QueryFeedback>
  );
}
