import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ListingForm } from '@/components/forms/ListingForm';
import { useAdminListing, useAdminUpdateListing } from '@/hooks/useListings';
import { useToast } from '@/hooks/useToast';
import { PageSpinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/listings/StatusBadge';
import type { ListingFormData } from '@/types';

export function AdminEditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateListing = useAdminUpdateListing();
  const { data: listing, isLoading } = useAdminListing(id || '');
  const { success, error } = useToast();

  if (isLoading) return <PageSpinner />;
  if (!listing) return <div className="p-8 text-gray-500">Inserat nicht gefunden</div>;

  const handleSave = async (data: ListingFormData, silent?: boolean) => {
    await updateListing.mutateAsync({ id: id!, data: data as unknown as Record<string, unknown> });
    // Only navigate back on explicit save, not on auto-save via Weiter
    if (!silent) {
      success('Inserat gespeichert');
      navigate(`/admin/inserate/${id}`);
    }
    return { id: id! };
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            to={`/admin/inserate/${id}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-2 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Zurück zur Detailansicht
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Inserat bearbeiten (Admin)</h1>
          <p className="text-gray-500 mt-1">{listing.title}</p>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        Sie bearbeiten dieses Inserat als Administrator. Änderungen werden beim Klick auf "Speichern" oder "Weiter" automatisch gespeichert.
      </div>

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
        listingId={id}
        existingImages={listing.listing_images || []}
        onSave={handleSave}
        isEdit
        isPublished
      />
    </div>
  );
}
