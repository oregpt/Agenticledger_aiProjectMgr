/**
 * D7: Output Formatter - Endpoint Tests
 */

import {
  TestResult,
  TestUser,
  TEST_ADMIN,
  login,
  post,
  runTest,
  assertSuccess,
  assertStatus,
} from '../utils/testHelpers';

export async function runD7Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let authUser: TestUser;

  // Setup: Login
  authUser = await login(TEST_ADMIN);

  // Test sample report data for formatting
  const sampleReportData = {
    sourceType: 'activity_report',
    data: {
      projectName: 'Test Project',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-07',
      summary: 'This is a test summary for the activity report.',
      statusUpdates: [
        {
          title: 'Test status update',
          description: 'Work progressed on testing',
          confidence: 'high',
          planItemName: 'Test Task',
        },
      ],
      actionItems: [
        {
          title: 'Follow up on tests',
          owner: 'Test User',
          dueDate: '2024-01-14',
          status: 'open',
        },
      ],
      risks: [],
      decisions: [],
    },
  };

  // Test: Format as markdown endpoint exists
  results.push(
    await runTest('Format as markdown endpoint exists', async () => {
      const response = await post('/format/markdown', authUser, sampleReportData);

      // Should not return 404
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  // Test: Format markdown with valid data
  results.push(
    await runTest('Format markdown with valid data succeeds', async () => {
      const response = await post('/format/markdown', authUser, sampleReportData);
      assertSuccess(response, 'Format markdown');

      const data = await response.json();
      if (!data.data?.content || typeof data.data.content !== 'string') {
        throw new Error('Expected content string in response');
      }
    })
  );

  // Test: Format markdown without auth
  results.push(
    await runTest('Format markdown without auth returns 401', async () => {
      const response = await post('/format/markdown', { email: '', password: '' }, sampleReportData);
      assertStatus(response, 401, 'Markdown no auth');
    })
  );

  // Test: Format as PPTX endpoint exists
  results.push(
    await runTest('Format as PPTX endpoint exists', async () => {
      const response = await post('/format/pptx', authUser, sampleReportData);

      // Should not return 404
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  // Test: Format PPTX with valid data
  results.push(
    await runTest('Format PPTX with valid data succeeds', async () => {
      const response = await post('/format/pptx', authUser, sampleReportData);
      assertSuccess(response, 'Format PPTX');

      // PPTX returns binary data, just verify success
    })
  );

  // Test: Format PPTX without auth
  results.push(
    await runTest('Format PPTX without auth returns 401', async () => {
      const response = await post('/format/pptx', { email: '', password: '' }, sampleReportData);
      assertStatus(response, 401, 'PPTX no auth');
    })
  );

  return results;
}
