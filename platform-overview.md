# AI Project Manager - Platform Overview

## Summary

AI Project Manager is a multi-tenant SaaS application that helps consultants manage project status reporting across multiple clients. Instead of manually filling out status reports, users dump raw information and AI agents organize, analyze, and format it.

**Core Philosophy**: You do the work, dump stuff to the system, and AI figures out how to apply it to your project and reporting.

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
| File Processing | pdf-parse, mammoth |

---

## Domain Architecture

### D1: Authentication & Multi-tenancy

**Purpose:** User authentication, organization management, RBAC

**Features:**
- JWT-based authentication (access + refresh tokens)
- Multi-tenant organization isolation
- Role-based access control (RBAC)
- User invitation system
- Password reset and email verification

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | User logout |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password with token |
| POST | /api/auth/verify-email | Verify email address |
| POST | /api/auth/change-password | Change password (authenticated) |
| GET | /api/auth/me | Get current user info |
| GET | /api/organizations | List user's organizations |
| POST | /api/organizations | Create organization |
| PUT | /api/organizations/:id | Update organization |
| GET | /api/users | List org users |
| POST | /api/invitations | Invite user to organization |

**Key Files:**
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/middleware/orgContext.ts`
- `backend/src/middleware/rbac.ts`
- `frontend/src/stores/authStore.ts`

---

### D2: Project Management

**Purpose:** Project CRUD, configuration, and organization

**Features:**
- Create/update/delete projects
- Project status tracking (active, on_hold, completed, cancelled)
- Project configuration (status config JSONB)
- Soft delete support
- Organization-scoped isolation

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List org projects |
| GET | /api/projects/:id | Get project details |
| POST | /api/projects | Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Soft delete project |
| GET | /api/projects/:id/dashboard | Get project dashboard stats |

**Key Files:**
- `backend/src/modules/projects/projects.controller.ts`
- `backend/src/modules/projects/projects.service.ts`
- `backend/src/modules/projects/projects.routes.ts`
- `frontend/src/api/projects.api.ts`
- `frontend/src/stores/projectStore.ts`

---

### D3: Plan Management (Agent 0)

**Purpose:** Project plan hierarchy, status tracking, plan updates

**Features:**
- Plan item CRUD (workstream, milestone, activity, task, subtask)
- Hierarchical tree structure with materialized path
- CSV import for bulk plan creation
- Plan status updates with history tracking
- Bulk update operations
- AI-powered plan update suggestions

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/plan | Get full plan tree |
| POST | /api/projects/:id/plan | Create plan item in project |
| POST | /api/projects/:id/plan/import/preview | Preview CSV import |
| POST | /api/projects/:id/plan/import | Import plan from CSV |
| GET | /api/plan-items/:id | Get single plan item |
| GET | /api/plan-items/:id/history | Get item change history |
| PUT | /api/plan-items/:id | Update plan item |
| DELETE | /api/plan-items/:id | Delete plan item |
| POST | /api/plan-items/bulk-update | Bulk update items |
| GET | /api/plan-items/import/template | Get CSV template |
| GET | /api/plan-item-types | List plan item types |
| POST | /api/projects/:id/plan-suggestions | Get AI plan suggestions |
| POST | /api/projects/:id/plan-updates | Apply plan updates |

**Key Files:**
- `backend/src/modules/plan-items/plan-items.controller.ts`
- `backend/src/modules/plan-items/plan-items.service.ts`
- `backend/src/modules/plan-updater/plan-updater.service.ts`
- `backend/src/services/ai/prompts/plan-updater.ts`
- `frontend/src/pages/plan/PlanPage.tsx`
- `frontend/src/components/plan/PlanTree.tsx`
- `frontend/src/components/plan/PlanUpdater.tsx`
- `frontend/src/api/plan-items.api.ts`

---

### D4: Content Management (Agent 1 - Intake)

**Purpose:** Content ingestion, AI analysis, RAG storage

**Features:**
- Content item CRUD
- File upload (PDF, DOCX, TXT, MD)
- Text extraction from uploaded files
- AI analysis and suggestions
- Content type and activity type classification
- Chunking and embedding for RAG
- Parent-child content item relationships

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/content | List project content |
| GET | /api/content-items | List all content items |
| GET | /api/content-items/:id | Get single content item |
| POST | /api/content-items | Create content item |
| POST | /api/content-items/upload | Upload file and create item |
| POST | /api/content-items/analyze | AI content analysis |
| POST | /api/content-items/save-analyzed | Save with AI suggestions |
| PUT | /api/content-items/:id | Update content item |
| DELETE | /api/content-items/:id | Delete content item |
| GET | /api/projects/lookup/content-types | Get content types |
| GET | /api/projects/lookup/activity-item-types | Get activity types |

**Key Files:**
- `backend/src/modules/content-items/content-items.controller.ts`
- `backend/src/modules/content-items/content-items.service.ts`
- `backend/src/modules/content-items/analyze.service.ts`
- `backend/src/services/ai/prompts/intake-agent.ts`
- `backend/src/services/file-processing/pdf.service.ts`
- `backend/src/services/file-processing/docx.service.ts`
- `backend/src/middleware/upload.ts`
- `frontend/src/pages/intake/IntakePage.tsx`
- `frontend/src/api/content-items.api.ts`

---

### D5: Activity Reporting (Agent 2)

**Purpose:** Generate activity reports from content using AI

**Features:**
- Activity report generation with AI
- RAG-based content retrieval
- Status/action/risk/decision extraction
- Period-based filtering
- Workstream and activity type filters
- Source content linking with confidence scores
- View source functionality

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:id/activity-report | Generate new report |
| GET | /api/projects/:id/activity-reports | List reports with pagination |
| GET | /api/projects/:id/activity-reports/:reportId | Get single report |
| GET | /api/projects/:id/activity-reports/:reportId/sources | Get source content |

**Key Files:**
- `backend/src/modules/activity-reporter/activity-reporter.controller.ts`
- `backend/src/modules/activity-reporter/activity-reporter.service.ts`
- `backend/src/services/ai/prompts/activity-reporter.ts`
- `backend/src/services/ai/embedding.service.ts`
- `frontend/src/pages/reporter/ReporterPage.tsx`
- `frontend/src/api/activity-reporter.api.ts`

---

### D6: Output Formatting (Agent 3)

**Purpose:** Convert reports to different formats

**Features:**
- Markdown export with structured sections
- PowerPoint export with professional slides
- Status emoji mapping
- Color-coded tables for priorities/severity
- Clean downloadable files

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/format/markdown | Format as Markdown |
| POST | /api/format/pptx | Format as PowerPoint |

**Key Files:**
- `backend/src/modules/output-formatter/output-formatter.controller.ts`
- `backend/src/modules/output-formatter/output-formatter.service.ts`
- `frontend/src/api/output-formatter.api.ts`

---

### D7: Configuration

**Purpose:** Type configuration (content types, activity types, plan item types)

**Features:**
- Plan item type management (workstream, milestone, activity, task, subtask)
- Content type management (meeting, document, email, note, transcript)
- Activity type management (status_update, action_item, risk, decision, blocker)
- System type protection (cannot edit/delete isSystem types)
- Organization-scoped custom types
- Soft delete support

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/config/plan-item-types | List plan item types |
| GET | /api/config/plan-item-types/:id | Get plan item type |
| POST | /api/config/plan-item-types | Create plan item type |
| PUT | /api/config/plan-item-types/:id | Update plan item type |
| DELETE | /api/config/plan-item-types/:id | Delete plan item type |
| GET | /api/config/content-types | List content types |
| GET | /api/config/content-types/:id | Get content type |
| POST | /api/config/content-types | Create content type |
| PUT | /api/config/content-types/:id | Update content type |
| DELETE | /api/config/content-types/:id | Delete content type |
| GET | /api/config/activity-types | List activity types |
| GET | /api/config/activity-types/:id | Get activity type |
| POST | /api/config/activity-types | Create activity type |
| PUT | /api/config/activity-types/:id | Update activity type |
| DELETE | /api/config/activity-types/:id | Delete activity type |

**Key Files:**
- `backend/src/modules/config/config.controller.ts`
- `backend/src/modules/config/config.service.ts`
- `backend/src/modules/config/config.routes.ts`
- `frontend/src/pages/admin/ConfigPage.tsx`
- `frontend/src/api/config.api.ts`

---

### D8: API Key Management

**Purpose:** Programmatic API access for integrations and automation

**Features:**
- API key CRUD operations
- Secure key generation (`aipm_<base64url>` format)
- bcrypt hashing (only prefix stored, full key shown once on creation)
- Organization-scoped keys with full user-level access
- Expiration date support
- Key revocation (soft delete)
- Last used tracking
- API keys cannot manage other API keys (security restriction)

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/api-keys | List organization's API keys |
| GET | /api/api-keys/:id | Get single API key details |
| POST | /api/api-keys | Create new API key (returns full key once) |
| DELETE | /api/api-keys/:id | Revoke API key |

**Authentication:**
- Use header: `X-API-Key: aipm_your_key_here`
- API key auth takes precedence over JWT when both present
- Full user-level access (below org admin)
- Cannot access: API key management endpoints, organization settings

**Key Files:**
- `backend/src/modules/api-keys/api-keys.controller.ts`
- `backend/src/modules/api-keys/api-keys.service.ts`
- `backend/src/modules/api-keys/api-keys.routes.ts`
- `backend/src/middleware/apiKeyAuth.ts`
- `frontend/src/api/api-keys.api.ts`
- `frontend/src/pages/admin/ConfigPage.tsx` (API Keys tab)

---

### D9: API Documentation (Swagger)

**Purpose:** Interactive API documentation for developers

**Features:**
- OpenAPI 3.0 specification
- Interactive Swagger UI
- Try-it-out functionality
- Both JWT and API Key auth support
- Organized by domain/tag

**Access Points:**

| URL | Description |
|-----|-------------|
| /api/docs | Swagger UI (interactive) |
| /api/docs.json | OpenAPI JSON spec |

**Key Files:**
- `backend/src/config/swagger.ts`
- Route documentation via JSDoc comments in `*.routes.ts` files

---

## Domain Relationships

```
[D1: Auth & Multi-tenancy] ──provides tokens──▶ [D2: Projects]
                                                      │
                     ┌────────────────────────────────┴────────────────────────────────┐
                     ▼                                                                 ▼
              [D3: Plan Management]                                        [D4: Content Management]
                     │                                                                 │
                     │  (AI plan suggestions)                          (AI analysis)  │
                     │                                                                 │
                     └─────────────────────────┬───────────────────────────────────────┘
                                               ▼
                                   [D5: Activity Reporter]
                                        (RAG queries)
                                               │
                                               ▼
                                   [D6: Output Formatter]
                                     (Markdown, PPTX)

                              [D7: Configuration]
                              (Provides types to D3, D4, D5)
```

---

## AI Integration

### OpenAI Services

| Service | Model | Purpose |
|---------|-------|---------|
| Chat Completions | gpt-4-turbo-preview | Content analysis, report generation, plan suggestions |
| Embeddings | text-embedding-3-small | Vector embeddings for RAG (1536 dimensions) |

### RAG Architecture

```
Content → Chunking → Embeddings → pgvector Storage
                                        ↓
Query → Embedding → Cosine Similarity Search → Context
                                                  ↓
                                       AI Generation with Sources
```

**Key Files:**
- `backend/src/config/ai.ts` - OpenAI configuration
- `backend/src/services/ai/openai.service.ts` - OpenAI client
- `backend/src/services/ai/embedding.service.ts` - Chunking and vector search

---

## Database Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| User | User accounts | email, passwordHash, organizations |
| Organization | Tenant container | slug, name, config |
| OrganizationUser | User-org membership | userId, organizationId, roleId |
| Role | RBAC roles | name, slug, permissions |
| Project | Client engagement | name, client, startDate, status |
| PlanItemType | Plan hierarchy levels | name, slug, level (1-5) |
| PlanItem | Plan tree nodes | name, parentId, path, status |
| PlanItemHistory | Audit trail | fieldChanged, oldValue, newValue |
| ContentType | Content classification | name, slug, isSystem |
| ActivityItemType | Activity classification | name, slug, isSystem |
| ContentItem | Raw content storage | title, rawContent, aiSummary |
| ContentChunk | RAG chunks | content, embedding (vector) |
| ActivityReport | Generated reports | periodStart, periodEnd, reportData |

---

## Getting Started

```bash
# Clone and setup
cd AIProjectManager

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and OpenAI key
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health
- **Swagger UI**: http://localhost:5000/api/docs
- **OpenAPI Spec**: http://localhost:5000/api/docs.json

---

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| JWT_REFRESH_SECRET | Refresh token secret | Yes |
| OPENAI_API_KEY | OpenAI API key | Yes |
| OPENAI_MODEL | Chat model (default: gpt-4-turbo-preview) | No |
| OPENAI_EMBEDDING_MODEL | Embedding model (default: text-embedding-3-small) | No |
| CHUNK_SIZE | Text chunk size in tokens (default: 500) | No |
| CHUNK_OVERLAP | Token overlap between chunks (default: 50) | No |
| RAG_TOP_K | Number of chunks to retrieve (default: 10) | No |
| RAG_SIMILARITY_THRESHOLD | Minimum similarity score (default: 0.7) | No |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | API base URL (default: /api) | No |

---

## Test Credentials

After running `npx prisma db seed`:

- **Admin:** admin@example.com / password123
- **User:** user@example.com / password123

---

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| /plan | Plan Agent | View and manage project plan hierarchy |
| /intake | Intake Agent | Submit content for AI analysis |
| /reporter | Activity Reporter | Generate AI-powered activity reports |
| /admin/config | Admin Config | Manage projects, type configurations, and API keys |
| /settings | Settings | User preferences |

**Admin Config Tabs:**
- Projects: Manage organization projects
- Plan Item Types: Configure plan hierarchy levels
- Content Types: Configure content classification
- Activity Types: Configure activity classification
- API Keys: Manage API keys for programmatic access

---

## API Response Format

All API responses follow this format:

```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: "Error message"
}
```

---

## Security

- JWT-based authentication with access and refresh tokens
- **API Key authentication** for programmatic access (X-API-Key header)
- Organization-based data isolation (multi-tenancy)
- Role-based access control (RBAC)
- Rate limiting on authentication endpoints
- Input validation with Zod schemas
- SQL injection protection via Prisma ORM
- API keys use bcrypt hashing (only prefix/hash stored)
- API keys restricted from sensitive operations (cannot manage other keys)

---

## File Upload

**Supported Formats:**
- PDF (.pdf) - extracted via pdf-parse
- Word (.docx, .doc) - extracted via mammoth
- Text (.txt)
- Markdown (.md)

**Limits:**
- Max file size: 10MB
- Files stored in `backend/uploads/` with UUID names
