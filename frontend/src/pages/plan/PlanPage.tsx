import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Calendar, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProjectSwitcher } from '@/components/plan/ProjectSwitcher';
import { PlanTree } from '@/components/plan/PlanTree';
import { PlanImport } from '@/components/plan/PlanImport';
import { PlanUpdater } from '@/components/plan/PlanUpdater';
import { AddPlanItemDialog } from '@/components/plan/AddPlanItemDialog';
import { EditPlanItemDialog } from '@/components/plan/EditPlanItemDialog';
import { useProjectStore } from '@/stores/projectStore';
import planItemsApi from '@/api/plan-items.api';
import type { PlanItem } from '@/types';

export function PlanPage() {
  const {
    currentProject,
    planItems,
    planItemsLoading,
    planItemsError,
    fetchPlanItems,
    addPlanItem,
    updatePlanItemInTree,
    removePlanItemFromTree,
  } = useProjectStore();

  // Tab state
  const [activeTab, setActiveTab] = useState('view');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [parentItemForAdd, setParentItemForAdd] = useState<PlanItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<PlanItem | null>(null);

  // Fetch plan items when project changes
  useEffect(() => {
    if (currentProject) {
      fetchPlanItems(currentProject.id);
    }
  }, [currentProject?.id]);

  const handleAddItem = () => {
    setParentItemForAdd(null);
    setAddDialogOpen(true);
  };

  const handleAddChild = (parentItem: PlanItem) => {
    setParentItemForAdd(parentItem);
    setAddDialogOpen(true);
  };

  const handleEdit = (item: PlanItem) => {
    setItemToEdit(item);
    setEditDialogOpen(true);
  };

  const handleDelete = async (item: PlanItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This will also delete all children.`)) {
      return;
    }

    try {
      const response = await planItemsApi.delete(item.id);
      if (response.success) {
        removePlanItemFromTree(item.id);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleAddSuccess = (newItem: PlanItem) => {
    addPlanItem(newItem);
  };

  const handleEditSuccess = (updatedItem: PlanItem) => {
    updatePlanItemInTree(updatedItem);
  };

  const handleRefresh = () => {
    if (currentProject) {
      fetchPlanItems(currentProject.id);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // If no project selected
  if (!currentProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plan Agent</h1>
            <p className="text-muted-foreground">View and manage your project plan</p>
          </div>
          <ProjectSwitcher />
        </div>

        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
            <p className="text-muted-foreground mb-4">
              Select a project from the dropdown above to view its plan
            </p>
            <ProjectSwitcher />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plan Agent</h1>
          <p className="text-muted-foreground">View and manage your project plan</p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectSwitcher />
        </div>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{currentProject.name}</CardTitle>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentProject.status === 'active' ? 'bg-green-100 text-green-700' :
              currentProject.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              currentProject.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {(currentProject.status || 'active').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {currentProject.client && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{currentProject.client}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Started: {formatDate(currentProject.startDate)}</span>
            </div>
            {currentProject.targetEndDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Target: {formatDate(currentProject.targetEndDate)}</span>
              </div>
            )}
          </div>
          {currentProject.description && (
            <p className="mt-3 text-sm text-muted-foreground">{currentProject.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="view">Plan View</TabsTrigger>
            <TabsTrigger value="updater">Plan Updater</TabsTrigger>
            <TabsTrigger value="import">Import CSV</TabsTrigger>
          </TabsList>

          {activeTab === 'view' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={planItemsLoading}>
                <RefreshCw className={`h-4 w-4 ${planItemsLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          )}
        </div>

        {/* Plan View Tab */}
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Project Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {planItemsLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : planItemsError ? (
                <div className="text-center py-12 text-destructive">
                  <p>{planItemsError}</p>
                  <Button variant="outline" onClick={handleRefresh} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : (
                <PlanTree
                  items={planItems}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Updater Tab */}
        <TabsContent value="updater">
          <PlanUpdater />
        </TabsContent>

        {/* Import CSV Tab */}
        <TabsContent value="import">
          <PlanImport />
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <AddPlanItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        parentItem={parentItemForAdd}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Dialog */}
      <EditPlanItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={itemToEdit}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
