import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import { parse } from 'csv-parse/sync';
import type {
  CreatePlanItemInput,
  UpdatePlanItemInput,
  ListPlanItemsQuery,
  BulkUpdateInput,
} from './plan-items.schema.js';

// CSV column mapping for hierarchy levels
const HIERARCHY_COLUMNS = ['workstream', 'milestone', 'activity', 'task', 'subtask'] as const;
const HIERARCHY_LEVELS: Record<typeof HIERARCHY_COLUMNS[number], number> = {
  workstream: 1,
  milestone: 2,
  activity: 3,
  task: 4,
  subtask: 5,
};

// CSV row interface
interface CsvRow {
  workstream?: string;
  milestone?: string;
  activity?: string;
  task?: string;
  subtask?: string;
  status?: string;
  owner?: string;
  start_date?: string;
  target_end_date?: string;
  notes?: string;
}

// Import result interface
export interface ImportResult {
  totalRows: number;
  itemsCreated: number;
  itemsUpdated: number;
  errors: Array<{ row: number; error: string }>;
}

// Helper to build tree structure from flat list
const buildTree = (items: any[], parentId: string | null = null): any[] => {
  return items
    .filter(item => item.parentId === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

// Calculate path and depth based on parent
const calculatePathAndDepth = async (parentId: string | null): Promise<{ path: string; depth: number }> => {
  if (!parentId) {
    return { path: '', depth: 0 };
  }

  const parent = await prisma.planItem.findUnique({
    where: { id: parentId },
    select: { path: true, depth: true, id: true },
  });

  if (!parent) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Parent plan item not found', 404);
  }

  return {
    path: parent.path ? `${parent.path}/${parent.id}` : `/${parent.id}`,
    depth: parent.depth + 1,
  };
};

// Get full plan tree for a project
export const getProjectPlan = async (projectId: string, organizationId: number, query: ListPlanItemsQuery) => {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId, isActive: true },
  });

  if (!project) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', 404);
  }

  const where: any = {
    projectId,
    isActive: true,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.itemTypeId) {
    where.itemTypeId = query.itemTypeId;
  }

  const items = await prisma.planItem.findMany({
    where,
    include: {
      itemType: {
        select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
      },
    },
    orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }],
  });

  // Build tree structure
  const tree = buildTree(items);

  return { items: tree, total: items.length };
};

// Get a single plan item with children
export const getPlanItemById = async (id: string, organizationId: number) => {
  const item = await prisma.planItem.findFirst({
    where: { id, isActive: true },
    include: {
      project: { select: { organizationId: true } },
      itemType: {
        select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
      },
      children: {
        where: { isActive: true },
        include: {
          itemType: {
            select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item not found', 404);
  }

  // Verify organization access
  if (item.project.organizationId !== organizationId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied', 403);
  }

  // Remove project from response
  const { project, ...itemData } = item;
  return itemData;
};

// Create a new plan item
export const createPlanItem = async (
  projectId: string,
  organizationId: number,
  input: CreatePlanItemInput,
  userId?: number,
  userEmail?: string
) => {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId, isActive: true },
  });

  if (!project) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', 404);
  }

  // Verify parent exists if specified
  if (input.parentId) {
    const parent = await prisma.planItem.findFirst({
      where: { id: input.parentId, projectId, isActive: true },
    });
    if (!parent) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Parent plan item not found', 404);
    }
  }

  // Verify item type exists
  const itemType = await prisma.planItemType.findUnique({
    where: { id: input.itemTypeId },
  });

  if (!itemType) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item type not found', 404);
  }

  // Calculate path and depth
  const { path, depth } = await calculatePathAndDepth(input.parentId || null);

  const item = await prisma.planItem.create({
    data: {
      projectId,
      parentId: input.parentId || null,
      itemTypeId: input.itemTypeId,
      name: input.name,
      description: input.description,
      owner: input.owner,
      status: input.status || 'not_started',
      startDate: input.startDate,
      targetEndDate: input.targetEndDate,
      actualStartDate: input.actualStartDate,
      actualEndDate: input.actualEndDate,
      notes: input.notes,
      references: input.references || [],
      sortOrder: input.sortOrder || 0,
      path,
      depth,
    },
    include: {
      itemType: {
        select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
      },
    },
  });

  return item;
};

// Update a plan item
export const updatePlanItem = async (
  id: string,
  organizationId: number,
  input: UpdatePlanItemInput,
  userId?: number,
  userEmail?: string
) => {
  const item = await prisma.planItem.findFirst({
    where: { id, isActive: true },
    include: {
      project: { select: { organizationId: true } },
    },
  });

  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item not found', 404);
  }

  if (item.project.organizationId !== organizationId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied', 403);
  }

  // Track changes for history
  const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
  const trackableFields = ['name', 'description', 'owner', 'status', 'startDate', 'targetEndDate', 'actualStartDate', 'actualEndDate', 'notes'];

  for (const field of trackableFields) {
    if (input[field as keyof UpdatePlanItemInput] !== undefined) {
      const oldVal = item[field as keyof typeof item];
      const newVal = input[field as keyof UpdatePlanItemInput];
      if (String(oldVal) !== String(newVal)) {
        changes.push({
          field,
          oldValue: oldVal !== null ? String(oldVal) : null,
          newValue: newVal !== null && newVal !== undefined ? String(newVal) : null,
        });
      }
    }
  }

  // Build update data
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.owner !== undefined) updateData.owner = input.owner;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.startDate !== undefined) updateData.startDate = input.startDate;
  if (input.targetEndDate !== undefined) updateData.targetEndDate = input.targetEndDate;
  if (input.actualStartDate !== undefined) updateData.actualStartDate = input.actualStartDate;
  if (input.actualEndDate !== undefined) updateData.actualEndDate = input.actualEndDate;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.references !== undefined) updateData.references = input.references;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
  if (input.itemTypeId !== undefined) updateData.itemTypeId = input.itemTypeId;

  // Handle parent change (needs path/depth recalculation)
  if (input.parentId !== undefined && input.parentId !== item.parentId) {
    // Verify new parent exists if not null
    if (input.parentId !== null) {
      const newParent = await prisma.planItem.findFirst({
        where: { id: input.parentId, projectId: item.projectId, isActive: true },
      });
      if (!newParent) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'New parent plan item not found', 404);
      }
      // Prevent circular reference
      if (newParent.path.includes(id)) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot move item to its own descendant', 400);
      }
    }

    const { path, depth } = await calculatePathAndDepth(input.parentId);
    updateData.parentId = input.parentId;
    updateData.path = path;
    updateData.depth = depth;

    changes.push({
      field: 'parentId',
      oldValue: item.parentId,
      newValue: input.parentId,
    });
  }

  // Update item and create history records in transaction
  const [updated] = await prisma.$transaction([
    prisma.planItem.update({
      where: { id },
      data: updateData,
      include: {
        itemType: {
          select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
        },
      },
    }),
    ...changes.map(change =>
      prisma.planItemHistory.create({
        data: {
          planItemId: id,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedByUserId: userId,
          changedByEmail: userEmail,
        },
      })
    ),
  ]);

  return updated;
};

// Delete a plan item (soft delete with cascade)
export const deletePlanItem = async (id: string, organizationId: number) => {
  const item = await prisma.planItem.findFirst({
    where: { id, isActive: true },
    include: {
      project: { select: { organizationId: true } },
    },
  });

  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item not found', 404);
  }

  if (item.project.organizationId !== organizationId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied', 403);
  }

  // Soft delete this item and all descendants
  await prisma.planItem.updateMany({
    where: {
      OR: [
        { id },
        { path: { startsWith: item.path ? `${item.path}/${id}` : `/${id}` } },
      ],
    },
    data: { isActive: false },
  });

  return { message: 'Plan item and children deleted successfully' };
};

// Get history for a plan item
export const getPlanItemHistory = async (id: string, organizationId: number) => {
  const item = await prisma.planItem.findFirst({
    where: { id },
    include: {
      project: { select: { organizationId: true } },
    },
  });

  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item not found', 404);
  }

  if (item.project.organizationId !== organizationId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied', 403);
  }

  const history = await prisma.planItemHistory.findMany({
    where: { planItemId: id },
    orderBy: { createdAt: 'desc' },
  });

  return history;
};

// Get plan item types (global + org-specific)
export const getPlanItemTypes = async (organizationId: number) => {
  const types = await prisma.planItemType.findMany({
    where: {
      isActive: true,
      OR: [
        { organizationId: null }, // Global types
        { organizationId }, // Org-specific types
      ],
    },
    orderBy: { level: 'asc' },
  });

  return types;
};

// Bulk update plan items (for plan updater agent)
export const bulkUpdatePlanItems = async (
  organizationId: number,
  input: BulkUpdateInput,
  userId?: number,
  userEmail?: string
) => {
  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  for (const update of input.updates) {
    try {
      await updatePlanItem(
        update.id,
        organizationId,
        {
          status: update.status,
          notes: update.notes,
          references: update.references,
        },
        userId,
        userEmail
      );
      results.push({ id: update.id, success: true });
    } catch (error) {
      results.push({
        id: update.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
};

// Parse CSV content and return preview data
export const parseCsvPreview = (csvContent: string): { headers: string[]; rows: CsvRow[]; errors: string[] } => {
  const errors: string[] = [];
  let rows: CsvRow[] = [];
  let headers: string[] = [];

  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true,
    });

    if (records.length > 0 && typeof records[0] === 'object' && records[0] !== null) {
      headers = Object.keys(records[0] as Record<string, unknown>);
    }

    rows = records as CsvRow[];

    // Validate that at least one hierarchy column exists
    const hasHierarchy = HIERARCHY_COLUMNS.some(col => headers.includes(col));
    if (!hasHierarchy) {
      errors.push('CSV must contain at least one hierarchy column (workstream, milestone, activity, task, or subtask)');
    }
  } catch (error) {
    errors.push(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { headers, rows, errors };
};

// Import plan items from CSV
export const importPlanItems = async (
  projectId: string,
  organizationId: number,
  csvContent: string,
  userId?: number,
  userEmail?: string
): Promise<ImportResult> => {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId, isActive: true },
  });

  if (!project) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', 404);
  }

  // Parse CSV
  const { rows, errors: parseErrors } = parseCsvPreview(csvContent);

  if (parseErrors.length > 0) {
    return {
      totalRows: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      errors: parseErrors.map((e, i) => ({ row: 0, error: e })),
    };
  }

  // Get plan item types for mapping
  const itemTypes = await prisma.planItemType.findMany({
    where: {
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
    orderBy: { level: 'asc' },
  });

  // Create a map of level to type ID
  const levelToTypeId: Record<number, number> = {};
  for (const type of itemTypes) {
    levelToTypeId[type.level] = type.id;
  }

  const result: ImportResult = {
    totalRows: rows.length,
    itemsCreated: 0,
    itemsUpdated: 0,
    errors: [],
  };

  // Process each row
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rowNumber = rowIndex + 2; // +2 for 1-indexed + header row

    try {
      await processImportRow(
        projectId,
        row,
        levelToTypeId,
        result,
        rowNumber,
        userId,
        userEmail
      );
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
};

// Process a single CSV row - find or create items at each hierarchy level
async function processImportRow(
  projectId: string,
  row: CsvRow,
  levelToTypeId: Record<number, number>,
  result: ImportResult,
  rowNumber: number,
  userId?: number,
  userEmail?: string
) {
  let parentId: string | null = null;
  let deepestItemId: string | null = null;
  let deepestLevel = 0;

  // Process each hierarchy level in order
  for (const column of HIERARCHY_COLUMNS) {
    const name = row[column]?.trim();
    if (!name) continue;

    const level = HIERARCHY_LEVELS[column];
    const typeId = levelToTypeId[level];

    if (!typeId) {
      result.errors.push({
        row: rowNumber,
        error: `No item type found for level ${level} (${column})`,
      });
      return;
    }

    // Find or create item at this level
    const { item, created } = await findOrCreatePlanItem(
      projectId,
      name,
      typeId,
      parentId,
      level
    );

    if (created) {
      result.itemsCreated++;
    }

    parentId = item.id;
    deepestItemId = item.id;
    deepestLevel = level;
  }

  // Apply metadata to the deepest item
  if (deepestItemId && hasMetadata(row)) {
    const updateData: UpdatePlanItemInput = {};

    if (row.status) {
      const normalizedStatus = normalizeStatus(row.status);
      if (normalizedStatus) {
        updateData.status = normalizedStatus;
      }
    }

    if (row.owner) {
      updateData.owner = row.owner.trim();
    }

    if (row.start_date) {
      const date = parseDate(row.start_date);
      if (date) updateData.startDate = new Date(date);
    }

    if (row.target_end_date) {
      const date = parseDate(row.target_end_date);
      if (date) updateData.targetEndDate = new Date(date);
    }

    if (row.notes) {
      updateData.notes = row.notes.trim();
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length > 0) {
      await prisma.planItem.update({
        where: { id: deepestItemId },
        data: updateData,
      });
      result.itemsUpdated++;
    }
  }
}

// Find or create a plan item by name and parent
async function findOrCreatePlanItem(
  projectId: string,
  name: string,
  itemTypeId: number,
  parentId: string | null,
  level: number
): Promise<{ item: { id: string }; created: boolean }> {
  // Look for existing item with same name under same parent
  const existing = await prisma.planItem.findFirst({
    where: {
      projectId,
      parentId,
      name,
      isActive: true,
    },
    select: { id: true },
  });

  if (existing) {
    return { item: existing, created: false };
  }

  // Calculate path and depth
  let path = '';
  let depth = 0;

  if (parentId) {
    const parent = await prisma.planItem.findUnique({
      where: { id: parentId },
      select: { path: true, depth: true, id: true },
    });

    if (parent) {
      path = parent.path ? `${parent.path}/${parent.id}` : `/${parent.id}`;
      depth = parent.depth + 1;
    }
  }

  // Get max sort order for siblings
  const maxSortOrder = await prisma.planItem.aggregate({
    where: { projectId, parentId, isActive: true },
    _max: { sortOrder: true },
  });

  // Create new item
  const newItem = await prisma.planItem.create({
    data: {
      projectId,
      parentId,
      itemTypeId,
      name,
      status: 'not_started',
      path,
      depth,
      sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
    },
    select: { id: true },
  });

  return { item: newItem, created: true };
}

// Check if row has any metadata fields
function hasMetadata(row: CsvRow): boolean {
  return !!(row.status || row.owner || row.start_date || row.target_end_date || row.notes);
}

// Normalize status string to valid status value
function normalizeStatus(status: string): 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | null {
  const normalized = status.toLowerCase().replace(/[\s-]/g, '_');
  const validStatuses = ['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'];

  if (validStatuses.includes(normalized)) {
    return normalized as any;
  }

  // Common aliases
  const aliases: Record<string, string> = {
    'done': 'completed',
    'complete': 'completed',
    'started': 'in_progress',
    'active': 'in_progress',
    'pending': 'not_started',
    'todo': 'not_started',
    'blocked': 'on_hold',
    'hold': 'on_hold',
    'cancel': 'cancelled',
    'canceled': 'cancelled',
  };

  return aliases[normalized] as any || null;
}

// Parse date string to ISO format
function parseDate(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Try various date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // MM-DD-YYYY
  ];

  for (const format of formats) {
    const match = trimmed.match(format);
    if (match) {
      let year: string, month: string, day: string;

      if (format === formats[0]) {
        [, year, month, day] = match;
      } else {
        [, month, day, year] = match;
      }

      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }

  // Try native Date parsing as fallback
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  return null;
}

// Generate CSV template
export const getCsvTemplate = (): string => {
  const headers = ['workstream', 'milestone', 'activity', 'task', 'subtask', 'status', 'owner', 'start_date', 'target_end_date', 'notes'];
  const sampleRows = [
    ['Development', 'Sprint 1', 'Setup', 'Create project', '', 'in_progress', 'John Doe', '2024-01-15', '2024-01-20', 'Initial setup'],
    ['Development', 'Sprint 1', 'Setup', 'Configure CI/CD', '', 'not_started', 'Jane Smith', '2024-01-21', '2024-01-25', ''],
    ['Development', 'Sprint 1', 'Features', 'User auth', 'Login page', 'completed', 'John Doe', '2024-01-15', '2024-01-18', ''],
    ['Development', 'Sprint 2', '', '', '', 'not_started', '', '2024-02-01', '2024-02-15', 'Planning phase'],
  ];

  return [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
};
