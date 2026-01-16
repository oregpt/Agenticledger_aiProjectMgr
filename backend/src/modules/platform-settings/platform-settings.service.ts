import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';

export const getAllSettings = async () => {
  const settings = await prisma.platformSetting.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });

  return settings;
};

export const getSettingsByCategory = async (category: string) => {
  const settings = await prisma.platformSetting.findMany({
    where: { category },
    orderBy: { key: 'asc' },
  });

  return settings;
};

export const getSetting = async (key: string) => {
  const setting = await prisma.platformSetting.findUnique({
    where: { key },
  });

  if (!setting) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Setting not found', 404);
  }

  return setting;
};

export const updateSetting = async (key: string, value: string) => {
  const setting = await prisma.platformSetting.findUnique({
    where: { key },
  });

  if (!setting) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Setting not found', 404);
  }

  // Validate value type
  switch (setting.type) {
    case 'NUMBER':
      if (isNaN(Number(value))) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Value must be a number', 400);
      }
      break;
    case 'BOOLEAN':
      if (value !== 'true' && value !== 'false') {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Value must be true or false', 400);
      }
      break;
    case 'JSON':
      try {
        JSON.parse(value);
      } catch {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Value must be valid JSON', 400);
      }
      break;
  }

  const updated = await prisma.platformSetting.update({
    where: { key },
    data: { value },
  });

  return updated;
};

export const getPublicSettings = async () => {
  // Only return non-sensitive settings
  const publicKeys = ['app_name', 'support_email'];

  const settings = await prisma.platformSetting.findMany({
    where: { key: { in: publicKeys } },
  });

  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);
};

export const getSettingValue = async (key: string, defaultValue?: string): Promise<string | undefined> => {
  const setting = await prisma.platformSetting.findUnique({
    where: { key },
  });

  return setting?.value ?? defaultValue;
};
