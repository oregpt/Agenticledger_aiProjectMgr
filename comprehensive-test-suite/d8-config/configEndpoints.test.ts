/**
 * D8: Configuration - Endpoint Tests
 */

import {
  TestResult,
  TestUser,
  TEST_ADMIN,
  login,
  get,
  post,
  put,
  del,
  runTest,
  assertSuccess,
  assertStatus,
  uniqueString,
} from '../utils/testHelpers';

export async function runD8Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let authUser: TestUser;
  let createdPlanItemTypeId: string | null = null;
  let createdContentTypeId: string | null = null;
  let createdActivityTypeId: string | null = null;
  let systemPlanItemTypeId: string | null = null;

  // Setup: Login
  authUser = await login(TEST_ADMIN);

  // ==================== Plan Item Types ====================

  // Test: List plan item types
  results.push(
    await runTest('List plan item types returns array', async () => {
      const response = await get('/config/plan-item-types', authUser);
      assertSuccess(response, 'List plan item types');
      const data = await response.json();
      if (!Array.isArray(data.data)) {
        throw new Error('Expected array of plan item types');
      }
      // Store a system type ID for later test
      const systemType = data.data.find((t: any) => t.isSystem === true);
      if (systemType) {
        systemPlanItemTypeId = systemType.id;
      }
    })
  );

  // Test: Create custom plan item type
  results.push(
    await runTest('Create custom plan item type succeeds', async () => {
      const response = await post('/config/plan-item-types', authUser, {
        name: uniqueString('CustomPlanType'),
        slug: uniqueString('custom_plan_type'),
        level: 3,
        description: 'Custom type created by tests',
      });

      assertSuccess(response, 'Create plan item type');
      const data = await response.json();
      createdPlanItemTypeId = data.data.id;
    })
  );

  // Test: Cannot edit system plan item types
  results.push(
    await runTest('Cannot edit system plan item types', async () => {
      if (!systemPlanItemTypeId) {
        // If no system type found, skip this test
        return;
      }

      const response = await put(`/config/plan-item-types/${systemPlanItemTypeId}`, authUser, {
        name: 'Modified System Type',
      });

      // Should return 400 or 403 for system type
      if (response.ok) {
        throw new Error('Should not be able to edit system type');
      }
    })
  );

  // Test: Delete custom plan item type
  results.push(
    await runTest('Delete custom plan item type succeeds', async () => {
      if (!createdPlanItemTypeId) throw new Error('No custom type created');

      const response = await del(`/config/plan-item-types/${createdPlanItemTypeId}`, authUser);
      assertSuccess(response, 'Delete plan item type');
    })
  );

  // ==================== Content Types ====================

  // Test: List content types
  results.push(
    await runTest('List content types returns array', async () => {
      const response = await get('/config/content-types', authUser);
      assertSuccess(response, 'List content types');
      const data = await response.json();
      if (!Array.isArray(data.data)) {
        throw new Error('Expected array of content types');
      }
    })
  );

  // Test: Create custom content type
  results.push(
    await runTest('Create custom content type succeeds', async () => {
      const response = await post('/config/content-types', authUser, {
        name: uniqueString('CustomContentType'),
        slug: uniqueString('custom_content_type'),
        description: 'Custom content type created by tests',
      });

      assertSuccess(response, 'Create content type');
      const data = await response.json();
      createdContentTypeId = data.data.id;
    })
  );

  // Test: Delete custom content type
  results.push(
    await runTest('Delete custom content type succeeds', async () => {
      if (!createdContentTypeId) throw new Error('No custom content type created');

      const response = await del(`/config/content-types/${createdContentTypeId}`, authUser);
      assertSuccess(response, 'Delete content type');
    })
  );

  // ==================== Activity Types ====================

  // Test: List activity types
  results.push(
    await runTest('List activity types returns array', async () => {
      const response = await get('/config/activity-types', authUser);
      assertSuccess(response, 'List activity types');
      const data = await response.json();
      if (!Array.isArray(data.data)) {
        throw new Error('Expected array of activity types');
      }
    })
  );

  // Test: Create custom activity type
  results.push(
    await runTest('Create custom activity type succeeds', async () => {
      const response = await post('/config/activity-types', authUser, {
        name: uniqueString('CustomActivityType'),
        slug: uniqueString('custom_activity_type'),
        description: 'Custom activity type created by tests',
      });

      assertSuccess(response, 'Create activity type');
      const data = await response.json();
      createdActivityTypeId = data.data.id;
    })
  );

  // Test: Delete custom activity type
  results.push(
    await runTest('Delete custom activity type succeeds', async () => {
      if (!createdActivityTypeId) throw new Error('No custom activity type created');

      const response = await del(`/config/activity-types/${createdActivityTypeId}`, authUser);
      assertSuccess(response, 'Delete activity type');
    })
  );

  // ==================== Auth Tests ====================

  // Test: List types without auth
  results.push(
    await runTest('List plan item types without auth returns 401', async () => {
      const response = await get('/config/plan-item-types', { email: '', password: '' });
      assertStatus(response, 401, 'No auth');
    })
  );

  return results;
}
