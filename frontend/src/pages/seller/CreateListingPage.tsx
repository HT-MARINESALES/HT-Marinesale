import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListingForm } from '@/components/forms/ListingForm';
import { useCreateListing } from '@/hooks/useListings';
import type { ListingFormData } from '@/types';

const DRAFT_KEY = 'ht-new-listing-draft';

export function CreateListingPage() {
  const navigate = useNavigate();
  const createListing = useCreateListing();

  const initialDraft = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : undefined;
    } catch { return undefined; }
  }, []);

  // After first save, navigate to edit page starting at step 1 (image upload)
  // The edit page loads full listing data from API, including any existing images
  const handleSave = async (data: ListingFormData) => {
    const result = await createListing.mutateAsync(data);
    navigate(`/seller/inserate/${result.id}`, { replace: true, state: { initialStep: 1 } });
    return result;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Neues Inserat erstellen</h1>
        <p className="text-gray-500 mt-1">Füllen Sie alle relevanten Felder aus und reichen Sie das Inserat zur Prüfung ein.</p>
      </div>
      <ListingForm initialData={initialDraft} onSave={handleSave} />
    </div>
  );
}
