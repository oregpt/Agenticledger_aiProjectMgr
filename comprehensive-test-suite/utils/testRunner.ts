/**
 * Test Runner Utility
 * Provides test execution framework with assertions and reporting
 */

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

export interface SuiteResult {
  suiteName: string;
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
  duration: number;
}

export class TestRunner {
  private suiteName: string;
  private passed: number = 0;
  private failed: number = 0;
  private results: TestResult[] = [];
  private startTime: number;

  constructor(suiteName: string) {
    this.suiteName = suiteName;
    this.startTime = Date.now();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${suiteName}`);
    console.log(`${'='.repeat(60)}\n`);
  }

  async test(name: string, fn: () => Promise<void>): Promise<void> {
    const testStart = Date.now();
    try {
      await fn();
      const duration = Date.now() - testStart;
      this.passed++;
      this.results.push({ name, passed: true, duration });
      console.log(`  \x1b[32m✓\x1b[0m ${name} \x1b[90m(${duration}ms)\x1b[0m`);
    } catch (error) {
      const duration = Date.now() - testStart;
      this.failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, error: errorMsg, duration });
      console.log(`  \x1b[31m✗\x1b[0m ${name} \x1b[90m(${duration}ms)\x1b[0m`);
      console.log(`    \x1b[31mError: ${errorMsg}\x1b[0m`);
    }
  }

  summary(): SuiteResult {
    const totalDuration = Date.now() - this.startTime;
    console.log(`\n${'-'.repeat(60)}`);
    console.log(`  ${this.suiteName} Results`);
    console.log(`${'-'.repeat(60)}`);
    console.log(`  \x1b[32mPassed:\x1b[0m ${this.passed}`);
    console.log(`  \x1b[31mFailed:\x1b[0m ${this.failed}`);
    console.log(`  Total:  ${this.passed + this.failed}`);
    console.log(`  Duration: ${totalDuration}ms`);
    console.log('');

    return {
      suiteName: this.suiteName,
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      results: this.results,
      duration: totalDuration
    };
  }
}

// Assertion helpers
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    const msg = message || 'Values are not equal';
    throw new Error(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const msg = message || 'Objects are not deeply equal';
    throw new Error(`${msg}: expected ${expectedStr}, got ${actualStr}`);
  }
}

export function assertExists<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    const msg = message || 'Value does not exist';
    throw new Error(`${msg}: value is ${value}`);
  }
}

export function assertNotExists<T>(value: T | null | undefined, message?: string): void {
  if (value !== null && value !== undefined) {
    const msg = message || 'Value should not exist';
    throw new Error(`${msg}: value is ${JSON.stringify(value)}`);
  }
}

export function assertArrayLength(arr: unknown[], expected: number, message?: string): void {
  if (arr.length !== expected) {
    const msg = message || 'Array length mismatch';
    throw new Error(`${msg}: expected length ${expected}, got ${arr.length}`);
  }
}

export function assertArrayMinLength(arr: unknown[], minLength: number, message?: string): void {
  if (arr.length < minLength) {
    const msg = message || 'Array length too short';
    throw new Error(`${msg}: expected at least ${minLength}, got ${arr.length}`);
  }
}

export function assertTrue(condition: boolean, message?: string): void {
  if (!condition) {
    const msg = message || 'Condition is not true';
    throw new Error(msg);
  }
}

export function assertFalse(condition: boolean, message?: string): void {
  if (condition) {
    const msg = message || 'Condition should be false';
    throw new Error(msg);
  }
}

export function assertContains(str: string, substring: string, message?: string): void {
  if (!str.includes(substring)) {
    const msg = message || 'String does not contain substring';
    throw new Error(`${msg}: "${str}" does not contain "${substring}"`);
  }
}

export function assertMatch(str: string, pattern: RegExp, message?: string): void {
  if (!pattern.test(str)) {
    const msg = message || 'String does not match pattern';
    throw new Error(`${msg}: "${str}" does not match ${pattern}`);
  }
}

export function assertStatusCode(actual: number, expected: number, message?: string): void {
  if (actual !== expected) {
    const msg = message || 'HTTP status code mismatch';
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

export function assertSuccess(response: { success: boolean; error?: string }, message?: string): void {
  if (!response.success) {
    const msg = message || 'Response indicates failure';
    throw new Error(`${msg}: ${response.error || 'Unknown error'}`);
  }
}

export function assertError(response: { success: boolean; error?: string }, message?: string): void {
  if (response.success) {
    const msg = message || 'Response should indicate failure';
    throw new Error(msg);
  }
}

export function assertHasProperty<T extends object>(obj: T, property: string, message?: string): void {
  if (!(property in obj)) {
    const msg = message || 'Object missing property';
    throw new Error(`${msg}: object does not have property "${property}"`);
  }
}

export function assertType(value: unknown, expectedType: string, message?: string): void {
  const actualType = typeof value;
  if (actualType !== expectedType) {
    const msg = message || 'Type mismatch';
    throw new Error(`${msg}: expected ${expectedType}, got ${actualType}`);
  }
}
