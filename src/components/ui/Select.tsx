import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export function Select({
  id,
  label,
  value,
  onChange,
  options,
  error,
  required,
  placeholder = 'Select...',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

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

  const selected = options.find((o) => o.value === value);
  const displayValue = selected ? selected.label : '';

  // Open upwards when the menu would not fit below the field.
  const toggle = () => {
    const field = fieldRef.current;
    if (field) {
      const rect = field.getBoundingClientRect();
      const menuHeight = Math.min(options.length * 44 + 8, 240);
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < menuHeight && rect.top > spaceBelow);
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="input-label">
        {label}
        {required && <span className="text-error-600 ml-0.5">*</span>}
      </label>
      <div ref={fieldRef} className="relative">
        <button
          id={id}
          type="button"
          onClick={toggle}
          className={`input-field text-left flex items-center justify-between ${error ? 'border-error-500' : ''} ${!value ? 'text-neutral-400' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? `${id}-listbox` : undefined}
        >
          <span>{displayValue || placeholder}</span>
          <ChevronDown size={18} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <ul
            id={`${id}-listbox`}
            className={`absolute left-0 z-[200] w-full rounded-xl border border-neutral-200 bg-white shadow-[0_18px_40px_-12px_rgba(0,85,221,0.2)] max-h-60 overflow-y-auto ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
            role="listbox"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-body transition-colors hover:bg-brand-50 ${
                    value === opt.value ? 'bg-brand-50 text-brand-600 font-medium' : 'text-neutral-700'
                  }`}
                  role="option"
                  aria-selected={value === opt.value}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

interface PassengerCounterProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  description?: string;
}

export function PassengerCounter({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 9,
  description,
}: PassengerCounterProps) {
  const { tp } = useI18n();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span id={`${id}_label`} className="block text-sm font-medium text-neutral-900">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-neutral-500">{description}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          id={`${id}_minus`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          aria-label={`${label}: ${tp('decrease')}`}
          aria-describedby={`${id}_label`}
        >
          −
        </button>
        <span aria-live="polite" className="w-8 text-center text-body font-semibold text-neutral-900">
          {value}
        </span>
        <button
          type="button"
          id={`${id}_plus`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          aria-label={`${label}: ${tp('increase')}`}
          aria-describedby={`${id}_label`}
        >
          +
        </button>
      </div>
    </div>
  );
}
