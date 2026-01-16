# Multi-Tenant Authentication Frontend

A React frontend for multi-tenant applications with authentication and role-based access control.

## Features

- **Authentication**: Login, register, password reset flows
- **Multi-Organization**: Switch between organizations
- **RBAC**: Role-based UI rendering
- **Feature Flags**: Conditional feature display
- **Modern UI**: shadcn/ui + Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend running on port 3001

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── api/              # API client and service modules
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Layout components
│   ├── auth/         # Auth forms
│   ├── admin/        # Admin UI components
│   ├── sample/       # Sample app components
│   └── common/       # Shared components
├── hooks/            # Custom React hooks
├── stores/           # Zustand state stores
├── pages/            # Page components
├── routes/           # Route definitions
├── lib/              # Utilities
├── types/            # TypeScript types
└── styles/           # Global styles
```

## Technology Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Form Validation**: Zod + React Hook Form

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/api` |
| `VITE_APP_NAME` | Application name | `Multi-Tenant App` |

## Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST to `/api/auth/login`
3. Backend returns JWT tokens
4. Frontend stores tokens in Zustand (persisted to localStorage)
5. Subsequent requests include `Authorization: Bearer <token>`
6. On 401, refresh token is used automatically

## RBAC Integration

The frontend uses `RBACGuard` and `FeatureFlagGuard` components:

```tsx
// Only show if user can create reports
<RBACGuard menuSlug="reports" action="create">
  <Button>Create Report</Button>
</RBACGuard>

// Only show if feature is enabled
<FeatureFlagGuard flagKey="advanced_analytics">
  <AnalyticsDashboard />
</FeatureFlagGuard>
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Extending the Frontend

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add menu entry in backend seed script
4. Assign permissions to roles

### Adding a New Component

1. Create component in appropriate `src/components/` directory
2. Use shadcn/ui primitives when possible
3. Wrap with `RBACGuard` if permission-based

## License

MIT
