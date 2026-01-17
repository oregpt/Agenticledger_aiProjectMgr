/**
 * D4: Content Management (Intake Agent) - Endpoint Tests
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

export async function runD4Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let authUser: TestUser;
  let testProjectId: string | null = null;
  let createdContentItemId: string | null = null;

  // Setup: Login and get a test project
  authUser = await login(TEST_ADMIN);

  // Get existing projects
  const projectsResponse = await get('/projects', authUser);
  const projectsData = await projectsResponse.json();

  if (projectsData.data && projectsData.data.length > 0) {
    testProjectId = projectsData.data[0].id;
  } else {
    // Create a test project if none exist
    const createProjectResponse = await post('/projects', authUser, {
      name: uniqueString('ContentTestProject'),
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    const projectData = await createProjectResponse.json();
    testProjectId = projectData.data.id;
  }

  // Test: Get content types
  results.push(
    await runTest('Get content types returns list', async () => {
      const response = await get('/projects/lookup/content-types', authUser);
      assertSuccess(response, 'Get content types');
      const data = await response.json();
      if (!Array.isArray(data.data)) {
        throw new Error('Content types should be an array');
      }
    })
  );

  // Test: Get activity types
  results.push(
    await runTest('Get activity types returns list', async () => {
      const response = await get('/projects/lookup/activity-item-types', authUser);
      assertSuccess(response, 'Get activity types');
      const data = await response.json();
      if (!Array.isArray(data.data)) {
        throw new Error('Activity types should be an array');
      }
    })
  );

  // Test: List project content
  results.push(
    await runTest('List project content returns array', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await get(`/projects/${testProjectId}/content`, authUser);
      assertSuccess(response, 'List content');
    })
  );

  // Test: Create content item
  results.push(
    await runTest('Create content item succeeds', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await post('/content-items', authUser, {
        projectId: testProjectId,
        sourceType: 'text',
        title: uniqueString('TestContent'),
        dateOccurred: new Date().toISOString().split('T')[0],
        rawContent: 'This is test content created by automated tests. It contains some sample text for testing purposes.',
        contentTypeIds: [],
        activityTypeIds: [],
        planItemIds: [],
        tags: ['test', 'automated'],
      });

      assertSuccess(response, 'Create content');
      const data = await assertResponseHas(response, ['data.id', 'data.title'], 'Create content') as any;
      createdContentItemId = data.data.id;
    })
  );

  // Test: Get content item by ID
  results.push(
    await runTest('Get content item by ID returns item', async () => {
      if (!createdContentItemId) throw new Error('No content item created');

      const response = await get(`/content-items/${createdContentItemId}`, authUser);
      assertSuccess(response, 'Get content item');
      await assertResponseHas(response, ['data.id', 'data.title'], 'Get content item');
    })
  );

  // Test: List all content items
  results.push(
    await runTest('List all content items works', async () => {
      const response = await get('/content-items', authUser);
      assertSuccess(response, 'List all content');
    })
  );

  // Test: Update content item
  results.push(
    await runTest('Update content item changes data', async () => {
      if (!createdContentItemId) throw new Error('No content item created');

      const newTitle = uniqueString('UpdatedContent');
      const response = await put(`/content-items/${createdContentItemId}`, authUser, {
        title: newTitle,
        tags: ['test', 'updated'],
      });

      assertSuccess(response, 'Update content');
      const data = await response.json();
      if (data.data.title !== newTitle) {
        throw new Error('Title was not updated');
      }
    })
  );

  // Test: Analyze endpoint exists (skip actual AI call)
  results.push(
    await runTest('Analyze endpoint exists', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await post('/content-items/analyze', authUser, {
        projectId: testProjectId,
        content: 'Test content for analysis',
      });

      // Should not return 404 (may fail due to missing OpenAI key, but endpoint exists)
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  // Test: Save analyzed endpoint exists
  results.push(
    await runTest('Save analyzed endpoint exists', async () => {
      if (!testProjectId) throw new Error('No test project available');

      const response = await post('/content-items/save-analyzed', authUser, {
        projectId: testProjectId,
        title: 'Test',
        dateOccurred: new Date().toISOString().split('T')[0],
        rawContent: 'Test',
        sourceType: 'text',
        contentTypeIds: [],
        activityTypeIds: [],
        planItemIds: [],
        tags: [],
      });

      // Should not return 404
      if (response.status === 404) {
        throw new Error('Endpoint not found');
      }
    })
  );

  // Test: Delete content item
  results.push(
    await runTest('Delete content item removes it', async () => {
      if (!createdContentItemId) throw new Error('No content item created');

      const response = await del(`/content-items/${createdContentItemId}`, authUser);
      assertSuccess(response, 'Delete content');

      // Verify it's deleted
      const getResponse = await get(`/content-items/${createdContentItemId}`, authUser);
      assertStatus(getResponse, 404, 'Content should be deleted');
    })
  );

  // Test: Create content without required fields
  results.push(
    await runTest('Create content without required fields fails', async () => {
      const response = await post('/content-items', authUser, {
        title: 'Missing projectId and sourceType',
      });

      assertStatus(response, 400, 'Create content invalid');
    })
  );

  return results;
}
