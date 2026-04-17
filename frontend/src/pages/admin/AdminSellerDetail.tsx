import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, UserCheck, UserX, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/listings/StatusBadge';
import { formatPrice, formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { PageSpinner } from '@/components/ui/Spinner';
import type { ListingStatus } from '@/types';

export function AdminSellerDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['admin-seller', id],
    queryFn: () => api.get<any>(`/admin/sellers/${id}`),
    enabled: !!id,
  });

  const updateSeller = useMutation({
    mutationFn: (data: { is_active: boolean }) =>
      api.put(`/admin/sellers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      success('Verkäufer aktualisiert');
    },
    onError: (err) => error('Fehler', err instanceof Error ? err.message : 'Update fehlgeschlagen'),
  });

  if (isLoading) return <PageSpinner />;
  if (!seller) return <div className="p-8 text-gray-500">Verkäufer nicht gefunden</div>;

  return (
    <div className="max-w-4xl">
      <Link to="/admin/verkaeufer" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{seller.first_name} {seller.last_name}</h1>
          {seller.email && <p className="text-gray-500">{seller.email}</p>}
        </div>
        <div className="flex gap-2">
          {seller.is_active ? (
            <Button variant="destructive" size="sm" onClick={() => updateSeller.mutate({ is_active: false })} loading={updateSeller.isPending}>
              <UserX className="h-4 w-4" />
              Deaktivieren
            </Button>
          ) : (
            <Button variant="success" size="sm" onClick={() => updateSeller.mutate({ is_active: true })} loading={updateSeller.isPending}>
              <UserCheck className="h-4 w-4" />
              Aktivieren
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Profil</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Status: </span>
                <span className={seller.is_active ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                  {seller.is_active ? 'Aktiv' : 'Deaktiviert'}
                </span>
              </div>
              {seller.email && <div><span className="text-gray-500">E-Mail: </span>{seller.email}</div>}
              {seller.phone && <div><span className="text-gray-500">Telefon: </span>{seller.phone}</div>}
              {seller.birth_date && <div><span className="text-gray-500">Geburtsdatum: </span>{formatDate(seller.birth_date)}</div>}
              {seller.street && <div><span className="text-gray-500">Straße: </span>{seller.street}</div>}
              {(seller.postal_code || seller.city) && (
                <div><span className="text-gray-500">Ort: </span>{[seller.postal_code, seller.city].filter(Boolean).join(' ')}</div>
              )}
              {seller.country && <div><span className="text-gray-500">Land: </span>{seller.country}</div>}
              <div><span className="text-gray-500">Registriert: </span>{formatDate(seller.created_at)}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Kommissionsvertrag</h3>
            {seller.contracts && seller.contracts.length > 0 ? (
              seller.contracts.map((contract: any) => (
                <div key={contract.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Akzeptiert</span>
                  </div>
                  <div className="text-sm space-y-1 pl-6">
                    <div>
                      <span className="text-gray-500 text-xs">Version: </span>
                      <span className="font-semibold text-gray-900 uppercase">{contract.contract_version || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Datum & Uhrzeit: </span>
                      <span className="text-gray-900 text-xs">{contract.accepted_at ? formatDateTime(contract.accepted_at) : formatDate(contract.created_at)}</span>
                    </div>
                  </div>
                  {contract.download_url && (
                    <a
                      href={contract.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-navy-700 hover:text-navy-900 font-medium pl-6"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {contract.file_name || 'Vertrag als PDF öffnen'}
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500">Kein Kommissionsvertrag vorhanden</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Inserate ({seller.listings?.length || 0})</h3>
            </div>
            {seller.listings && seller.listings.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {seller.listings.map((listing: any) => (
                  <Link
                    key={listing.id}
                    to={`/admin/inserate/${listing.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{listing.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{formatPrice(listing.price)}</span>
                        <span className="text-xs text-gray-400">{formatDate(listing.created_at)}</span>
                      </div>
                    </div>
                    <StatusBadge status={listing.status as ListingStatus} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">Keine Inserate</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
