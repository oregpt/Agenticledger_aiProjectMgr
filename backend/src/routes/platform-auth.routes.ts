// Platform SSO Login Route
// GET /platform-login — verifies platform token, creates/finds local user, issues local session
// This is an ADDITIVE route — existing auth routes are NOT modified

import { Router, Request, Response } from 'express';
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateTokenPair } from '../services/token/token.service.js';
import { verifyPlatformToken, type PlatformClaims } from '../services/platform-sso.service.js';

const router = Router();

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

    // Redirect to frontend with SSO tokens in URL hash fragment
    // Hash fragments are never sent to the server, keeping tokens safe
    // Frontend has an SSO handler that reads the hash, stores tokens in localStorage, and redirects
    const frontendUrl = process.env.FRONTEND_URL || '/';
    const ssoPayload = Buffer.from(JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      currentOrgId: org.id,
      isAuthenticated: true,
    })).toString('base64url');

    return res.redirect(`${frontendUrl}#sso=${ssoPayload}`);
  } catch (err: any) {
    console.error('Platform SSO login error:', err);
    return res.redirect('/login?error=sso_failed');
  }
});

export default router;
