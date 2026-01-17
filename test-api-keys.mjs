/**
 * API Keys Test Script
 * Tests the new API Keys endpoints
 */

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('========== API Keys Test Suite ==========\n');

  let passed = 0;
  let failed = 0;
  let accessToken = '';
  let createdKeyId = '';
  let createdFullKey = '';

  // Test 1: Login to get JWT token
  console.log('TEST 1: Login to get JWT token');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'orgadmin@acme.local', password: 'orgadmin123' })
    });
    const loginData = await loginRes.json();
    if (loginData.success && loginData.data.accessToken) {
      accessToken = loginData.data.accessToken;
      console.log('  ✅ Login successful');
      passed++;
    } else {
      throw new Error('No access token in response');
    }
  } catch (e) {
    console.log(`  ❌ Login failed: ${e.message}`);
    failed++;
    return { passed, failed };
  }

  // Test 2: GET /api/api-keys (list)
  console.log('\nTEST 2: GET /api/api-keys (list)');
  try {
    const listRes = await fetch(`${BASE_URL}/api/api-keys`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Organization-Id': '2'
      }
    });
    const listData = await listRes.json();
    if (listData.success && Array.isArray(listData.data)) {
      console.log(`  ✅ List API keys successful - found ${listData.data.length} keys`);
      passed++;
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(listData)}`);
    }
  } catch (e) {
    console.log(`  ❌ List API keys failed: ${e.message}`);
    failed++;
  }

  // Test 3: POST /api/api-keys (create)
  console.log('\nTEST 3: POST /api/api-keys (create)');
  try {
    const createRes = await fetch(`${BASE_URL}/api/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Organization-Id': '2'
      },
      body: JSON.stringify({ name: 'Test Key from Script' })
    });
    const createData = await createRes.json();
    if (createData.success && createData.data.key && createData.data.key.startsWith('aipm_')) {
      createdKeyId = createData.data.id;
      createdFullKey = createData.data.key;
      console.log(`  ✅ Create API key successful`);
      console.log(`     Key ID: ${createdKeyId}`);
      console.log(`     Key prefix: ${createData.data.keyPrefix}`);
      console.log(`     Full key starts with: ${createdFullKey.substring(0, 15)}...`);
      passed++;
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(createData)}`);
    }
  } catch (e) {
    console.log(`  ❌ Create API key failed: ${e.message}`);
    failed++;
  }

  // Test 4: GET /api/api-keys (verify key appears in list)
  console.log('\nTEST 4: Verify new key appears in list');
  try {
    const listRes = await fetch(`${BASE_URL}/api/api-keys`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Organization-Id': '2'
      }
    });
    const listData = await listRes.json();
    const foundKey = listData.data.find(k => k.id === createdKeyId);
    if (foundKey) {
      console.log(`  ✅ New key found in list`);
      console.log(`     Name: ${foundKey.name}`);
      console.log(`     Prefix: ${foundKey.keyPrefix}`);
      passed++;
    } else {
      throw new Error('Key not found in list');
    }
  } catch (e) {
    console.log(`  ❌ Verify key in list failed: ${e.message}`);
    failed++;
  }

  // Test 5: Use API key for authentication
  console.log('\nTEST 5: Use API key for authentication (GET /api/projects)');
  try {
    const projectsRes = await fetch(`${BASE_URL}/api/projects`, {
      method: 'GET',
      headers: {
        'X-API-Key': createdFullKey
      }
    });
    const projectsData = await projectsRes.json();
    if (projectsData.success) {
      console.log(`  ✅ API key authentication successful`);
      console.log(`     Projects found: ${projectsData.data.length}`);
      passed++;
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(projectsData)}`);
    }
  } catch (e) {
    console.log(`  ❌ API key authentication failed: ${e.message}`);
    failed++;
  }

  // Test 6: API key cannot access /api/api-keys
  console.log('\nTEST 6: API key blocked from /api/api-keys');
  try {
    const blockedRes = await fetch(`${BASE_URL}/api/api-keys`, {
      method: 'GET',
      headers: {
        'X-API-Key': createdFullKey
      }
    });
    const blockedData = await blockedRes.json();
    if (blockedRes.status === 403 && blockedData.error) {
      console.log(`  ✅ API key correctly blocked (403 Forbidden)`);
      console.log(`     Message: ${blockedData.error.message}`);
      passed++;
    } else {
      throw new Error(`Expected 403, got ${blockedRes.status}: ${JSON.stringify(blockedData)}`);
    }
  } catch (e) {
    console.log(`  ❌ API key block test failed: ${e.message}`);
    failed++;
  }

  // Test 7: DELETE /api/api-keys/:id (revoke)
  console.log('\nTEST 7: DELETE /api/api-keys/:id (revoke)');
  try {
    const deleteRes = await fetch(`${BASE_URL}/api/api-keys/${createdKeyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Organization-Id': '2'
      }
    });
    const deleteData = await deleteRes.json();
    if (deleteData.success && deleteData.data.revokedAt) {
      console.log(`  ✅ Revoke API key successful`);
      console.log(`     Revoked at: ${deleteData.data.revokedAt}`);
      passed++;
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(deleteData)}`);
    }
  } catch (e) {
    console.log(`  ❌ Revoke API key failed: ${e.message}`);
    failed++;
  }

  // Test 8: Revoked key no longer works
  console.log('\nTEST 8: Revoked key no longer authenticates');
  try {
    const revokedRes = await fetch(`${BASE_URL}/api/projects`, {
      method: 'GET',
      headers: {
        'X-API-Key': createdFullKey
      }
    });
    const revokedData = await revokedRes.json();
    if (revokedRes.status === 401) {
      console.log(`  ✅ Revoked key correctly rejected (401)`);
      passed++;
    } else {
      throw new Error(`Expected 401, got ${revokedRes.status}`);
    }
  } catch (e) {
    console.log(`  ❌ Revoked key test failed: ${e.message}`);
    failed++;
  }

  // Test 9: GET /api/docs.json (Swagger spec)
  console.log('\nTEST 9: GET /api/docs.json (Swagger spec)');
  try {
    const swaggerRes = await fetch(`${BASE_URL}/api/docs.json`);
    const swaggerData = await swaggerRes.json();
    if (swaggerData.openapi === '3.0.0' && swaggerData.info && swaggerData.paths) {
      console.log(`  ✅ Swagger JSON spec valid`);
      console.log(`     OpenAPI version: ${swaggerData.openapi}`);
      console.log(`     Title: ${swaggerData.info.title}`);
      console.log(`     Paths count: ${Object.keys(swaggerData.paths).length}`);
      passed++;
    } else {
      throw new Error('Invalid OpenAPI spec');
    }
  } catch (e) {
    console.log(`  ❌ Swagger spec test failed: ${e.message}`);
    failed++;
  }

  // Test 10: GET /api/docs (Swagger UI HTML)
  console.log('\nTEST 10: GET /api/docs (Swagger UI)');
  try {
    const docsRes = await fetch(`${BASE_URL}/api/docs`);
    const docsHtml = await docsRes.text();
    if (docsRes.headers.get('content-type')?.includes('text/html') && docsHtml.includes('swagger')) {
      console.log(`  ✅ Swagger UI HTML returned`);
      console.log(`     Content-Type: ${docsRes.headers.get('content-type')}`);
      passed++;
    } else {
      throw new Error('Expected HTML with swagger');
    }
  } catch (e) {
    console.log(`  ❌ Swagger UI test failed: ${e.message}`);
    failed++;
  }

  return { passed, failed };
}

// Run tests
runTests().then(({ passed, failed }) => {
  console.log('\n========== Test Summary ==========');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);
  console.log(`  Pass Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
  process.exit(failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
