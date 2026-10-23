import { SearchForm } from '@/components/search/SearchForm';
import { MODE_ICON_MAP } from '@/components/ui/ModeIcons';
import { useApp } from '@/context/AppContext';
import { ALL_MODES } from '@/data/locations';
import type { BookingMode } from '@/types';

const TAB_LABELS: Record<BookingMode, string> = {
  bus: 'Bus',
  ferry: 'Ferry',
  flights: 'Flight',
  train: 'Trains',
  stays: 'Stays',
  experiences: 'Experiences',
};

export function HeroSearchCard() {
  const { activeMode, setActiveMode } = useApp();

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-xl overflow-visible">
      <div className="px-4 sm:px-6 pt-4 pb-0">
        <div className="mx-auto flex max-w-3xl items-end justify-center gap-1 border-b border-neutral-200">
          {ALL_MODES.map((mode) => {
            const Icon = MODE_ICON_MAP[mode];
            const isActive = mode === activeMode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`
                  group flex min-w-0 flex-1 max-w-[9rem] flex-col items-center gap-1 px-2 sm:px-4 pb-3 pt-1.5
                  border-b-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1
                  ${isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'}
                `}
                aria-pressed={isActive}
                aria-label={`Search ${TAB_LABELS[mode]}`}
              >
                <Icon
                  size={24}
                  className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-brand-600' : 'text-neutral-400 group-hover:text-neutral-700'}`}
                />
                <span className={`text-label font-medium whitespace-nowrap transition-colors duration-150 ${isActive ? 'text-brand-600' : 'text-neutral-500 group-hover:text-neutral-800'}`}>
                  {TAB_LABELS[mode]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-neutral-100 px-4 py-4 sm:px-6 sm:py-5">
        <SearchForm mode={activeMode} key={activeMode} />
      </div>
    </div>
  );
}
