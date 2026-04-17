import { useState, useRef, useEffect, forwardRef } from 'react';
import { ALL_BOAT_BRANDS } from '@/lib/boatBrands';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  name?: string;
}

export const BrandAutocomplete = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, error, label, required, placeholder = 'z.B. Bayliner', name }, ref) => {
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const suggestions = value.trim().length > 0
      ? ALL_BOAT_BRANDS.filter(b => b.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
      : [];

    const showDropdown = open && suggestions.length > 0;

    // Close on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showDropdown) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted(h => Math.max(h - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onChange(suggestions[highlighted]);
        setOpen(false);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleSelect = (brand: string) => {
      onChange(brand);
      setOpen(false);
    };

    // Highlight matched substring
    const highlight = (text: string) => {
      const q = value.trim();
      if (!q) return <span>{text}</span>;
      const idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return <span>{text}</span>;
      return (
        <span>
          {text.slice(0, idx)}
          <span className="font-bold text-navy-900">{text.slice(idx, idx + q.length)}</span>
          {text.slice(idx + q.length)}
        </span>
      );
    };

    return (
      <div ref={containerRef} className="relative">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          name={name}
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); setHighlighted(0); }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

        {showDropdown && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {suggestions.map((brand, i) => (
              <button
                key={brand}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(brand)}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  i === highlighted ? 'bg-navy-50 text-navy-900' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {highlight(brand)}
              </button>
            ))}
            {value.trim() && !ALL_BOAT_BRANDS.some(b => b.toLowerCase() === value.toLowerCase()) && (
              <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
                „{value}" als eigene Marke verwenden
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
BrandAutocomplete.displayName = 'BrandAutocomplete';
