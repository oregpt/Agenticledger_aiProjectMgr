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
import type { PlanItem, UpdatePlanItemInput } from '@/types';

interface EditPlanItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PlanItem | null;
  onSuccess: (item: PlanItem) => void;
}

const statusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function EditPlanItemDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: EditPlanItemDialogProps) {
  const { planItemTypes, fetchPlanItemTypes } = useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [itemTypeId, setItemTypeId] = useState<number | null>(null);
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<UpdatePlanItemInput['status']>('not_started');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [actualStartDate, setActualStartDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Load plan item types
  useEffect(() => {
    if (open && planItemTypes.length === 0) {
      fetchPlanItemTypes();
    }
  }, [open, planItemTypes.length, fetchPlanItemTypes]);

  // Populate form when item changes
  useEffect(() => {
    if (open && item) {
      setName(item.name || '');
      setDescription(item.description || '');
      setItemTypeId(item.itemTypeId || null);
      setOwner(item.owner || '');
      setStatus(item.status || 'not_started');
      setStartDate(item.startDate ? item.startDate.split('T')[0] : '');
      setTargetEndDate(item.targetEndDate ? item.targetEndDate.split('T')[0] : '');
      setActualStartDate(item.actualStartDate ? item.actualStartDate.split('T')[0] : '');
      setActualEndDate(item.actualEndDate ? item.actualEndDate.split('T')[0] : '');
      setNotes(item.notes || '');
      setError(null);
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !itemTypeId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const input: UpdatePlanItemInput = {
        name,
        itemTypeId,
        description: description || null,
        owner: owner || null,
        status,
        startDate: startDate || null,
        targetEndDate: targetEndDate || null,
        actualStartDate: actualStartDate || null,
        actualEndDate: actualEndDate || null,
        notes: notes || null,
      };

      const response = await planItemsApi.update(item.id, input);

      if (response.success && response.data) {
        onSuccess(response.data);
        onOpenChange(false);
      } else {
        setError(response.error?.message || 'Failed to update plan item');
      }
    } catch (err) {
      setError('Failed to update plan item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Plan Item</DialogTitle>
          <DialogDescription>
            Update the details of this plan item.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter item name"
                required
              />
            </div>

            {/* Type selector */}
            <div className="grid gap-2">
              <Label htmlFor="edit-itemType">Type *</Label>
              <select
                id="edit-itemType"
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
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>

            {/* Owner */}
            <div className="grid gap-2">
              <Label htmlFor="edit-owner">Owner</Label>
              <Input
                id="edit-owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Person responsible"
              />
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as UpdatePlanItemInput['status'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Planned Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-targetEndDate">Target End Date</Label>
                <Input
                  id="edit-targetEndDate"
                  type="date"
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Actual Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-actualStartDate">Actual Start Date</Label>
                <Input
                  id="edit-actualStartDate"
                  type="date"
                  value={actualStartDate}
                  onChange={(e) => setActualStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-actualEndDate">Actual End Date</Label>
                <Input
                  id="edit-actualEndDate"
                  type="date"
                  value={actualEndDate}
                  onChange={(e) => setActualEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
