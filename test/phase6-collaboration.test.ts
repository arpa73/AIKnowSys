/**
 * Tests for Phase 6: Collaboration & CI/CD features
 */

import { describe, it, beforeEach, afterEach, expect } from 'vitest';
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

    expect(result.success).toBe(true);
    expect(Array.isArray(result.checks)).toBeTruthy();
    expect(result.checks.length > 0).toBeTruthy();
    expect(typeof result.totalDuration === 'number').toBeTruthy();
  }, 30000); // Increase timeout for npm operations

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

    expect(result.success).toBe(false);
    
    const testCheck: any = result.checks.find((c: any) => c.check === 'Tests');
    expect(testCheck).toBeTruthy();
    expect(testCheck.passed).toBe(false);
  }, 30000); // Increase timeout for npm operations

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
    expect(result.success).toBe(true);
  }, 30000); // Increase timeout for npm operations

  it('should report check durations', async () => {
    const result: any = await ciCheck({
      dir: TEST_DIR,
      _silent: true
    });

    for (const check of result.checks) {
      expect(typeof check.duration === 'number').toBeTruthy();
      expect(check.duration >= 0).toBeTruthy();
    }
  }, 30000); // Increase timeout for npm operations
});

describe('pre-commit hook', () => {
  const HOOK_PATH: string = path.join(projectRoot, 'templates', 'git-hooks', 'pre-commit-enhanced');

  it('should exist as a file', async () => {
    try {
      await fs.access(HOOK_PATH);
      expect(true).toBeTruthy();
    } catch {
      expect.fail('Hook file should exist');
    }
  });

  it('should be a bash script', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    expect(content.startsWith('#!/bin/bash')).toBeTruthy();
  });

  it('should include test validation', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    expect(content.includes('npm test')).toBeTruthy();
    expect(content.includes('commit blocked')).toBeTruthy();
  });

  it('should include ESSENTIALS size check', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    expect(content.includes('CODEBASE_ESSENTIALS.md')).toBeTruthy();
    expect(content.includes('800')).toBeTruthy();
  });
});

describe('collaboration-check hook', () => {
  const HOOK_PATH: string = path.join(projectRoot, 'templates', 'hooks', 'collaboration-check.mjs');

  it('should exist as a file', async () => {
    try {
      await fs.access(HOOK_PATH);
      expect(true).toBeTruthy();
    } catch {
      expect.fail('Hook file should exist');
    }
  });

  it('should be a Node.js script', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    expect(content.startsWith('#!/usr/bin/env node')).toBeTruthy();
  });

  it('should check for git repository', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    expect(content.includes('isGitRepo')).toBeTruthy();
    expect(content.includes('git rev-parse')).toBeTruthy();
  });

  it('should check CURRENT_PLAN.md changes', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    expect(content.includes('CURRENT_PLAN.md')).toBeTruthy();
    expect(content.includes('Collaboration Notice')).toBeTruthy();
  });

  it('should check branch divergence', async () => {
    const content: string = await fs.readFile(HOOK_PATH, 'utf-8');
    expect(content.includes('checkBranchDivergence')).toBeTruthy();
    expect(content.includes('behind')).toBeTruthy();
  });
});
