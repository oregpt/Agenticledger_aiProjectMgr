// User types
export interface User {
  id: number;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  organizations: OrganizationMembership[];
  createdAt: string;
}

export interface OrganizationMembership {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  role: Role;
}

// Organization types
export interface Organization {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isPlatform: boolean;
  config?: Record<string, unknown>;
  userCount?: number;
  createdAt: string;
}

// Role types
export interface Role {
  id: number;
  uuid?: string;
  name: string;
  slug: string;
  description?: string | null;
  level: number;
  isSystem?: boolean;
  scope?: 'PLATFORM' | 'ORGANIZATION';
  organizationId?: number | null;
  baseRole?: { id: number; name: string; slug: string } | null;
  userCount?: number;
}

// Permission types
export interface Permission {
  menuId: number;
  menuName: string;
  menuSlug: string;
  menuPath: string;
  menuSection?: string;
  menuIcon?: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

// Menu types
export interface Menu {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string | null;
  icon: string | null;
  path: string;
  sortOrder: number;
  section: 'MAIN' | 'ADMIN' | 'PLATFORM_ADMIN';
  parentId: number | null;
  permissions?: {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

// Feature flag types
export interface FeatureFlag {
  id: number;
  uuid: string;
  key: string;
  name: string;
  description: string | null;
  defaultEnabled: boolean;
}

export interface OrganizationFeatureFlag {
  featureFlagId: number;
  key: string;
  name: string;
  description?: string | null;
  platformEnabled: boolean;
  orgEnabled: boolean;
  effectiveEnabled: boolean;
}

// Platform setting types
export interface PlatformSetting {
  id: number;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description: string | null;
  category: string;
}

// Invitation types
export interface Invitation {
  id: number;
  uuid: string;
  email: string;
  roleId: number;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  invitedBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Auth types
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  invitationToken?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  message: string;
}

// Project types
export interface Project {
  id: string;
  organizationId: number;
  name: string;
  client: string | null;
  description: string | null;
  startDate: string;
  targetEndDate: string | null;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  statusConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Plan Item types
export interface PlanItemType {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isActive: boolean;
}

export interface PlanItem {
  id: string;
  projectId: string;
  parentId: string | null;
  itemTypeId: number;
  name: string;
  description: string | null;
  owner: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  startDate: string | null;
  targetEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  notes: string | null;
  references: string[];
  sortOrder: number;
  path: string;
  depth: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  itemType: PlanItemType;
  children?: PlanItem[];
}

export interface PlanItemHistory {
  id: number;
  planItemId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedByUserId: number | null;
  changedByEmail: string | null;
  changeReason: string | null;
  createdAt: string;
}

export interface CreatePlanItemInput {
  parentId?: string;
  itemTypeId: number;
  name: string;
  description?: string;
  owner?: string;
  status?: PlanItem['status'];
  startDate?: string;
  targetEndDate?: string;
  notes?: string;
  references?: string[];
  sortOrder?: number;
}

export interface UpdatePlanItemInput {
  parentId?: string | null;
  itemTypeId?: number;
  name?: string;
  description?: string | null;
  owner?: string | null;
  status?: PlanItem['status'];
  startDate?: string | null;
  targetEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  notes?: string | null;
  references?: string[];
  sortOrder?: number;
}
