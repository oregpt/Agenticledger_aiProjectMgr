# D4: Content Management (Intake Agent) - API Endpoints

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/content | List project content |
| GET | /api/content-items | List all content items |
| GET | /api/content-items/:id | Get single content item |
| POST | /api/content-items | Create content item |
| POST | /api/content-items/upload | Upload file |
| POST | /api/content-items/analyze | AI content analysis |
| POST | /api/content-items/save-analyzed | Save with AI suggestions |
| PUT | /api/content-items/:id | Update content item |
| DELETE | /api/content-items/:id | Delete content item |
| GET | /api/projects/lookup/content-types | Get content types |
| GET | /api/projects/lookup/activity-item-types | Get activity types |

## Test Cases

### Content Items
- [x] List project content returns array
- [x] Create content item succeeds
- [x] Get content item by ID returns item
- [x] Update content item changes data
- [x] Delete content item removes it

### Type Lookups
- [x] Get content types returns list
- [x] Get activity types returns list

### AI Analysis
- [x] Analyze endpoint exists
- [x] Save analyzed endpoint exists
