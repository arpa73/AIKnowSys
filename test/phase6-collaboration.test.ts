/**
 * Tests for Phase 6: Collaboration & CI/CD features
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ciCheck } from '../lib/commands/ci-check.js';

// Use PROJECT_ROOT to resolve templates (works from compiled dist/ and source)
const projectRoot = process.env.PROJECT_ROOT || path.join(import.meta.dirname, '..');
const TEST_DIR: string = path.join(import.meta.dirname, 'fixtures', 'ci-check-test');

describe('ci-check command', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    
    // Create minimal package.json with test script
    await fs.writeFile(
      path.join(TEST_DIR, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'exit 0',  // Passes
          lint: 'exit 0',   // Passes
          build: 'exit 0',  // Passes
        }
      }, null, 2)
    );
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should run CI checks and report results', async () => {
    const result: any = await ciCheck({
      dir: TEST_DIR,
      _silent: true
    });

    assert.strictEqual(result.success, true, 'CI checks should pass');
    assert.ok(Array.isArray(result.checks), 'Should return checks array');
    assert.ok(result.checks.length > 0, 'Should run at least one check');
    assert.ok(typeof result.totalDuration === 'number', 'Should report total duration');
  });

  it('should detect failing tests', async () => {
    // Override test script to fail
    await fs.writeFile(
      path.join(TEST_DIR, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'exit 1',  // Fails
        }
      }, null, 2)
    );

    const result: any = await ciCheck({
      dir: TEST_DIR,
      _silent: true
    });

    assert.strictEqual(result.success, false, 'CI checks should fail when tests fail');
    
    const testCheck: any = result.checks.find((c: any) => c.check === 'Tests');
    assert.ok(testCheck, 'Should include Tests check');
    assert.strictEqual(testCheck.passed, false, 'Tests check should fail');
  });

  it('should handle optional checks gracefully', async () => {
    // Package without optional scripts
    await fs.writeFile(
      path.join(TEST_DIR, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'exit 0',  // Only test script, no lint/build
        }
      }, null, 2)
    );

    const result: any = await ciCheck({
      dir: TEST_DIR,
      _silent: true
    });

    // Should still pass even without optional scripts
    assert.strictEqual(result.success, true, 'Should pass with only required checks');
  });

  it('should report check durations', async () => {
    const result: any = await ciCheck({
      dir: TEST_DIR,
      _silent: true
    });

    for (const check of result.checks) {
      assert.ok(typeof check.duration === 'number', `Check ${check.check} should have duration`);
      assert.ok(check.duration >= 0, 'Duration should be non-negative');
    }
  });
});

describe('pre-commit hook', () => {
  const HOOK_PATH: string = path.join(projectRoot, 'templates', 'git-hooks', 'pre-commit-enhanced');

  it('should exist as a file', async () => {
    try {
      await fs.access(HOOK_PATH);
      assert.ok(true, 'Hook file should exist');
    } catch {
      assert.fail('Hook file should exist');
    }
  });

  it('should be a bash script', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    assert.ok(content.startsWith('#!/bin/bash'), 'Should start with bash shebang');
  });

  it('should include test validation', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    assert.ok(content.includes('npm test'), 'Should run tests');
    assert.ok(content.includes('commit blocked'), 'Should block on test failure');
  });

  it('should include ESSENTIALS size check', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    assert.ok(content.includes('CODEBASE_ESSENTIALS.md'), 'Should check ESSENTIALS');
    assert.ok(content.includes('800'), 'Should check for 800 line limit');
  });
});

describe('collaboration-check hook', () => {
  const HOOK_PATH: string = path.join(projectRoot, 'templates', 'hooks', 'collaboration-check.mjs');

  it('should exist as a file', async () => {
    try {
      await fs.access(HOOK_PATH);
      assert.ok(true, 'Hook file should exist');
    } catch {
      assert.fail('Hook file should exist');
    }
  });

  it('should be a Node.js script', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    assert.ok(content.startsWith('#!/usr/bin/env node'), 'Should start with node shebang');
  });

  it('should check for git repository', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    assert.ok(content.includes('isGitRepo'), 'Should check if git repo');
    assert.ok(content.includes('git rev-parse'), 'Should use git commands');
  });

  it('should check CURRENT_PLAN.md changes', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    assert.ok(content.includes('CURRENT_PLAN.md'), 'Should check plan file');
    assert.ok(content.includes('Collaboration Notice'), 'Should warn about concurrent changes');
  });

  it('should check branch divergence', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    assert.ok(content.includes('checkBranchDivergence'), 'Should check branch sync');
    assert.ok(content.includes('behind'), 'Should detect commits behind');
  });
});
