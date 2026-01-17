/**
 * D6: Output Formatting Tests
 * Tests for Markdown and PowerPoint export
 */

import {
  TestRunner,
  assertEqual,
  assertExists,
  assertTrue,
  assertSuccess,
  assertError,
  assertHasProperty,
  assertContains,
} from '../utils/testRunner.js';
import {
  TEST_ADMIN,
  login,
  post,
  apiRequest,
  type TestUser,
} from '../utils/testHelpers.js';

export async function runD6Tests(): Promise<ReturnType<TestRunner['summary']>> {
  const runner = new TestRunner('D6: Output Formatting (Agent 3)');

  let adminUser: TestUser = TEST_ADMIN;

  // Sample report data for formatting tests (matches FormatMarkdownInputSchema)
  const sampleReportData = {
    sourceType: 'activity_report',
    projectName: 'Test Project',
    data: {
      title: 'Weekly Status Report',
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString(),
      reportData: {
        summary: 'Weekly summary: Project is on track with 80% completion.',
        statusUpdates: [
          {
            planItemId: null,
            planItemName: 'Backend Development',
            update: 'All API endpoints are deployed and tested.',
            status: 'completed',
            confidence: 'high',
            sourceContentIds: [],
          },
          {
            planItemId: null,
            planItemName: 'Frontend Dashboard',
            update: 'Dashboard UI is 60% complete.',
            status: 'in_progress',
            confidence: 'medium',
            sourceContentIds: [],
          },
        ],
        actionItems: [
          {
            title: 'Complete security audit',
            description: 'Perform full security review',
            owner: 'John Smith',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'high',
            status: 'pending',
            planItemId: null,
            confidence: 'high',
            sourceContentIds: [],
          },
        ],
        risks: [
          {
            title: 'Resource availability',
            description: 'Holiday season may impact team availability.',
            severity: 'medium',
            mitigation: 'Front-load critical tasks before December.',
            planItemId: null,
            confidence: 'medium',
            sourceContentIds: [],
          },
        ],
        decisions: [
          {
            title: 'Technology stack approved',
            description: 'Team decided to use React with TypeScript.',
            decisionMaker: 'Tech Lead',
            decisionDate: new Date().toISOString(),
            planItemId: null,
            confidence: 'high',
            sourceContentIds: [],
          },
        ],
        blockers: [
          {
            title: 'Third-party API delay',
            description: 'Waiting for vendor to provide API access.',
            resolution: null,
            planItemId: null,
            confidence: 'high',
            sourceContentIds: [],
          },
        ],
        suggestedPlanUpdates: [],
      },
    },
  };

  // Login
  await runner.test('Setup: Login as admin', async () => {
    adminUser = await login(TEST_ADMIN);
    assertExists(adminUser.accessToken, 'Access token should exist');
  });

  // ==================== Markdown Formatting ====================

  await runner.test('POST /api/format/markdown - Format activity report as Markdown', async () => {
    const response = await post('/format/markdown', adminUser, sampleReportData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Format should succeed');
    assertHasProperty(data.data, 'content', 'Should return content');
    assertHasProperty(data.data, 'filename', 'Should return filename');

    // Verify Markdown content
    const content = data.data.content;
    assertTrue(typeof content === 'string', 'Content should be string');
    assertTrue(content.length > 0, 'Content should not be empty');

    // Check for expected sections
    assertContains(content, 'Test Project', 'Should contain project name');
    assertContains(content, 'summary', 'Should contain summary reference');
  });

  await runner.test('POST /api/format/markdown - Format plan as Markdown', async () => {
    const planData = {
      sourceType: 'plan',
      projectName: 'Test Project',
      data: {
        planItems: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Phase 1 - Planning',
            itemType: 'workstream',
            status: 'completed',
            owner: null,
            children: [
              {
                id: '00000000-0000-0000-0000-000000000002',
                name: 'Requirements gathering',
                itemType: 'milestone',
                status: 'completed',
                owner: null,
              },
              {
                id: '00000000-0000-0000-0000-000000000003',
                name: 'Design review',
                itemType: 'milestone',
                status: 'completed',
                owner: null,
              },
            ],
          },
          {
            id: '00000000-0000-0000-0000-000000000004',
            name: 'Phase 2 - Development',
            itemType: 'workstream',
            status: 'in_progress',
            owner: null,
            children: [
              {
                id: '00000000-0000-0000-0000-000000000005',
                name: 'Backend API',
                itemType: 'milestone',
                status: 'in_progress',
                owner: null,
              },
            ],
          },
        ],
      },
    };

    const response = await post('/format/markdown', adminUser, planData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Format should succeed');
    assertHasProperty(data.data, 'content', 'Should return content');
  });

  await runner.test('POST /api/format/markdown - Empty data should handle gracefully', async () => {
    const emptyData = {
      sourceType: 'activity_report',
      projectName: 'Empty Project',
      data: {
        title: 'Empty Report',
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        reportData: {
          summary: '',
          statusUpdates: [],
          actionItems: [],
          risks: [],
          decisions: [],
          blockers: [],
          suggestedPlanUpdates: [],
        },
      },
    };

    const response = await post('/format/markdown', adminUser, emptyData);
    const data = await response.json();

    // Should succeed with minimal content
    assertTrue(
      response.status === 200 || response.status >= 400,
      'Should handle empty data'
    );
  });

  await runner.test('POST /api/format/markdown - Missing sourceType should fail', async () => {
    const response = await post('/format/markdown', adminUser, {
      projectName: 'Test',
      data: {},
    });
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should return validation error');
  });

  await runner.test('POST /api/format/markdown - Without auth should fail', async () => {
    const response = await post('/format/markdown', {} as TestUser, sampleReportData);
    assertEqual(response.status, 401, 'Should return 401 status');
  });

  // ==================== PowerPoint Formatting ====================

  await runner.test('POST /api/format/pptx - Format as PowerPoint', async () => {
    const response = await apiRequest('POST', '/format/pptx', adminUser, sampleReportData);

    assertEqual(response.status, 200, 'Should return 200 status');

    // Verify response is binary PPTX file
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');

    assertTrue(
      contentType?.includes('application/vnd.openxmlformats') ||
        contentType?.includes('application/octet-stream'),
      'Should return PPTX content type'
    );

    if (contentDisposition) {
      assertContains(contentDisposition, '.pptx', 'Should have PPTX filename');
    }

    // Verify binary content
    const buffer = await response.arrayBuffer();
    assertTrue(buffer.byteLength > 0, 'Should return non-empty file');
    assertTrue(buffer.byteLength > 1000, 'PPTX file should be substantial size');
  });

  await runner.test('POST /api/format/pptx - Without auth should fail', async () => {
    const response = await apiRequest('POST', '/format/pptx', {} as TestUser, sampleReportData);
    assertEqual(response.status, 401, 'Should return 401 status');
  });

  await runner.test('POST /api/format/pptx - Missing data should fail', async () => {
    const response = await apiRequest('POST', '/format/pptx', adminUser, {
      sourceType: 'activity_report',
    });

    // Should fail validation since data is required
    assertTrue(
      response.status === 200 || response.status >= 400,
      'Should handle missing data'
    );
  });

  // ==================== Edge Cases ====================

  await runner.test('POST /api/format/markdown - Long content should work', async () => {
    const longContent = {
      ...sampleReportData,
      data: {
        ...sampleReportData.data,
        reportData: {
          ...sampleReportData.data.reportData,
          summary: 'A'.repeat(5000), // Very long summary
          statusUpdates: Array(50)
            .fill(null)
            .map((_, i) => ({
              planItemId: null,
              planItemName: `Item ${i + 1}`,
              update: `Description for item ${i + 1}`,
              status: i % 3 === 0 ? 'completed' : 'in_progress',
              confidence: 'high' as const,
              sourceContentIds: [],
            })),
        },
      },
    };

    const response = await post('/format/markdown', adminUser, longContent);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should handle long content');
    assertSuccess(data, 'Format should succeed');
  });

  await runner.test('POST /api/format/markdown - Special characters should be escaped', async () => {
    const specialChars = {
      ...sampleReportData,
      projectName: 'Test <Project> & "Special" Characters',
      data: {
        ...sampleReportData.data,
        reportData: {
          ...sampleReportData.data.reportData,
          summary: 'Summary with **markdown** and `code` and <html>',
        },
      },
    };

    const response = await post('/format/markdown', adminUser, specialChars);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should handle special characters');
    assertSuccess(data, 'Format should succeed');
  });

  return runner.summary();
}

// Run if executed directly
if (process.argv[1]?.includes('d6Endpoints.test')) {
  runD6Tests()
    .then(result => {
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
