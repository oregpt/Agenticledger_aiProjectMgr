# D6: Plan Updater - API Endpoints

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:id/plan-suggestions | Get AI plan update suggestions |
| POST | /api/projects/:id/plan-updates | Apply selected plan updates |

## Test Cases

### Plan Suggestions
- [x] Get plan suggestions endpoint exists
- [x] Get suggestions without auth returns 401

### Apply Updates
- [x] Apply plan updates endpoint exists
- [x] Apply updates without auth returns 401
