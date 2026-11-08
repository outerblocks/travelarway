import { Link } from '@/router';
import { useI18n, type Language } from '@/context/I18nContext';
import { GUIDE_TOPIC_KEYS } from '@/pages/guides/guide-topic';
import type { PublicGuideSummary } from '@/server/guides';

export function formatGuideDate(iso: string, lang: Language): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const locale = lang === 'sw' ? 'sw-TZ' : lang === 'fr' ? 'fr-FR' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

/** Groups of three for a two-column board. Six stories → 3 left, 3 right; extras wrap to the next row. */
export function splitGuideColumns<T>(items: T[], perColumn = 3): T[][] {
  if (items.length === 0) return [];
  const columns: T[][] = [];
  for (let index = 0; index < items.length; index += perColumn) {
    columns.push(items.slice(index, index + perColumn));
  }
  return columns;
}

export function GuidesNewsBoard({
  guides,
  showAllHref,
  headingLevel = 'h3',
}: {
  guides: PublicGuideSummary[];
  showAllHref?: string;
  headingLevel?: 'h2' | 'h3';
}) {
  const { tp, lang } = useI18n();
  const Heading = headingLevel;
  const columns = splitGuideColumns(guides);

  return (
    <div>
      <div className="guides-board">
        {columns.map((column) => (
          <ul key={column.map((guide) => guide.slug).join('-')} className="min-w-0 w-full overflow-hidden">
            {column.map((guide) => {
              const href = `/guides/${guide.slug}`;
              return (
                <li key={guide.slug} className="guides-story">
                  <article className="flex min-w-0 gap-4 py-4">
                    <Link to={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
                      <img
                        src={guide.coverPath}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="h-[4.75rem] w-[6.5rem] object-cover sm:h-24 sm:w-32"
                      />
                    </Link>
                    <div className="min-w-0">
                      <p className="text-meta text-neutral-500">
                        <span className="font-medium text-neutral-700">{tp(GUIDE_TOPIC_KEYS[guide.topic])}</span>
                        <span className="mx-2 text-neutral-300" aria-hidden="true">
                          /
                        </span>
                        <time dateTime={guide.researchedAt}>{formatGuideDate(guide.researchedAt, lang)}</time>
                      </p>
                      <Heading className="mt-1 text-listing font-semibold leading-snug">
                        <Link to={href} className="guides-headline">
                          {guide.title}
                        </Link>
                      </Heading>
                      <p className="mt-1 line-clamp-2 text-body leading-relaxed text-neutral-600">{guide.excerpt}</p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
      {showAllHref ? (
        <p className="mt-2">
          <Link to={showAllHref} className="guides-headline text-body font-semibold">
            {tp('backToGuides')}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
