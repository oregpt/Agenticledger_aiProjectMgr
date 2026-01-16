import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProjectStore } from '@/stores/projectStore';
import planItemsApi from '@/api/plan-items.api';
import type { PlanItem, CreatePlanItemInput } from '@/types';

interface AddPlanItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentItem?: PlanItem | null;
  onSuccess: (item: PlanItem) => void;
}

const statusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AddPlanItemDialog({
  open,
  onOpenChange,
  parentItem,
  onSuccess,
}: AddPlanItemDialogProps) {
  const { currentProject, planItemTypes, fetchPlanItemTypes } = useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [itemTypeId, setItemTypeId] = useState<number | null>(null);
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<CreatePlanItemInput['status']>('not_started');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Load plan item types
  useEffect(() => {
    if (open && planItemTypes.length === 0) {
      fetchPlanItemTypes();
    }
  }, [open, planItemTypes.length, fetchPlanItemTypes]);

  // Set default type based on parent
  useEffect(() => {
    if (open && planItemTypes.length > 0) {
      if (parentItem) {
        // Find the next level type
        const parentLevel = parentItem.itemType?.level || 0;
        const nextType = planItemTypes.find((t) => t.level === parentLevel + 1);
        if (nextType) {
          setItemTypeId(nextType.id);
        } else {
          // Use same level as parent if no next level
          setItemTypeId(parentItem.itemTypeId);
        }
      } else {
        // Default to first type (workstream)
        const firstType = planItemTypes.find((t) => t.level === 1) || planItemTypes[0];
        if (firstType) {
          setItemTypeId(firstType.id);
        }
      }
    }
  }, [open, planItemTypes, parentItem]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setOwner('');
      setStatus('not_started');
      setStartDate('');
      setTargetEndDate('');
      setNotes('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !itemTypeId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const input: CreatePlanItemInput = {
        name,
        itemTypeId,
        parentId: parentItem?.id,
        description: description || undefined,
        owner: owner || undefined,
        status,
        startDate: startDate || undefined,
        targetEndDate: targetEndDate || undefined,
        notes: notes || undefined,
      };

      const response = await planItemsApi.create(currentProject.id, input);

      if (response.success && response.data) {
        onSuccess(response.data);
        onOpenChange(false);
      } else {
        setError(response.error?.message || 'Failed to create plan item');
      }
    } catch (err) {
      setError('Failed to create plan item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {parentItem ? `Add Child to "${parentItem.name}"` : 'Add Plan Item'}
          </DialogTitle>
          <DialogDescription>
            {parentItem
              ? 'Create a new child item under the selected parent.'
              : 'Create a new top-level plan item.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter item name"
                required
              />
            </div>

            {/* Type selector */}
            <div className="grid gap-2">
              <Label htmlFor="itemType">Type *</Label>
              <select
                id="itemType"
                value={itemTypeId || ''}
                onChange={(e) => setItemTypeId(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select type</option>
                {planItemTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} (Level {type.level})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>

            {/* Owner */}
            <div className="grid gap-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Person responsible"
              />
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CreatePlanItemInput['status'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetEndDate">Target End Date</Label>
                <Input
                  id="targetEndDate"
                  type="date"
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || !itemTypeId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
