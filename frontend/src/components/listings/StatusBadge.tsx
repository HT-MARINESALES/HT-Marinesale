import { Badge } from '@/components/ui/Badge';
import { STATUS_LABELS } from '@/lib/utils';
import type { ListingStatus } from '@/types';

interface StatusBadgeProps {
  status: ListingStatus;
  className?: string;
}

const statusVariants: Record<ListingStatus, 'secondary' | 'info' | 'warning' | 'orange' | 'teal' | 'success' | 'destructive' | 'default' | 'purple'> = {
  draft: 'secondary',
  submitted: 'info',
  checkup_required: 'warning',
  checkup_scheduled: 'orange',
  checkup_completed: 'teal',
  published: 'success',
  rejected: 'destructive',
  archived: 'secondary',
  sold: 'purple',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]} className={className}>
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}
