import { useState, useRef, useEffect, type RefObject } from 'react';
import { ChevronDown, X } from 'lucide-react';

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
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(value);
  const containerRef: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    setSelectedName(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div ref={containerRef} className="relative">
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
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedName && !isOpen && (
            <button
              type="button"
              onClick={handleClear}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown size={16} className="text-neutral-400" />
        </div>
      </div>
      {isOpen && filtered.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-sm shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {filtered.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
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
        <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-sm shadow-lg p-4 text-meta text-neutral-500">
          No matches found
        </div>
      )}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
