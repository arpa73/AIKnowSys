import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { listPatterns } from '../lib/commands/list-patterns.js';

describe('list-patterns command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(import.meta.dirname, 'fixtures', 'list-patterns-test');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should list personal patterns', async () => {
    // Setup: Create personal patterns
    const personalDir: string = path.join(testDir, '.aiknowsys', 'personal', 'test-user');
    await fs.mkdir(personalDir, { recursive: true });
    await fs.writeFile(path.join(personalDir, 'api-retry.md'), '# API Retry\n\n**Trigger Words:** api, retry, error');
    await fs.writeFile(path.join(personalDir, 'vue-composable.md'), '# Vue Composable\n\n**Trigger Words:** vue, composable');

    const result: any = await listPatterns({ dir: testDir, _silent: true, _username: 'test-user' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.personal.length, 2);
    assert.ok(result.personal.some((p: any) => p.name === 'api-retry.md'));
    assert.ok(result.personal.some((p: any) => p.name === 'vue-composable.md'));
  });

  it('should list team patterns from learned directory', async () => {
    // Setup: Create learned patterns
    const learnedDir: string = path.join(testDir, '.aiknowsys', 'learned');
    await fs.mkdir(learnedDir, { recursive: true });
    await fs.writeFile(path.join(learnedDir, 'database-pooling.md'), '# Database Pooling\n\n**Trigger Words:** database, pool');
    await fs.writeFile(path.join(learnedDir, 'error-handling.md'), '# Error Handling\n\n**Trigger Words:** error, handling');

    const result: any = await listPatterns({ dir: testDir, _silent: true, _username: 'test-user' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.learned.length, 2);
    assert.ok(result.learned.some((p: any) => p.name === 'database-pooling.md'));
    assert.ok(result.learned.some((p: any) => p.name === 'error-handling.md'));
  });

  it('should show both personal and team patterns', async () => {
    // Setup: Create both types
    const personalDir: string = path.join(testDir, '.aiknowsys', 'personal', 'test-user');
    const learnedDir: string = path.join(testDir, '.aiknowsys', 'learned');
    await fs.mkdir(personalDir, { recursive: true });
    await fs.mkdir(learnedDir, { recursive: true });
    
    await fs.writeFile(path.join(personalDir, 'personal-pattern.md'), '# Personal\n\n**Trigger Words:** test');
    await fs.writeFile(path.join(learnedDir, 'team-pattern.md'), '# Team\n\n**Trigger Words:** test');

    const result: any = await listPatterns({ dir: testDir, _silent: true, _username: 'test-user' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.personal.length, 1);
    assert.strictEqual(result.learned.length, 1);
  });

  it('should handle empty state (no patterns)', async () => {
    // Setup: Create directories but no patterns
    const personalDir: string = path.join(testDir, '.aiknowsys', 'personal', 'test-user');
    const learnedDir: string = path.join(testDir, '.aiknowsys', 'learned');
    await fs.mkdir(personalDir, { recursive: true });
    await fs.mkdir(learnedDir, { recursive: true });

    const result: any = await listPatterns({ dir: testDir, _silent: true, _username: 'test-user' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.personal.length, 0);
    assert.strictEqual(result.learned.length, 0);
    assert.ok(result.message.includes('No patterns found'));
  });

  it('should handle missing directories gracefully', async () => {
    // No .aiknowsys directory at all
    const result: any = await listPatterns({ dir: testDir, _silent: true, _username: 'test-user' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.personal.length, 0);
    assert.strictEqual(result.learned.length, 0);
  });

  it('should error if no git username available', async () => {
    const result: any = await listPatterns({ dir: testDir, _silent: true, _username: null });

    assert.strictEqual(result.success, false);
    assert.ok(result.message.includes('No git username'));
  });

  it('should filter out non-markdown files', async () => {
    // Setup: Create patterns with various extensions
    const personalDir: string = path.join(testDir, '.aiknowsys', 'personal', 'test-user');
    await fs.mkdir(personalDir, { recursive: true });
    await fs.writeFile(path.join(personalDir, 'valid-pattern.md'), '# Valid\n\n**Trigger Words:** test');
    await fs.writeFile(path.join(personalDir, 'readme.txt'), 'Not a pattern');
    await fs.writeFile(path.join(personalDir, '.gitkeep'), '');

    const result: any = await listPatterns({ dir: testDir, _silent: true, _username: 'test-user' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.personal.length, 1);
    assert.strictEqual(result.personal[0].name, 'valid-pattern.md');
  });

  it('should extract trigger words from patterns', async () => {
    // Setup: Create pattern with trigger words
    const personalDir: string = path.join(testDir, '.aiknowsys', 'personal', 'test-user');
    await fs.mkdir(personalDir, { recursive: true });
    await fs.writeFile(
      path.join(personalDir, 'test-pattern.md'),
      '# Test Pattern\n\n**Trigger Words:** api, retry, error, handling\n\n## Content'
    );

    const result: any = await listPatterns({ dir: testDir, _silent: true, _username: 'test-user' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.personal.length, 1);
    assert.deepStrictEqual(result.personal[0].keywords, ['api', 'retry', 'error', 'handling']);
  });
});
