import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config/index.js';
import prisma from '../../config/database.js';

interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const generateAccessToken = (userId: string, email: string): string => {
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, config.jwt.secret as Secret, {
    expiresIn: config.jwt.accessExpiry as string,
  } as SignOptions);
};

export const generateRefreshToken = async (
  userId: number,
  userAgent?: string,
  ipAddress?: string
): Promise<string> => {
  const jti = uuidv4();

  // Calculate expiry
  const expiresAt = new Date();
  const expiryDays = parseInt(config.jwt.refreshExpiry.replace('d', ''), 10) || 7;
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // Create refresh token payload
  const payload: RefreshTokenPayload = {
    sub: userId.toString(),
    jti,
    type: 'refresh',
  };

  const token = jwt.sign(payload, config.jwt.secret as Secret, {
    expiresIn: config.jwt.refreshExpiry as string,
  } as SignOptions);

  // Store in database
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  return token;
};

export const generateTokenPair = async (
  userId: number,
  userUuid: string,
  email: string,
  userAgent?: string,
  ipAddress?: string
): Promise<TokenPair> => {
  const accessToken = generateAccessToken(userUuid, email);
  const refreshToken = await generateRefreshToken(userId, userAgent, ipAddress);

  // Calculate expiry in seconds (for access token)
  const expiryMatch = config.jwt.accessExpiry.match(/(\d+)([mhd])/);
  let expiresIn = 900; // default 15 minutes

  if (expiryMatch) {
    const value = parseInt(expiryMatch[1], 10);
    const unit = expiryMatch[2];
    switch (unit) {
      case 'm':
        expiresIn = value * 60;
        break;
      case 'h':
        expiresIn = value * 60 * 60;
        break;
      case 'd':
        expiresIn = value * 60 * 60 * 24;
        break;
    }
  }

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
};

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload & AccessTokenPayload;

    if (payload.type !== 'access') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = async (
  token: string
): Promise<{ valid: boolean; userId?: number; error?: string }> => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload & RefreshTokenPayload;

    if (payload.type !== 'refresh') {
      return { valid: false, error: 'Invalid token type' };
    }

    // Check if token exists in database and is not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      return { valid: false, error: 'Token not found' };
    }

    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, userId: storedToken.userId };
  } catch {
    return { valid: false, error: 'Invalid token' };
  }
};

export const revokeRefreshToken = async (token: string): Promise<boolean> => {
  try {
    await prisma.refreshToken.delete({ where: { token } });
    return true;
  } catch {
    return false;
  }
};

export const revokeAllUserTokens = async (userId: number): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

export const generateEmailVerificationToken = (): { token: string; expires: Date } => {
  const token = uuidv4();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours
  return { token, expires };
};

export const generatePasswordResetToken = (): { token: string; expires: Date } => {
  const token = uuidv4();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour
  return { token, expires };
};

export const generateInvitationToken = (expiryHours: number = 72): { token: string; expires: Date } => {
  const token = uuidv4();
  const expires = new Date();
  expires.setHours(expires.getHours() + expiryHours);
  return { token, expires };
};
