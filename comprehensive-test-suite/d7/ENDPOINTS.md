# D7: Configuration

## Purpose
Type configuration (content types, activity types, plan item types)

## Endpoints Tested

| Method | Endpoint | Description | Tests |
|--------|----------|-------------|-------|
| GET | /api/config/plan-item-types | List plan item types | Success |
| GET | /api/config/plan-item-types/:id | Get plan item type | Success, not found |
| POST | /api/config/plan-item-types | Create type | Success, validation |
| PUT | /api/config/plan-item-types/:id | Update type | Success, system protection |
| DELETE | /api/config/plan-item-types/:id | Delete type | Success, system protection |
| GET | /api/config/content-types | List content types | Success |
| GET | /api/config/content-types/:id | Get content type | Success, not found |
| POST | /api/config/content-types | Create type | Success, validation |
| PUT | /api/config/content-types/:id | Update type | Success, system protection |
| DELETE | /api/config/content-types/:id | Delete type | Success, system protection |
| GET | /api/config/activity-types | List activity types | Success |
| GET | /api/config/activity-types/:id | Get activity type | Success, not found |
| POST | /api/config/activity-types | Create type | Success, validation |
| PUT | /api/config/activity-types/:id | Update type | Success, system protection |
| DELETE | /api/config/activity-types/:id | Delete type | Success, system protection |

## Test Coverage

- **Type CRUD**: Create, read, update, delete for all type entities
- **System Type Protection**: System types cannot be edited/deleted
- **Validation**: Required fields, unique slugs
- **Organization Scoping**: Types scoped to organization
- **Soft Delete**: isActive flag behavior
