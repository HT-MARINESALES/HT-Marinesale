import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BOAT_TYPES, FUEL_TYPES, CONDITIONS } from '@/lib/utils';

export interface FilterState {
  search: string;
  boat_type: string;
  brand: string;
  condition: string;
  min_price: string;
  max_price: string;
  min_year: string;
  max_year: string;
  fuel_type: string;
  sort: string;
}

interface ListingFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const currentYear = new Date().getFullYear();

export function ListingFilters({ filters, onChange, onReset }: ListingFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => k !== 'sort' && v !== '');

  const FilterContent = () => (
    <div className="space-y-5">
      <div>
        <Input
          label="Suche"
          placeholder="Marke, Modell, Titel..."
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
        />
      </div>

      <Select
        label="Bootstyp"
        value={filters.boat_type}
        onChange={(e) => update('boat_type', e.target.value)}
        options={Object.entries(BOAT_TYPES).map(([v, l]) => ({ value: v, label: l }))}
        placeholder="Alle Typen"
      />

      <Input
        label="Marke"
        placeholder="z.B. Bayliner, Bavaria..."
        value={filters.brand}
        onChange={(e) => update('brand', e.target.value)}
      />

      <Select
        label="Zustand"
        value={filters.condition}
        onChange={(e) => update('condition', e.target.value)}
        options={Object.entries(CONDITIONS).map(([v, l]) => ({ value: v, label: l }))}
        placeholder="Alle Zustände"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preis (€)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Von"
            value={filters.min_price}
            onChange={(e) => update('min_price', e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <input
            type="number"
            placeholder="Bis"
            value={filters.max_price}
            onChange={(e) => update('max_price', e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Baujahr</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Von"
            min={1900}
            max={currentYear}
            value={filters.min_year}
            onChange={(e) => update('min_year', e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <input
            type="number"
            placeholder="Bis"
            min={1900}
            max={currentYear}
            value={filters.max_year}
            onChange={(e) => update('max_year', e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
      </div>

      <Select
        label="Kraftstoff"
        value={filters.fuel_type}
        onChange={(e) => update('fuel_type', e.target.value)}
        options={Object.entries(FUEL_TYPES).map(([v, l]) => ({ value: v, label: l }))}
        placeholder="Alle Kraftstoffe"
      />

      {hasActiveFilters && (
        <Button variant="outline" onClick={onReset} className="w-full">
          <X className="h-4 w-4" />
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-navy-900 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </h3>
            {hasActiveFilters && (
              <button onClick={onReset} className="text-xs text-gray-500 hover:text-red-600 transition-colors">
                Zurücksetzen
              </button>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filter
          {hasActiveFilters && (
            <span className="bg-navy-600 text-white text-xs rounded-full px-1.5 py-0.5">
              {Object.entries(filters).filter(([k, v]) => k !== 'sort' && v !== '').length}
            </span>
          )}
        </Button>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-navy-900 text-lg">Filter</h3>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <FilterContent />
              <Button className="w-full mt-6" onClick={() => setMobileOpen(false)}>
                Anwenden
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
