/**
 * Test Helpers for AI Project Manager
 * Provides utilities for API testing including authentication, request helpers, and assertions
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface TestUser {
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
  organizationId?: number;
  userId?: number;
}

// Default test credentials from seed
// orgadmin@acme.local is an org admin in acme-corp organization
export const TEST_ADMIN: TestUser = {
  email: 'orgadmin@acme.local',
  password: 'orgadmin123',
};

// Regular user - same as admin for now since seed only creates org admin
export const TEST_USER: TestUser = {
  email: 'orgadmin@acme.local',
  password: 'orgadmin123',
};

// Cache for authenticated users to avoid repeated logins (rate limiting protection)
const authCache = new Map<string, TestUser>();

/**
 * Login and get tokens for a test user (uses cache to avoid rate limiting)
 */
export async function login(user: TestUser, forceRefresh = false): Promise<TestUser> {
  const cacheKey = user.email;

  // Return cached user if available and not forcing refresh
  if (!forceRefresh && authCache.has(cacheKey)) {
    const cached = authCache.get(cacheKey)!;
    if (cached.accessToken) {
      return cached;
    }
  }

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const authenticatedUser: TestUser = {
    ...user,
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    organizationId: data.data.user?.organizations?.[0]?.id,
    userId: data.data.user?.id,
  };

  // Cache the authenticated user
  authCache.set(cacheKey, authenticatedUser);

  return authenticatedUser;
}

/**
 * Clear the auth cache (useful for logout tests)
 */
export function clearAuthCache(): void {
  authCache.clear();
}

/**
 * Get cached user if available (doesn't make a request)
 */
export function getCachedUser(email: string): TestUser | undefined {
  return authCache.get(email);
}

/**
 * Make an authenticated API request with retry logic for rate limiting
 */
export async function apiRequest(
  method: string,
  path: string,
  user: TestUser,
  body?: unknown,
  customHeaders?: Record<string, string>
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(user.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {}),
    ...(user.organizationId ? { 'X-Organization-Id': String(user.organizationId) } : {}),
    ...customHeaders,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  // Retry logic for rate limiting (429 errors)
  const maxRetries = 3;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    lastResponse = response;

    // If not rate limited, return immediately
    if (response.status !== 429) {
      return response;
    }

    // If this was the last attempt, return the 429 response
    if (attempt === maxRetries) {
      return response;
    }

    // Wait with exponential backoff before retrying (1s, 2s, 4s)
    const waitMs = Math.pow(2, attempt) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }

  return lastResponse!;
}

/**
 * GET request helper
 */
export async function get(path: string, user: TestUser): Promise<Response> {
  return apiRequest('GET', path, user);
}

/**
 * POST request helper
 */
export async function post(path: string, user: TestUser, body?: unknown): Promise<Response> {
  return apiRequest('POST', path, user, body);
}

/**
 * PUT request helper
 */
export async function put(path: string, user: TestUser, body?: unknown): Promise<Response> {
  return apiRequest('PUT', path, user, body);
}

/**
 * DELETE request helper
 */
export async function del(path: string, user: TestUser): Promise<Response> {
  return apiRequest('DELETE', path, user);
}

/**
 * Assert that a response is successful (2xx status)
 */
export function assertSuccess(response: Response, testName: string): void {
  if (!response.ok) {
    throw new Error(`${testName}: Expected success status, got ${response.status}`);
  }
}

/**
 * Assert that a response has a specific status code
 */
export function assertStatus(response: Response, expectedStatus: number, testName: string): void {
  if (response.status !== expectedStatus) {
    throw new Error(`${testName}: Expected status ${expectedStatus}, got ${response.status}`);
  }
}

/**
 * Assert that response body has a specific structure
 */
export async function assertResponseHas(response: Response, fields: string[], testName: string): Promise<unknown> {
  const data = await response.json();

  for (const field of fields) {
    const parts = field.split('.');
    let current = data;

    for (const part of parts) {
      if (current === undefined || current === null || !(part in current)) {
        throw new Error(`${testName}: Missing field '${field}' in response`);
      }
      current = current[part];
    }
  }

  return data;
}

/**
 * Run a test with timing and error handling
 */
export async function runTest(testName: string, testFn: () => Promise<void>): Promise<TestResult> {
  const start = Date.now();

  try {
    await testFn();
    return {
      testName,
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      testName,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    };
  }
}

/**
 * Generate a unique test string (for creating unique entities)
 */
export function uniqueString(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clean up test data (soft delete)
 */
export async function cleanup(path: string, user: TestUser): Promise<void> {
  try {
    await del(path, user);
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Print test results summary
 */
export function printResults(results: TestResult[], domain: string): void {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${domain} Test Results`);
  console.log(`${'='.repeat(60)}`);

  for (const result of results) {
    const status = result.passed ? '✓' : '✗';
    const emoji = result.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    console.log(`${emoji}${status}${reset} ${result.testName} (${result.duration}ms)`);
    if (!result.passed && result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }

  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Duration: ${totalDuration}ms`);
  console.log(`${'='.repeat(60)}\n`);
}
