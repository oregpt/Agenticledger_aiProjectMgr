# AI Project Manager

Multi-tenant AI-powered project management and status reporting tool for consultants.

## Overview

Instead of manually filling out status reports, users dump raw information (meeting notes, documents, emails) and AI agents organize, analyze, and format it into status reports.

## Architecture

The system consists of 4 main agents:

1. **Plan Agent (Agent 0)** - Manages project plan hierarchy, updates status based on activity
2. **Intake Agent (Agent 1)** - Receives content, AI-analyzes it, stores with proper labels
3. **Activity Reporter (Agent 2)** - Generates activity reports from stored content using RAG
4. **Output Formatter (Agent 3)** - Converts reports to Markdown, PowerPoint, etc.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15 with pgvector extension
- **ORM**: Prisma
- **Auth**: JWT (multi-tenant with organizations)
- **AI**: OpenAI GPT-4 + text-embedding-3-small

## Building with Ralph

This project uses the Ralph autonomous coding loop to build itself.

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- Claude CLI installed (`npm install -g @anthropic-ai/claude-cli`)
- OpenAI API key

### Running Ralph

```bash
# Navigate to project directory
cd "C:\Users\oreph\Documents\AgenticLedger\Custom Applications\AIProjectManager"

# Run Ralph with 25 max iterations
./scripts/ralph/ralph.sh 25
```

### Ralph Files

- `scripts/ralph/ralph.sh` - The autonomous loop engine
- `scripts/ralph/prompt.md` - Agent instructions and templates
- `scripts/ralph/prd.json` - User stories to implement
- `scripts/ralph/progress.txt` - Learning log across iterations

### User Stories

Ralph will implement these stories in order:

| ID | Title | Priority |
|----|-------|----------|
| US-000 | Copy multitenancy starter | 0 |
| US-001 | Add Project model and CRUD | 1 |
| US-002 | Add PlanItem model with hierarchy | 2 |
| US-003 | Create Plan view UI | 3 |
| US-004 | Implement CSV import | 4 |
| US-005 | Add ContentItem models | 5 |
| US-006 | Create Intake Agent UI | 6 |
| US-007 | Set up OpenAI + pgvector | 7 |
| US-008 | Implement AI analysis | 8 |
| US-009 | Implement Activity Reporter | 9 |
| US-010 | Implement Plan Updater | 10 |
| US-011 | Implement Output Formatter | 11 |
| US-012 | Create Admin Config UI | 12 |
| US-013 | Create main app layout | 13 |
| US-014 | Add file upload support | 14 |
| US-015 | Polish UI design | 15 |
| REL-001-005 | Release phase | 900+ |

## Documentation

- `SPEC.md` - Full technical specification
- `platform-overview.md` - Domain documentation (created in REL-001)
- `RELEASE_CHECKLIST.md` - Final release summary (created in REL-005)

## Manual Development

If not using Ralph, you can develop manually:

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and OPENAI_API_KEY
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## License

Private - AgenticLedger
