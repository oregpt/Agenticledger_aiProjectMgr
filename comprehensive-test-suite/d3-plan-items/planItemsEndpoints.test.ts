/**
 * D3: Plan Management - Endpoint Tests
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

export async function runD3Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let authUser: TestUser;
  let testProjectId: string | null = null;
  let createdPlanItemId: string | null = null;
  let planItemTypeId: string | null = null;

  // Setup: Login and get/create a test project
  authUser = await login(TEST_ADMIN);

  // Get existing projects to use for testing
  const projectsResponse = await get('/projects', authUser);
  const projectsData = await projectsResponse.json();

  if (projectsData.data && projectsData.data.length > 0) {
    testProjectId = projectsData.data[0].id;
  } else {
    // Create a test project if none exist
    const createProjectResponse = await post('/projects', authUser, {
      name: uniqueString('PlanTestProject'),
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    const projectData = await createProjectResponse.json();
    testProjectId = projectData.data.id;
  }

  // Get plan item types
  const typesResponse = await get('/config/plan-item-types', authUser);
  const typesData = await typesResponse.json();
  if (typesData.data && typesData.data.length > 0) {
    // Find workstream type (level 1)
    const workstreamType = typesData.data.find((t: any) => t.level === 1);
    planItemTypeId = workstreamType?.id || typesData.data[0].id;
  }

  // Test: Get plan tree
  results.push(
    await runTest('Get plan tree returns structure', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await get(`/projects/${testProjectId}/plan`, authUser);
      assertSuccess(response, 'Get plan');
    })
  );

  // Test: Get plan without auth
  results.push(
    await runTest('Get plan without auth returns 401', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await get(`/projects/${testProjectId}/plan`, { email: '', password: '' });
      assertStatus(response, 401, 'Get plan no auth');
    })
  );

  // Test: Create plan item
  results.push(
    await runTest('Create plan item succeeds', async () => {
      if (!testProjectId || !planItemTypeId) throw new Error('Missing test project or plan item type');

      const response = await post(`/projects/${testProjectId}/plan`, authUser, {
        name: uniqueString('TestWorkstream'),
        itemTypeId: planItemTypeId,
        status: 'not_started',
        description: 'Test plan item created by automated tests',
      });

      assertSuccess(response, 'Create plan item');
      const data = await assertResponseHas(response, ['data.id', 'data.name'], 'Create plan item') as any;
      createdPlanItemId = data.data.id;
    })
  );

  // Test: Get plan item by ID
  results.push(
    await runTest('Get plan item by ID returns item', async () => {
      if (!createdPlanItemId) throw new Error('No plan item created');

      const response = await get(`/plan-items/${createdPlanItemId}`, authUser);
      assertSuccess(response, 'Get plan item');
      await assertResponseHas(response, ['data.id', 'data.name'], 'Get plan item');
    })
  );

  // Test: Update plan item
  results.push(
    await runTest('Update plan item changes data', async () => {
      if (!createdPlanItemId) throw new Error('No plan item created');

      const newStatus = 'in_progress';
      const response = await put(`/plan-items/${createdPlanItemId}`, authUser, {
        status: newStatus,
        notes: 'Updated by test at ' + new Date().toISOString(),
      });

      assertSuccess(response, 'Update plan item');
      const data = await response.json();
      if (data.data.status !== newStatus) {
        throw new Error('Status was not updated');
      }
    })
  );

  // Test: Get plan item history
  results.push(
    await runTest('Get plan item history returns changes', async () => {
      if (!createdPlanItemId) throw new Error('No plan item created');

      const response = await get(`/plan-items/${createdPlanItemId}/history`, authUser);
      assertSuccess(response, 'Get history');
      // History should be an array (may be empty if no updates tracked yet)
      const data = await response.json();
      if (!Array.isArray(data.data)) {
        throw new Error('History should be an array');
      }
    })
  );

  // Test: Get CSV template
  results.push(
    await runTest('Get CSV template returns file', async () => {
      const response = await get('/plan-items/import/template', authUser);
      assertSuccess(response, 'Get CSV template');
    })
  );

  // Test: Delete plan item
  results.push(
    await runTest('Delete plan item removes from tree', async () => {
      if (!createdPlanItemId) throw new Error('No plan item created');

      const response = await del(`/plan-items/${createdPlanItemId}`, authUser);
      assertSuccess(response, 'Delete plan item');

      // Verify it's deleted
      const getResponse = await get(`/plan-items/${createdPlanItemId}`, authUser);
      assertStatus(getResponse, 404, 'Plan item should be deleted');
    })
  );

  // Test: Create plan item without required fields
  results.push(
    await runTest('Create plan item without name fails', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await post(`/projects/${testProjectId}/plan`, authUser, {
        description: 'Missing name',
      });

      assertStatus(response, 400, 'Create plan item invalid');
    })
  );

  // Test: Bulk update endpoint exists
  results.push(
    await runTest('Bulk update endpoint exists', async () => {
      // Send empty updates to verify endpoint exists
      const response = await post('/plan-items/bulk-update', authUser, {
        updates: [],
      });

      // Should not return 404
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  return results;
}
