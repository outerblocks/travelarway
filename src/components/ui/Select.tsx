import { useState, type RefObject, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

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
  const containerRef: RefObject<HTMLDivElement> = useRef(null);

  if (typeof document !== 'undefined' && isOpen) {
    setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handler, { once: true });
    }, 0);
  }

  const selected = options.find((o) => o.value === value);
  const displayValue = selected ? selected.label : '';

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="input-label">
        {label}
        {required && <span className="text-error-600 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`input-field text-left flex items-center justify-between ${error ? 'border-error-500' : ''} ${!value ? 'text-neutral-400' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{displayValue || placeholder}</span>
          <ChevronDown size={18} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {isOpen && (
        <ul
          className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-sm shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
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
  return (
    <div>
      <label htmlFor={id} className="input-label">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          id={`${id}_minus`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-10 h-10 flex items-center justify-center border border-neutral-300 rounded-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span id={id} className="w-8 text-center text-body font-medium text-neutral-900">
          {value}
        </span>
        <button
          type="button"
          id={`${id}_plus`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-10 h-10 flex items-center justify-center border border-neutral-300 rounded-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      {description && <p className="text-meta text-neutral-500 mt-1">{description}</p>}
    </div>
  );
}
