/**
 * D7: Configuration Tests
 * Tests for plan item types, content types, and activity types management
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

export async function runD7Tests(): Promise<ReturnType<TestRunner['summary']>> {
  const runner = new TestRunner('D7: Configuration');

  let adminUser: TestUser = TEST_ADMIN;
  let customPlanItemTypeId: number | null = null;
  let customContentTypeId: number | null = null;
  let customActivityTypeId: number | null = null;

  // Login
  await runner.test('Setup: Login as admin', async () => {
    adminUser = await login(TEST_ADMIN);
    assertExists(adminUser.accessToken, 'Access token should exist');
    assertExists(adminUser.organizationId, 'Organization ID should exist');
  });

  // ==================== Plan Item Types ====================

  await runner.test('GET /api/config/plan-item-types - List all plan item types', async () => {
    const response = await get('/config/plan-item-types', adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertTrue(Array.isArray(data.data), 'Should return array');
    assertArrayMinLength(data.data, 5, 'Should have default system types');

    // Verify system types exist
    const systemTypes = data.data.filter((t: any) => t.isSystem);
    assertArrayMinLength(systemTypes, 5, 'Should have 5 system types');
  });

  await runner.test('POST /api/config/plan-item-types - Create custom type', async () => {
    const typeData = {
      name: `Custom Phase ${uniqueString()}`,
      slug: uniqueString('phase'),
      description: 'A custom project phase',
      level: 1,
      icon: 'folder',
      color: '#3498db',
    };

    const response = await post('/config/plan-item-types', adminUser, typeData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Create should succeed');
    assertHasProperty(data.data, 'id', 'Should return type ID');
    assertEqual(data.data.isSystem, false, 'Custom type should not be system');

    customPlanItemTypeId = data.data.id;
  });

  await runner.test('POST /api/config/plan-item-types - Duplicate slug should fail', async () => {
    const slug = uniqueString('dup');

    // Create first
    await post('/config/plan-item-types', adminUser, {
      name: 'First Type',
      slug,
      level: 1,
    });

    // Try duplicate
    const response = await post('/config/plan-item-types', adminUser, {
      name: 'Second Type',
      slug, // Same slug
      level: 1,
    });
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should return duplicate error');
  });

  await runner.test('GET /api/config/plan-item-types/:id - Get type by ID', async () => {
    if (!customPlanItemTypeId) throw new Error('No custom type created');

    const response = await get(`/config/plan-item-types/${customPlanItemTypeId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertEqual(data.data.id, customPlanItemTypeId, 'ID should match');
  });

  await runner.test('PUT /api/config/plan-item-types/:id - Update custom type', async () => {
    if (!customPlanItemTypeId) throw new Error('No custom type created');

    const response = await put(`/config/plan-item-types/${customPlanItemTypeId}`, adminUser, {
      name: 'Updated Phase Name',
      color: '#e74c3c',
    });
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Update should succeed');
    assertEqual(data.data.name, 'Updated Phase Name', 'Name should be updated');
  });

  await runner.test('PUT /api/config/plan-item-types/:id - Update system type should fail', async () => {
    // Get a system type
    const listResponse = await get('/config/plan-item-types', adminUser);
    const listData = await listResponse.json();
    const systemType = listData.data.find((t: any) => t.isSystem);

    if (!systemType) {
      assertTrue(true, 'No system type found to test');
      return;
    }

    const response = await put(`/config/plan-item-types/${systemType.id}`, adminUser, {
      name: 'Hacked Name',
    });
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should not allow editing system type');
  });

  await runner.test('DELETE /api/config/plan-item-types/:id - Delete custom type', async () => {
    if (!customPlanItemTypeId) throw new Error('No custom type created');

    const response = await del(`/config/plan-item-types/${customPlanItemTypeId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Delete should succeed');

    customPlanItemTypeId = null;
  });

  await runner.test('DELETE /api/config/plan-item-types/:id - Delete system type should fail', async () => {
    // Get a system type
    const listResponse = await get('/config/plan-item-types', adminUser);
    const listData = await listResponse.json();
    const systemType = listData.data.find((t: any) => t.isSystem);

    if (!systemType) {
      assertTrue(true, 'No system type found to test');
      return;
    }

    const response = await del(`/config/plan-item-types/${systemType.id}`, adminUser);
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should not allow deleting system type');
  });

  // ==================== Content Types ====================

  await runner.test('GET /api/config/content-types - List all content types', async () => {
    const response = await get('/config/content-types', adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertTrue(Array.isArray(data.data), 'Should return array');
    assertArrayMinLength(data.data, 5, 'Should have default system types');
  });

  await runner.test('POST /api/config/content-types - Create custom type', async () => {
    const typeData = {
      name: `Custom Content ${uniqueString()}`,
      slug: uniqueString('content'),
      description: 'A custom content type',
      icon: 'file',
      color: '#9b59b6',
    };

    const response = await post('/config/content-types', adminUser, typeData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Create should succeed');
    assertHasProperty(data.data, 'id', 'Should return type ID');

    customContentTypeId = data.data.id;
  });

  await runner.test('GET /api/config/content-types/:id - Get type by ID', async () => {
    if (!customContentTypeId) throw new Error('No custom type created');

    const response = await get(`/config/content-types/${customContentTypeId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
  });

  await runner.test('PUT /api/config/content-types/:id - Update custom type', async () => {
    if (!customContentTypeId) throw new Error('No custom type created');

    const response = await put(`/config/content-types/${customContentTypeId}`, adminUser, {
      name: 'Updated Content Type',
      description: 'Updated description',
    });
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Update should succeed');
  });

  await runner.test('DELETE /api/config/content-types/:id - Delete custom type', async () => {
    if (!customContentTypeId) throw new Error('No custom type created');

    const response = await del(`/config/content-types/${customContentTypeId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Delete should succeed');

    customContentTypeId = null;
  });

  // ==================== Activity Types ====================

  await runner.test('GET /api/config/activity-types - List all activity types', async () => {
    const response = await get('/config/activity-types', adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertTrue(Array.isArray(data.data), 'Should return array');
    assertArrayMinLength(data.data, 5, 'Should have default system types');
  });

  await runner.test('POST /api/config/activity-types - Create custom type', async () => {
    const typeData = {
      name: `Custom Activity ${uniqueString()}`,
      slug: uniqueString('activity'),
      description: 'A custom activity type',
      icon: 'activity',
      color: '#f39c12',
    };

    const response = await post('/config/activity-types', adminUser, typeData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Create should succeed');
    assertHasProperty(data.data, 'id', 'Should return type ID');

    customActivityTypeId = data.data.id;
  });

  await runner.test('GET /api/config/activity-types/:id - Get type by ID', async () => {
    if (!customActivityTypeId) throw new Error('No custom type created');

    const response = await get(`/config/activity-types/${customActivityTypeId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
  });

  await runner.test('PUT /api/config/activity-types/:id - Update custom type', async () => {
    if (!customActivityTypeId) throw new Error('No custom type created');

    const response = await put(`/config/activity-types/${customActivityTypeId}`, adminUser, {
      name: 'Updated Activity Type',
      color: '#27ae60',
    });
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Update should succeed');
  });

  await runner.test('DELETE /api/config/activity-types/:id - Delete custom type', async () => {
    if (!customActivityTypeId) throw new Error('No custom type created');

    const response = await del(`/config/activity-types/${customActivityTypeId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Delete should succeed');

    customActivityTypeId = null;
  });

  // ==================== Error Cases ====================

  await runner.test('GET /api/config/plan-item-types/:id - Non-existent ID should fail', async () => {
    const response = await get('/config/plan-item-types/99999', adminUser);
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400, 'Should return error status');
  });

  await runner.test('GET /api/config/content-types/:id - Non-existent ID should fail', async () => {
    const response = await get('/config/content-types/99999', adminUser);
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400, 'Should return error status');
  });

  await runner.test('GET /api/config/activity-types/:id - Non-existent ID should fail', async () => {
    const response = await get('/config/activity-types/99999', adminUser);
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400, 'Should return error status');
  });

  await runner.test('POST /api/config/content-types - Missing name should fail', async () => {
    const response = await post('/config/content-types', adminUser, {
      slug: uniqueString('noname'),
    });
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should return validation error');
  });

  await runner.test('POST /api/config/activity-types - Missing slug should fail', async () => {
    const response = await post('/config/activity-types', adminUser, {
      name: 'No Slug Type',
    });
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should return validation error');
  });

  // ==================== Auth Tests ====================

  await runner.test('GET /api/config/plan-item-types - Without auth should fail', async () => {
    const response = await get('/config/plan-item-types', {} as TestUser);
    assertEqual(response.status, 401, 'Should return 401 status');
  });

  await runner.test('GET /api/config/content-types - Without auth should fail', async () => {
    const response = await get('/config/content-types', {} as TestUser);
    assertEqual(response.status, 401, 'Should return 401 status');
  });

  await runner.test('GET /api/config/activity-types - Without auth should fail', async () => {
    const response = await get('/config/activity-types', {} as TestUser);
    assertEqual(response.status, 401, 'Should return 401 status');
  });

  return runner.summary();
}

// Run if executed directly
if (process.argv[1]?.includes('d7Endpoints.test')) {
  runD7Tests()
    .then(result => {
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
