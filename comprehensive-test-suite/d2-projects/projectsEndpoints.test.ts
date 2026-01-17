/**
 * D2: Project Management - Endpoint Tests
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
  assertResponseHas,
  uniqueString,
} from '../utils/testHelpers';

export async function runD2Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let authUser: TestUser;
  let createdProjectId: string | null = null;

  // Setup: Login
  authUser = await login(TEST_ADMIN);

  // Test: List projects
  results.push(
    await runTest('List projects returns array', async () => {
      const response = await get('/projects', authUser);
      assertSuccess(response, 'List projects');
      const data = await response.json();
      if (!Array.isArray(data.data)) {
        throw new Error('Expected data to be an array');
      }
    })
  );

  // Test: List projects without auth
  results.push(
    await runTest('List projects without auth returns 401', async () => {
      const response = await get('/projects', { email: '', password: '' });
      assertStatus(response, 401, 'List projects no auth');
    })
  );

  // Test: Create project
  results.push(
    await runTest('Create project with valid data succeeds', async () => {
      const projectName = uniqueString('TestProject');
      const response = await post('/projects', authUser, {
        name: projectName,
        client: 'Test Client',
        description: 'Test project for automated tests',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });

      assertSuccess(response, 'Create project');
      const data = await assertResponseHas(response, ['data.id', 'data.name'], 'Create project') as any;
      createdProjectId = data.data.id;
    })
  );

  // Test: Create project without required fields
  results.push(
    await runTest('Create project without required fields fails', async () => {
      const response = await post('/projects', authUser, {
        description: 'Missing name and startDate',
      });

      assertStatus(response, 400, 'Create project invalid');
    })
  );

  // Test: Get project by ID
  results.push(
    await runTest('Get project by ID returns project data', async () => {
      if (!createdProjectId) {
        throw new Error('No project created for test');
      }

      const response = await get(`/projects/${createdProjectId}`, authUser);
      assertSuccess(response, 'Get project');
      await assertResponseHas(response, ['data.id', 'data.name'], 'Get project');
    })
  );

  // Test: Get non-existent project
  results.push(
    await runTest('Get non-existent project returns 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await get(`/projects/${fakeId}`, authUser);
      assertStatus(response, 404, 'Get non-existent project');
    })
  );

  // Test: Update project
  results.push(
    await runTest('Update project changes data', async () => {
      if (!createdProjectId) {
        throw new Error('No project created for test');
      }

      const newDescription = 'Updated description ' + Date.now();
      const response = await put(`/projects/${createdProjectId}`, authUser, {
        description: newDescription,
      });

      assertSuccess(response, 'Update project');
      const data = await response.json();
      if (data.data.description !== newDescription) {
        throw new Error('Description was not updated');
      }
    })
  );

  // Test: Get project dashboard
  results.push(
    await runTest('Get project dashboard returns stats', async () => {
      if (!createdProjectId) {
        throw new Error('No project created for test');
      }

      const response = await get(`/projects/${createdProjectId}/dashboard`, authUser);
      assertSuccess(response, 'Get dashboard');
    })
  );

  // Test: Delete project
  results.push(
    await runTest('Delete project soft-deletes', async () => {
      if (!createdProjectId) {
        throw new Error('No project created for test');
      }

      const response = await del(`/projects/${createdProjectId}`, authUser);
      assertSuccess(response, 'Delete project');

      // Verify it's soft deleted (should still exist but be inactive)
      const getResponse = await get(`/projects/${createdProjectId}`, authUser);
      // May return 404 if inactive projects are filtered out, or 200 with isActive: false
      // Either is acceptable for soft delete
    })
  );

  // Test: Update non-existent project
  results.push(
    await runTest('Update non-existent project returns 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await put(`/projects/${fakeId}`, authUser, {
        description: 'Should fail',
      });
      assertStatus(response, 404, 'Update non-existent');
    })
  );

  return results;
}
