import { cn } from '@/lib/utils';

export type PlanStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'blocked' | 'cancelled';

export interface StatusBadgeProps {
  status: PlanStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<PlanStatus, { label: string; bgClass: string; textClass: string }> = {
  not_started: {
    label: 'Not Started',
    bgClass: 'bg-status-not-started/10',
    textClass: 'text-status-not-started',
  },
  in_progress: {
    label: 'In Progress',
    bgClass: 'bg-status-in-progress/10',
    textClass: 'text-status-in-progress',
  },
  on_hold: {
    label: 'On Hold',
    bgClass: 'bg-status-on-hold/10',
    textClass: 'text-status-on-hold',
  },
  completed: {
    label: 'Completed',
    bgClass: 'bg-status-completed/10',
    textClass: 'text-status-completed',
  },
  blocked: {
    label: 'Blocked',
    bgClass: 'bg-status-blocked/10',
    textClass: 'text-status-blocked',
  },
  cancelled: {
    label: 'Cancelled',
    bgClass: 'bg-status-cancelled/10',
    textClass: 'text-status-cancelled',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.not_started;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bgClass,
        config.textClass,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: PlanStatus; className?: string }) {
  const dotColors: Record<PlanStatus, string> = {
    not_started: 'bg-status-not-started',
    in_progress: 'bg-status-in-progress',
    on_hold: 'bg-status-on-hold',
    completed: 'bg-status-completed',
    blocked: 'bg-status-blocked',
    cancelled: 'bg-status-cancelled',
  };

  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        dotColors[status] || dotColors.not_started,
        className
      )}
    />
  );
}

export default StatusBadge;
