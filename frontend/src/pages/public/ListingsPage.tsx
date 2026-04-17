import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SortAsc, X } from 'lucide-react';
import { ListingFilters, type FilterState } from '@/components/listings/ListingFilters';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { Select } from '@/components/ui/Select';
import { usePublicListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/Button';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'price_asc', label: 'Preis aufsteigend' },
  { value: 'price_desc', label: 'Preis absteigend' },
  { value: 'year_desc', label: 'Baujahr (neueste)' },
];

const defaultFilters: FilterState = {
  search: '',
  boat_type: '',
  brand: '',
  condition: '',
  min_price: '',
  max_price: '',
  min_year: '',
  max_year: '',
  fuel_type: '',
  sort: 'newest',
};

export function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    search: searchParams.get('search') || '',
    boat_type: searchParams.get('boat_type') || '',
    sort: searchParams.get('sort') || 'newest',
  });
  const [page, setPage] = useState(1);

  const queryFilters = {
    ...(filters.search && { search: filters.search }),
    ...(filters.boat_type && { boat_type: filters.boat_type }),
    ...(filters.brand && { brand: filters.brand }),
    ...(filters.condition && { condition: filters.condition }),
    ...(filters.min_price && { min_price: Number(filters.min_price) }),
    ...(filters.max_price && { max_price: Number(filters.max_price) }),
    ...(filters.min_year && { min_year: Number(filters.min_year) }),
    ...(filters.max_year && { max_year: Number(filters.max_year) }),
    ...(filters.fuel_type && { fuel_type: filters.fuel_type }),
    sort: filters.sort,
    page,
    limit: 12,
  };

  const { data, isLoading } = usePublicListings(queryFilters);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    const params: Record<string, string> = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.boat_type) params.boat_type = newFilters.boat_type;
    if (newFilters.sort !== 'newest') params.sort = newFilters.sort;
    setSearchParams(params);
  };

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'sort' && v !== '').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Boote kaufen</h1>
        <p className="text-gray-500 mt-1">
          {data?.total || 0} geprüfte Boote und Yachten
        </p>
      </div>

      <div className="flex gap-8">
        <ListingFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={() => handleFilterChange(defaultFilters)}
        />

        <div className="flex-1 min-w-0">
          {/* Sort + mobile filter */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Mobile filter button is rendered inside ListingFilters */}
              <div className="lg:hidden">
                <ListingFilters
                  filters={filters}
                  onChange={handleFilterChange}
                  onReset={() => handleFilterChange(defaultFilters)}
                />
              </div>
              {activeFilterCount > 0 && (
                <div className="hidden sm:flex items-center gap-2 flex-wrap">
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 bg-navy-100 text-navy-800 text-xs px-2 py-1 rounded-full">
                      Suche: {filters.search}
                      <button onClick={() => handleFilterChange({ ...filters, search: '' })}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-gray-400 hidden sm:block" />
              <div className="w-48">
                <Select
                  options={SORT_OPTIONS}
                  value={filters.sort}
                  onChange={(e) => handleFilterChange({ ...filters, sort: e.target.value })}
                />
              </div>
            </div>
          </div>

          <ListingGrid
            listings={data?.data || []}
            loading={isLoading}
          />

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Zurück
              </Button>

              {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pages}
                onClick={() => setPage(p => p + 1)}
              >
                Weiter
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
