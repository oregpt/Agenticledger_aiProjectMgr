# D2: Project Management - API Endpoints

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List organization projects |
| GET | /api/projects/:id | Get project details |
| POST | /api/projects | Create new project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Soft-delete project |
| GET | /api/projects/:id/dashboard | Get project dashboard stats |

## Test Cases

### List Projects
- [x] List projects returns array
- [x] List projects without auth returns 401

### Get Project
- [x] Get project by ID returns project data
- [x] Get non-existent project returns 404

### Create Project
- [x] Create project with valid data succeeds
- [x] Create project without required fields fails

### Update Project
- [x] Update project changes data
- [x] Update non-existent project returns 404

### Delete Project
- [x] Delete project soft-deletes (sets isActive: false)

### Dashboard
- [x] Get project dashboard returns stats
