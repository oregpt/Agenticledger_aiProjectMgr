// Platform SSO Token Verification
// Fetches JWKS from AgenticLedger Platform and verifies RS256 tokens

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const PLATFORM_URL = process.env.AGENTICLEDGER_PLATFORM_URL || 'http://localhost:6010';
const JWKS_URL = `${PLATFORM_URL}/api/.well-known/jwks.json`;

let cachedPublicKey: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface PlatformClaims {
  sub: string;
  org_id: string;
  email: string;
  name: string;
  org_name: string;
  org_slug: string;
  role: string;
  entitlements: string[];
  iss: string;
  aud: string;
}

async function fetchPublicKey(): Promise<string> {
  if (cachedPublicKey && Date.now() < cacheExpiry) {
    return cachedPublicKey;
  }

  const response = await fetch(JWKS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS from platform: ${response.status}`);
  }

  const jwks = (await response.json()) as { keys?: Array<Record<string, unknown>> };
  const key = jwks.keys?.[0];
  if (!key) {
    throw new Error('No keys found in platform JWKS');
  }

  const publicKeyObj = crypto.createPublicKey({ key, format: 'jwk' });
  cachedPublicKey = publicKeyObj.export({ type: 'spki', format: 'pem' }) as string;
  cacheExpiry = Date.now() + CACHE_TTL;

  return cachedPublicKey;
}

export async function verifyPlatformToken(token: string): Promise<PlatformClaims> {
  const publicKey = await fetchPublicKey();

  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'agenticledger-platform',
    audience: 'agenticledger-app',
  }) as PlatformClaims;
}
