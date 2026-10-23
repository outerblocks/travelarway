import { useState, useRef, type RefObject } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const d = new Date(value);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const containerRef: RefObject<HTMLDivElement> = useRef(null);

  const displayValue = value
    ? new Date(value).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const minDateObj = minDate ? new Date(minDate) : undefined;

  const handleDateClick = (day: number) => {
    const selected = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const iso = selected.toISOString().split('T')[0];
    onChange(iso);
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

  const selectedDate = value ? new Date(value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (typeof document !== 'undefined') {
    setTimeout(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handler, { once: true });
    }, 0);
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="input-label">
        {label}
        {required && <span className="text-error-600 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          readOnly
          className={`input-field pr-10 cursor-pointer ${error ? 'border-error-500' : ''}`}
          placeholder={placeholder}
          value={displayValue}
          onClick={() => setIsOpen(!isOpen)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <Calendar
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-neutral-100 rounded-sm"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} className="text-neutral-600" />
            </button>
            <span className="font-medium text-body text-neutral-900">
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-neutral-100 rounded-sm"
              aria-label="Next month"
            >
              <ChevronRight size={20} className="text-neutral-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-meta font-medium text-neutral-500 py-1">
                {day}
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
                    w-9 h-9 rounded-sm text-body transition-colors
                    ${isSelected ? 'bg-brand-600 text-white font-medium' : ''}
                    ${!isSelected && isToday ? 'border border-brand-600 text-brand-600' : ''}
                    ${!isSelected && !isToday && !isDisabled ? 'text-neutral-700 hover:bg-brand-50' : ''}
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
