import { Link, useNavigate } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { usePublishedGuide } from '@/hooks/usePublishedGuides';
import { formatGuideDate } from '@/pages/guides/GuidesNewsBoard';
import { LoadingState, QueryFeedback } from '@/components/shared/States';
import { GUIDE_TOPIC_KEYS } from '@/pages/guides/guide-topic';

export function GuideArticlePage({ slug }: { slug: string }) {
  const { tp, lang } = useI18n();
  const { setActiveMode } = useApp();
  const navigate = useNavigate();
  const { status, guide, retry } = usePublishedGuide(slug, lang);

  if (status === 'loading' || status === 'error' || status === 'offline') {
    return (
      <QueryFeedback
        status={status}
        onRetry={retry}
        errorMessage={tp('guidesUnavailable')}
        loading={<LoadingState message={tp('readGuide')} />}
      >
        {null}
      </QueryFeedback>
    );
  }

  if (!guide) {
    return (
      <article className="section-container py-12">
        <p className="text-body text-neutral-700">{tp('noGuidesYet')}</p>
        <Link to="/guides" className="mt-4 inline-flex text-body font-semibold text-ink">{tp('backToGuides')}</Link>
      </article>
    );
  }

  const product = tp(GUIDE_TOPIC_KEYS[guide.topic]);

  return (
    <article className="bg-background py-10 sm:py-14">
      <div className="section-container max-w-3xl">
        <Link to="/guides" className="guides-headline inline-flex min-h-10 items-center gap-2 text-label font-semibold">
          <ArrowLeft size={16} /> {tp('backToGuides')}
        </Link>
        <p className="mt-6 text-meta text-neutral-500">
          <span className="font-medium text-ink">{product}</span>
          <span className="mx-2 text-neutral-300" aria-hidden="true">/</span>
          <time dateTime={guide.researchedAt}>{formatGuideDate(guide.researchedAt, lang)}</time>
        </p>
        <h1 className="guides-masthead mt-2 pb-4 font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {guide.title}
        </h1>
        <p className="mt-4 text-body leading-relaxed text-neutral-600">{guide.excerpt}</p>
        <img
          src={guide.coverPath}
          alt={guide.coverAlt}
          className="mt-8 w-full object-cover"
        />

        {guide.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-listing font-semibold text-neutral-900">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="mt-3 text-body leading-relaxed text-neutral-700">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <p className="mt-10 border-t border-neutral-300 pt-4 text-meta leading-relaxed text-neutral-500">
          {tp('guideEditorialNote')}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center bg-ink px-5 text-body font-semibold text-white"
            onClick={() => {
              setActiveMode(guide.relatedMode);
              void navigate('/');
            }}
          >
            {tp('search')} {product}
          </button>
          <Link
            to="/guides"
            className="guides-headline inline-flex min-h-11 items-center text-body font-semibold"
          >
            {tp('backToGuides')}
          </Link>
        </div>
      </div>
    </article>
  );
}
