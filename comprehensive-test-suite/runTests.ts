/**
 * Master Test Runner for AI Project Manager
 * Run: npx tsx comprehensive-test-suite/runTests.ts [domain1] [domain2] ...
 *
 * Examples:
 *   npx tsx comprehensive-test-suite/runTests.ts          # Run all tests
 *   npx tsx comprehensive-test-suite/runTests.ts d1       # Run only D1 (auth) tests
 *   npx tsx comprehensive-test-suite/runTests.ts d2 d3    # Run D2 and D3 tests
 */

import { TestResult, printResults } from './utils/testHelpers';

// Import all domain test runners
import { runD1Tests } from './d1-auth/authEndpoints.test';
import { runD2Tests } from './d2-projects/projectsEndpoints.test';
import { runD3Tests } from './d3-plan-items/planItemsEndpoints.test';
import { runD4Tests } from './d4-content/contentEndpoints.test';
import { runD5Tests } from './d5-activity-reporter/activityReporterEndpoints.test';
import { runD6Tests } from './d6-plan-updater/planUpdaterEndpoints.test';
import { runD7Tests } from './d7-output-formatter/outputFormatterEndpoints.test';
import { runD8Tests } from './d8-config/configEndpoints.test';

interface DomainTestRunner {
  name: string;
  alias: string[];
  runner: () => Promise<TestResult[]>;
}

const domains: DomainTestRunner[] = [
  { name: 'D1: Authentication & Users', alias: ['d1', 'auth'], runner: runD1Tests },
  { name: 'D2: Projects', alias: ['d2', 'projects'], runner: runD2Tests },
  { name: 'D3: Plan Items', alias: ['d3', 'plan', 'plan-items'], runner: runD3Tests },
  { name: 'D4: Content Management', alias: ['d4', 'content'], runner: runD4Tests },
  { name: 'D5: Activity Reporter', alias: ['d5', 'reporter'], runner: runD5Tests },
  { name: 'D6: Plan Updater', alias: ['d6', 'updater'], runner: runD6Tests },
  { name: 'D7: Output Formatter', alias: ['d7', 'output', 'format'], runner: runD7Tests },
  { name: 'D8: Configuration', alias: ['d8', 'config'], runner: runD8Tests },
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

  let allResults: { domain: string; results: TestResult[] }[] = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const domain of domainsToRun) {
    console.log(`\n▶ Starting ${domain.name}...`);

    try {
      const results = await domain.runner();
      allResults.push({ domain: domain.name, results });

      const passed = results.filter(r => r.passed).length;
      const failed = results.length - passed;
      totalPassed += passed;
      totalFailed += failed;

      printResults(results, domain.name);
    } catch (error) {
      console.error(`\n✗ ${domain.name} - Runner error: ${error}`);
      allResults.push({
        domain: domain.name,
        results: [{
          testName: 'Domain Runner',
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          duration: 0,
        }],
      });
      totalFailed++;
    }
  }

  // Final summary
  console.log('\n' + '█'.repeat(60));
  console.log('  FINAL SUMMARY');
  console.log('█'.repeat(60));

  for (const { domain, results } of allResults) {
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const status = failed === 0 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`${status} ${domain}: ${passed}/${results.length} passed`);
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`\x1b[32mPassed: ${totalPassed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${totalFailed}\x1b[0m`);
  console.log('█'.repeat(60) + '\n');

  // Exit with error code if any tests failed
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
