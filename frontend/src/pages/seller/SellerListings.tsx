import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Send, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/listings/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useSellerListings, useDeleteListing, useSubmitListing, useRestoreListing } from '@/hooks/useListings';
import { useToast } from '@/hooks/useToast';
import { formatPrice, formatDate } from '@/lib/utils';
import { PageSpinner } from '@/components/ui/Spinner';
import type { ListingStatus } from '@/types';

const DELETABLE_STATUSES = ['draft', 'rejected', 'submitted', 'published', 'sold'];

export function SellerListings() {
  const { data: listings, isLoading } = useSellerListings();
  const deleteListing = useDeleteListing();
  const submitListing = useSubmitListing();
  const restoreListing = useRestoreListing();
  const { success, error } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);

  if (isLoading) return <PageSpinner />;

  const handleRestore = async () => {
    if (!restoreId) return;
    try {
      await restoreListing.mutateAsync(restoreId);
      success('Inserat wiederhergestellt', 'Das Inserat wurde als Entwurf wiederhergestellt.');
      setRestoreId(null);
    } catch (err) {
      error('Fehler', err instanceof Error ? err.message : 'Wiederherstellen fehlgeschlagen');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteListing.mutateAsync(deleteId);
      success('Inserat gelöscht');
      setDeleteId(null);
    } catch (err) {
      error('Fehler', err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    }
  };

  const handleSubmit = async () => {
    if (!submitId) return;
    try {
      await submitListing.mutateAsync(submitId);
      success('Inserat eingereicht', 'Wir prüfen Ihr Inserat und melden uns bald.');
      setSubmitId(null);
    } catch (err) {
      error('Fehler', err instanceof Error ? err.message : 'Einreichen fehlgeschlagen');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meine Inserate</h1>
        <Link to="/seller/inserate/neu">
          <Button>
            <Plus className="h-4 w-4" />
            Neues Inserat
          </Button>
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <EmptyState
          title="Noch keine Inserate"
          description="Erstellen Sie Ihr erstes Boot-Inserat und lassen Sie es professionell prüfen."
          action={
            <Link to="/seller/inserate/neu">
              <Button>
                <Plus className="h-4 w-4" />
                Erstes Inserat erstellen
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Titel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Erstellt</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map(listing => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-xs">{listing.title}</div>
                      <div className="text-xs text-gray-400">{listing.brand} {listing.model} {listing.year}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatPrice(listing.price)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={listing.status as ListingStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(listing.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {listing.status === 'published' && (
                          <Link to={`/boote/${listing.slug}`} title="Öffentliche Ansicht">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {['draft', 'rejected', 'submitted', 'published'].includes(listing.status) && (
                          <Link to={`/seller/inserate/${listing.id}`} title="Bearbeiten">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {['draft', 'rejected'].includes(listing.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:bg-green-50"
                            title="Einreichen"
                            onClick={() => setSubmitId(listing.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {DELETABLE_STATUSES.includes(listing.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            title="Löschen"
                            onClick={() => setDeleteId(listing.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {listing.status === 'archived' && (
                          <>
                            <Link to={`/seller/inserate/${listing.id}`} title="Ansehen">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:bg-blue-50"
                              title="Als Entwurf wiederherstellen"
                              onClick={() => setRestoreId(listing.id)}
                            >
                              <ArchiveRestore className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {(() => {
        const toDelete = listings?.find(l => l.id === deleteId);
        const status = toDelete?.status;
        const description =
          status === 'published'
            ? 'Dieses Inserat ist aktuell veröffentlicht. Es wird von der öffentlichen Seite entfernt und kann nicht wiederhergestellt werden.'
            : status === 'sold'
            ? 'Dieses Inserat ist als verkauft markiert. Es wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.'
            : 'Sind Sie sicher, dass Sie dieses Inserat löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.';
        return (
          <Modal
            open={!!deleteId}
            onClose={() => setDeleteId(null)}
            title="Inserat löschen"
            description={description}
          >
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Abbrechen</Button>
              <Button variant="destructive" onClick={handleDelete} loading={deleteListing.isPending}>
                Endgültig löschen
              </Button>
            </div>
          </Modal>
        );
      })()}

      {/* Restore confirm */}
      <Modal
        open={!!restoreId}
        onClose={() => setRestoreId(null)}
        title="Inserat wiederherstellen"
        description="Das Inserat wird als Entwurf wiederhergestellt und muss erneut zur Prüfung eingereicht werden."
      >
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setRestoreId(null)}>Abbrechen</Button>
          <Button onClick={handleRestore} loading={restoreListing.isPending}>
            <ArchiveRestore className="h-4 w-4" />
            Wiederherstellen
          </Button>
        </div>
      </Modal>

      {/* Submit confirm */}
      <Modal
        open={!!submitId}
        onClose={() => setSubmitId(null)}
        title="Inserat einreichen"
        description="Ihr Inserat wird zur Prüfung eingereicht. Unser Team wird sich zeitnah für den Check-up-Termin bei Ihnen melden."
      >
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setSubmitId(null)}>Abbrechen</Button>
          <Button onClick={handleSubmit} loading={submitListing.isPending}>
            <Send className="h-4 w-4" />
            Einreichen
          </Button>
        </div>
      </Modal>
    </div>
  );
}
