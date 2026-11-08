import { useI18n } from '@/context/I18nContext';
import { usePublishedGuides } from '@/hooks/usePublishedGuides';
import { GuidesNewsBoard } from '@/pages/guides/GuidesNewsBoard';
import { EmptyResults, LoadingState, QueryFeedback } from '@/components/shared/States';

export function GuidesIndexPage() {
  const { tp, lang } = useI18n();
  const { status, guides, retry } = usePublishedGuides(lang);

  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="section-container">
        <div className="guides-masthead mb-8 grid gap-4 pb-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {tp('planBetterTrip')}
          </h1>
          <p className="max-w-xl text-body leading-relaxed text-neutral-600 lg:justify-self-end">
            {tp('planBetterTripLead')}
          </p>
        </div>

        <QueryFeedback
          status={status}
          onRetry={retry}
          errorMessage={tp('guidesUnavailable')}
          loading={<LoadingState message={tp('readGuide')} />}
        >
          {guides.length === 0
            ? <EmptyResults message={tp('noGuidesYet')} />
            : <GuidesNewsBoard guides={guides} headingLevel="h2" />}
        </QueryFeedback>
      </div>
    </section>
  );
}
