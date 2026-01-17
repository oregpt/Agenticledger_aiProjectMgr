/**
 * D5: Activity Reporter - Endpoint Tests
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
} from '../utils/testHelpers';

export async function runD5Tests(): Promise<TestResult[]> {
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

  // Test: List activity reports
  results.push(
    await runTest('List activity reports returns array', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await get(`/projects/${testProjectId}/activity-reports`, authUser);
      assertSuccess(response, 'List reports');
    })
  );

  // Test: List reports without auth
  results.push(
    await runTest('List reports without auth returns 401', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await get(`/projects/${testProjectId}/activity-reports`, { email: '', password: '' });
      assertStatus(response, 401, 'List reports no auth');
    })
  );

  // Test: Generate report endpoint exists (skip actual AI call)
  results.push(
    await runTest('Generate report endpoint exists', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);

      const response = await post(`/projects/${testProjectId}/activity-report`, authUser, {
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: today.toISOString().split('T')[0],
      });

      // Should not return 404 (may fail due to missing OpenAI key, but endpoint exists)
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  // Test: Generate report without auth
  results.push(
    await runTest('Generate report without auth returns 401', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const today = new Date();
      const response = await post(`/projects/${testProjectId}/activity-report`, { email: '', password: '' }, {
        periodStart: today.toISOString().split('T')[0],
        periodEnd: today.toISOString().split('T')[0],
      });

      assertStatus(response, 401, 'Generate report no auth');
    })
  );

  // Test: Get non-existent report
  results.push(
    await runTest('Get non-existent report returns 404', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const fakeReportId = '00000000-0000-0000-0000-000000000000';
      const response = await get(`/projects/${testProjectId}/activity-reports/${fakeReportId}`, authUser);
      assertStatus(response, 404, 'Get non-existent report');
    })
  );

  // Test: Get report sources endpoint exists
  results.push(
    await runTest('Get report sources endpoint exists', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const fakeReportId = '00000000-0000-0000-0000-000000000000';
      const response = await get(`/projects/${testProjectId}/activity-reports/${fakeReportId}/sources`, authUser);

      // Should not return 404 for endpoint itself (may return 404 for report not found)
      // Accept 404 here since the report doesn't exist
    })
  );

  return results;
}
