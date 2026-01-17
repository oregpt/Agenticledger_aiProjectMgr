# D1: Authentication & User Management - API Endpoints

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | User logout |
| GET | /api/auth/me | Get current user info |
| POST | /api/auth/change-password | Change password |
| GET | /api/users | List organization users |
| GET | /api/organizations | List user's organizations |
| POST | /api/organizations/:id/switch | Switch active organization |

## Test Cases

### Login
- [x] Login with valid credentials returns tokens
- [x] Login with invalid credentials returns 401

### Auth Flow
- [x] Get current user (/me) with valid token succeeds
- [x] Get current user without token returns 401
- [x] Refresh token returns new access token
- [x] Logout invalidates refresh token

### Users
- [x] List organization users succeeds
- [x] List users without auth returns 401

### Organizations
- [x] List organizations returns user's orgs
- [x] Switch organization updates context
