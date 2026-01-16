import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';

export const getAllFeatureFlags = async () => {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { name: 'asc' },
  });

  return flags;
};

export const getOrganizationFeatureFlags = async (organizationId: number) => {
  // Get all flags with org-specific settings
  const allFlags = await prisma.featureFlag.findMany({
    orderBy: { name: 'asc' },
  });

  const orgFlags = await prisma.organizationFeatureFlag.findMany({
    where: { organizationId },
  });

  const orgFlagMap = new Map(orgFlags.map((f) => [f.featureFlagId, f]));

  return allFlags.map((flag) => {
    const orgFlag = orgFlagMap.get(flag.id);
    const platformEnabled = orgFlag?.platformEnabled ?? flag.defaultEnabled;
    const orgEnabled = orgFlag?.orgEnabled ?? true;

    return {
      featureFlagId: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      platformEnabled,
      orgEnabled,
      effectiveEnabled: platformEnabled && orgEnabled,
    };
  });
};

export const updateOrganizationFeatureFlag = async (
  organizationId: number,
  flagId: number,
  updates: { platformEnabled?: boolean; orgEnabled?: boolean },
  isPlatformAdmin: boolean
) => {
  const flag = await prisma.featureFlag.findUnique({
    where: { id: flagId },
  });

  if (!flag) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Feature flag not found', 404);
  }

  // Get or create org flag record
  let orgFlag = await prisma.organizationFeatureFlag.findUnique({
    where: {
      organizationId_featureFlagId: {
        organizationId,
        featureFlagId: flagId,
      },
    },
  });

  if (!orgFlag) {
    // Create with defaults
    orgFlag = await prisma.organizationFeatureFlag.create({
      data: {
        organizationId,
        featureFlagId: flagId,
        platformEnabled: flag.defaultEnabled,
        orgEnabled: true,
      },
    });
  }

  // Build update data
  const updateData: { platformEnabled?: boolean; orgEnabled?: boolean } = {};

  // Only platform admin can update platformEnabled
  if (updates.platformEnabled !== undefined && isPlatformAdmin) {
    updateData.platformEnabled = updates.platformEnabled;
  }

  // Org admin can only set orgEnabled
  if (updates.orgEnabled !== undefined) {
    // But can't enable if platform has disabled
    if (updates.orgEnabled && !orgFlag.platformEnabled && !updates.platformEnabled) {
      throw new AppError(
        ErrorCodes.FORBIDDEN,
        'Cannot enable feature that is disabled at platform level',
        403
      );
    }
    updateData.orgEnabled = updates.orgEnabled;
  }

  const updated = await prisma.organizationFeatureFlag.update({
    where: { id: orgFlag.id },
    data: updateData,
    include: { featureFlag: true },
  });

  return {
    featureFlagId: updated.featureFlag.id,
    key: updated.featureFlag.key,
    name: updated.featureFlag.name,
    platformEnabled: updated.platformEnabled,
    orgEnabled: updated.orgEnabled,
    effectiveEnabled: updated.platformEnabled && updated.orgEnabled,
  };
};

export const updateFeatureFlagDefault = async (
  flagId: number,
  defaultEnabled: boolean
) => {
  const flag = await prisma.featureFlag.findUnique({
    where: { id: flagId },
  });

  if (!flag) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Feature flag not found', 404);
  }

  const updated = await prisma.featureFlag.update({
    where: { id: flagId },
    data: { defaultEnabled },
  });

  return updated;
};

export const checkFeatureFlag = async (
  organizationId: number,
  flagKey: string
): Promise<boolean> => {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) {
    return false;
  }

  const orgFlag = await prisma.organizationFeatureFlag.findUnique({
    where: {
      organizationId_featureFlagId: {
        organizationId,
        featureFlagId: flag.id,
      },
    },
  });

  if (!orgFlag) {
    return flag.defaultEnabled;
  }

  return orgFlag.platformEnabled && orgFlag.orgEnabled;
};
