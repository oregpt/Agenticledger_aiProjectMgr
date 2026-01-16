import prisma from '../../config/database.js';

export const getAllMenus = async () => {
  const menus = await prisma.menu.findMany({
    where: { isActive: true },
    orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
  });

  return menus.map((menu) => ({
    id: menu.id,
    uuid: menu.uuid,
    name: menu.name,
    slug: menu.slug,
    description: menu.description,
    icon: menu.icon,
    path: menu.path,
    sortOrder: menu.sortOrder,
    section: menu.section,
    parentId: menu.parentId,
  }));
};

export const getMenusBySection = async (section: string) => {
  const menus = await prisma.menu.findMany({
    where: {
      isActive: true,
      section: section as any,
    },
    orderBy: { sortOrder: 'asc' },
  });

  return menus;
};

export const getUserMenus = async (userId: number, organizationId: number) => {
  // Get user's permissions for this org
  const membership = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              menu: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return [];
  }

  // Filter menus based on permissions (at least read access)
  const accessibleMenus = membership.role.permissions
    .filter((p) => p.canRead)
    .map((p) => ({
      id: p.menu.id,
      uuid: p.menu.uuid,
      name: p.menu.name,
      slug: p.menu.slug,
      icon: p.menu.icon,
      path: p.menu.path,
      section: p.menu.section,
      sortOrder: p.menu.sortOrder,
      permissions: {
        canCreate: p.canCreate,
        canRead: p.canRead,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
      },
    }));

  // Sort by section and sortOrder
  return accessibleMenus.sort((a, b) => {
    const sectionOrder = { MAIN: 0, ADMIN: 1, PLATFORM_ADMIN: 2 };
    const aSectionOrder = sectionOrder[a.section as keyof typeof sectionOrder] ?? 99;
    const bSectionOrder = sectionOrder[b.section as keyof typeof sectionOrder] ?? 99;

    if (aSectionOrder !== bSectionOrder) {
      return aSectionOrder - bSectionOrder;
    }
    return a.sortOrder - b.sortOrder;
  });
};
