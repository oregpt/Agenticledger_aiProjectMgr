export interface AuthUser {
  id: number;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  organizations: OrganizationMembership[];
  createdAt: Date;
}

export interface OrganizationMembership {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  role: {
    id: number;
    name: string;
    slug: string;
    level: number;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  message: string;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
