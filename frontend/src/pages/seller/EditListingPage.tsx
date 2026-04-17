import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArchiveRestore } from 'lucide-react';
import { api } from '@/lib/api';
import { ListingForm } from '@/components/forms/ListingForm';
import { useUpdateListing, useSubmitListing, useRestoreListing } from '@/hooks/useListings';
import { useToast } from '@/hooks/useToast';
import { PageSpinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/listings/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Listing, ListingFormData } from '@/types';

const EDITABLE_STATUSES = ['draft', 'rejected', 'submitted', 'published'];

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const updateListing = useUpdateListing();
  const submitListing = useSubmitListing();
  const restoreListing = useRestoreListing();
  const { success, error } = useToast();
  const [restoring, setRestoring] = useState(false);

  // Read initialStep from navigation state (set when redirecting from create page)
  const initialStep = (location.state as { initialStep?: number } | null)?.initialStep;

  const { data: listing, isLoading } = useQuery({
    queryKey: ['seller-listing', id],
    queryFn: () => api.get<Listing>(`/seller/listings/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <PageSpinner />;
  if (!listing) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Inserat nicht gefunden</p>
      </div>
    );
  }

  const isEditable = EDITABLE_STATUSES.includes(listing.status);

  const handleSave = async (data: ListingFormData, silent?: boolean) => {
    await updateListing.mutateAsync({ id: id!, data });
    // Only navigate on explicit save (not auto-save via Weiter)
    if (!silent && listing?.status === 'published') {
      success('Änderung gespeichert');
      navigate('/seller/inserate');
    }
    return { id: id! };
  };

  const handleSubmit = async (listingId: string) => {
    await submitListing.mutateAsync(listingId);
    success('Inserat eingereicht!', 'Wir melden uns zeitnah bei Ihnen.');
    navigate('/seller/inserate');
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restoreListing.mutateAsync(id!);
      success('Inserat wiederhergestellt', 'Das Inserat wurde als Entwurf wiederhergestellt.');
      navigate('/seller/inserate');
    } catch (err) {
      error('Fehler', err instanceof Error ? err.message : 'Wiederherstellen fehlgeschlagen');
    }
    setRestoring(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {listing.status === 'archived' ? 'Archiviertes Inserat' : 'Inserat bearbeiten'}
          </h1>
          <p className="text-gray-500 mt-1">{listing.title}</p>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      {listing.status === 'published' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Veröffentlichtes Inserat</strong> — Alle Änderungen werden protokolliert und sind für den Admin einsichtbar.
        </div>
      )}

      {listing.status === 'submitted' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Eingereicht zur Prüfung</strong> — Sie können das Inserat noch bearbeiten, solange es noch nicht geprüft wurde.
        </div>
      )}

      {listing.status === 'rejected' && listing.rejection_reason && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <strong>Abgelehnt:</strong> {listing.rejection_reason}
        </div>
      )}

      {listing.status === 'archived' && (
        <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">
            Dieses Inserat wurde vom Admin archiviert und ist nicht mehr öffentlich sichtbar.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 mt-3 mb-4">
            <div><span className="font-medium text-gray-700">Marke/Modell:</span> {listing.brand} {listing.model} {listing.year}</div>
            <div><span className="font-medium text-gray-700">Preis:</span> {formatPrice(listing.price)}</div>
            {listing.created_at && <div><span className="font-medium text-gray-700">Erstellt:</span> {formatDate(listing.created_at)}</div>}
          </div>
          <Button onClick={handleRestore} loading={restoring} variant="outline">
            <ArchiveRestore className="h-4 w-4" />
            Als Entwurf wiederherstellen
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Das Inserat wird als Entwurf wiederhergestellt und muss erneut zur Prüfung eingereicht werden.
          </p>
        </div>
      )}

      {!isEditable && listing.status !== 'archived' && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          Dieses Inserat kann in diesem Status nicht mehr bearbeitet werden.
        </div>
      )}

      {isEditable && (
        <ListingForm
          initialData={{
            ...listing,
            condition: listing.condition ?? undefined,
            fuel_type: listing.fuel_type ?? undefined,
            ce_category: listing.ce_category ?? undefined,
            navigation_equipment: listing.navigation_equipment ?? undefined,
            safety_equipment: listing.safety_equipment ?? undefined,
            comfort_features: listing.comfort_features ?? undefined,
          }}
          initialStep={initialStep}
          listingId={id}
          existingImages={listing.listing_images || []}
          onSave={handleSave}
          onSubmit={listing.status !== 'submitted' && listing.status !== 'published' ? handleSubmit : undefined}
          isEdit
          isPublished={listing.status === 'published'}
        />
      )}
    </div>
  );
}
