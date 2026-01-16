import { User, Organization, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        uuid: string;
        email: string;
        firstName: string;
        lastName: string;
      };
      organizationId?: number;
      organization?: Organization;
      role?: Role;
      permissions?: Map<string, { canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }>;
    }
  }
}

export {};
