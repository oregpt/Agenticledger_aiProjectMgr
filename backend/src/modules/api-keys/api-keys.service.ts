import prisma from '../../config/database.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * API Keys Service
 * Handles creation, listing, and revocation of API keys for tenants
 */

const API_KEY_PREFIX = 'aipm_';
const SALT_ROUNDS = 10;

/**
 * Generate a secure random API key
 * Format: aipm_<32 random alphanumeric characters>
 */
function generateApiKey(): string {
  const randomPart = crypto.randomBytes(24).toString('base64url'); // 32 chars
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Extract the prefix for display (first 12 chars including aipm_)
 */
function extractKeyPrefix(key: string): string {
  return key.substring(0, 12) + '...';
}

/**
 * List all API keys for an organization
 * Returns only safe fields (no key hash)
 */
export async function listApiKeys(organizationId: number) {
  const keys = await prisma.apiKey.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return keys;
}

/**
 * Create a new API key
 * Returns the full key ONLY on creation - it cannot be retrieved later
 */
export async function createApiKey(
  organizationId: number,
  createdByUserId: number,
  name: string,
  expiresAt?: Date
) {
  // Generate the key
  const rawKey = generateApiKey();
  const keyPrefix = extractKeyPrefix(rawKey);

  // Hash the key for storage
  const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);

  // Store in database
  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId,
      name,
      keyHash,
      keyPrefix,
      createdByUserId,
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  // Return the full key (only time it's available)
  return {
    ...apiKey,
    key: rawKey, // This is the only time the full key is returned
  };
}

/**
 * Revoke (soft delete) an API key
 */
export async function revokeApiKey(
  organizationId: number,
  keyId: string
) {
  // Verify the key belongs to this org
  const existing = await prisma.apiKey.findFirst({
    where: {
      id: keyId,
      organizationId,
      isActive: true,
    },
  });

  if (!existing) {
    return null;
  }

  // Soft delete
  const revoked = await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      revokedAt: true,
    },
  });

  return revoked;
}

/**
 * Validate an API key and return the associated organization
 * Used by the API key auth middleware
 */
export async function validateApiKey(rawKey: string) {
  // Check format
  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyPrefix = extractKeyPrefix(rawKey);

  // Find keys with matching prefix (narrows down the search)
  const candidates = await prisma.apiKey.findMany({
    where: {
      keyPrefix,
      isActive: true,
    },
    include: {
      organization: {
        select: {
          id: true,
          uuid: true,
          name: true,
          slug: true,
          isActive: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          uuid: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      },
    },
  });

  // Check each candidate against the hash
  for (const candidate of candidates) {
    const isMatch = await bcrypt.compare(rawKey, candidate.keyHash);

    if (isMatch) {
      // Check if expired
      if (candidate.expiresAt && candidate.expiresAt < new Date()) {
        return null;
      }

      // Check if org is active
      if (!candidate.organization.isActive) {
        return null;
      }

      // Check if user who created it is still active
      if (!candidate.createdBy.isActive) {
        return null;
      }

      // Update last used timestamp (fire and forget)
      prisma.apiKey.update({
        where: { id: candidate.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {}); // Ignore errors

      return {
        apiKey: candidate,
        organization: candidate.organization,
        user: candidate.createdBy,
      };
    }
  }

  return null;
}

/**
 * Get a single API key by ID (for admin purposes)
 */
export async function getApiKeyById(organizationId: number, keyId: string) {
  return prisma.apiKey.findFirst({
    where: {
      id: keyId,
      organizationId,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      revokedAt: true,
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}
