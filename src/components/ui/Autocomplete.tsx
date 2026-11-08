import { useState, useRef, useEffect } from 'react';
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
  options?: Option[];
  loadOptions?: (query: string) => Promise<Option[]>;
  value: string;
  onChange: (id: string, name: string) => void;
  error?: string;
  required?: boolean;
}

export function Autocomplete({
  id,
  label,
  placeholder = 'Search...',
  options = [],
  loadOptions,
  value,
  onChange,
  error,
  required,
}: AutocompleteProps) {
  const { tp } = useI18n();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(value);
  const [remoteOptions, setRemoteOptions] = useState<Option[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedName(value);
  }, [value]);

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

  useEffect(() => {
    if (!loadOptions || !isOpen) return;
    const needle = query.trim();
    if (needle.length < 2 && !/^[A-Za-z]{3}$/.test(needle)) {
      setRemoteOptions([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadOptions(needle).then((rows) => {
        if (!cancelled) setRemoteOptions(rows);
      });
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, loadOptions, query]);

  const needle = query.trim().toLowerCase();
  const filtered = loadOptions
    ? remoteOptions
    : needle
      ? options.filter((o) => {
          return o.name.toLowerCase().includes(needle) || (o.subText?.toLowerCase().includes(needle) ?? false);
        })
      : [];

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
    setRemoteOptions([]);
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
          name={`${id}-no-autofill`}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
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
            setRemoteOptions([]);
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
              <span aria-hidden="true" className="text-sm leading-none">✕</span>
            </button>
          )}
          <span
            aria-hidden="true"
            className={`inline-block text-sm leading-none text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
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
          {needle ? tp('noMatchesFound') : tp('typeToSearchPlaces')}
        </div>
      )}

      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
