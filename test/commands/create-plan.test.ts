/**
 * Tests for create-plan command
 * Phase B Mini - Context Query Completion
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { createPlan } from '../../lib/commands/create-plan.js';

describe('create-plan command', () => {
  const testDir = path.join(process.cwd(), 'test-fixtures', 'create-plan-test');

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(path.join(testDir, '.aiknowsys', 'plans'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('creates plan file with YAML frontmatter', async () => {
    const result = await createPlan({
      title: 'Test Feature Implementation',
      author: 'test-user',
      targetDir: testDir,
      _silent: true
    });

    expect(result.created).toBe(true);
    expect(result.planId).toBe('PLAN_test_feature_implementation');

    // Verify file exists
    const filepath = path.join(testDir, '.aiknowsys', 'PLAN_test_feature_implementation.md');
    const exists = await fs.access(filepath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify content has YAML frontmatter
    const content = await fs.readFile(filepath, 'utf-8');
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('id: PLAN_test_feature_implementation');
    expect(content).toContain('title: "Test Feature Implementation"');
    expect(content).toContain('author: test-user');
    expect(content).toContain('status: PLANNED');
  });

  it('generates plan ID from title', async () => {
    const result = await createPlan({
      title: 'Bug Fix: Performance Issue',
      author: 'dev',
      targetDir: testDir,
      _silent: true
    });

    expect(result.planId).toBe('PLAN_bug_fix_performance_issue');
  });

  it('creates active plan pointer', async () => {
    await createPlan({
      title: 'Feature A',
      author: 'alice',
      targetDir: testDir,
      _silent: true
    });

    const pointerPath = path.join(testDir, '.aiknowsys', 'plans', 'active-alice.md');
    const exists = await fs.access(pointerPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    const content = await fs.readFile(pointerPath, 'utf-8');
    expect(content).toContain('# Active Plan: alice');
    expect(content).toContain('[Feature A](../PLAN_feature_a.md)');
    expect(content).toContain('🎯 ACTIVE');
  });

  it('updates existing pointer when creating new plan', async () => {
    // Create first plan
    await createPlan({
      title: 'Plan One',
      author: 'bob',
      targetDir: testDir,
      _silent: true
    });

    // Create second plan (should update pointer)
    await createPlan({
      title: 'Plan Two',
      author: 'bob',
      targetDir: testDir,
      _silent: true
    });

    const pointerPath = path.join(testDir, '.aiknowsys', 'plans', 'active-bob.md');
    const content = await fs.readFile(pointerPath, 'utf-8');
    
    // Pointer should reference newest plan
    expect(content).toContain('[Plan Two](../PLAN_plan_two.md)');
    expect(content).not.toContain('Plan One');
  });

  it('throws error if title is missing', async () => {
    await expect(
      createPlan({
        author: 'test',
        targetDir: testDir,
        _silent: true
      } as any)
    ).rejects.toThrow(/title is required/i);
  });

  it('throws error if plan already exists', async () => {
    await createPlan({
      title: 'Duplicate Test',
      author: 'test',
      targetDir: testDir,
      _silent: true
    });

    await expect(
      createPlan({
        title: 'Duplicate Test',
        author: 'test',
        targetDir: testDir,
        _silent: true
      })
    ).rejects.toThrow(/Plan already exists/);
  });

  it('uses default status PLANNED', async () => {
    await createPlan({
      title: 'Status Test',
      author: 'test',
      targetDir: testDir,
      _silent: true
    });

    const filepath = path.join(testDir, '.aiknowsys', 'PLAN_status_test.md');
    const content = await fs.readFile(filepath, 'utf-8');
    expect(content).toContain('status: PLANNED');
  });

  it('includes topics in frontmatter if provided', async () => {
    await createPlan({
      title: 'Topics Test',
      author: 'test',
      topics: ['testing', 'validation'],
      targetDir: testDir,
      _silent: true
    });

    const filepath = path.join(testDir, '.aiknowsys', 'PLAN_topics_test.md');
    const content = await fs.readFile(filepath, 'utf-8');
    expect(content).toContain('topics: [testing, validation]');
  });

  it('auto-detects author if not provided', async () => {
    const result = await createPlan({
      title: 'Auto Author Test',
      targetDir: testDir,
      _silent: true
    });

    expect(result.created).toBe(true);
    // Author should be detected (not 'unknown' in test environment)
    const filepath = path.join(testDir, '.aiknowsys', 'PLAN_auto_author_test.md');
    const content = await fs.readFile(filepath, 'utf-8');
    expect(content).toContain('author:');
  });

  it('updates context index after creating plan', async () => {
    await createPlan({
      title: 'Index Test',
      author: 'test',
      targetDir: testDir,
      _silent: true
    });

    // Check index was created/updated
    const indexPath = path.join(testDir, '.aiknowsys', 'context-index.json');
    const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
    expect(indexExists).toBe(true);

    const index = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
    expect(index.plans.length).toBeGreaterThan(0);
    
    // Find the plan we just created
    const createdPlan = index.plans.find((p: any) => p.file === 'PLAN_index_test.md');
    expect(createdPlan).toBeDefined();
    expect(createdPlan?.id).toBe('PLAN_index_test');
  });

  it('returns metadata in response', async () => {
    const result = await createPlan({
      title: 'Metadata Test',
      author: 'test',
      targetDir: testDir,
      _silent: true
    });

    expect(result.planId).toBe('PLAN_metadata_test');
    expect(result.filePath).toContain('PLAN_metadata_test.md');
    expect(result.pointerPath).toContain('active-test.md');
    expect(result.created).toBe(true);
  });

  it('creates directories recursively if missing', async () => {
    // Remove directories
    await fs.rm(path.join(testDir, '.aiknowsys'), { recursive: true, force: true });

    await createPlan({
      title: 'Dir Test',
      author: 'test',
      targetDir: testDir,
      _silent: true
    });

    const filepath = path.join(testDir, '.aiknowsys', 'PLAN_dir_test.md');
    const exists = await fs.access(filepath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});
