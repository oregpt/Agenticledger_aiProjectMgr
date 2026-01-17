# D3: Plan Management - API Endpoints

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/plan | Get full plan tree |
| POST | /api/projects/:id/plan | Create plan item |
| GET | /api/plan-items/:id | Get single plan item |
| GET | /api/plan-items/:id/history | Get item change history |
| PUT | /api/plan-items/:id | Update plan item |
| DELETE | /api/plan-items/:id | Delete plan item |
| POST | /api/plan-items/bulk-update | Bulk update items |
| GET | /api/plan-items/import/template | Get CSV template |
| POST | /api/projects/:id/plan/import/preview | Preview CSV import |
| POST | /api/projects/:id/plan/import | Import plan from CSV |

## Test Cases

### Plan Tree
- [x] Get plan tree returns hierarchical structure
- [x] Get plan without auth returns 401

### Plan Items
- [x] Create plan item succeeds
- [x] Get plan item by ID returns item
- [x] Update plan item changes data
- [x] Delete plan item removes from tree
- [x] Get plan item history returns changes

### CSV Import
- [x] Get CSV template returns template file
- [x] Preview import parses CSV data
