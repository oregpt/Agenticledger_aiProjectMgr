/**
 * D2: Project Management Tests
 * Tests for project CRUD operations and organization-scoped data
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

export async function runD2Tests(): Promise<ReturnType<TestRunner['summary']>> {
  const runner = new TestRunner('D2: Project Management');

  let adminUser: TestUser = TEST_ADMIN;
  let testProjectId: string | null = null;
  const testProjectName = uniqueString('project');

  // Login first
  await runner.test('Setup: Login as admin', async () => {
    adminUser = await login(TEST_ADMIN);
    assertExists(adminUser.accessToken, 'Access token should exist');
    assertExists(adminUser.organizationId, 'Organization ID should exist');
  });

  // ==================== List Projects ====================

  await runner.test('GET /api/projects - List projects', async () => {
    const response = await get('/projects', adminUser);
    const data = await response.json();
    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertTrue(Array.isArray(data.data), 'Should return array of projects');
  });

  await runner.test('GET /api/projects - Without auth should fail', async () => {
    const response = await get('/projects', {} as TestUser);
    assertEqual(response.status, 401, 'Should return 401 status');
  });

  await runner.test('GET /api/projects - Without org context should fail', async () => {
    const noOrgUser = { ...adminUser };
    delete noOrgUser.organizationId;
    const response = await get('/projects', noOrgUser);
    // May return 400 or 403 depending on implementation
    assertTrue(response.status >= 400, 'Should return error status');
  });

  // ==================== Create Project ====================

  await runner.test('POST /api/projects - Create project with valid data', async () => {
    const projectData = {
      name: testProjectName,
      client: 'Test Client',
      description: 'Test project description',
      status: 'active',
      startDate: new Date().toISOString(),
    };

    const response = await post('/projects', adminUser, projectData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Create should succeed');
    assertHasProperty(data.data, 'id', 'Should return project ID');
    assertHasProperty(data.data, 'name', 'Should return project name');
    assertEqual(data.data.name, testProjectName, 'Name should match');
    assertEqual(data.data.status, 'active', 'Status should be active');

    testProjectId = data.data.id;
  });

  await runner.test('POST /api/projects - Create with duplicate name should fail', async () => {
    const projectData = {
      name: testProjectName, // Same name as above
      client: 'Another Client',
      status: 'active',
    };

    const response = await post('/projects', adminUser, projectData);
    const data = await response.json();

    // Should fail due to unique constraint (organizationId, name)
    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should return error for duplicate name');
  });

  await runner.test('POST /api/projects - Create without name should fail', async () => {
    const projectData = {
      client: 'Test Client',
      status: 'active',
    };

    const response = await post('/projects', adminUser, projectData);
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
    assertError(data, 'Should return validation error');
  });

  await runner.test('POST /api/projects - Create with invalid status should fail', async () => {
    const projectData = {
      name: uniqueString('project'),
      status: 'invalid_status',
    };

    const response = await post('/projects', adminUser, projectData);
    const data = await response.json();

    assertTrue(response.status >= 400, 'Should return error status');
  });

  // ==================== Get Project ====================

  await runner.test('GET /api/projects/:id - Get project by ID', async () => {
    if (!testProjectId) {
      throw new Error('No test project created');
    }

    const response = await get(`/projects/${testProjectId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Response should be successful');
    assertHasProperty(data.data, 'id', 'Should return project ID');
    assertEqual(data.data.id, testProjectId, 'ID should match');
    assertEqual(data.data.name, testProjectName, 'Name should match');
  });

  await runner.test('GET /api/projects/:id - Non-existent ID should return error', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await get(`/projects/${fakeId}`, adminUser);
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400, 'Should return 404 or 400');
    assertError(data, 'Should return error');
  });

  await runner.test('GET /api/projects/:id - Invalid UUID format should fail', async () => {
    const response = await get('/projects/invalid-uuid', adminUser);
    assertTrue(response.status >= 400, 'Should return error status');
  });

  // ==================== Update Project ====================

  await runner.test('PUT /api/projects/:id - Update project', async () => {
    if (!testProjectId) {
      throw new Error('No test project created');
    }

    const updateData = {
      name: `${testProjectName}_updated`,
      description: 'Updated description',
      status: 'on_hold',
    };

    const response = await put(`/projects/${testProjectId}`, adminUser, updateData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Update should succeed');
    assertEqual(data.data.description, 'Updated description', 'Description should be updated');
    assertEqual(data.data.status, 'on_hold', 'Status should be updated');
  });

  await runner.test('PUT /api/projects/:id - Update non-existent should fail', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await put(`/projects/${fakeId}`, adminUser, {
      name: 'Updated Name',
    });
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400, 'Should return 404 or 400');
    assertError(data, 'Should return error');
  });

  // ==================== Delete Project ====================

  await runner.test('DELETE /api/projects/:id - Delete (soft) project', async () => {
    if (!testProjectId) {
      throw new Error('No test project created');
    }

    const response = await del(`/projects/${testProjectId}`, adminUser);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Delete should succeed');

    // Verify soft delete - project should still exist but be inactive
    const getResponse = await get(`/projects/${testProjectId}`, adminUser);
    const getData = await getResponse.json();

    // Project may not be returned in list after soft delete
    // or may have isActive: false
    if (getResponse.status === 200) {
      assertEqual(getData.data.isActive, false, 'Project should be soft deleted');
    }
  });

  await runner.test('DELETE /api/projects/:id - Delete non-existent should fail', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await del(`/projects/${fakeId}`, adminUser);
    const data = await response.json();

    assertTrue(response.status === 404 || response.status === 400, 'Should return 404 or 400');
    assertError(data, 'Should return error');
  });

  // ==================== Create another project for remaining tests ====================

  let secondProjectId: string | null = null;

  await runner.test('POST /api/projects - Create second test project', async () => {
    const projectData = {
      name: uniqueString('project2'),
      client: 'Second Client',
      description: 'Second test project',
      status: 'active',
    };

    const response = await post('/projects', adminUser, projectData);
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Create should succeed');
    secondProjectId = data.data.id;
  });

  // ==================== Project Status Variations ====================

  await runner.test('PUT /api/projects/:id - Change to completed status', async () => {
    if (!secondProjectId) {
      throw new Error('No second project created');
    }

    const response = await put(`/projects/${secondProjectId}`, adminUser, {
      status: 'completed',
    });
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Update should succeed');
    assertEqual(data.data.status, 'completed', 'Status should be completed');
  });

  await runner.test('PUT /api/projects/:id - Change to cancelled status', async () => {
    if (!secondProjectId) {
      throw new Error('No second project created');
    }

    const response = await put(`/projects/${secondProjectId}`, adminUser, {
      status: 'cancelled',
    });
    const data = await response.json();

    assertEqual(response.status, 200, 'Should return 200 status');
    assertSuccess(data, 'Update should succeed');
    assertEqual(data.data.status, 'cancelled', 'Status should be cancelled');
  });

  // Cleanup
  await runner.test('Cleanup: Delete second test project', async () => {
    if (secondProjectId) {
      await cleanup(`/projects/${secondProjectId}`, adminUser);
    }
    assertTrue(true, 'Cleanup completed');
  });

  return runner.summary();
}

// Run if executed directly
if (process.argv[1]?.includes('d2Endpoints.test')) {
  runD2Tests()
    .then(result => {
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
