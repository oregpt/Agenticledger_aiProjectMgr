/**
 * Master Test Runner for AI Project Manager
 * Run: npx tsx comprehensive-test-suite/runTests.ts [domain1] [domain2] ...
 *
 * Examples:
 *   npx tsx comprehensive-test-suite/runTests.ts          # Run all tests
 *   npx tsx comprehensive-test-suite/runTests.ts d1       # Run only D1 (auth) tests
 *   npx tsx comprehensive-test-suite/runTests.ts d2 d3    # Run D2 and D3 tests
 */

import type { SuiteResult } from './utils/testRunner.js';

// Import all domain test runners from d1-d7 folders
import { runD1Tests } from './d1/d1Endpoints.test.js';
import { runD2Tests } from './d2/d2Endpoints.test.js';
import { runD3Tests } from './d3/d3Endpoints.test.js';
import { runD4Tests } from './d4/d4Endpoints.test.js';
import { runD5Tests } from './d5/d5Endpoints.test.js';
import { runD6Tests } from './d6/d6Endpoints.test.js';
import { runD7Tests } from './d7/d7Endpoints.test.js';

interface DomainTestRunner {
  name: string;
  alias: string[];
  runner: () => Promise<SuiteResult>;
}

const domains: DomainTestRunner[] = [
  { name: 'D1: Authentication & Multi-tenancy', alias: ['d1', 'auth'], runner: runD1Tests },
  { name: 'D2: Project Management', alias: ['d2', 'projects'], runner: runD2Tests },
  { name: 'D3: Plan Management (Agent 0)', alias: ['d3', 'plan', 'plan-items'], runner: runD3Tests },
  { name: 'D4: Content Management (Agent 1)', alias: ['d4', 'content', 'intake'], runner: runD4Tests },
  { name: 'D5: Activity Reporting (Agent 2)', alias: ['d5', 'reporter', 'reports'], runner: runD5Tests },
  { name: 'D6: Output Formatting (Agent 3)', alias: ['d6', 'output', 'format'], runner: runD6Tests },
  { name: 'D7: Configuration', alias: ['d7', 'config'], runner: runD7Tests },
];

async function main() {
  const args = process.argv.slice(2).map(a => a.toLowerCase());

  // Determine which domains to run
  let domainsToRun = domains;
  if (args.length > 0) {
    domainsToRun = domains.filter(d =>
      args.some(arg => d.alias.includes(arg))
    );

    if (domainsToRun.length === 0) {
      console.error('No matching domains found. Available domains:');
      for (const d of domains) {
        console.error(`  ${d.name}: ${d.alias.join(', ')}`);
      }
      process.exit(1);
    }
  }

  console.log('\n' + '█'.repeat(60));
  console.log('  AI Project Manager - Comprehensive Test Suite');
  console.log('█'.repeat(60));
  console.log(`\nRunning ${domainsToRun.length} domain(s)...\n`);

  const allResults: SuiteResult[] = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const domain of domainsToRun) {
    try {
      const result = await domain.runner();
      allResults.push(result);
      totalPassed += result.passed;
      totalFailed += result.failed;
    } catch (error) {
      console.error(`\n✗ ${domain.name} - Runner error: ${error}`);
      allResults.push({
        suiteName: domain.name,
        passed: 0,
        failed: 1,
        total: 1,
        results: [{
          name: 'Domain Runner',
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          duration: 0,
        }],
        duration: 0,
      });
      totalFailed++;
    }
  }

  // Final summary
  console.log('\n' + '█'.repeat(60));
  console.log('  FINAL SUMMARY');
  console.log('█'.repeat(60));

  for (const result of allResults) {
    const status = result.failed === 0 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`${status} ${result.suiteName}: ${result.passed}/${result.total} passed`);
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`\x1b[32mPassed: ${totalPassed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${totalFailed}\x1b[0m`);

  // Show failed tests
  if (totalFailed > 0) {
    console.log('\n\x1b[31mFailed Tests:\x1b[0m');
    console.log('-'.repeat(60));
    for (const suite of allResults) {
      const failedTests = suite.results.filter(t => !t.passed);
      if (failedTests.length > 0) {
        console.log(`\n${suite.suiteName}:`);
        for (const test of failedTests) {
          console.log(`  \x1b[31m✗\x1b[0m ${test.name}`);
          if (test.error) {
            console.log(`    Error: ${test.error}`);
          }
        }
      }
    }
  }

  console.log('\n' + '█'.repeat(60) + '\n');

  // Exit with error code if any tests failed
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
