import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, UserCheck, UserX, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PageSpinner } from '@/components/ui/Spinner';
import type { Profile, PaginatedResponse } from '@/types';

interface SellerWithCount extends Profile {
  listing_count: number;
}

export function AdminSellers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sellers', { search, page }],
    queryFn: () => api.get<PaginatedResponse<SellerWithCount>>(
      `/admin/sellers?page=${page}&limit=20${search ? `&search=${search}` : ''}`
    ),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verkäufer verwalten</h1>
      </div>

      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Name suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 pr-4 h-9 w-full rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-4">{data?.total || 0} Verkäufer</div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inserate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kommissionsvertrag</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registriert</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.data || []).map(seller => (
                  <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{seller.first_name} {seller.last_name}</div>
                      <div className="text-xs text-gray-400">{seller.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-navy-50 text-navy-700 font-semibold text-sm">
                        {seller.listing_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(seller as any).contract ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-semibold text-green-700 uppercase">{(seller as any).contract.contract_version}</span>
                            <p className="text-xs text-gray-400">{formatDate((seller as any).contract.accepted_at)}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-medium">Fehlt</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {seller.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          <UserCheck className="h-3 w-3" />
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                          <UserX className="h-3 w-3" />
                          Deaktiviert
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(seller.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/verkaeufer/${seller.id}`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          Details
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Zurück</Button>
              <span className="text-sm text-gray-600">Seite {page} von {data.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Weiter</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
