# Multi-Tenant Authentication Backend

A robust backend API for multi-tenant applications with comprehensive authentication and role-based access control (RBAC).

## Features

- **Multi-tenant Architecture**: Organization-based data isolation
- **Authentication**: JWT-based auth with access/refresh tokens
- **RBAC**: Granular CRUD permissions per menu/page
- **Feature Flags**: Two-level control (platform + organization)
- **Invitation System**: Email-based user invitations
- **Email Notifications**: Pluggable provider (Resend default)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Setup

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL** (using Docker)
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

6. **Seed the database**
   ```bash
   npm run db:seed
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## Default Credentials

After seeding, you can use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | platformadmin@platform.local | platformadmin123 |
| Org Admin | orgadmin@acme.local | orgadmin123 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `GET /api/auth/me` - Get current user

### Users
- `PATCH /api/users/me` - Update profile
- `GET /api/users` - List org users (Org Admin+)
- `PATCH /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Remove user from org

### Organizations
- `GET /api/organizations` - Get user's organizations
- `GET /api/organizations/all` - Get all orgs (Platform Admin)
- `POST /api/organizations` - Create org (Platform Admin)
- `PATCH /api/organizations/:id` - Update org
- `DELETE /api/organizations/:id` - Delete org (Platform Admin)
- `GET /api/organizations/:id/config` - Get org config
- `PATCH /api/organizations/:id/config` - Update org config

### Roles
- `GET /api/roles` - List roles
- `POST /api/roles` - Create custom role
- `PATCH /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/roles/:id/permissions` - Get role permissions
- `PUT /api/roles/:id/permissions` - Update role permissions

### Feature Flags
- `GET /api/feature-flags` - Get all flags (Platform Admin)
- `GET /api/feature-flags/organization` - Get org flags
- `PATCH /api/feature-flags/organization/flag/:id` - Update org flag

### Platform Settings
- `GET /api/platform-settings/public` - Get public settings
- `GET /api/platform-settings` - Get all settings (Platform Admin)
- `PATCH /api/platform-settings/:key` - Update setting

### Invitations
- `POST /api/invitations` - Send invitation
- `GET /api/invitations` - List pending invitations
- `GET /api/invitations/:token/validate` - Validate invitation
- `DELETE /api/invitations/:id` - Cancel invitation
- `POST /api/invitations/:id/resend` - Resend invitation

### Menus
- `GET /api/menus` - Get all menus
- `GET /api/menus/user` - Get user's accessible menus

## Request Headers

For authenticated requests:
```
Authorization: Bearer <access_token>
X-Organization-Id: <organization_id>
```

## Role Hierarchy

| Level | Role | Description |
|-------|------|-------------|
| 10 | Viewer | View-only access |
| 20 | Standard User | Basic CRUD |
| 30 | Advanced User | Extended access |
| 40 | Org Admin | Full org access |
| 100 | Platform Admin | Cross-org access |

## Project Structure

```
src/
├── config/          # Configuration
├── middleware/      # Express middleware
├── modules/         # Feature modules
│   ├── auth/
│   ├── users/
│   ├── organizations/
│   ├── roles/
│   ├── feature-flags/
│   ├── platform-settings/
│   ├── invitations/
│   └── menus/
├── services/        # Shared services
│   ├── email/
│   └── token/
├── utils/           # Utilities
├── types/           # TypeScript types
├── app.ts           # Express app
└── index.ts         # Entry point
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:reset` - Reset and reseed database
- `npm run db:studio` - Open Prisma Studio

## License

MIT
