import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, PlanItem, PlanItemType } from '@/types';
import projectsApi from '@/api/projects.api';
import planItemsApi from '@/api/plan-items.api';

interface ProjectState {
  // Projects list
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;

  // Current project
  currentProject: Project | null;

  // Plan items for current project
  planItems: PlanItem[];
  planItemsLoading: boolean;
  planItemsError: string | null;

  // Plan item types
  planItemTypes: PlanItemType[];
  planItemTypesLoading: boolean;

  // Actions
  fetchProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  fetchPlanItems: (projectId: string) => Promise<void>;
  fetchPlanItemTypes: () => Promise<void>;
  addPlanItem: (item: PlanItem) => void;
  updatePlanItemInTree: (updatedItem: PlanItem) => void;
  removePlanItemFromTree: (itemId: string) => void;
  clearProjectData: () => void;
}

// Helper to recursively update item in tree
const updateItemInTree = (items: PlanItem[], updatedItem: PlanItem): PlanItem[] => {
  return items.map(item => {
    if (item.id === updatedItem.id) {
      return { ...updatedItem, children: item.children };
    }
    if (item.children && item.children.length > 0) {
      return { ...item, children: updateItemInTree(item.children, updatedItem) };
    }
    return item;
  });
};

// Helper to recursively remove item from tree
const removeItemFromTree = (items: PlanItem[], itemId: string): PlanItem[] => {
  return items
    .filter(item => item.id !== itemId)
    .map(item => {
      if (item.children && item.children.length > 0) {
        return { ...item, children: removeItemFromTree(item.children, itemId) };
      }
      return item;
    });
};

// Helper to add item to tree at correct position
const addItemToTree = (items: PlanItem[], newItem: PlanItem): PlanItem[] => {
  if (!newItem.parentId) {
    // Root level item
    return [...items, newItem].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return items.map(item => {
    if (item.id === newItem.parentId) {
      const children = item.children || [];
      return {
        ...item,
        children: [...children, newItem].sort((a, b) => a.sortOrder - b.sortOrder),
      };
    }
    if (item.children && item.children.length > 0) {
      return { ...item, children: addItemToTree(item.children, newItem) };
    }
    return item;
  });
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      projectsLoading: false,
      projectsError: null,
      currentProject: null,
      planItems: [],
      planItemsLoading: false,
      planItemsError: null,
      planItemTypes: [],
      planItemTypesLoading: false,

      // Fetch all projects for current org
      fetchProjects: async () => {
        set({ projectsLoading: true, projectsError: null });
        try {
          const response = await projectsApi.list({ limit: 100 });
          if (response.success && response.data) {
            const projects = response.data;
            set({ projects, projectsLoading: false });

            // Auto-select first project if none selected and projects exist
            const { currentProject } = get();
            if (!currentProject && projects.length > 0) {
              // Select first project
              get().setCurrentProject(projects[0]);
            } else if (currentProject && projects.length > 0) {
              // Rehydrate full project data if we only have ID from persistence
              const fullProject = projects.find(p => p.id === currentProject.id);
              if (fullProject && !currentProject.name) {
                get().setCurrentProject(fullProject);
              }
            }
          } else {
            set({ projectsError: response.error?.message || 'Failed to fetch projects', projectsLoading: false });
          }
        } catch (error) {
          set({ projectsError: 'Failed to fetch projects', projectsLoading: false });
        }
      },

      // Set current project
      setCurrentProject: (project) => {
        set({ currentProject: project, planItems: [], planItemsError: null });
        if (project) {
          get().fetchPlanItems(project.id);
        }
      },

      // Fetch plan items for a project
      fetchPlanItems: async (projectId) => {
        set({ planItemsLoading: true, planItemsError: null });
        try {
          const response = await planItemsApi.getProjectPlan(projectId);
          if (response.success && response.data) {
            set({ planItems: response.data.items, planItemsLoading: false });
          } else {
            set({ planItemsError: response.error?.message || 'Failed to fetch plan', planItemsLoading: false });
          }
        } catch (error) {
          set({ planItemsError: 'Failed to fetch plan', planItemsLoading: false });
        }
      },

      // Fetch plan item types
      fetchPlanItemTypes: async () => {
        set({ planItemTypesLoading: true });
        try {
          const response = await planItemsApi.getTypes();
          if (response.success && response.data) {
            set({ planItemTypes: response.data, planItemTypesLoading: false });
          } else {
            set({ planItemTypesLoading: false });
          }
        } catch (error) {
          set({ planItemTypesLoading: false });
        }
      },

      // Add a new plan item to the tree
      addPlanItem: (item) => {
        const { planItems } = get();
        set({ planItems: addItemToTree(planItems, item) });
      },

      // Update a plan item in the tree
      updatePlanItemInTree: (updatedItem) => {
        const { planItems } = get();
        set({ planItems: updateItemInTree(planItems, updatedItem) });
      },

      // Remove a plan item from the tree
      removePlanItemFromTree: (itemId) => {
        const { planItems } = get();
        set({ planItems: removeItemFromTree(planItems, itemId) });
      },

      // Clear all project data (on org switch, logout, etc.)
      clearProjectData: () => {
        set({
          projects: [],
          currentProject: null,
          planItems: [],
          planItemsError: null,
        });
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        // Only persist the current project ID, not full data
        currentProject: state.currentProject ? { id: state.currentProject.id } : null,
      }),
    }
  )
);
