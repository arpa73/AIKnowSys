/**
 * Tests for create-session command
 * Phase B Mini - Context Query Completion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { createSession } from '../../lib/commands/create-session.js';

describe('create-session command', () => {
  const testDir = path.join(process.cwd(), 'test-fixtures', 'create-session-test');

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(path.join(testDir, '.aiknowsys', 'sessions'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('creates session file with YAML frontmatter', async () => {
    const result = await createSession({
      topics: ['TDD', 'validation'],
      plan: 'PLAN_xyz',
      title: 'Test Session',
      targetDir: testDir
    });

    expect(result.created).toBe(true);
    expect(result.filePath).toMatch(/\.aiknowsys\/sessions\/\d{4}-\d{2}-\d{2}-session\.md$/);

    // Verify file exists
    const content = await fs.readFile(result.filePath, 'utf-8');
    
    // Should have YAML frontmatter
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('date:');
    expect(content).toContain('topics: ["TDD", "validation"]');
    expect(content).toContain('plan: "PLAN_xyz"');
    expect(content).toContain('author:');
    expect(content).toContain('status: "in-progress"');
    expect(content).toMatch(/\n---\n/);
    
    // Should have markdown structure
    expect(content).toContain('# Session: Test Session');
    expect(content).toContain('## Goal');
    expect(content).toContain('## Changes');
    expect(content).toContain('## Notes for Next Session');
  });

  it('creates session with minimal options', async () => {
    const result = await createSession({
      targetDir: testDir
    });

    expect(result.created).toBe(true);

    const content = await fs.readFile(result.filePath, 'utf-8');
    expect(content).toContain('topics: []');
    expect(content).not.toContain('plan:');
    expect(content).toContain('status: "in-progress"');
  });

  it('uses today\'s date in filename', async () => {
    const result = await createSession({
      targetDir: testDir
    });

    const today = new Date().toISOString().split('T')[0];
    expect(result.filePath).toContain(`${today}-session.md`);
  });

  it('updates index after creating session', async () => {
    const result = await createSession({
      topics: ['test'],
      targetDir: testDir
    });

    expect(result.created).toBe(true);

    // Verify index was created/updated
    const indexPath = path.join(testDir, '.aiknowsys', 'context-index.json');
    const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
    expect(indexExists).toBe(true);

    // Verify index contains new session
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    const index = JSON.parse(indexContent);
    expect(index.sessions.length).toBeGreaterThan(0);
    expect(index.sessions[0].topics).toContain('test');
  });

  it('returns existing session if already created today', async () => {
    // Create first session
    await createSession({
      topics: ['first'],
      targetDir: testDir
    });

    // Try to create second session same day
    const result = await createSession({
      topics: ['second'],
      targetDir: testDir
    });

    expect(result.created).toBe(false);
    expect(result.message).toContain('already exists');
  });

  it('returns JSON output when json=true', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await createSession({
      topics: ['test'],
      json: true,
      targetDir: testDir
    });

    expect(consoleSpy).toHaveBeenCalled();
    const jsonOutput = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(jsonOutput).toHaveProperty('filePath');
    expect(jsonOutput).toHaveProperty('created');
    expect(jsonOutput).toHaveProperty('metadata');
    expect(jsonOutput.metadata.topics).toContain('test');

    consoleSpy.mockRestore();
  });

  it('creates .aiknowsys/sessions directory if missing', async () => {
    // Remove sessions directory
    await fs.rm(path.join(testDir, '.aiknowsys', 'sessions'), { recursive: true, force: true });

    const result = await createSession({
      targetDir: testDir
    });

    expect(result.created).toBe(true);

    // Verify directory was created
    const dirExists = await fs.access(path.join(testDir, '.aiknowsys', 'sessions'))
      .then(() => true)
      .catch(() => false);
    expect(dirExists).toBe(true);
  });

  it('includes provided plan in frontmatter', async () => {
    const result = await createSession({
      plan: 'PLAN_context_query',
      targetDir: testDir
    });

    const content = await fs.readFile(result.filePath, 'utf-8');
    expect(content).toContain('plan: "PLAN_context_query"');
  });

  it('includes provided title in session heading', async () => {
    const result = await createSession({
      title: 'Bug Fix Session',
      targetDir: testDir
    });

    const content = await fs.readFile(result.filePath, 'utf-8');
    expect(content).toContain('# Session: Bug Fix Session');
  });

  it('returns metadata in response', async () => {
    const result = await createSession({
      topics: ['TDD', 'validation'],
      plan: 'PLAN_xyz',
      title: 'Test',
      targetDir: testDir
    });

    expect(result.metadata).toBeDefined();
    expect(result.metadata!.topics).toEqual(['TDD', 'validation']);
    expect(result.metadata!.plan).toBe('PLAN_xyz');
    expect(result.metadata!.title).toBe('Test');
    expect(result.metadata!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
