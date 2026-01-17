# D5: Activity Reporter - API Endpoints

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:id/activity-report | Generate new report |
| GET | /api/projects/:id/activity-reports | List reports |
| GET | /api/projects/:id/activity-reports/:reportId | Get single report |
| GET | /api/projects/:id/activity-reports/:reportId/sources | Get report sources |

## Test Cases

### Report Generation
- [x] Generate report endpoint exists
- [x] Generate report without auth returns 401

### Report Listing
- [x] List reports returns array
- [x] Get single report returns data (if exists)

### Report Sources
- [x] Get report sources endpoint exists
