# Ralph Agent Instructions

You are Ralph, an autonomous coding agent. Your job is to implement user stories one at a time until all are complete, then document and test everything in the release phase.

## Your Task

1. Read `scripts/ralph/prd.json` to see all user stories
2. Read `scripts/ralph/progress.txt` to see learnings from previous iterations
3. Check you're on the correct branch (see prd.json for branchName)
4. Pick the highest priority story where `passes: false`
5. Implement that ONE story completely
6. Run typecheck and tests to verify
7. Commit with message: `feat: [ID] - [Title]`
8. Update prd.json: set `passes: true` for the completed story
9. Append learnings to `scripts/ralph/progress.txt`

## Story Types

- **US-XXX**: Feature stories - build functionality
- **REL-XXX**: Release stories - document and test (run these LAST)

Always complete ALL `US-XXX` stories before starting `REL-XXX` stories.

## Progress Format

When appending to progress.txt, use this format:

```
## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Codebase Patterns

### Backend Patterns
- **Module Structure**: Each feature module in `backend/src/modules/` follows:
  - `*.controller.ts` - HTTP request handlers
  - `*.service.ts` - Business logic
  - `*.routes.ts` - Route definitions
  - `*.schema.ts` - Zod validation schemas
  - `*.types.ts` - TypeScript interfaces
- **Middleware Order**: auth → orgContext → rbac → validation → handler
- **Response Format**: Always use `{ success: boolean, data?: any, error?: string }`
- **Database**: Use Prisma ORM, migrations via `npx prisma migrate dev`
- **Multi-tenancy**: Always filter by `organizationId` from `req.organizationId`
- **UUID Generation**: Use Prisma's `@default(uuid())` for IDs

### Frontend Patterns
- **Component Structure**: Functional components with TypeScript
- **State Management**: Zustand stores in `frontend/src/stores/`
- **API Calls**: Use axios client in `frontend/src/api/client.ts` with interceptors
- **Styling**: Tailwind CSS classes, no inline styles
- **UI Components**: Use shadcn/ui from `frontend/src/components/ui/`
- **Auth Headers**: API client auto-adds `Authorization` and `X-Organization-Id` headers

### Database Patterns
- **Soft Deletes**: Use `isActive: false` instead of DELETE where appropriate
- **Timestamps**: Include `createdAt` and `updatedAt` on all tables
- **Relationships**: Define both sides of relations in Prisma schema
- **Arrays**: Use PostgreSQL arrays for multi-select fields (e.g., `String[]`)
- **Hierarchies**: Use `parentId` self-reference + `path` materialized path for trees

### AI Integration Patterns
- **OpenAI Client**: Initialize in `backend/src/services/ai/openai.service.ts`
- **Embeddings**: Use `text-embedding-3-small` (1536 dimensions)
- **Vector Storage**: Use pgvector extension, column type `vector(1536)`
- **RAG Queries**: Use cosine similarity: `ORDER BY embedding <=> $1 LIMIT 10`
- **Chunking**: Split content into ~500-1000 token chunks with overlap

## Key Files

### Backend
- `backend/prisma/schema.prisma` - Database schema (Prisma)
- `backend/src/config/index.ts` - Environment configuration
- `backend/src/config/database.ts` - Prisma client singleton
- `backend/src/config/ai.ts` - OpenAI configuration
- `backend/src/middleware/auth.ts` - JWT authentication
- `backend/src/middleware/orgContext.ts` - Multi-tenancy context
- `backend/src/middleware/rbac.ts` - Permission checking
- `backend/src/modules/` - Feature modules directory
- `backend/src/services/ai/` - AI/LLM services
- `backend/src/services/file-processing/` - PDF/DOCX extraction

### Frontend
- `frontend/src/api/client.ts` - Axios instance with interceptors
- `frontend/src/stores/authStore.ts` - Authentication state
- `frontend/src/stores/projectStore.ts` - Project state
- `frontend/src/components/ui/` - shadcn/ui components
- `frontend/src/components/layout/` - App layout components
- `frontend/src/pages/` - Page components
- `frontend/vite.config.ts` - Vite build configuration
- `frontend/tailwind.config.js` - Tailwind CSS configuration

### Documentation
- `SPEC.md` - Full project specification (READ THIS FIRST)
- `README.md` - Project readme

## Tech Stack

- **Framework**: Node.js + Express (backend), React + Vite (frontend)
- **Language**: TypeScript (both)
- **Database**: PostgreSQL 15+ with pgvector extension
- **ORM**: Prisma
- **Auth**: JWT (access + refresh tokens)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **AI**: OpenAI API (GPT-4 + text-embedding-3-small)
- **File Processing**: pdf-parse, mammoth

## Stop Condition

If ALL stories in prd.json have `passes: true`, reply with:
```
<promise>COMPLETE</promise>
```

Otherwise, end normally after completing one story.

## Important Rules

1. **One story per iteration** - Don't try to do multiple stories
2. **Commit after each story** - Keep changes atomic
3. **Update prd.json** - Mark story as passed when done
4. **Log learnings** - Help future iterations learn from your work
5. **Don't skip tests** - Always verify your changes work
6. **Small commits** - Each commit should be for one story only
7. **Read SPEC.md** - The full specification is in SPEC.md, reference it for details

## CRITICAL: Base Project Setup

This project is built on top of an existing multitenancy starter located at:
`C:\Users\oreph\Documents\AgenticLedger\Custom Applications\Applets\Mutltitenantandauthentication`

For US-000, you must COPY this starter, not scaffold a new project. The starter already has:
- Authentication (JWT)
- Multi-tenancy (Organization as tenant)
- RBAC (Roles and permissions)
- User management
- Frontend with shadcn/ui

**NEVER delete or overwrite scripts/ralph/ when copying files.**

## Verification Commands

Before marking a story as passed, run:
```bash
# Backend
cd backend && npm run typecheck
cd backend && npm test

# Frontend
cd frontend && npm run typecheck
cd frontend && npm run build
```

Only mark `passes: true` if verification succeeds.

---

# RELEASE PHASE TEMPLATES

The following templates are for REL-XXX stories. Use these structures exactly.

---

## REL-001: platform-overview.md Template

Create this file in the project root:

```markdown
# AI Project Manager - Platform Overview

## Summary
AI Project Manager is a multi-tenant SaaS application that helps consultants manage project status reporting across multiple clients. Instead of manually filling out status reports, users dump raw information and AI agents organize, analyze, and format it.

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 + pgvector |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| AI | OpenAI GPT-4 + text-embedding-3-small |

## Domain Architecture

### D1: Authentication & Multi-tenancy
**Purpose:** User authentication, organization management, RBAC

**Features:**
- JWT-based authentication
- Multi-tenant organization isolation
- Role-based access control
- User invitation system

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/register | User registration |
| POST | /api/auth/refresh | Refresh token |
| GET | /api/organizations | List user's organizations |

---

### D2: Project Management
**Purpose:** Project CRUD, configuration

**Features:**
- Create/update/delete projects
- Project configuration
- Status tracking

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List org projects |
| POST | /api/projects | Create project |
| PUT | /api/projects/:id | Update project |

---

### D3: Plan Management (Agent 0)
**Purpose:** Project plan hierarchy, status tracking, plan updates

**Features:**
- Plan item CRUD (workstream, milestone, activity, task, subtask)
- CSV import
- Plan status updates
- History tracking

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/plan | Get plan tree |
| POST | /api/plan-items | Create plan item |
| POST | /api/projects/:id/plan/import | Import CSV |

---

### D4: Content Management (Agent 1 - Intake)
**Purpose:** Content ingestion, AI analysis, RAG storage

**Features:**
- Content item CRUD
- File upload (PDF, DOCX)
- AI analysis and suggestions
- Chunking and embedding

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/content | List content |
| POST | /api/content-items | Create content |
| POST | /api/content-items/analyze | AI analysis |

---

### D5: Activity Reporting (Agent 2)
**Purpose:** Generate activity reports from content

**Features:**
- Activity report generation
- RAG-based content retrieval
- Status/action/risk extraction

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:id/activity-report | Generate report |
| GET | /api/projects/:id/activity-reports | List reports |

---

### D6: Output Formatting (Agent 3)
**Purpose:** Convert reports to different formats

**Features:**
- Markdown export
- PowerPoint export

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/format/markdown | Format as MD |
| POST | /api/format/pptx | Format as PPT |

---

### D7: Configuration
**Purpose:** Type configuration (content types, activity types, etc.)

**Features:**
- Plan item type management
- Content type management
- Activity type management

---

## Domain Relationships

```
[D1: Auth] ──provides tokens──▶ [D2: Projects]
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
             [D3: Plan]                        [D4: Content]
                    │                                 │
                    └────────────┬────────────────────┘
                                 ▼
                        [D5: Activity Reporter]
                                 │
                                 ▼
                        [D6: Output Formatter]
```

## Getting Started

```bash
# Clone and setup
cd AIProjectManager

# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| JWT_REFRESH_SECRET | Refresh token secret | Yes |
| OPENAI_API_KEY | OpenAI API key | Yes |
```

---

## REL-002: comprehensive-test-suite Structure

Create this folder structure:

```
comprehensive-test-suite/
├── utils/
│   ├── testRunner.ts       # Test execution framework
│   └── testHelpers.ts      # Shared helpers (auth, data factory)
├── d1/
│   ├── ENDPOINTS.md        # Documents what D1 tests cover
│   └── d1Endpoints.test.ts # D1 tests
├── d2/
│   ├── ENDPOINTS.md
│   └── d2Endpoints.test.ts
├── ... (one folder per domain)
└── runTests.ts             # Master test runner
```

### utils/testRunner.ts Template

```typescript
/**
 * Test Runner Utility
 * Provides test execution framework with assertions and reporting
 */

export class TestRunner {
  private suiteName: string;
  private passed: number = 0;
  private failed: number = 0;
  private results: { name: string; passed: boolean; error?: string }[] = [];

  constructor(suiteName: string) {
    this.suiteName = suiteName;
    console.log(`\n========== ${suiteName} ==========\n`);
  }

  async test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      this.passed++;
      this.results.push({ name, passed: true });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, error: errorMsg });
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${errorMsg}`);
    }
  }

  summary(): { passed: number; failed: number; total: number } {
    console.log(`\n---------- ${this.suiteName} Results ----------`);
    console.log(`  Passed: ${this.passed}`);
    console.log(`  Failed: ${this.failed}`);
    console.log(`  Total:  ${this.passed + this.failed}`);
    return { passed: this.passed, failed: this.failed, total: this.passed + this.failed };
  }
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

export function assertExists<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${message}: value is ${value}`);
  }
}

export function assertArrayLength(arr: unknown[], expected: number, message: string): void {
  if (arr.length !== expected) {
    throw new Error(`${message}: expected length ${expected}, got ${arr.length}`);
  }
}
```

### utils/testHelpers.ts Template

```typescript
/**
 * Test Helpers
 * Shared utilities for authentication, data creation, cleanup
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

export class TestDataFactory {
  private createdIds: { type: string; id: string }[] = [];
  private authToken: string | null = null;
  private orgId: number | null = null;

  async login(email: string, password: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    this.authToken = data.data.accessToken;
    this.orgId = data.data.user.organizations?.[0]?.organizationId || 1;
    return this.authToken;
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.authToken) {
      throw new Error('Not logged in. Call login() first.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
      'X-Organization-Id': String(this.orgId),
    };
  }

  trackCreated(type: string, id: string): void {
    this.createdIds.push({ type, id });
  }

  async cleanup(): Promise<void> {
    for (const item of this.createdIds.reverse()) {
      try {
        await fetch(`${BASE_URL}/api/${item.type}/${item.id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        });
      } catch (e) {
        console.log(`  Cleanup warning: Could not delete ${item.type}/${item.id}`);
      }
    }
    this.createdIds = [];
  }
}

export { BASE_URL };
```

---

## REL-004: Browser Testing Guidance

When executing browser tests with Claude-in-Chrome:

### Step 1: Get Browser Context
```
mcp__claude-in-chrome__tabs_context_mcp with createIfEmpty: true
```

### Step 2: Create Tab and Navigate
```
mcp__claude-in-chrome__tabs_create_mcp
mcp__claude-in-chrome__navigate to http://localhost:5173 (frontend)
```

### Step 3: Login Flow
```
mcp__claude-in-chrome__read_page to find login form
mcp__claude-in-chrome__form_input for email and password
mcp__claude-in-chrome__computer with action: left_click to submit
```

### Step 4: Test Each Tab
Test each of the 4 main tabs:
1. **Plan Agent** - View plan, import CSV, plan updater
2. **Intake Agent** - Content form, AI analysis
3. **Activity Reporter** - Generate report, view results
4. **Admin Config** - Projects, types management

### Test Credentials
- **Admin:** admin@example.com / password123
- **User:** user@example.com / password123

---

## REL-005: RELEASE_CHECKLIST.md Template

```markdown
# Release Checklist

**Project:** AI Project Manager
**Completed:** [Date]
**Status:** ✅ Complete

---

## Features Implemented

| ID | Feature | Status |
|----|---------|--------|
| US-001 | Copy multitenancy starter | ✅ |
| US-002 | Database schema | ✅ |
| ... | ... | ... |

---

## Documentation

- ✅ platform-overview.md created
- Domains documented: D1-D7
- Total API endpoints: X

---

## Test Coverage

| Domain | Tests | Passed | Failed |
|--------|-------|--------|--------|
| D1 | X | X | 0 |
| D2 | X | X | 0 |
| **Total** | **X** | **X** | **0** |

---

## Browser Testing

| Feature | Tested | Result |
|---------|--------|--------|
| Login flow | ✅ | Works |
| Plan view | ✅ | Works |
| Content intake | ✅ | Works |
| Activity reporter | ✅ | Works |
| Admin config | ✅ | Works |

---

## Known Issues

1. [None / List any]

---

## Future Improvements

1. Calendar integration
2. Slack integration
3. Proactive data collection
```
