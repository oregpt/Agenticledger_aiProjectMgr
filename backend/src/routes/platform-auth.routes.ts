// Platform SSO Login Route
// GET /platform-login — verifies platform token, creates/finds local user, issues local session
// GET /sso-exchange — exchanges one-time code for session tokens (used by frontend /sso-callback)
// This is an ADDITIVE route — existing auth routes are NOT modified

import { Router, Request, Response } from 'express';
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateTokenPair } from '../services/token/token.service.js';
import { verifyPlatformToken, type PlatformClaims } from '../services/platform-sso.service.js';

const router = Router();

// In-memory store for one-time SSO codes (code → tokens, expires after 60s)
const ssoCodeStore = new Map<string, { tokens: any; expiresAt: number }>();

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of ssoCodeStore) {
    if (entry.expiresAt < now) ssoCodeStore.delete(code);
  }
}, 5 * 60 * 1000);

// GET /api/auth/platform-login?token=xxx
router.get('/platform-login', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.redirect('/login?error=missing_token');
    }

    // Verify the platform SSO token (RS256 via JWKS)
    let claims: PlatformClaims;
    try {
      claims = await verifyPlatformToken(token as string);
    } catch (err: any) {
      console.error('Platform SSO token verification failed:', err.message);
      return res.redirect('/login?error=invalid_token');
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email: claims.email.toLowerCase().trim() },
    });

    if (!user) {
      // Create SSO user with random password (they authenticate via platform, not directly)
      const nameParts = claims.name.split(' ');
      const firstName = nameParts[0] || claims.name;
      const lastName = nameParts.slice(1).join(' ') || '-';
      const passwordHash = await bcrypt.hash(crypto.randomBytes(64).toString('hex'), 10);

      user = await prisma.user.create({
        data: {
          email: claims.email.toLowerCase().trim(),
          passwordHash,
          firstName,
          lastName,
        },
      });
    }

    // Find or create organization by slug
    let org = await prisma.organization.findUnique({
      where: { slug: claims.org_slug },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: claims.org_name,
          slug: claims.org_slug,
        },
      });
    }

    // Ensure user is a member of this organization
    const existingMembership = await prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: org.id,
        },
      },
    });

    if (!existingMembership) {
      // Find a system "standard" role to assign (level 20 = member equivalent)
      const memberRole = await prisma.role.findFirst({
        where: {
          slug: 'standard',
          isSystem: true,
        },
      });

      if (memberRole) {
        await prisma.organizationUser.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            roleId: memberRole.id,
          },
        });
      }
    }

    // Generate local session tokens using existing token service
    const tokens = await generateTokenPair(
      user.id,
      user.uuid,
      user.email,
      req.headers['user-agent'],
      req.ip || undefined,
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate a one-time code and store tokens server-side
    // Frontend will exchange this code for tokens via /api/auth/sso-exchange
    const code = crypto.randomBytes(32).toString('hex');
    ssoCodeStore.set(code, {
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        currentOrgId: org.id,
      },
      expiresAt: Date.now() + 60_000, // 60 seconds
    });

    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    return res.redirect(`${frontendUrl}/sso-callback?code=${code}`);
  } catch (err: any) {
    console.error('Platform SSO login error:', err);
    return res.redirect('/login?error=sso_failed');
  }
});

// GET /api/auth/sso-exchange?code=xxx — exchange one-time code for session tokens
router.get('/sso-exchange', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    const entry = ssoCodeStore.get(code);
    if (!entry) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Delete immediately (one-time use)
    ssoCodeStore.delete(code);

    // Check expiry
    if (entry.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Code expired' });
    }

    return res.json({ data: entry.tokens });
  } catch (err: any) {
    console.error('SSO exchange error:', err);
    return res.status(500).json({ error: 'SSO exchange failed' });
  }
});

export default router;
