import { useState, useCallback } from 'react';
import { PlanItemCard } from './PlanItemCard';
import type { PlanItem } from '@/types';

interface PlanTreeProps {
  items: PlanItem[];
  onEdit: (item: PlanItem) => void;
  onDelete: (item: PlanItem) => void;
  onAddChild: (parentItem: PlanItem) => void;
}

interface TreeNodeProps {
  item: PlanItem;
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (item: PlanItem) => void;
  onDelete: (item: PlanItem) => void;
  onAddChild: (parentItem: PlanItem) => void;
}

function TreeNode({
  item,
  depth,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
}: TreeNodeProps) {
  const isExpanded = expandedIds.has(item.id);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <PlanItemCard
        item={item}
        depth={depth}
        isExpanded={isExpanded}
        onToggleExpand={() => onToggleExpand(item.id)}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddChild={onAddChild}
      />
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlanTree({ items, onEdit, onDelete, onAddChild }: PlanTreeProps) {
  // Start with all items expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    const collectIds = (items: PlanItem[]) => {
      items.forEach((item) => {
        ids.add(item.id);
        if (item.children) {
          collectIds(item.children);
        }
      });
    };
    collectIds(items);
    return ids;
  });

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const ids = new Set<string>();
    const collectIds = (items: PlanItem[]) => {
      items.forEach((item) => {
        ids.add(item.id);
        if (item.children) {
          collectIds(item.children);
        }
      });
    };
    collectIds(items);
    setExpandedIds(ids);
  }, [items]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg">No plan items yet</p>
        <p className="text-sm">Click "Add Item" to create your first plan item</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Expand/Collapse controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={expandAll}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Expand All
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          onClick={collapseAll}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Collapse All
        </button>
      </div>

      {/* Tree */}
      {items.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          depth={0}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}
