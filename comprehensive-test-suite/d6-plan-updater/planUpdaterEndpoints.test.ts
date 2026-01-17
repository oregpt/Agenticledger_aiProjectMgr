/**
 * D6: Plan Updater - Endpoint Tests
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
} from '../utils/testHelpers';

export async function runD6Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let authUser: TestUser;
  let testProjectId: string | null = null;

  // Setup: Login and get a test project
  authUser = await login(TEST_ADMIN);

  // Get existing projects
  const projectsResponse = await get('/projects', authUser);
  const projectsData = await projectsResponse.json();

  if (projectsData.data && projectsData.data.length > 0) {
    testProjectId = projectsData.data[0].id;
  }

  // Test: Get plan suggestions endpoint exists
  results.push(
    await runTest('Get plan suggestions endpoint exists', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);

      const response = await post(`/projects/${testProjectId}/plan-suggestions`, authUser, {
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: today.toISOString().split('T')[0],
      });

      // Should not return 404 (may fail due to missing OpenAI key, but endpoint exists)
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  // Test: Get suggestions without auth
  results.push(
    await runTest('Get suggestions without auth returns 401', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const today = new Date();
      const response = await post(`/projects/${testProjectId}/plan-suggestions`, { email: '', password: '' }, {
        periodStart: today.toISOString().split('T')[0],
        periodEnd: today.toISOString().split('T')[0],
      });

      assertStatus(response, 401, 'Suggestions no auth');
    })
  );

  // Test: Apply plan updates endpoint exists
  results.push(
    await runTest('Apply plan updates endpoint exists', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await post(`/projects/${testProjectId}/plan-updates`, authUser, {
        updates: [],
      });

      // Should not return 404 (empty updates should return success or validation error)
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  // Test: Apply updates without auth
  results.push(
    await runTest('Apply updates without auth returns 401', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await post(`/projects/${testProjectId}/plan-updates`, { email: '', password: '' }, {
        updates: [],
      });

      assertStatus(response, 401, 'Updates no auth');
    })
  );

  return results;
}
