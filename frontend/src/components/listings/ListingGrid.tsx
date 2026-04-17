import { ListingCard } from './ListingCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Listing } from '@/types';

interface ListingGridProps {
  listings: Listing[];
  loading?: boolean;
  showStatus?: boolean;
  adminLinks?: boolean;
  emptyMessage?: string;
}

export function ListingGrid({
  listings,
  loading = false,
  showStatus = false,
  adminLinks = false,
  emptyMessage = 'Keine Inserate gefunden',
}: ListingGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description="Versuchen Sie andere Suchkriterien oder schauen Sie später wieder vorbei."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map(listing => (
        <ListingCard
          key={listing.id}
          listing={listing}
          showStatus={showStatus}
          adminLink={adminLinks}
        />
      ))}
    </div>
  );
}
