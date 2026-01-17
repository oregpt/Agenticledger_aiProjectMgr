import { PrismaClient, RoleScope, MenuSection, SettingType, InvitationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // ============================================================================
  // 1. Create Platform Organization
  // ============================================================================
  console.log('Creating platform organization...');
  const platformOrg = await prisma.organization.upsert({
    where: { slug: 'platform' },
    update: {},
    create: {
      name: 'Platform',
      slug: 'platform',
      description: 'Platform administration organization',
      isPlatform: true,
      config: {},
    },
  });
  console.log(`Created platform org: ${platformOrg.name} (ID: ${platformOrg.id})`);

  // ============================================================================
  // 2. Create System Roles
  // ============================================================================
  console.log('Creating system roles...');

  const roles = [
    {
      name: 'Viewer',
      slug: 'viewer',
      description: 'View-only access to permitted pages',
      level: 10,
      isSystem: true,
      scope: RoleScope.PLATFORM,
    },
    {
      name: 'Standard User',
      slug: 'standard_user',
      description: 'Basic CRUD access on permitted pages',
      level: 20,
      isSystem: true,
      scope: RoleScope.PLATFORM,
    },
    {
      name: 'Advanced User',
      slug: 'advanced_user',
      description: 'Extended access, can manage own data',
      level: 30,
      isSystem: true,
      scope: RoleScope.PLATFORM,
    },
    {
      name: 'Org Admin',
      slug: 'org_admin',
      description: 'Organization administrator with full org access',
      level: 40,
      isSystem: true,
      scope: RoleScope.PLATFORM,
    },
    {
      name: 'Platform Admin',
      slug: 'platform_admin',
      description: 'Platform administrator with cross-org access',
      level: 100,
      isSystem: true,
      scope: RoleScope.PLATFORM,
    },
  ];

  const createdRoles: Record<string, number> = {};

  for (const role of roles) {
    // For system roles with null organizationId, we need to check existence manually
    let created = await prisma.role.findFirst({
      where: { slug: role.slug, organizationId: null },
    });

    if (!created) {
      created = await prisma.role.create({
        data: role,
      });
    }

    createdRoles[role.slug] = created.id;
    console.log(`Created role: ${created.name} (ID: ${created.id}, Level: ${created.level})`);
  }

  // ============================================================================
  // 3. Create Default Menus
  // ============================================================================
  console.log('Creating default menus...');

  const menus = [
    // Main Section
    { name: 'Dashboard', slug: 'dashboard', path: '/dashboard', icon: 'LayoutDashboard', section: MenuSection.MAIN, sortOrder: 1 },
    { name: 'Plan', slug: 'plan', path: '/plan', icon: 'ListTree', section: MenuSection.MAIN, sortOrder: 2 },
    { name: 'Intake', slug: 'intake', path: '/intake', icon: 'Inbox', section: MenuSection.MAIN, sortOrder: 3 },
    { name: 'Activity Reporter', slug: 'reports', path: '/reporter', icon: 'ClipboardList', section: MenuSection.MAIN, sortOrder: 4 },
    { name: 'Data Export', slug: 'data_export', path: '/data-export', icon: 'Download', section: MenuSection.MAIN, sortOrder: 5 },
    { name: 'Settings', slug: 'settings', path: '/settings', icon: 'Settings', section: MenuSection.MAIN, sortOrder: 6 },
    { name: 'Audit Log', slug: 'audit_log', path: '/audit-log', icon: 'History', section: MenuSection.MAIN, sortOrder: 7 },

    // Admin Section
    { name: 'Organization', slug: 'admin_organization', path: '/admin/organization', icon: 'Building2', section: MenuSection.ADMIN, sortOrder: 1 },
    { name: 'Roles', slug: 'admin_roles', path: '/admin/roles', icon: 'Shield', section: MenuSection.ADMIN, sortOrder: 2 },

    // Platform Admin Section
    { name: 'Platform Settings', slug: 'platform_settings', path: '/platform/settings', icon: 'Sliders', section: MenuSection.PLATFORM_ADMIN, sortOrder: 1 },
    { name: 'All Organizations', slug: 'platform_organizations', path: '/platform/organizations', icon: 'Buildings', section: MenuSection.PLATFORM_ADMIN, sortOrder: 2 },
    { name: 'Platform Roles', slug: 'platform_roles', path: '/platform/roles', icon: 'ShieldCheck', section: MenuSection.PLATFORM_ADMIN, sortOrder: 3 },
  ];

  const createdMenus: Record<string, number> = {};

  for (const menu of menus) {
    const created = await prisma.menu.upsert({
      where: { slug: menu.slug },
      update: {},
      create: menu,
    });
    createdMenus[menu.slug] = created.id;
    console.log(`Created menu: ${created.name} (ID: ${created.id})`);
  }

  // ============================================================================
  // 4. Create Default Permissions
  // ============================================================================
  console.log('Creating default permissions...');

  // Permission matrix: [roleSlug][menuSlug] = { C, R, U, D }
  const permissionMatrix: Record<string, Record<string, { c: boolean; r: boolean; u: boolean; d: boolean }>> = {
    viewer: {
      dashboard: { c: false, r: true, u: false, d: false },
      plan: { c: false, r: true, u: false, d: false },
      intake: { c: false, r: true, u: false, d: false },
      reports: { c: false, r: true, u: false, d: false },
      settings: { c: false, r: true, u: false, d: false },
    },
    standard_user: {
      dashboard: { c: false, r: true, u: false, d: false },
      plan: { c: true, r: true, u: true, d: false },
      intake: { c: true, r: true, u: true, d: false },
      reports: { c: true, r: true, u: true, d: true },
      data_export: { c: false, r: true, u: false, d: false },
      settings: { c: false, r: true, u: true, d: false },
      audit_log: { c: false, r: true, u: false, d: false },
    },
    advanced_user: {
      dashboard: { c: false, r: true, u: false, d: false },
      plan: { c: true, r: true, u: true, d: true },
      intake: { c: true, r: true, u: true, d: true },
      reports: { c: true, r: true, u: true, d: true },
      data_export: { c: false, r: true, u: true, d: false },
      settings: { c: false, r: true, u: true, d: false },
      audit_log: { c: false, r: true, u: false, d: false },
    },
    org_admin: {
      dashboard: { c: false, r: true, u: false, d: false },
      plan: { c: true, r: true, u: true, d: true },
      intake: { c: true, r: true, u: true, d: true },
      reports: { c: true, r: true, u: true, d: true },
      data_export: { c: true, r: true, u: true, d: true },
      settings: { c: true, r: true, u: true, d: true },
      audit_log: { c: false, r: true, u: false, d: false },
      admin_organization: { c: true, r: true, u: true, d: true },
      admin_roles: { c: true, r: true, u: true, d: true },
    },
    platform_admin: {
      dashboard: { c: false, r: true, u: false, d: false },
      plan: { c: true, r: true, u: true, d: true },
      intake: { c: true, r: true, u: true, d: true },
      reports: { c: true, r: true, u: true, d: true },
      data_export: { c: true, r: true, u: true, d: true },
      settings: { c: true, r: true, u: true, d: true },
      audit_log: { c: false, r: true, u: false, d: false },
      admin_organization: { c: true, r: true, u: true, d: true },
      admin_roles: { c: true, r: true, u: true, d: true },
      platform_settings: { c: true, r: true, u: true, d: true },
      platform_organizations: { c: true, r: true, u: true, d: true },
      platform_roles: { c: true, r: true, u: true, d: true },
    },
  };

  for (const [roleSlug, menuPerms] of Object.entries(permissionMatrix)) {
    const roleId = createdRoles[roleSlug];
    for (const [menuSlug, perms] of Object.entries(menuPerms)) {
      const menuId = createdMenus[menuSlug];
      if (roleId && menuId) {
        await prisma.rolePermission.upsert({
          where: { roleId_menuId: { roleId, menuId } },
          update: {
            canCreate: perms.c,
            canRead: perms.r,
            canUpdate: perms.u,
            canDelete: perms.d,
          },
          create: {
            roleId,
            menuId,
            canCreate: perms.c,
            canRead: perms.r,
            canUpdate: perms.u,
            canDelete: perms.d,
          },
        });
      }
    }
  }
  console.log('Created default permissions');

  // ============================================================================
  // 5. Create Feature Flags
  // ============================================================================
  console.log('Creating feature flags...');

  const featureFlags = [
    { key: 'reporting_portal', name: 'Reporting Portal', description: 'Access to advanced reporting features', defaultEnabled: false },
    { key: 'advanced_analytics', name: 'Advanced Analytics', description: 'Analytics dashboard features', defaultEnabled: false },
    { key: 'data_export', name: 'Data Export', description: 'Export data to CSV/Excel', defaultEnabled: true },
    { key: 'api_access', name: 'API Access', description: 'REST API access', defaultEnabled: false },
    { key: 'audit_logging', name: 'Audit Logging', description: 'Detailed audit trail', defaultEnabled: true },
    { key: 'custom_roles', name: 'Custom Roles', description: 'Create custom roles', defaultEnabled: true },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
    console.log(`Created feature flag: ${flag.name}`);
  }

  // ============================================================================
  // 6. Create Platform Settings
  // ============================================================================
  console.log('Creating platform settings...');

  const platformSettings = [
    { key: 'app_name', value: 'AI Project Manager', type: SettingType.STRING, description: 'Application name', category: 'general' },
    { key: 'support_email', value: 'support@example.com', type: SettingType.STRING, description: 'Support email address', category: 'general' },
    { key: 'invitation_enabled', value: 'true', type: SettingType.BOOLEAN, description: 'Whether email invitations are enabled', category: 'general' },
    { key: 'invitation_expiry_hours', value: '72', type: SettingType.NUMBER, description: 'Invitation expiry time in hours', category: 'general' },
    { key: 'min_password_length', value: '8', type: SettingType.NUMBER, description: 'Minimum password length', category: 'security' },
    { key: 'session_timeout_minutes', value: '60', type: SettingType.NUMBER, description: 'Session timeout in minutes', category: 'security' },
  ];

  for (const setting of platformSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
    console.log(`Created platform setting: ${setting.key}`);
  }

  // ============================================================================
  // 7. Create Initial Platform Admin User
  // ============================================================================
  console.log('Creating initial platform admin user...');

  const passwordHash = await bcrypt.hash('admin123', 12);

  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@agenticledger.ai' },
    update: {},
    create: {
      email: 'admin@agenticledger.ai',
      passwordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
    },
  });
  console.log(`Created platform admin user: ${platformAdmin.email} (ID: ${platformAdmin.id})`);

  // Assign platform admin to platform organization
  await prisma.organizationUser.upsert({
    where: {
      userId_organizationId: {
        userId: platformAdmin.id,
        organizationId: platformOrg.id,
      },
    },
    update: {},
    create: {
      userId: platformAdmin.id,
      organizationId: platformOrg.id,
      roleId: createdRoles['platform_admin'],
    },
  });
  console.log('Assigned platform admin to platform organization');

  // ============================================================================
  // 8. Create Sample Organization with Org Admin
  // ============================================================================
  console.log('Creating sample organization...');

  const sampleOrg = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      description: 'Sample organization for testing',
      config: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
      },
    },
  });
  console.log(`Created sample org: ${sampleOrg.name} (ID: ${sampleOrg.id})`);

  // Create org admin for sample org
  const orgAdminHash = await bcrypt.hash('orgadmin123', 12);

  const orgAdmin = await prisma.user.upsert({
    where: { email: 'orgadmin@acme.local' },
    update: {},
    create: {
      email: 'orgadmin@acme.local',
      passwordHash: orgAdminHash,
      firstName: 'Org',
      lastName: 'Admin',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
    },
  });
  console.log(`Created org admin user: ${orgAdmin.email} (ID: ${orgAdmin.id})`);

  await prisma.organizationUser.upsert({
    where: {
      userId_organizationId: {
        userId: orgAdmin.id,
        organizationId: sampleOrg.id,
      },
    },
    update: {},
    create: {
      userId: orgAdmin.id,
      organizationId: sampleOrg.id,
      roleId: createdRoles['org_admin'],
    },
  });
  console.log('Assigned org admin to sample organization');

  // ============================================================================
  // 9. Create Default PlanItemTypes (Global - no organizationId)
  // ============================================================================
  console.log('Creating default plan item types...');

  const planItemTypes = [
    { name: 'Workstream', slug: 'workstream', description: 'High-level work category or stream', level: 1, icon: 'Layers', color: '#3b82f6', isSystem: true },
    { name: 'Milestone', slug: 'milestone', description: 'Key project milestone or checkpoint', level: 2, icon: 'Flag', color: '#10b981', isSystem: true },
    { name: 'Activity', slug: 'activity', description: 'A specific activity within a milestone', level: 3, icon: 'Activity', color: '#8b5cf6', isSystem: true },
    { name: 'Task', slug: 'task', description: 'A task to be completed', level: 4, icon: 'CheckSquare', color: '#f59e0b', isSystem: true },
    { name: 'Subtask', slug: 'subtask', description: 'A subtask within a task', level: 5, icon: 'Check', color: '#6b7280', isSystem: true },
  ];

  for (const type of planItemTypes) {
    // Check if exists (global types have organizationId = null)
    const existing = await prisma.planItemType.findFirst({
      where: { slug: type.slug, organizationId: null },
    });

    if (!existing) {
      await prisma.planItemType.create({
        data: type,
      });
      console.log(`Created plan item type: ${type.name} (Level ${type.level})`);
    } else {
      console.log(`Plan item type already exists: ${type.name}`);
    }
  }

  // ============================================================================
  // 10. Create Default ContentTypes (Global - no organizationId)
  // ============================================================================
  console.log('Creating default content types...');

  const contentTypes = [
    { name: 'Meeting', slug: 'meeting', description: 'Meeting notes, transcripts, summaries', icon: 'Users', color: '#3b82f6', isSystem: true },
    { name: 'Document', slug: 'document', description: 'Documents, specs, proposals', icon: 'FileText', color: '#10b981', isSystem: true },
    { name: 'Email', slug: 'email', description: 'Email threads and correspondence', icon: 'Mail', color: '#8b5cf6', isSystem: true },
    { name: 'Note', slug: 'note', description: 'Quick notes and updates', icon: 'StickyNote', color: '#f59e0b', isSystem: true },
    { name: 'Transcript', slug: 'transcript', description: 'Call or meeting transcripts', icon: 'FileAudio', color: '#ec4899', isSystem: true },
  ];

  for (const type of contentTypes) {
    const existing = await prisma.contentType.findFirst({
      where: { slug: type.slug, organizationId: null },
    });

    if (!existing) {
      await prisma.contentType.create({
        data: type,
      });
      console.log(`Created content type: ${type.name}`);
    } else {
      console.log(`Content type already exists: ${type.name}`);
    }
  }

  // ============================================================================
  // 11. Create Default ActivityItemTypes (Global - no organizationId)
  // ============================================================================
  console.log('Creating default activity item types...');

  const activityItemTypes = [
    { name: 'Status Update', slug: 'status_update', description: 'Progress or state change', icon: 'RefreshCw', color: '#3b82f6', isSystem: true },
    { name: 'Action Item', slug: 'action_item', description: 'Task to be completed', icon: 'CheckCircle', color: '#10b981', isSystem: true },
    { name: 'Risk', slug: 'risk', description: 'Potential issue identified', icon: 'AlertTriangle', color: '#f59e0b', isSystem: true },
    { name: 'Decision', slug: 'decision', description: 'A decision that was made', icon: 'GitBranch', color: '#8b5cf6', isSystem: true },
    { name: 'Blocker', slug: 'blocker', description: 'Something blocking progress', icon: 'XCircle', color: '#ef4444', isSystem: true },
    { name: 'Milestone Update', slug: 'milestone_update', description: 'Progress toward milestone', icon: 'Flag', color: '#06b6d4', isSystem: true },
    { name: 'Dependency', slug: 'dependency', description: 'External dependency noted', icon: 'Link', color: '#6b7280', isSystem: true },
  ];

  for (const type of activityItemTypes) {
    const existing = await prisma.activityItemType.findFirst({
      where: { slug: type.slug, organizationId: null },
    });

    if (!existing) {
      await prisma.activityItemType.create({
        data: type,
      });
      console.log(`Created activity item type: ${type.name}`);
    } else {
      console.log(`Activity item type already exists: ${type.name}`);
    }
  }

  // Enable some feature flags for sample org
  const flagsToEnable = ['data_export', 'audit_logging', 'custom_roles'];
  const allFlags = await prisma.featureFlag.findMany();

  for (const flag of allFlags) {
    await prisma.organizationFeatureFlag.upsert({
      where: {
        organizationId_featureFlagId: {
          organizationId: sampleOrg.id,
          featureFlagId: flag.id,
        },
      },
      update: {},
      create: {
        organizationId: sampleOrg.id,
        featureFlagId: flag.id,
        platformEnabled: flagsToEnable.includes(flag.key),
        orgEnabled: true,
      },
    });
  }
  console.log('Enabled feature flags for sample organization');

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('\nTest Credentials:');
  console.log('----------------------------------------');
  console.log('Platform Admin:');
  console.log('  Email: admin@agenticledger.ai');
  console.log('  Password: admin123');
  console.log('');
  console.log('Org Admin (Acme Corp):');
  console.log('  Email: orgadmin@acme.local');
  console.log('  Password: orgadmin123');
  console.log('----------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
