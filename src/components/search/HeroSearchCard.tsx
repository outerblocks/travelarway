import { useEffect, useRef } from 'react';
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
  const tabRefs = useRef<Partial<Record<BookingMode, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const tab = tabRefs.current[activeMode];
    if (typeof tab?.scrollIntoView !== 'function') return;
    tab.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeMode]);

  return (
    <div className="hero-search-card mx-auto w-full min-w-0 max-w-[1360px] overflow-visible rounded-xl bg-white shadow-[0_24px_48px_-12px_rgba(0,40,100,0.18)] ring-1 ring-black/5 sm:rounded-2xl">
      <div className="min-w-0 border-b border-neutral-200">
        <div
          className="hero-search-tabs"
          role="tablist"
          aria-label={tp('searchTrips')}
        >
          {ALL_MODES.map((mode) => {
            const isActive = mode === activeMode;
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                ref={(node) => {
                  tabRefs.current[mode] = node;
                }}
                onClick={() => setActiveMode(mode)}
                className={`hero-search-tab ${isActive ? 'is-active' : ''}`}
                aria-selected={isActive}
                aria-pressed={isActive}
                aria-label={`${tp('search')} ${tp(TAB_LABELS[mode])}`}
              >
                <span className="hero-search-tab-label">{tp(TAB_LABELS[mode])}</span>
                {isActive && (
                  <span className="hero-search-tab-rule" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 overflow-visible px-3 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <SearchForm mode={activeMode} />
      </div>
    </div>
  );
}
