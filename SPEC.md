# AI Project Manager - Technical Specification

## Overview

AI Project Manager is a multi-tenant SaaS application that helps consultants manage project status reporting across multiple clients. Instead of manually filling out status reports, users dump raw information and AI agents organize, analyze, and format it.

**Core Philosophy**: You do the work, dump stuff to the system, and AI figures out how to apply it to your project and reporting.

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AI PROJECT MANAGER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           FRONTEND (React + Vite)                        │   │
│  │                                                                          │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │   │  Plan    │  │  Intake  │  │ Activity │  │  Admin   │  │  Settings│ │   │
│  │   │  Agent   │  │  Agent   │  │ Reporter │  │  Config  │  │          │ │   │
│  │   │  (Tab 1) │  │  (Tab 2) │  │  (Tab 3) │  │  (Tab 4) │  │  (Tab 5) │ │   │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        BACKEND (Node + Express)                          │   │
│  │                                                                          │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐           │   │
│  │   │   Plan    │  │  Intake   │  │  Activity │  │  Output   │           │   │
│  │   │  Updater  │  │   Agent   │  │  Reporter │  │ Formatter │           │   │
│  │   │  Service  │  │  Service  │  │  Service  │  │  Service  │           │   │
│  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘           │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │                    AI / LLM Integration Layer                    │   │   │
│  │   │              (OpenAI API - GPT-4 + Embeddings)                  │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         DATABASE (PostgreSQL)                            │   │
│  │                                                                          │   │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │   │
│  │   │ Tenant  │  │ Project │  │PlanItem │  │Content  │  │ Vector  │      │   │
│  │   │  Orgs   │  │         │  │         │  │  Item   │  │  Store  │      │   │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 18 + TypeScript | SPA with Vite |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, clean design |
| **State** | Zustand | Lightweight, persistent |
| **Backend** | Node.js + Express + TypeScript | REST API |
| **Database** | PostgreSQL 15+ | With pgvector extension |
| **ORM** | Prisma | Type-safe queries |
| **Auth** | JWT (from multitenancy starter) | Access + Refresh tokens |
| **AI** | OpenAI API | GPT-4 + text-embedding-3-small |
| **Vector Store** | pgvector | Embeddings in PostgreSQL |
| **File Processing** | pdf-parse, mammoth | PDF + DOCX extraction |

---

## Multi-Tenancy Model

```
Organization (Tenant)
    │
    ├── Users (via OrganizationUser)
    │   └── Roles & Permissions
    │
    └── Projects
        ├── PlanItems (hierarchy)
        ├── ContentItems (documents)
        └── ActivityReports (generated)
```

- **Organization** = Tenant (from starter kit)
- **Project** = Client engagement / work effort
- All data is scoped to Organization → Project
- Users can belong to multiple organizations

---

## Database Schema

### Core Tables (From Multitenancy Starter)

Inherited from starter:
- `User` - User accounts
- `Organization` - Tenants
- `OrganizationUser` - Membership join table
- `Role` - RBAC roles
- `RolePermission` - Permission grants
- `Menu` - Navigation items
- `RefreshToken` - Session management
- `AuditLog` - Activity tracking

### New Tables

#### Project

```sql
CREATE TABLE "Project" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" INTEGER NOT NULL REFERENCES "Organization"("id"),
    "name" VARCHAR(255) NOT NULL,
    "client" VARCHAR(255),
    "description" TEXT,
    "startDate" DATE NOT NULL,
    "targetEndDate" DATE,
    "status" VARCHAR(50) DEFAULT 'active',
    "statusConfig" JSONB DEFAULT '{}',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),

    UNIQUE("organizationId", "name")
);
```

#### PlanItemType (Configurable)

```sql
CREATE TABLE "PlanItemType" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" INTEGER REFERENCES "Organization"("id"),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL, -- 1=workstream, 2=milestone, 3=activity, 4=task, 5=subtask
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "isSystem" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),

    UNIQUE("organizationId", "slug")
);

-- Default types (organizationId = NULL means global)
INSERT INTO "PlanItemType" ("name", "slug", "level", "isSystem") VALUES
('Workstream', 'workstream', 1, true),
('Milestone', 'milestone', 2, true),
('Activity', 'activity', 3, true),
('Task', 'task', 4, true),
('Subtask', 'subtask', 5, true);
```

#### PlanItem (Generic Hierarchy)

```sql
CREATE TABLE "PlanItem" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "parentId" UUID REFERENCES "PlanItem"("id") ON DELETE CASCADE,
    "itemTypeId" UUID NOT NULL REFERENCES "PlanItemType"("id"),

    -- Identity
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,

    -- Ownership & Status
    "owner" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'not_started',
    -- Statuses: not_started, in_progress, on_hold, completed, blocked, cancelled

    -- Dates
    "startDate" DATE,
    "targetEndDate" DATE,
    "actualStartDate" DATE,
    "actualEndDate" DATE,

    -- Notes & References
    "notes" TEXT,
    "references" UUID[] DEFAULT '{}', -- ContentItem IDs that informed status

    -- Metadata
    "sortOrder" INTEGER DEFAULT 0,
    "path" TEXT, -- Materialized path for fast hierarchy queries: /uuid1/uuid2/uuid3
    "depth" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_planitem_project" ON "PlanItem"("projectId");
CREATE INDEX "idx_planitem_parent" ON "PlanItem"("parentId");
CREATE INDEX "idx_planitem_path" ON "PlanItem"("path");
CREATE INDEX "idx_planitem_status" ON "PlanItem"("status");
```

#### PlanItemHistory (Audit Trail)

```sql
CREATE TABLE "PlanItemHistory" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "planItemId" UUID NOT NULL REFERENCES "PlanItem"("id") ON DELETE CASCADE,
    "fieldChanged" VARCHAR(100) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changeReason" TEXT,
    "sourceContentIds" UUID[] DEFAULT '{}',
    "changedBy" VARCHAR(50), -- 'user' or 'plan_updater_agent'
    "changedByUserId" INTEGER REFERENCES "User"("id"),
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_planitemhistory_planitem" ON "PlanItemHistory"("planItemId");
```

#### ContentType (Configurable)

```sql
CREATE TABLE "ContentType" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" INTEGER REFERENCES "Organization"("id"),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "isSystem" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),

    UNIQUE("organizationId", "slug")
);

-- Default content types
INSERT INTO "ContentType" ("name", "slug", "description", "isSystem") VALUES
('Meeting', 'meeting', 'Meeting notes, transcripts, summaries', true),
('Document', 'document', 'Documents, specs, proposals', true),
('Email', 'email', 'Email threads and correspondence', true),
('Note', 'note', 'Quick notes and updates', true),
('Transcript', 'transcript', 'Call or meeting transcripts', true);
```

#### ActivityItemType (Configurable)

```sql
CREATE TABLE "ActivityItemType" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" INTEGER REFERENCES "Organization"("id"),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "isSystem" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),

    UNIQUE("organizationId", "slug")
);

-- Default activity types
INSERT INTO "ActivityItemType" ("name", "slug", "description", "isSystem") VALUES
('Status Update', 'status_update', 'Progress or state change', true),
('Action Item', 'action_item', 'Task to be completed', true),
('Risk', 'risk', 'Potential issue identified', true),
('Decision', 'decision', 'A decision that was made', true),
('Blocker', 'blocker', 'Something blocking progress', true),
('Milestone Update', 'milestone_update', 'Progress toward milestone', true),
('Dependency', 'dependency', 'External dependency noted', true);
```

#### ContentItem

```sql
CREATE TABLE "ContentItem" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,

    -- Plan Linkage (multi-select)
    "planItemIds" UUID[] DEFAULT '{}',

    -- Classification (multi-select)
    "contentTypeIds" UUID[] DEFAULT '{}',
    "activityTypeIds" UUID[] DEFAULT '{}',

    -- Source
    "sourceType" VARCHAR(50) NOT NULL, -- file, text, calendar, transcript, email
    "title" VARCHAR(500) NOT NULL,
    "dateOccurred" DATE NOT NULL, -- CRUCIAL - when this happened
    "projectWeek" INTEGER, -- Calculated from project.startDate
    "tags" TEXT[] DEFAULT '{}',

    -- Raw Storage
    "rawContent" TEXT,
    "fileReference" VARCHAR(1000), -- Path if source was file
    "fileName" VARCHAR(255),
    "fileSize" INTEGER,
    "mimeType" VARCHAR(100),

    -- AI Processing
    "aiSummary" TEXT,
    "aiExtractedEntities" JSONB DEFAULT '{}',
    "processingStatus" VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed

    -- Lineage
    "parentItemId" UUID REFERENCES "ContentItem"("id"),
    "createdBy" VARCHAR(50) DEFAULT 'user', -- user, ai_split
    "createdByUserId" INTEGER REFERENCES "User"("id"),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_contentitem_project" ON "ContentItem"("projectId");
CREATE INDEX "idx_contentitem_date" ON "ContentItem"("dateOccurred");
CREATE INDEX "idx_contentitem_week" ON "ContentItem"("projectWeek");
CREATE INDEX "idx_contentitem_planitems" ON "ContentItem" USING GIN("planItemIds");
```

#### ContentChunk (RAG Optimized)

```sql
CREATE TABLE "ContentChunk" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "contentItemId" UUID NOT NULL REFERENCES "ContentItem"("id") ON DELETE CASCADE,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "embedding" vector(1536), -- OpenAI text-embedding-3-small

    -- Metadata for filtering
    "dateOccurred" DATE,
    "projectWeek" INTEGER,
    "planItemIds" UUID[] DEFAULT '{}',
    "contentTypeIds" UUID[] DEFAULT '{}',
    "activityTypeIds" UUID[] DEFAULT '{}',

    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_contentchunk_contentitem" ON "ContentChunk"("contentItemId");
CREATE INDEX "idx_contentchunk_embedding" ON "ContentChunk" USING ivfflat("embedding" vector_cosine_ops);
```

#### ActivityReport (Generated)

```sql
CREATE TABLE "ActivityReport" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "projectWeek" INTEGER,
    "reportData" JSONB NOT NULL, -- Full structured report
    "generatedByUserId" INTEGER REFERENCES "User"("id"),
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_activityreport_project" ON "ActivityReport"("projectId");
CREATE INDEX "idx_activityreport_period" ON "ActivityReport"("periodStart", "periodEnd");
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

// ============================================
// MULTITENANCY (from starter)
// ============================================

model User {
  id                       Int                @id @default(autoincrement())
  uuid                     String             @unique @default(uuid())
  email                    String             @unique
  passwordHash             String
  firstName                String?
  lastName                 String?
  avatarUrl                String?
  emailVerified            Boolean            @default(false)
  isActive                 Boolean            @default(true)
  lastLoginAt              DateTime?
  createdAt                DateTime           @default(now())
  updatedAt                DateTime           @updatedAt

  organizations            OrganizationUser[]
  refreshTokens            RefreshToken[]
  contentItems             ContentItem[]
  activityReports          ActivityReport[]
  planItemHistories        PlanItemHistory[]
}

model Organization {
  id          Int       @id @default(autoincrement())
  uuid        String    @unique @default(uuid())
  slug        String    @unique
  name        String
  description String?
  logoUrl     String?
  isPlatform  Boolean   @default(false)
  config      Json      @default("{}")
  isActive    Boolean   @default(true)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  users              OrganizationUser[]
  roles              Role[]
  projects           Project[]
  planItemTypes      PlanItemType[]
  contentTypes       ContentType[]
  activityItemTypes  ActivityItemType[]
}

model OrganizationUser {
  id             Int          @id @default(autoincrement())
  userId         Int
  organizationId Int
  roleId         Int
  isActive       Boolean      @default(true)
  joinedAt       DateTime     @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role         Role         @relation(fields: [roleId], references: [id])

  @@unique([userId, organizationId])
}

model Role {
  id             Int       @id @default(autoincrement())
  uuid           String    @unique @default(uuid())
  name           String
  slug           String
  description    String?
  level          Int       @default(10)
  isSystem       Boolean   @default(false)
  scope          String    @default("ORGANIZATION")
  organizationId Int?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization   Organization?      @relation(fields: [organizationId], references: [id])
  users          OrganizationUser[]
  permissions    RolePermission[]

  @@unique([organizationId, slug])
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  expiresAt DateTime
  userAgent String?
  ipAddress String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ============================================
// PROJECT MANAGEMENT
// ============================================

model Project {
  id             String    @id @default(uuid())
  organizationId Int
  name           String
  client         String?
  description    String?
  startDate      DateTime  @db.Date
  targetEndDate  DateTime? @db.Date
  status         String    @default("active")
  statusConfig   Json      @default("{}")
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization    Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  planItems       PlanItem[]
  contentItems    ContentItem[]
  activityReports ActivityReport[]

  @@unique([organizationId, name])
}

// ============================================
// PLAN HIERARCHY
// ============================================

model PlanItemType {
  id             String   @id @default(uuid())
  organizationId Int?
  name           String
  slug           String
  description    String?
  level          Int      // 1=workstream, 2=milestone, 3=activity, 4=task, 5=subtask
  icon           String?
  color          String?
  isSystem       Boolean  @default(false)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())

  organization Organization? @relation(fields: [organizationId], references: [id])
  planItems    PlanItem[]

  @@unique([organizationId, slug])
}

model PlanItem {
  id            String    @id @default(uuid())
  projectId     String
  parentId      String?
  itemTypeId    String

  name          String
  description   String?
  owner         String?
  status        String    @default("not_started")

  startDate       DateTime? @db.Date
  targetEndDate   DateTime? @db.Date
  actualStartDate DateTime? @db.Date
  actualEndDate   DateTime? @db.Date

  notes      String?
  references String[]  @default([]) // ContentItem IDs

  sortOrder Int     @default(0)
  path      String? // Materialized path
  depth     Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project  Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parent   PlanItem?    @relation("PlanItemHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children PlanItem[]   @relation("PlanItemHierarchy")
  itemType PlanItemType @relation(fields: [itemTypeId], references: [id])
  history  PlanItemHistory[]

  @@index([projectId])
  @@index([parentId])
  @@index([path])
  @@index([status])
}

model PlanItemHistory {
  id               String   @id @default(uuid())
  planItemId       String
  fieldChanged     String
  oldValue         String?
  newValue         String?
  changeReason     String?
  sourceContentIds String[] @default([])
  changedBy        String?  // 'user' or 'plan_updater_agent'
  changedByUserId  Int?
  createdAt        DateTime @default(now())

  planItem PlanItem @relation(fields: [planItemId], references: [id], onDelete: Cascade)
  user     User?    @relation(fields: [changedByUserId], references: [id])

  @@index([planItemId])
}

// ============================================
// CONTENT MANAGEMENT
// ============================================

model ContentType {
  id             String   @id @default(uuid())
  organizationId Int?
  name           String
  slug           String
  description    String?
  icon           String?
  color          String?
  isSystem       Boolean  @default(false)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())

  organization Organization? @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, slug])
}

model ActivityItemType {
  id             String   @id @default(uuid())
  organizationId Int?
  name           String
  slug           String
  description    String?
  icon           String?
  color          String?
  isSystem       Boolean  @default(false)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())

  organization Organization? @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, slug])
}

model ContentItem {
  id              String   @id @default(uuid())
  projectId       String

  planItemIds     String[] @default([])
  contentTypeIds  String[] @default([])
  activityTypeIds String[] @default([])

  sourceType      String   // file, text, calendar, transcript, email
  title           String
  dateOccurred    DateTime @db.Date
  projectWeek     Int?
  tags            String[] @default([])

  rawContent      String?
  fileReference   String?
  fileName        String?
  fileSize        Int?
  mimeType        String?

  aiSummary             String?
  aiExtractedEntities   Json     @default("{}")
  processingStatus      String   @default("pending")

  parentItemId    String?
  createdBy       String   @default("user")
  createdByUserId Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project    Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parent     ContentItem?   @relation("ContentItemSplit", fields: [parentItemId], references: [id])
  children   ContentItem[]  @relation("ContentItemSplit")
  user       User?          @relation(fields: [createdByUserId], references: [id])
  chunks     ContentChunk[]

  @@index([projectId])
  @@index([dateOccurred])
  @@index([projectWeek])
}

model ContentChunk {
  id              String                   @id @default(uuid())
  contentItemId   String
  chunkIndex      Int
  content         String
  tokenCount      Int?
  embedding       Unsupported("vector(1536)")?

  dateOccurred    DateTime?                @db.Date
  projectWeek     Int?
  planItemIds     String[]                 @default([])
  contentTypeIds  String[]                 @default([])
  activityTypeIds String[]                 @default([])

  createdAt       DateTime                 @default(now())

  contentItem ContentItem @relation(fields: [contentItemId], references: [id], onDelete: Cascade)

  @@index([contentItemId])
}

// ============================================
// REPORTING
// ============================================

model ActivityReport {
  id                String   @id @default(uuid())
  projectId         String
  periodStart       DateTime @db.Date
  periodEnd         DateTime @db.Date
  projectWeek       Int?
  reportData        Json
  generatedByUserId Int?
  createdAt         DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [generatedByUserId], references: [id])

  @@index([projectId])
  @@index([periodStart, periodEnd])
}
```

---

## Frontend Design System

### Design Principles

1. **Clean & Professional** - No clutter, clear hierarchy
2. **Consistent Spacing** - 8px base unit system
3. **Muted Colors** - Professional palette, not too flashy
4. **Clear Typography** - Inter font, good readability
5. **Purposeful Animation** - Subtle, not distracting

### Color Palette

```css
/* Primary - Deep Blue */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-900: #1e3a8a;

/* Neutral - Slate */
--neutral-50: #f8fafc;
--neutral-100: #f1f5f9;
--neutral-200: #e2e8f0;
--neutral-300: #cbd5e1;
--neutral-400: #94a3b8;
--neutral-500: #64748b;
--neutral-600: #475569;
--neutral-700: #334155;
--neutral-800: #1e293b;
--neutral-900: #0f172a;

/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* Plan Status Colors */
--status-not-started: #94a3b8;
--status-in-progress: #3b82f6;
--status-on-hold: #f59e0b;
--status-completed: #10b981;
--status-blocked: #ef4444;
--status-cancelled: #6b7280;
```

### Typography

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Component Styles

```css
/* Cards */
.card {
  background: white;
  border-radius: 12px;
  border: 1px solid var(--neutral-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Buttons */
.btn-primary {
  background: var(--primary-600);
  color: white;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  transition: background 150ms;
}
.btn-primary:hover {
  background: var(--primary-700);
}

/* Inputs */
.input {
  border: 1px solid var(--neutral-300);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: var(--text-sm);
  transition: border-color 150ms, box-shadow 150ms;
}
.input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Status Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 500;
}
```

---

## Page Designs

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Logo]  AI Project Manager          [Project ▼]  [Org ▼]  [User ▼] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TABS                                                                 │  │
│  │  ┌────────┐ ┌────────┐ ┌────────────┐ ┌────────┐ ┌────────┐         │  │
│  │  │  Plan  │ │ Intake │ │  Activity  │ │ Admin  │ │Settings│         │  │
│  │  │ Agent  │ │ Agent  │ │  Reporter  │ │        │ │        │         │  │
│  │  └────────┘ └────────┘ └────────────┘ └────────┘ └────────┘         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │                         MAIN CONTENT AREA                            │  │
│  │                                                                       │  │
│  │                         (Tab-specific content)                        │  │
│  │                                                                       │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tab 1: Plan Agent

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PLAN AGENT                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Sub-tabs ───────────────────────────────────────────────────────────┐  │
│  │  [Plan View]  [Import CSV]  [Plan Updater]                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════    │
│  PLAN VIEW SUB-TAB                                                          │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Project Alpha                                     [+ Add Item] [⋮]  │   │
│  │  Client: Acme Corp  |  Started: Jan 1, 2025  |  Week 5              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ▼ Backend Development                                              │   │
│  │    ┌────────────────────────────────────────────────────────────┐   │   │
│  │    │ ● In Progress  │  Owner: John  │  Jan 1 - Feb 15  │  60%   │   │   │
│  │    └────────────────────────────────────────────────────────────┘   │   │
│  │    │                                                                │   │
│  │    ├── ▼ API Launch (Milestone)                                     │   │
│  │    │     ├── API Integration          ✓ Completed                  │   │
│  │    │     │     ├── Build payment endpoint    ✓ Completed           │   │
│  │    │     │     ├── Build user endpoint       ✓ Completed           │   │
│  │    │     │     └── Integration testing       ✓ Completed           │   │
│  │    │     │                                                          │   │
│  │    │     └── Database Design          ● In Progress                │   │
│  │    │           ├── Schema design            ✓ Completed            │   │
│  │    │           ├── Migration scripts        ● In Progress          │   │
│  │    │           └── Performance testing      ○ Not Started          │   │
│  │    │                                                                │   │
│  │    └── Data Migration (Milestone)     ○ Not Started                │   │
│  │                                                                      │   │
│  │  ▶ Frontend Development               ○ Not Started                 │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════    │
│  PLAN UPDATER SUB-TAB                                                       │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  ┌─ Activity Report Input ─────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Period:  [This Week ▼]   or   From [Jan 13] to [Jan 17]           │   │
│  │                                                                      │   │
│  │  [Load Activity & Suggest Updates]                                   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─ Suggested Updates ─────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Based on activity from Jan 13-17, I suggest:                       │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  ☑  Build payment endpoint                                    │   │   │
│  │  │      Status: In Progress → Completed                          │   │   │
│  │  │      Evidence: "Payment endpoint deployed to staging" (Jan 15)│   │   │
│  │  │      [View Evidence]                                          │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  ☑  API Integration                                           │   │   │
│  │  │      Status: In Progress → Completed (all tasks done)         │   │   │
│  │  │      Evidence: Derived from child completions                 │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  ⚠  NEW RISK DETECTED                                         │   │   │
│  │  │      "Client IT delays may impact staging timeline"           │   │   │
│  │  │      Suggest: Add to Database Design notes                    │   │   │
│  │  │      [Add as Note]  [Ignore]                                  │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Apply Selected Updates]                      [Edit Before Applying]       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tab 2: Intake Agent

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INTAKE AGENT                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Content Intake Form ───────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ── Link to Plan (optional) ──                                      │   │
│  │                                                                      │   │
│  │  Workstream    [▼ Select workstream(s)           ]                  │   │
│  │  Activity      [▼ Select activity (filtered)     ]                  │   │
│  │  Task          [▼ Select task (filtered)         ]                  │   │
│  │                                                                      │   │
│  │  ── Content Details ──                                              │   │
│  │                                                                      │   │
│  │  Content Type  [▼ Meeting ☑  Document ☐  Email ☐  Note ☐ ]         │   │
│  │  Activity Type [▼ Status Update ☐  Action Item ☐  Risk ☐ ]         │   │
│  │                                                                      │   │
│  │  Date *        [ Jan 15, 2025         📅 ]                          │   │
│  │                                                                      │   │
│  │  Tags          [ Add tags...                      ]                  │   │
│  │                                                                      │   │
│  │  ── Content ──                                                      │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                              │   │   │
│  │  │                                                              │   │   │
│  │  │         📄 Drop files here or paste text                     │   │   │
│  │  │                                                              │   │   │
│  │  │         Supported: PDF, DOCX, TXT, MD                       │   │   │
│  │  │         Or paste text directly                              │   │   │
│  │  │                                                              │   │   │
│  │  │         [Browse Files]                                       │   │   │
│  │  │                                                              │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  [Submit for Analysis]                                               │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─ AI Analysis ───────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  🤖 Analysis Complete                                               │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │  Detected: Meeting notes from Jan 15, 2025                 │     │   │
│  │  │                                                            │     │   │
│  │  │  You labeled: Meeting                                      │     │   │
│  │  │                                                            │     │   │
│  │  │  I also detected:                                          │     │   │
│  │  │    • 2 Status Updates                                      │     │   │
│  │  │    • 3 Action Items                                        │     │   │
│  │  │    • 1 Risk                                                │     │   │
│  │  │                                                            │     │   │
│  │  │  Plan linking suggestion:                                  │     │   │
│  │  │    → Activity: API Integration (high confidence)           │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │  📦 Recommended Items to Create:                           │     │   │
│  │  │                                                            │     │   │
│  │  │  ☑ Meeting (full notes)                                    │     │   │
│  │  │  ☑ Status Update: "Payment endpoint deployed"              │     │   │
│  │  │  ☑ Status Update: "Schema design completed"                │     │   │
│  │  │  ☑ Action Item: "Send API docs to client" (John, Jan 20)   │     │   │
│  │  │  ☑ Action Item: "Schedule perf testing" (Sarah, Jan 25)    │     │   │
│  │  │  ☑ Action Item: "Review security reqs" (John, Jan 22)      │     │   │
│  │  │  ☑ Risk: "Client IT delays may impact timeline"            │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  [Accept All]    [Edit Suggestions]    [Just Store Raw]             │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tab 3: Activity Reporter

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ACTIVITY REPORTER                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Report Parameters ─────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Period:   [This Week ▼]    or    From [        ] to [        ]    │   │
│  │                                                                      │   │
│  │  Filter:   [All Workstreams ▼]    [All Activity Types ▼]           │   │
│  │                                                                      │   │
│  │  [Generate Report]                                                   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─ Activity Report: Jan 13-17, 2025 (Week 5) ─────────────────────────┐   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │  📊 SUMMARY                                                 │     │   │
│  │  │                                                            │     │   │
│  │  │  Significant progress on Backend Development. API          │     │   │
│  │  │  Integration activity completed ahead of schedule.         │     │   │
│  │  │  Database design ongoing with one identified risk.         │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  ── STATUS UPDATES (4) ──────────────────────────────────────────   │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │  ✓ Payment endpoint deployed to staging                    │     │   │
│  │  │    Task: Build payment endpoint  |  Jan 15  |  High conf.  │     │   │
│  │  │    [View Source]                                           │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │  ✓ User endpoint integration testing passed                │     │   │
│  │  │    Task: Build user endpoint  |  Jan 16  |  High conf.     │     │   │
│  │  │    [View Source]                                           │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  ── ACTION ITEMS (3) ────────────────────────────────────────────   │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │  □ Send API documentation to client                        │     │   │
│  │  │    Owner: John  |  Due: Jan 20  |  Activity: API Integration│    │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  ── RISKS (1) ───────────────────────────────────────────────────   │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │  ⚠ Client IT delays may impact staging timeline            │     │   │
│  │  │    Severity: Medium  |  Activity: Database Design  |  Jan 15│    │   │
│  │  │    [View Source]                                           │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  ── DECISIONS (1) ───────────────────────────────────────────────   │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │  ✓ Using JWT for API authentication                        │     │   │
│  │  │    Activity: API Integration  |  Jan 14                    │     │   │
│  │  │    Rationale: Simpler for this use case                    │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Export Markdown]  [Export PowerPoint]  [Send to Plan Updater]            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tab 4: Admin Configuration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN CONFIGURATION                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Sub-tabs ───────────────────────────────────────────────────────────┐  │
│  │  [Projects]  [Plan Item Types]  [Content Types]  [Activity Types]    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════    │
│  PROJECTS SUB-TAB                                                           │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  [+ New Project]                                          🔍 Search...     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Name            Client       Start Date   Status    Actions         │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  Project Alpha   Acme Corp    Jan 1, 2025  Active    [Edit] [View]   │  │
│  │  Project Beta    TechStart    Feb 1, 2025  Active    [Edit] [View]   │  │
│  │  Project Gamma   BigBank      Mar 1, 2025  Planning  [Edit] [View]   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════    │
│  CONTENT TYPES SUB-TAB                                                      │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  [+ New Content Type]                                                       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Name          Slug          Description              System  Active │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  Meeting       meeting       Meeting notes...         ✓       ✓      │  │
│  │  Document      document      Documents, specs...      ✓       ✓      │  │
│  │  Email         email         Email threads...         ✓       ✓      │  │
│  │  Note          note          Quick notes...           ✓       ✓      │  │
│  │  Transcript    transcript    Call transcripts...      ✓       ✓      │  │
│  │  Client Call   client_call   Client call notes        ✗       ✓  [⋮] │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════    │
│  ACTIVITY TYPES SUB-TAB                                                     │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  [+ New Activity Type]                                                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Name              Slug              Description          System     │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  Status Update     status_update     Progress or state...  ✓         │  │
│  │  Action Item       action_item       Task to be done       ✓         │  │
│  │  Risk              risk              Potential issue       ✓         │  │
│  │  Decision          decision          Decision made         ✓         │  │
│  │  Blocker           blocker           Blocking progress     ✓         │  │
│  │  Milestone Update  milestone_update  Milestone progress    ✓         │  │
│  │  Dependency        dependency        External dep          ✓         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List org projects |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Soft delete project |

### Plan Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/plan` | Get full plan tree |
| GET | `/api/plan-items/:id` | Get single item |
| POST | `/api/plan-items` | Create plan item |
| PUT | `/api/plan-items/:id` | Update plan item |
| DELETE | `/api/plan-items/:id` | Delete plan item |
| POST | `/api/projects/:id/plan/import` | Import CSV |
| GET | `/api/plan-items/:id/history` | Get item history |

### Content Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/content` | List content items |
| GET | `/api/content-items/:id` | Get single item |
| POST | `/api/content-items` | Create content item |
| POST | `/api/content-items/analyze` | Analyze & suggest |
| PUT | `/api/content-items/:id` | Update content item |
| DELETE | `/api/content-items/:id` | Delete content item |

### Activity Reporter

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:id/activity-report` | Generate report |
| GET | `/api/projects/:id/activity-reports` | List past reports |
| GET | `/api/activity-reports/:id` | Get specific report |

### Plan Updater

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:id/plan-suggestions` | Get update suggestions |
| POST | `/api/plan-items/bulk-update` | Apply multiple updates |

### Output Formatter

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/format/markdown` | Format as markdown |
| POST | `/api/format/pptx` | Format as PowerPoint |

### Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/plan-item-types` | List plan item types |
| POST | `/api/config/plan-item-types` | Create type |
| PUT | `/api/config/plan-item-types/:id` | Update type |
| GET | `/api/config/content-types` | List content types |
| POST | `/api/config/content-types` | Create type |
| PUT | `/api/config/content-types/:id` | Update type |
| GET | `/api/config/activity-types` | List activity types |
| POST | `/api/config/activity-types` | Create type |
| PUT | `/api/config/activity-types/:id` | Update type |

---

## AI Integration

### OpenAI Configuration

```typescript
// config/ai.ts
export const aiConfig = {
  model: 'gpt-4-turbo-preview',
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  maxTokens: 4096,
  temperature: 0.3, // Lower for more consistent extraction
};
```

### Agent Prompts

#### Intake Agent Prompt

```
You are an expert project management assistant. Your job is to analyze content
submitted by a consultant and:

1. Identify what type of content this is (meeting notes, document, email, etc.)
2. Extract any status updates mentioned
3. Extract any action items with owners and due dates
4. Identify any risks or blockers mentioned
5. Identify any decisions that were made
6. Suggest which plan items this content relates to

Be specific and extract actual quotes where possible. Format your response as JSON.
```

#### Activity Reporter Prompt

```
You are an expert activity report generator. Given a set of content items from
a specific time period, generate a comprehensive activity report that includes:

1. Executive summary (2-3 sentences)
2. Status updates with specific progress
3. Action items with owners and due dates
4. Risks identified with severity
5. Decisions made with rationale
6. Suggested status changes for plan items

Be very specific. Every item must link back to source content. Include confidence
levels for your extractions. Format as JSON matching the ActivityReport schema.
```

#### Plan Updater Prompt

```
You are an expert project plan analyst. Given an activity report and the current
plan structure, suggest updates to the plan:

1. Status changes (with evidence)
2. New notes to add
3. Date adjustments if implied
4. Rollup completions (if all children done, suggest parent complete)

Be conservative - only suggest changes with clear evidence. Never fabricate.
Format suggestions as JSON with source references.
```

---

## Implementation Phases

### Phase 1: Foundation (MVP)

**Goal**: Basic working system with manual features

- [ ] Project setup (copy multitenancy starter)
- [ ] Database schema implementation
- [ ] Project CRUD
- [ ] Plan item CRUD with hierarchy
- [ ] Plan CSV import (no AI)
- [ ] Basic plan view UI
- [ ] Content item CRUD (manual entry)
- [ ] Basic intake form UI

### Phase 2: AI Integration

**Goal**: Add AI-powered features

- [ ] OpenAI integration setup
- [ ] Content analysis (Intake Agent)
- [ ] Chunking and embedding pipeline
- [ ] Activity report generation
- [ ] Plan update suggestions
- [ ] RAG search implementation

### Phase 3: Output & Polish

**Goal**: Complete the experience

- [ ] Markdown export
- [ ] PowerPoint export
- [ ] Admin configuration UI
- [ ] File upload support (PDF, DOCX)
- [ ] UI polish and animations
- [ ] Error handling improvements

### Phase 4: Advanced Features

**Goal**: Future enhancements

- [ ] Calendar integration (Google, Outlook)
- [ ] Slack integration
- [ ] Email ingestion
- [ ] Proactive data collection
- [ ] Custom report templates
- [ ] Team collaboration features

---

## File Structure

```
AIProjectManager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts
│   │   │   ├── database.ts
│   │   │   └── ai.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── orgContext.ts
│   │   │   └── rbac.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── organizations/
│   │   │   ├── projects/
│   │   │   │   ├── projects.controller.ts
│   │   │   │   ├── projects.service.ts
│   │   │   │   ├── projects.routes.ts
│   │   │   │   └── projects.schema.ts
│   │   │   ├── plan-items/
│   │   │   ├── content-items/
│   │   │   ├── activity-reporter/
│   │   │   ├── plan-updater/
│   │   │   ├── output-formatter/
│   │   │   └── config/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── openai.service.ts
│   │   │   │   ├── embedding.service.ts
│   │   │   │   └── prompts/
│   │   │   ├── file-processing/
│   │   │   │   ├── pdf.service.ts
│   │   │   │   └── docx.service.ts
│   │   │   └── email/
│   │   ├── utils/
│   │   └── types/
│   ├── app.ts
│   ├── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── projects.api.ts
│   │   │   ├── plan-items.api.ts
│   │   │   ├── content-items.api.ts
│   │   │   └── reports.api.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── projectStore.ts
│   │   │   └── uiStore.ts
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn components
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── TabNavigation.tsx
│   │   │   │   └── ProjectSwitcher.tsx
│   │   │   ├── plan/
│   │   │   │   ├── PlanTree.tsx
│   │   │   │   ├── PlanItemCard.tsx
│   │   │   │   ├── PlanImport.tsx
│   │   │   │   └── PlanUpdater.tsx
│   │   │   ├── intake/
│   │   │   │   ├── IntakeForm.tsx
│   │   │   │   ├── ContentDropzone.tsx
│   │   │   │   └── AISuggestions.tsx
│   │   │   ├── reporter/
│   │   │   │   ├── ReportGenerator.tsx
│   │   │   │   ├── ActivityReport.tsx
│   │   │   │   └── ReportExport.tsx
│   │   │   ├── admin/
│   │   │   │   ├── ProjectsManager.tsx
│   │   │   │   ├── TypesManager.tsx
│   │   │   │   └── ConfigTabs.tsx
│   │   │   └── common/
│   │   │       ├── StatusBadge.tsx
│   │   │       ├── DatePicker.tsx
│   │   │       ├── MultiSelect.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── plan/
│   │   │   │   └── PlanPage.tsx
│   │   │   ├── intake/
│   │   │   │   └── IntakePage.tsx
│   │   │   ├── reporter/
│   │   │   │   └── ReporterPage.tsx
│   │   │   ├── admin/
│   │   │   │   └── AdminPage.tsx
│   │   │   └── settings/
│   │   │       └── SettingsPage.tsx
│   │   ├── hooks/
│   │   │   ├── useProject.ts
│   │   │   ├── usePlanItems.ts
│   │   │   └── useContentItems.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── SPEC.md
├── README.md
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- OpenAI API key

### Setup

```bash
# Clone and setup
cd AIProjectManager

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and OpenAI key
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
# Backend .env
DATABASE_URL="postgresql://user:pass@localhost:5432/aipm"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
OPENAI_API_KEY="sk-..."

# Frontend .env
VITE_API_URL="/api"
```

---

## Summary

This spec defines a multi-tenant AI-powered project management and status reporting tool with:

- **4 Main Agent Pages**: Plan, Intake, Activity Reporter, Admin
- **AI-Powered Features**: Content analysis, activity extraction, plan suggestions
- **RAG Architecture**: Embeddings stored in pgvector for semantic search
- **Clean Design System**: Professional UI with shadcn/ui and Tailwind
- **Extensible Types**: Configurable content types, activity types, plan item types
- **Multi-Tenant**: Organization-based isolation from starter kit

The system is designed to minimize manual data entry by letting users dump content and having AI organize, analyze, and report on it.
