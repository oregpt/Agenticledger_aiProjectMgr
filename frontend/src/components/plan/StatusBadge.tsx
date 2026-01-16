import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
  not_started: {
    label: 'Not Started',
    variant: 'secondary',
    className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  completed: {
    label: 'Completed',
    variant: 'default',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  on_hold: {
    label: 'On Hold',
    variant: 'default',
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.not_started;

  return (
    <Badge className={cn('font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}
