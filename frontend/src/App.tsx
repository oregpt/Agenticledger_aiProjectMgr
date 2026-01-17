import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppLayout } from '@/components/layout/AppLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { AcceptInvitationPage } from '@/pages/auth/AcceptInvitationPage';

// Sample Pages
import { DashboardPage } from '@/pages/sample/DashboardPage';
import { ReportsPage } from '@/pages/sample/ReportsPage';
import { DataExportPage } from '@/pages/sample/DataExportPage';
import { SettingsPage } from '@/pages/sample/SettingsPage';
import { AuditLogPage } from '@/pages/sample/AuditLogPage';

// Plan Pages
import { PlanPage } from '@/pages/plan/PlanPage';

// Intake Pages
import { IntakePage } from '@/pages/intake/IntakePage';

// Admin Pages
import { OrganizationPage } from '@/pages/admin/OrganizationPage';
import { RolesPage } from '@/pages/admin/RolesPage';

// Platform Admin Pages
import { PlatformSettingsPage } from '@/pages/platform/PlatformSettingsPage';
import { AllOrganizationsPage } from '@/pages/platform/AllOrganizationsPage';

// Error Pages
import { NotFoundPage, UnauthorizedPage, ForbiddenPage } from '@/pages/errors/NotFoundPage';

// Guards
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      </Route>

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Plan Page */}
        <Route path="/plan" element={<PlanPage />} />

        {/* Intake Page */}
        <Route path="/intake" element={<IntakePage />} />

        {/* Sample Pages */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/data-export" element={<DataExportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />

        {/* Admin Routes */}
        <Route path="/admin/organization" element={<OrganizationPage />} />
        <Route path="/admin/roles" element={<RolesPage />} />

        {/* Platform Admin Routes */}
        <Route path="/platform/settings" element={<PlatformSettingsPage />} />
        <Route path="/platform/organizations" element={<AllOrganizationsPage />} />
      </Route>

      {/* Error Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
