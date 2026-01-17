/**
 * D1: Authentication & Users - Endpoint Tests
 */

import {
  TestResult,
  TestUser,
  TEST_ADMIN,
  login,
  get,
  post,
  runTest,
  assertSuccess,
  assertStatus,
  assertResponseHas,
  uniqueString,
} from '../utils/testHelpers';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

export async function runD1Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let authUser: TestUser = { ...TEST_ADMIN };

  // Test: Login with valid credentials
  results.push(
    await runTest('Login with valid credentials', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_ADMIN.email, password: TEST_ADMIN.password }),
      });

      assertSuccess(response, 'Login');
      const data = await assertResponseHas(response, ['data.accessToken', 'data.refreshToken'], 'Login') as any;

      authUser = {
        ...TEST_ADMIN,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        organizationId: data.data.organizations?.[0]?.id,
        userId: data.data.user?.id,
      };
    })
  );

  // Test: Login with invalid credentials
  results.push(
    await runTest('Login with invalid credentials returns 401', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bad@email.com', password: 'wrongpassword' }),
      });

      assertStatus(response, 401, 'Invalid login');
    })
  );

  // Test: Get current user with valid token
  results.push(
    await runTest('Get /me with valid token succeeds', async () => {
      const response = await get('/auth/me', authUser);
      assertSuccess(response, 'Get me');
      await assertResponseHas(response, ['data.id', 'data.email'], 'Get me');
    })
  );

  // Test: Get current user without token
  results.push(
    await runTest('Get /me without token returns 401', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/me`);
      assertStatus(response, 401, 'Get me without token');
    })
  );

  // Test: Refresh token
  results.push(
    await runTest('Refresh token returns new access token', async () => {
      if (!authUser.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: authUser.refreshToken }),
      });

      assertSuccess(response, 'Refresh token');
      await assertResponseHas(response, ['data.accessToken'], 'Refresh token');
    })
  );

  // Test: List organization users
  results.push(
    await runTest('List organization users succeeds', async () => {
      const response = await get('/users', authUser);
      assertSuccess(response, 'List users');
      await assertResponseHas(response, ['data'], 'List users');
    })
  );

  // Test: List users without auth
  results.push(
    await runTest('List users without auth returns 401', async () => {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'X-Organization-Id': String(authUser.organizationId) },
      });
      assertStatus(response, 401, 'List users without auth');
    })
  );

  // Test: List organizations
  results.push(
    await runTest('List organizations returns user orgs', async () => {
      const response = await get('/organizations', authUser);
      assertSuccess(response, 'List orgs');
      await assertResponseHas(response, ['data'], 'List orgs');
    })
  );

  // Test: Change password (skip actual change to preserve test user)
  results.push(
    await runTest('Change password endpoint exists', async () => {
      // Send intentionally bad request to verify endpoint exists
      const response = await post('/auth/change-password', authUser, {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      });

      // Should return 400/401 (bad request or wrong password), not 404
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  // Test: Register (skip actual registration to avoid creating test users)
  results.push(
    await runTest('Register endpoint exists', async () => {
      // Send request with existing email to verify endpoint exists
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_ADMIN.email,
          password: 'testpassword123',
          firstName: 'Test',
          lastName: 'User',
        }),
      });

      // Should return 400/409 (validation error or email exists), not 404
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  return results;
}
