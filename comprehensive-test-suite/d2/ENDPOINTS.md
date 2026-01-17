# D2: Project Management

## Purpose
Project CRUD, configuration, and organization

## Endpoints Tested

| Method | Endpoint | Description | Tests |
|--------|----------|-------------|-------|
| GET | /api/projects | List org projects | Success, empty list, unauthorized |
| GET | /api/projects/:id | Get project details | Success, not found |
| POST | /api/projects | Create project | Success, validation error |
| PUT | /api/projects/:id | Update project | Success, not found |
| DELETE | /api/projects/:id | Soft delete project | Success, not found |

## Test Coverage

- **Project CRUD**: Create, read, update, delete operations
- **Project Listing**: List with organization context
- **Status Management**: Track project status (active, on_hold, completed, cancelled)
- **Soft Delete**: Verify isActive flag behavior
- **Validation**: Required fields, unique constraints
- **Multi-tenancy**: Organization-scoped data isolation
