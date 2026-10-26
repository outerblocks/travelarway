import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

interface Option {
  id: string;
  name: string;
  subText?: string;
}

interface AutocompleteProps {
  id: string;
  label: string;
  placeholder?: string;
  options: Option[];
  value: string;
  onChange: (id: string, name: string) => void;
  error?: string;
  required?: boolean;
}

export function Autocomplete({
  id,
  label,
  placeholder = 'Search...',
  options,
  value,
  onChange,
  error,
  required,
}: AutocompleteProps) {
  const { tp } = useI18n();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedName(value);
  }, [value]);

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

  const filtered = query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (opt: Option) => {
    setSelectedName(opt.name);
    onChange(opt.id, opt.name);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedName('');
    onChange('', '');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <label htmlFor={id} className="input-label">
        {label}
        {required && <span className="text-error-600 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          className={`input-field pr-16 ${error ? 'border-error-500' : ''}`}
          placeholder={placeholder}
          value={isOpen ? query : selectedName}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={isOpen ? `${id}-listbox` : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedName && !isOpen && (
            <button
              type="button"
              onClick={handleClear}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label={tp('clearSelection')}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && filtered.length > 0 && (
        <ul
          id={`${id}-listbox`}
          className="absolute left-0 top-full z-[200] mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-[0_18px_40px_-12px_rgba(0,85,221,0.2)] max-h-60 overflow-y-auto"
          role="listbox"
        >
          {filtered.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                onPointerDown={(e) => {
                  // Prevent the document pointerdown from closing the dropdown
                  // before the click is registered.
                  e.stopPropagation();
                }}
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-4 py-2.5 hover:bg-brand-50 transition-colors text-body"
                role="option"
                aria-selected={selectedName === opt.name}
              >
                <div className="font-medium text-neutral-900">{opt.name}</div>
                {opt.subText && <div className="text-meta text-neutral-500">{opt.subText}</div>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && filtered.length === 0 && (
        <div className="absolute left-0 top-full z-[200] mt-1 w-full rounded-xl border border-neutral-200 bg-white p-4 text-meta text-neutral-500 shadow-[0_18px_40px_-12px_rgba(0,85,221,0.2)]">
          {tp('noMatchesFound')}
        </div>
      )}

      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
