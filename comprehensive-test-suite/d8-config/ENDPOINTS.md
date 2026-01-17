# D8: Configuration - API Endpoints

## Endpoints Tested

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

## Test Cases

### Plan Item Types
- [x] List plan item types returns array
- [x] Create custom plan item type succeeds
- [x] Cannot edit system plan item types
- [x] Delete custom plan item type succeeds

### Content Types
- [x] List content types returns array
- [x] Create custom content type succeeds
- [x] Delete custom content type succeeds

### Activity Types
- [x] List activity types returns array
- [x] Create custom activity type succeeds
- [x] Delete custom activity type succeeds
