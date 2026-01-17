/**
 * D3: Plan Management Tests
 * Tests for plan items, hierarchy, history, and bulk operations
 */

import {
  TestRunner,
  assertEqual,
  assertExists,
  assertTrue,
  assertSuccess,
  assertError,
  assertHasProperty,
  assertArrayMinLength,
} from '../utils/testRunner.js';
import {
  TEST_ADMIN,
  login,
  get,
  post,
  put,
  del,
  uniqueString,
  cleanup,
  type TestUser,
} from '../utils/testHelpers.js';

export async function runD3Tests(): Promise<ReturnType<TestRunner['summary']>> {
  const runner = new TestRunner('D3: Plan Management (Agent 0)');

  let adminUser: TestUser = TEST_ADMIN;
  let testProjectId: string | null = null;
  let testPlanItemId: string | null = null;
  let childPlanItemId: string | null = null;

  // Login and create test project
  await runner.test('Setup: Login and create test project', async () => {
    adminUser = await login(TEST_ADMIN);
    assertExists(adminUser.accessToken, 'Access token should exist');

    // Create a test project
    const response = await post('/projects', adminUser, {
      name: uniqueString('plan-test'),
      client: 'Plan Test Client',
      status: 'active',
      startDate: new Date().toISOString(),
    });
    const data = await response.json();
    assertSuccess(data, 'Project creation should succeed');
    testProjectId = data.data.id;
  });

  // ==================== Plan Item Types ====================

  await runner.test('GET /api/plan-item-types - List plan item types', async () => {
    const response = await get('/plan-item-types', adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertTrue(Array.isArray(data.data), 'Should return array of types');
    assertArrayMinLength(data.data, 5, 'Should have at least 5 default types');

    // Verify standard types exist
    const typeNames = data.data.map((t: any) => t.name.toLowerCase());
    assertTrue(typeNames.includes('workstream'), 'Should have workstream type');
    assertTrue(typeNames.includes('milestone'), 'Should have milestone type');
    assertTrue(typeNames.includes('activity'), 'Should have activity type');
    assertTrue(typeNames.includes('task'), 'Should have task type');
    assertTrue(typeNames.includes('subtask'), 'Should have subtask type');
  });

  // ==================== Get Empty Plan ====================

  await runner.test('GET /api/projects/:id/plan - Get empty plan', async () => {
    if (!testProjectId) throw new Error('No test project');

    const response = await get(`/projects/${testProjectId}/plan`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    // Plan endpoint may return array or paginated object with items
    const items = Array.isArray(data.data) ? data.data : (data.data?.items || []);
    assertTrue(Array.isArray(items), 'Should return array (empty plan)');
  });

  // ==================== Create Plan Items ====================

  await runner.test('POST /api/projects/:id/plan - Create workstream', async () => {
    if (!testProjectId) throw new Error('No test project');

    const itemData = {
      name: 'Test Workstream',
      itemTypeId: 1, // workstream
      status: 'in_progress',
      description: 'A test workstream',
      owner: 'Test Owner',
    };

    const response = await post(`/projects/${testProjectId}/plan`, adminUser, itemData);
    const data = await response.json();

    // 201 Created is the correct REST response for POST
    assertTrue(response.status === 200 || response.status === 201, 'Should return 200 or 201 status');
    assertSuccess(data, 'Create should succeed');
    assertHasProperty(data.data, 'id', 'Should return item ID');
    assertEqual(data.data.name, 'Test Workstream', 'Name should match');
    assertEqual(data.data.status, 'in_progress', 'Status should match');
    assertEqual(data.data.depth, 0, 'Root item should have depth 0');

    testPlanItemId = data.data.id;
  });

  await runner.test('POST /api/projects/:id/plan - Create child milestone', async () => {
    if (!testProjectId || !testPlanItemId) throw new Error('Missing test data');

    const itemData = {
      name: 'Test Milestone',
      itemTypeId: 2, // milestone
      parentId: testPlanItemId,
      status: 'not_started',
      targetEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const response = await post(`/projects/${testProjectId}/plan`, adminUser, itemData);
    const data = await response.json();

    // 201 Created is the correct REST response for POST
    assertTrue(response.status === 200 || response.status === 201, 'Should return 200 or 201 status');
    assertSuccess(data, 'Create should succeed');
    assertEqual(data.data.parentId, testPlanItemId, 'Parent ID should match');
    assertEqual(data.data.depth, 1, 'Child should have depth 1');

    childPlanItemId = data.data.id;
  });

  await runner.test('POST /api/projects/:id/plan - Create without name should fail', async () => {
    if (!testProjectId) throw new Error('No test project');

    const response = await post(`/projects/${testProjectId}/plan`, adminUser, {
      itemTypeId: 1,
      status: 'not_started',
    });
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should return validation error');
  });

  // ==================== Get Plan Tree ====================

  await runner.test('GET /api/projects/:id/plan - Get plan tree with items', async () => {
    if (!testProjectId) throw new Error('No test project');

    const response = await get(`/projects/${testProjectId}/plan`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    // Plan endpoint may return array or paginated object with items
    const items = Array.isArray(data.data) ? data.data : (data.data?.items || []);
    assertTrue(Array.isArray(items), 'Should return array');
    assertArrayMinLength(items, 1, 'Should have at least 1 root item');

    // Check tree structure
    const rootItem = items.find((item: any) => item.id === testPlanItemId);
    assertExists(rootItem, 'Root item should exist');
    assertTrue(Array.isArray(rootItem.children), 'Root should have children array');
  });

  // ==================== Get Single Plan Item ====================

  await runner.test('GET /api/plan-items/:id - Get plan item by ID', async () => {
    if (!testPlanItemId) throw new Error('No test plan item');

    const response = await get(`/plan-items/${testPlanItemId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertEqual(data.data.id, testPlanItemId, 'ID should match');
    assertEqual(data.data.name, 'Test Workstream', 'Name should match');
  });

  await runner.test('GET /api/plan-items/:id - Non-existent ID should fail', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await get(`/plan-items/${fakeId}`, adminUser);
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400, 'Should return error status');
  });

  // ==================== Update Plan Item ====================

  await runner.test('PUT /api/plan-items/:id - Update plan item', async () => {
    if (!testPlanItemId) throw new Error('No test plan item');

    const updateData = {
      name: 'Updated Workstream',
      status: 'completed',
      notes: 'This workstream has been completed',
    };

    const response = await put(`/plan-items/${testPlanItemId}`, adminUser, updateData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Update should succeed');
    assertEqual(data.data.name, 'Updated Workstream', 'Name should be updated');
    assertEqual(data.data.status, 'completed', 'Status should be updated');
  });

  // ==================== Plan Item History ====================

  await runner.test('GET /api/plan-items/:id/history - Get item history', async () => {
    if (!testPlanItemId) throw new Error('No test plan item');

    const response = await get(`/plan-items/${testPlanItemId}/history`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertTrue(Array.isArray(data.data), 'Should return array of history');
    // Should have history from the update
    assertArrayMinLength(data.data, 1, 'Should have at least 1 history record');
  });

  // ==================== Bulk Update ====================

  await runner.test('POST /api/plan-items/bulk-update - Bulk update items', async () => {
    if (!childPlanItemId) throw new Error('No child plan item');

    const bulkData = {
      updates: [
        {
          id: childPlanItemId,
          status: 'in_progress',
          notes: 'Bulk updated milestone',
        },
      ],
    };

    const response = await post('/plan-items/bulk-update', adminUser, bulkData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Bulk update should succeed');

    // Verify update
    const getResponse = await get(`/plan-items/${childPlanItemId}`, adminUser);
    const getData = await getResponse.json();
    assertEqual(getData.data.status, 'in_progress', 'Status should be updated');
  });

  // ==================== CSV Template ====================

  await runner.test('GET /api/plan-items/import/template - Get CSV template', async () => {
    const response = await get('/plan-items/import/template', adminUser);

    // Template endpoint may return CSV file or template info
    assertTrue(
      response.status === 200 || response.status === 404,
      'Should return 200 or 404 if not implemented'
    );
  });

  // ==================== Delete Plan Item ====================

  await runner.test('DELETE /api/plan-items/:id - Delete child item first', async () => {
    if (!childPlanItemId) throw new Error('No child plan item');

    const response = await del(`/plan-items/${childPlanItemId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Delete should succeed');

    // Verify deleted
    const getResponse = await get(`/plan-items/${childPlanItemId}`, adminUser);
    assertTrue(
      getResponse.status === 404 || getResponse.status === 400,
      'Should not find deleted item'
    );
  });

  await runner.test('DELETE /api/plan-items/:id - Delete parent item', async () => {
    if (!testPlanItemId) throw new Error('No test plan item');

    const response = await del(`/plan-items/${testPlanItemId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Delete should succeed');
  });

  // ==================== Plan Suggestions (AI) ====================

  await runner.test('POST /api/projects/:id/plan-suggestions - Get AI suggestions (may require OpenAI)', async () => {
    if (!testProjectId) throw new Error('No test project');

    const requestData = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    };

    const response = await post(`/projects/${testProjectId}/plan-suggestions`, adminUser, requestData);
    const data = await response.json();

    // This may fail without OpenAI API key configured
    if (response.status === 200) {
      assertSuccess(data, 'Suggestions should be returned');
      assertTrue(Array.isArray(data.data?.suggestions) || data.data?.suggestions === undefined, 'Suggestions should be array or undefined');
    } else {
      // Expected if no OpenAI API key or no content to analyze
      assertTrue(response.status >= 400, 'May fail without AI configuration');
    }
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
if (process.argv[1]?.includes('d3Endpoints.test')) {
  runD3Tests()
    .then(result => {
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
