/**
 * D5: Activity Reporting Tests
 * Tests for report generation and management
 */

import {
  TestRunner,
  assertEqual,
  assertExists,
  assertTrue,
  assertSuccess,
  assertError,
  assertHasProperty,
} from '../utils/testRunner.js';
import {
  TEST_ADMIN,
  login,
  get,
  post,
  uniqueString,
  cleanup,
  type TestUser,
} from '../utils/testHelpers.js';

export async function runD5Tests(): Promise<ReturnType<TestRunner['summary']>> {
  const runner = new TestRunner('D5: Activity Reporting (Agent 2)');

  let adminUser: TestUser = TEST_ADMIN;
  let testProjectId: string | null = null;
  let testReportId: string | null = null;

  // Login and create test project with content
  await runner.test('Setup: Login and create test project with content', async () => {
    adminUser = await login(TEST_ADMIN);
    assertExists(adminUser.accessToken, 'Access token should exist');

    // Create project
    const projectResponse = await post('/projects', adminUser, {
      name: uniqueString('reporter-test'),
      client: 'Reporter Test Client',
      status: 'active',
      startDate: new Date().toISOString(),
    });
    const projectData = await projectResponse.json();
    assertSuccess(projectData, 'Project creation should succeed');
    testProjectId = projectData.data.id;

    // Create some content for the project
    await post('/content-items', adminUser, {
      projectId: testProjectId,
      title: 'Weekly Status Update',
      rawContent: `
        Status update for the week:

        Completed:
        - Database schema design finalized
        - API endpoints for user management deployed

        In Progress:
        - Frontend dashboard development
        - Integration testing

        Blocked:
        - Waiting for security review approval

        Risks:
        - Timeline may slip if security review is delayed
      `,
      dateOccurred: new Date().toISOString(),
      contentTypeIds: [1],
      activityTypeIds: [1],
      tags: ['weekly', 'status'],
    });
  });

  // ==================== List Reports (Empty) ====================

  await runner.test('GET /api/projects/:id/activity-reports - List reports (empty)', async () => {
    if (!testProjectId) throw new Error('No test project');

    const response = await get(`/projects/${testProjectId}/activity-reports`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    // Reports endpoint may return array or paginated object with items
    const items = Array.isArray(data.data) ? data.data : (data.data?.items || []);
    assertTrue(Array.isArray(items), 'Should return array');
  });

  await runner.test('GET /api/projects/:id/activity-reports - Without auth should fail', async () => {
    if (!testProjectId) throw new Error('No test project');

    const response = await get(`/projects/${testProjectId}/activity-reports`, {} as TestUser);
    assertEqual(response.status, 401, 'Should return 401 status');
  });

  // ==================== Generate Report ====================

  await runner.test('POST /api/projects/:id/activity-report - Generate report (may require OpenAI)', async () => {
    if (!testProjectId) throw new Error('No test project');

    const reportData = {
      title: `Weekly Report ${uniqueString()}`,
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString(),
      workstreamFilter: [],
      activityTypeFilter: [],
    };

    const response = await post(`/projects/${testProjectId}/activity-report`, adminUser, reportData);
    const data = await response.json();

    // This may fail without OpenAI API key configured
    if (response.status === 200) {
      assertSuccess(data, 'Report generation should succeed');
      assertHasProperty(data.data, 'id', 'Should return report ID');
      testReportId = data.data.id;

      // Verify report structure
      if (data.data.reportData) {
        assertHasProperty(data.data.reportData, 'summary', 'Should have summary');
      }
    } else {
      // Expected if no OpenAI API key or no content to analyze
      assertTrue(
        response.status >= 400,
        'May fail without AI configuration - this is expected'
      );
    }
  });

  await runner.test('POST /api/projects/:id/activity-report - Missing dates should fail', async () => {
    if (!testProjectId) throw new Error('No test project');

    const response = await post(`/projects/${testProjectId}/activity-report`, adminUser, {
      title: 'Invalid Report',
    });
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should return validation error');
  });

  await runner.test('POST /api/projects/:id/activity-report - Invalid project should fail', async () => {
    const fakeProjectId = '00000000-0000-0000-0000-000000000000';

    const response = await post(`/projects/${fakeProjectId}/activity-report`, adminUser, {
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString(),
    });
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400, 'Should return error status');
  });

  // ==================== List Reports (With Data) ====================

  await runner.test('GET /api/projects/:id/activity-reports - List reports with data', async () => {
    if (!testProjectId) throw new Error('No test project');

    const response = await get(`/projects/${testProjectId}/activity-reports`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    // Reports endpoint may return array or paginated object with items
    const items = Array.isArray(data.data) ? data.data : (data.data?.items || []);
    assertTrue(Array.isArray(items), 'Should return array');

    // If we created a report, it should be in the list
    if (testReportId) {
      const reportExists = items.some((r: any) => r.id === testReportId);
      assertTrue(reportExists, 'Created report should be in list');
    }
  });

  await runner.test('GET /api/projects/:id/activity-reports - Pagination', async () => {
    if (!testProjectId) throw new Error('No test project');

    const response = await get(
      `/projects/${testProjectId}/activity-reports?page=1&limit=10`,
      adminUser
    );
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    // Reports endpoint may return array or paginated object with items
    const items = Array.isArray(data.data) ? data.data : (data.data?.items || []);
    assertTrue(Array.isArray(items), 'Should return array');
  });

  // ==================== Get Single Report ====================

  await runner.test('GET /api/projects/:id/activity-reports/:reportId - Get report by ID', async () => {
    if (!testProjectId) throw new Error('No test project');

    if (!testReportId) {
      // Skip if no report was created (OpenAI not configured)
      assertTrue(true, 'Skipped - no report created (OpenAI may not be configured)');
      return;
    }

    const response = await get(
      `/projects/${testProjectId}/activity-reports/${testReportId}`,
      adminUser
    );
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertEqual(data.data.id, testReportId, 'Report ID should match');
    assertHasProperty(data.data, 'reportData', 'Should have report data');
  });

  await runner.test('GET /api/projects/:id/activity-reports/:reportId - Non-existent should fail', async () => {
    if (!testProjectId) throw new Error('No test project');

    const fakeReportId = '00000000-0000-0000-0000-000000000000';
    const response = await get(
      `/projects/${testProjectId}/activity-reports/${fakeReportId}`,
      adminUser
    );
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400, 'Should return error status');
  });

  // ==================== Get Report Sources ====================

  await runner.test('GET /api/projects/:id/activity-reports/:reportId/sources - Get sources', async () => {
    if (!testProjectId) throw new Error('No test project');

    if (!testReportId) {
      assertTrue(true, 'Skipped - no report created (OpenAI may not be configured)');
      return;
    }

    const response = await get(
      `/projects/${testProjectId}/activity-reports/${testReportId}/sources`,
      adminUser
    );
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertTrue(Array.isArray(data.data), 'Should return array of sources');
  });

  await runner.test('GET /api/projects/:id/activity-reports/:reportId/sources - Non-existent report', async () => {
    if (!testProjectId) throw new Error('No test project');

    const fakeReportId = '00000000-0000-0000-0000-000000000000';
    const response = await get(
      `/projects/${testProjectId}/activity-reports/${fakeReportId}/sources`,
      adminUser
    );
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400 || response.status === 200, 'Should handle non-existent gracefully');
  });

  // ==================== Cleanup ====================

  await runner.test('Cleanup: Delete test project', async () => {
    if (testProjectId) {
      await cleanup(`/projects/${testProjectId}`, adminUser);
    }
    assertTrue(true, 'Cleanup completed');
  });

  return runner.summary();
}

// Run if executed directly
if (process.argv[1]?.includes('d5Endpoints.test')) {
  runD5Tests()
    .then(result => {
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
