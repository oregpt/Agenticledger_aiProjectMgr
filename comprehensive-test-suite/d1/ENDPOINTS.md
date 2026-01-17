# D1: Authentication & Multi-tenancy

## Purpose
User authentication, organization management, RBAC

## Endpoints Tested

| Method | Endpoint | Description | Tests |
|--------|----------|-------------|-------|
| POST | /api/auth/register | User registration | Success, duplicate email error |
| POST | /api/auth/login | User login | Success, invalid credentials |
| POST | /api/auth/refresh | Refresh access token | Success with valid token |
| POST | /api/auth/logout | User logout | Success |
| GET | /api/auth/me | Get current user info | Success, unauthorized |
| POST | /api/auth/change-password | Change password | Requires current password |
| GET | /api/organizations | List user's organizations | Success |
| POST | /api/organizations | Create organization | Success |
| PUT | /api/organizations/:id | Update organization | Success |
| GET | /api/users | List org users | Success |

## Test Coverage

- **Authentication Flow**: Login, token refresh, logout
- **User Info**: Get current user, change password
- **Organization Management**: List, create organizations
- **Error Handling**: Invalid credentials, unauthorized access
- **Multi-tenancy**: Organization context header validation
