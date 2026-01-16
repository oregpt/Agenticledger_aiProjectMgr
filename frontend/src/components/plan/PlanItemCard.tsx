import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  User,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import type { PlanItem } from '@/types';

interface PlanItemCardProps {
  item: PlanItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (item: PlanItem) => void;
  onDelete: (item: PlanItem) => void;
  onAddChild: (parentItem: PlanItem) => void;
  depth?: number;
}

export function PlanItemCard({
  item,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
  depth = 0,
}: PlanItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeIcon = (level: number) => {
    const icons: Record<number, string> = {
      1: 'bg-blue-500', // Workstream
      2: 'bg-green-500', // Milestone
      3: 'bg-purple-500', // Activity
      4: 'bg-orange-500', // Task
      5: 'bg-gray-500', // Subtask
    };
    return icons[level] || 'bg-gray-500';
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 py-2 px-3 rounded-lg transition-colors',
        'hover:bg-accent/50',
        isHovered && 'bg-accent/30'
      )}
      style={{ paddingLeft: `${depth * 24 + 12}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expand/collapse button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-6 w-6 p-0', !hasChildren && 'invisible')}
        onClick={onToggleExpand}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Type indicator */}
      <div
        className={cn('h-3 w-3 rounded-full shrink-0', getTypeIcon(item.itemType?.level || 1))}
        title={item.itemType?.name}
      />

      {/* Item name */}
      <span className="font-medium flex-1 truncate">{item.name}</span>

      {/* Meta info (visible on hover or always for some) */}
      <div className={cn('flex items-center gap-3 transition-opacity', !isHovered && 'opacity-60')}>
        {item.owner && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{item.owner}</span>
          </div>
        )}

        {item.targetEndDate && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(item.targetEndDate)}</span>
          </div>
        )}

        <StatusBadge status={item.status} />
      </div>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity')}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddChild(item)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(item)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
