import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'default';
}

// Status colors aligned with SPEC.md design system
const statusConfig: Record<string, { label: string; className: string }> = {
  not_started: {
    label: 'Not Started',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-primary-50 text-primary-700 border-primary-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  on_hold: {
    label: 'On Hold',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  draft: {
    label: 'Draft',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
};

export function StatusBadge({ status, className, size = 'default' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.not_started;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border transition-colors',
        config.className,
        size === 'sm' && 'text-xs px-2 py-0.5',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
