import { SearchForm } from '@/components/search/SearchForm';
import { MODE_ICON_MAP } from '@/components/ui/ModeIcons';
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
    <div className="hero-search-card mx-auto w-full max-w-[1360px] overflow-visible rounded-2xl bg-white shadow-[0_28px_64px_-18px_rgba(0,85,221,0.45)] ring-1 ring-black/8">
      <div className="rounded-t-2xl bg-ink px-1.5 pt-1.5 sm:px-2">
        <div className="flex min-w-0 items-stretch">
          {ALL_MODES.map((mode) => {
            const Icon = MODE_ICON_MAP[mode];
            const isActive = mode === activeMode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`
                  group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 border-b-2 px-1.5 py-3 text-center
                  transition-colors duration-150 focus:outline-none sm:px-2 sm:py-3.5
                  ${isActive
                    ? 'border-brand-600 text-white'
                    : 'border-transparent text-white/65 hover:text-white'}
                `}
                aria-pressed={isActive}
                aria-label={`${tp('search')} ${tp(TAB_LABELS[mode])}`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 ${
                    isActive ? 'bg-accent text-ink' : 'bg-white/10 text-white group-hover:bg-white/16'
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={2.25}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                </span>
                <span className={`max-w-full whitespace-normal text-xs font-semibold leading-tight ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                  {tp(TAB_LABELS[mode])}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-b-2xl bg-white px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 overflow-visible">
        <SearchForm mode={activeMode} key={activeMode} />
      </div>
    </div>
  );
}
