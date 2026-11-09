import { SearchForm } from '@/components/search/SearchForm';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { ALL_MODES } from '@/data/locations';
import type { BookingMode } from '@/types';

const TAB_LABELS: Record<BookingMode, 'bus' | 'ferry' | 'flights' | 'trains' | 'stays' | 'experiences'> = {
  bus: 'bus',
  ferry: 'ferry',
  flights: 'flights',
  train: 'trains',
  stays: 'stays',
  experiences: 'experiences',
};

export function HeroSearchCard() {
  const { activeMode, setActiveMode } = useApp();
  const { tp } = useI18n();

  return (
    <div className="hero-search-card mx-auto w-full max-w-[1360px] overflow-visible rounded-2xl bg-white shadow-[0_24px_48px_-12px_rgba(0,40,100,0.18)] ring-1 ring-black/5">
      {/* Tab bar — text labels only, no icons */}
      <div className="border-b border-neutral-200">
        <div className="flex min-w-0" role="tablist" aria-label={tp('searchTrips')}>
          {ALL_MODES.map((mode) => {
            const isActive = mode === activeMode;
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                onClick={() => setActiveMode(mode)}
                className={`
                  relative flex min-w-0 flex-1 items-center justify-center px-2 py-3.5 text-center
                  transition-colors duration-150 focus:outline-none sm:px-3 sm:py-4
                  ${isActive
                    ? 'text-ink'
                    : 'text-neutral-500 hover:text-neutral-800'}
                `}
                aria-selected={isActive}
                aria-label={`${tp('search')} ${tp(TAB_LABELS[mode])}`}
              >
                <span className={`text-xs font-semibold tracking-wide sm:text-label ${isActive ? 'text-ink' : ''}`}>
                  {tp(TAB_LABELS[mode])}
                </span>
                {isActive && (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[12rem] overflow-visible px-4 pb-5 pt-5 sm:min-h-[10.5rem] sm:px-6 sm:pb-6 sm:pt-5">
        <SearchForm mode={activeMode} key={activeMode} />
      </div>
    </div>
  );
}
