import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { parseIsoDate, toIsoDate } from '@/utils/format';

interface DatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
  required?: boolean;
  minDate?: string;
  placeholder?: string;
}

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function DatePicker({
  id,
  label,
  value,
  onChange,
  error,
  required,
  minDate,
  placeholder = 'Select date',
}: DatePickerProps) {
  const { tp, lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const d = parseIsoDate(value);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Only attach listener while open; clean up when closed or unmounted.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayValue = value
    ? parseIsoDate(value).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'sw' ? 'sw-TZ' : 'en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const minDateObj = minDate ? parseIsoDate(minDate) : undefined;

  const handleDateClick = (day: number) => {
    const selected = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    // Local calendar day, never UTC: toISOString() would move it to the previous day in
    // any timezone east of Greenwich (Dar es Salaam is UTC+3).
    onChange(toIsoDate(selected));
    setIsOpen(false);
  };

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();

  const selectedDate = value ? parseIsoDate(value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <label htmlFor={id} className="input-label">
        {label}
        {required && <span className="text-error-600 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={`${id}-no-autofill`}
          type="text"
          readOnly
          autoComplete="off"
          className={`input-field pr-10 cursor-pointer ${error ? 'border-error-500' : ''}`}
          placeholder={placeholder}
          value={displayValue}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        />
        <Calendar
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        />
      </div>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-[200] mt-1 w-[min(20rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_18px_40px_-12px_rgba(0,85,221,0.2)] sm:w-80 sm:max-w-[calc(100vw-2rem)] sm:p-4"
          role="dialog"
          aria-label={label}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label={tp('previousMonth')}
            >
              <ChevronLeft size={20} className="text-neutral-600" />
            </button>
            <span className="font-semibold text-body text-neutral-900">
              {tp(MONTH_KEYS[viewMonth.getMonth()])} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label={tp('nextMonth')}
            >
              <ChevronRight size={20} className="text-neutral-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_KEYS.map((day) => (
              <div key={day} className="text-center text-meta font-medium text-neutral-500 py-1">
                {tp(day)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty_${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
              const isPast = dayDate < today;
              const isBeforeMin = minDateObj ? dayDate < minDateObj : false;
              const isSelected = selectedDate
                ? dayDate.toDateString() === selectedDate.toDateString()
                : false;
              const isToday = dayDate.toDateString() === today.toDateString();
              const isDisabled = isPast || isBeforeMin;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateClick(day)}
                  className={`
                    min-h-9 min-w-9 w-full h-9 rounded-lg text-body transition-colors
                    ${isSelected ? 'bg-ink text-white font-semibold' : ''}
                    ${!isSelected && isToday ? 'border border-ink text-ink font-semibold' : ''}
                    ${!isSelected && !isToday && !isDisabled ? 'text-neutral-700 hover:bg-brand-50 hover:text-brand-700' : ''}
                    ${isDisabled ? 'text-neutral-300 cursor-not-allowed' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
