/**
 * Tests for update-session command
 * Phase B Mini - Context Query Completion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { updateSession } from '../../lib/commands/update-session.js';
import { createSession } from '../../lib/commands/create-session.js';

describe('update-session command', () => {
  const testDir = path.join(process.cwd(), 'test-fixtures', 'update-session-test');
  const date = new Date().toISOString().split('T')[0];
  const sessionPath = path.join(testDir, '.aiknowsys', 'sessions', `${date}-session.md`);

  beforeEach(async () => {
    // Create test directory and initial session
    await fs.mkdir(path.join(testDir, '.aiknowsys', 'sessions'), { recursive: true });
    
    // Create a session to update
    await createSession({
      topics: ['initial'],
      title: 'Test Session',
      targetDir: testDir,
      _silent: true
    });
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('adds topic to existing topics array', async () => {
    const result = await updateSession({
      addTopic: 'TDD',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Added topic: TDD');

    // Verify file content
    const content = await fs.readFile(sessionPath, 'utf-8');
    expect(content).toContain('topics: ["initial", "TDD"]');
  });

  it('adds file to files array', async () => {
    const result = await updateSession({
      addFile: 'lib/commands/update-session.ts',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Added file: lib/commands/update-session.ts');

    const content = await fs.readFile(sessionPath, 'utf-8');
    expect(content).toContain('files: ["lib/commands/update-session.ts"]');
  });

  it('updates session status', async () => {
    const result = await updateSession({
      setStatus: 'complete',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Status: in-progress → complete');

    const content = await fs.readFile(sessionPath, 'utf-8');
    expect(content).toContain('status: "complete"');
  });

  it('applies multiple updates at once', async () => {
    const result = await updateSession({
      addTopic: 'refactoring',
      addFile: 'lib/utils/yaml-frontmatter.ts',
      setStatus: 'complete',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toBeDefined();
    expect(result.changes!.length).toBe(3);

    const content = await fs.readFile(sessionPath, 'utf-8');
    expect(content).toContain('topics: ["initial", "refactoring"]');
    expect(content).toContain('files: ["lib/utils/yaml-frontmatter.ts"]');
    expect(content).toContain('status: "complete"');
  });

  it('does not duplicate topics', async () => {
    // Add same topic twice
    await updateSession({
      addTopic: 'TDD',
      targetDir: testDir,
      _silent: true
    });

    const result = await updateSession({
      addTopic: 'TDD',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(false);
    expect(result.message).toContain('No changes needed');

    const content = await fs.readFile(sessionPath, 'utf-8');
    // Should only appear once
    expect(content.match(/TDD/g)?.length).toBe(1);
  });

  it('does not duplicate files', async () => {
    const file = 'lib/commands/update-session.ts';
    
    await updateSession({
      addFile: file,
      targetDir: testDir,
      _silent: true
    });

    const result = await updateSession({
      addFile: file,
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(false);
    expect(result.message).toContain('No changes needed');
  });

  it('throws error if session does not exist', async () => {
    // Remove the session file
    await fs.rm(sessionPath);

    await expect(
      updateSession({
        addTopic: 'test',
        targetDir: testDir,
        _silent: true
      })
    ).rejects.toThrow(/No session file found/);
  });

  it('validates status values', async () => {
    await expect(
      updateSession({
        setStatus: 'invalid-status' as any,
        targetDir: testDir,
        _silent: true
      })
    ).rejects.toThrow(/Invalid status/);
  });

  it('updates index after modification', async () => {
    await updateSession({
      addTopic: 'validation',
      targetDir: testDir,
      _silent: true
    });

    // Check index was updated
    const indexPath = path.join(testDir, '.aiknowsys', 'context-index.json');
    const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
    expect(indexExists).toBe(true);

    const index = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
    expect(index.sessions.length).toBeGreaterThan(0);
    expect(index.sessions[0].topics).toContain('validation');
  });

  it('returns JSON output when json=true', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await updateSession({
      addTopic: 'test',
      json: true,
      targetDir: testDir,
      _silent: true
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"updated": true')
    );

    consoleSpy.mockRestore();
  });

  it('returns metadata in response', async () => {
    const result = await updateSession({
      addTopic: 'metadata-test',
      targetDir: testDir,
      _silent: true
    });

    expect(result.filePath).toBe(sessionPath);
    expect(result.updated).toBe(true);
    expect(result.changes).toBeDefined();
    expect(Array.isArray(result.changes)).toBe(true);
  });

  it('preserves markdown content when updating frontmatter', async () => {
    // Add custom content to session
    const originalContent = await fs.readFile(sessionPath, 'utf-8');
    const customContent = originalContent + '\n## Custom Section\nCustom content here\n';
    await fs.writeFile(sessionPath, customContent, 'utf-8');

    await updateSession({
      addTopic: 'preserve-test',
      targetDir: testDir,
      _silent: true
    });

    const newContent = await fs.readFile(sessionPath, 'utf-8');
    expect(newContent).toContain('## Custom Section');
    expect(newContent).toContain('Custom content here');
  });

  it('handles session with no options gracefully', async () => {
    const result = await updateSession({
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(false);
    expect(result.message).toContain('No changes');
  });
});
