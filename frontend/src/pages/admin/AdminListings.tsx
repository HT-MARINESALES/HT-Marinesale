import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/listings/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useAdminListings, useAdminChangeStatus } from '@/hooks/useListings';
import { formatPrice, formatDate, STATUS_LABELS, getProvisionInfo } from '@/lib/utils';
import { PageSpinner } from '@/components/ui/Spinner';
import type { ListingStatus } from '@/types';

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Alle' },
  { value: 'submitted', label: 'Eingereicht' },
  { value: 'checkup_required', label: 'Check-up Erf.' },
  { value: 'checkup_scheduled', label: 'Geplant' },
  { value: 'checkup_completed', label: 'Abgeschlossen' },
  { value: 'published', label: 'Veröffentlicht' },
  { value: 'rejected', label: 'Abgelehnt' },
  { value: 'archived', label: 'Archiviert' },
  { value: 'sold', label: 'Verkauft' },
  { value: 'draft', label: 'Entwurf' },
];

export function AdminListings() {
  const [searchParams] = useSearchParams();
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminListings({
    status: activeStatus === 'all' ? undefined : activeStatus,
    search: search || undefined,
    page,
    limit: 20,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inserate verwalten</h1>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 pr-4 h-9 w-full rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setActiveStatus(tab.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-4">{data?.total || 0} Inserate</div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inserat</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verkäufer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preis</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Datum</th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data?.data || []).map(listing => {
                    const seller = listing.profiles as { first_name: string; last_name: string } | null;
                    return (
                      <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 truncate max-w-xs">{listing.title}</div>
                          <div className="text-xs text-gray-400">{listing.brand} {listing.model} {listing.year}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {seller ? `${seller.first_name} ${seller.last_name}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{formatPrice(listing.price)}</div>
                          {(() => {
                            const { rate, amount } = getProvisionInfo(listing.price);
                            return <div className="text-xs text-blue-600 mt-0.5">{rate.toString().replace('.', ',')}% = {formatPrice(amount)}</div>;
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={listing.status as ListingStatus} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(listing.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/admin/inserate/${listing.id}`}>
                            <Button variant="ghost" size="sm" className="flex items-center gap-1">
                              Details
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Zurück
              </Button>
              <span className="text-sm text-gray-600">Seite {page} von {data.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>
                Weiter
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
