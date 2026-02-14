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

  // ====================================================================
  // Phase 1: Content Manipulation Tests (v0.11.0)
  // ====================================================================

  it('appends section with inline content', async () => {
    const result = await updateSession({
      appendSection: '## Work Complete',
      content: 'All polishing items finished.\n\nTests passing: 959/959',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Appended section: ## Work Complete');

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('## Work Complete');
    expect(sessionContent).toContain('All polishing items finished.');
    expect(sessionContent).toContain('Tests passing: 959/959');
  });

  it('appends section without content (just header)', async () => {
    const result = await updateSession({
      appendSection: '## Notes',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('## Notes');
  });

  it('appends content from file', async () => {
    // Create a test markdown file
    const contentFile = path.join(testDir, 'test-content.md');
    await fs.writeFile(contentFile, '## Imported Section\n\nThis content came from a file.', 'utf-8');

    const result = await updateSession({
      appendFile: contentFile,
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain(`Appended content from: ${contentFile}`);

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('## Imported Section');
    expect(sessionContent).toContain('This content came from a file.');

    // Cleanup
    await fs.rm(contentFile);
  });

  it('combines metadata and content updates', async () => {
    const result = await updateSession({
      addTopic: 'polishing',
      setStatus: 'complete',
      appendSection: '## Summary',
      content: 'Completed all enhancements.',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Added topic: polishing');
    expect(result.changes).toContain('Status: in-progress → complete');
    expect(result.changes).toContain('Appended section: ## Summary');

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    // Metadata changes
    expect(sessionContent).toContain('topics: ["initial", "polishing"]');
    expect(sessionContent).toContain('status: "complete"');
    // Content changes
    expect(sessionContent).toContain('## Summary');
    expect(sessionContent).toContain('Completed all enhancements.');
  });

  it('rejects appendFile with non-existent file', async () => {
    await expect(updateSession({
      appendFile: path.join(testDir, 'nonexistent.md'),
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow();
  });

  it('rejects appendSection with content but no section title', async () => {
    await expect(updateSession({
      content: 'Content without section',
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow(/content requires a section option/);
  });

  it('preserves existing content when appending', async () => {
    // Add initial content
    await updateSession({
      appendSection: '## First Section',
      content: 'First content',
      targetDir: testDir,
      _silent: true
    });

    // Append more content
    await updateSession({
      appendSection: '## Second Section',
      content: 'Second content',
      targetDir: testDir,
      _silent: true
    });

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('## First Section');
    expect(sessionContent).toContain('First content');
    expect(sessionContent).toContain('## Second Section');
    expect(sessionContent).toContain('Second content');
  });

  it('allows duplicate section headers (markdown permits this)', async () => {
    // Add first note
    await updateSession({
      appendSection: '## Test Notes',
      content: 'First note',
      targetDir: testDir,
      _silent: true
    });

    // Add second note with same header
    await updateSession({
      appendSection: '## Test Notes',
      content: 'Second note',
      targetDir: testDir,
      _silent: true
    });

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    const notesSections = (sessionContent.match(/## Test Notes/g) || []).length;
    expect(notesSections).toBe(2); // Explicitly allow duplicate headers
    expect(sessionContent).toContain('First note');
    expect(sessionContent).toContain('Second note');
  });

  // === Shortcuts Tests (Phase 4.2) ===

  it('supports --done shortcut for completing session', async () => {
    const result = await updateSession({
      done: true,
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Status: in-progress → complete');

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('status: "complete"');
  });

  it('supports --wip shortcut for marking session in-progress', async () => {
    // First mark as complete
    await updateSession({
      setStatus: 'complete',
      targetDir: testDir,
      _silent: true
    });

    // Then use wip shortcut
    const result = await updateSession({
      wip: true,
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Status: complete → in-progress');

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('status: "in-progress"');
  });

  it('supports --append shortcut for adding Update section with content', async () => {
    const result = await updateSession({
      append: 'Completed refactoring',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Appended section: ## Update');

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('## Update');
    expect(sessionContent).toContain('Completed refactoring');
  });

  it('auto-detects file path in --append and reads content', async () => {
    // Create a test markdown file
    const testNotePath = path.join(testDir, 'test-note.md');
    await fs.writeFile(testNotePath, '# Test Note\n\nFile content here', 'utf-8');

    const result = await updateSession({
      append: testNotePath,
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('## Update');
    expect(sessionContent).toContain('# Test Note');
    expect(sessionContent).toContain('File content here');
  });

  it('treats --append with newlines as markdown content', async () => {
    const multilineContent = 'Line 1\n\nLine 2\n\n- Bullet';
    const result = await updateSession({
      append: multilineContent,
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('Line 1');
    expect(sessionContent).toContain('Line 2');
    expect(sessionContent).toContain('- Bullet');
  });

  // Phase 1: Advanced insertion options
  it('supports --prepend to add section at the beginning', async () => {
    // Setup: Create session with existing content
    await updateSession({
      appendSection: '## Middle Section',
      content: 'Existing content',
      targetDir: testDir,
      _silent: true
    });

    // Test: Prepend new section
    const result = await updateSession({
      prependSection: '## First Section',
      content: 'This should appear first',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Prepended section: ## First Section');

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    const firstSectionPos = sessionContent.indexOf('## First Section');
    const middleSectionPos = sessionContent.indexOf('## Middle Section');
    expect(firstSectionPos).toBeGreaterThan(0);
    expect(middleSectionPos).toBeGreaterThan(firstSectionPos);
  });

  it('supports --insert-after to insert section after pattern', async () => {
    // Setup: Create session with multiple sections (use unique names)
    await updateSession({
      appendSection: '## InsertAfter Goal',
      content: 'Original goal',
      targetDir: testDir,
      _silent: true
    });
    await updateSession({
      appendSection: '## InsertAfter Notes',
      content: 'Final notes',
      targetDir: testDir,
      _silent: true
    });

    // Test: Insert section after Goal
    const result = await updateSession({
      insertAfter: '## InsertAfter Goal',
      appendSection: '## Changes',
      content: 'List of changes',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Inserted section after: ## InsertAfter Goal');

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    const goalPos = sessionContent.indexOf('## InsertAfter Goal');
    // Use specific pattern to find our inserted section, not template section
    const changesPos = sessionContent.indexOf('## Changes\n\nList of changes');
    const notesPos = sessionContent.indexOf('## InsertAfter Notes');
    expect(changesPos).toBeGreaterThan(goalPos);
    expect(notesPos).toBeGreaterThan(changesPos);
  });

  it('supports --insert-before to insert section before pattern', async () => {
    // Setup: Create session with sections (use unique names)
    await updateSession({
      appendSection: '## InsertBefore Goal',
      content: 'Original goal',
      targetDir: testDir,
      _silent: true
    });
    await updateSession({
      appendSection: '## InsertBefore Notes',
      content: 'Final notes',
      targetDir: testDir,
      _silent: true
    });

    // Test: Insert section before Notes
    const result = await updateSession({
      insertBefore: '## InsertBefore Notes',
      appendSection: '## Changes',
      content: 'List of changes',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    expect(result.changes).toContain('Inserted section before: ## InsertBefore Notes');

    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    const goalPos = sessionContent.indexOf('## InsertBefore Goal');
    // Use specific pattern to find our inserted section, not template section
    const changesPos = sessionContent.indexOf('## Changes\n\nList of changes');
    const notesPos = sessionContent.indexOf('## InsertBefore Notes');
    expect(changesPos).toBeGreaterThan(goalPos);
    expect(notesPos).toBeGreaterThan(changesPos);
  });

  it('throws error when insert pattern not found', async () => {
    await expect(updateSession({
      insertAfter: '## Nonexistent Section',
      appendSection: '## New Section',
      content: 'Content',
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow('Pattern not found: ## Nonexistent Section');
  });

  it('handles prepend with only section title', async () => {
    const result = await updateSession({
      prependSection: '## Quick Note',
      targetDir: testDir,
      _silent: true
    });

    expect(result.updated).toBe(true);
    const sessionContent = await fs.readFile(sessionPath, 'utf-8');
    expect(sessionContent).toContain('## Quick Note');
  });

  // Optional Enhancement: Multi-match detection
  it('detects when pattern matches multiple times and provides helpful error', async () => {
    // Setup: Create session with duplicate pattern (use unique name to avoid template conflicts)
    await updateSession({
      appendSection: '## MultiMatch Notes',
      content: 'First notes',
      targetDir: testDir,
      _silent: true
    });
    await updateSession({
      appendSection: '## MultiMatch Notes',
      content: 'Second notes',
      targetDir: testDir,
      _silent: true
    });

    // Test: insertAfter with ambiguous pattern should error
    await expect(updateSession({
      insertAfter: '## MultiMatch Notes',
      appendSection: '## Summary',
      content: 'Summary content',
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow(/Pattern '## MultiMatch Notes' found 2 times/);
    
    // Error should include line number hints
    await expect(updateSession({
      insertAfter: '## MultiMatch Notes',
      appendSection: '## Summary',
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow(/lines: \d+/);
  });

  it('provides helpful error with line numbers for duplicate patterns', async () => {
    // Setup: Create session with duplicate pattern
    await updateSession({
      appendSection: '## Changes',
      content: 'Change 1',
      targetDir: testDir,
      _silent: true
    });
    await updateSession({
      appendSection: '## Changes',
      content: 'Change 2',
      targetDir: testDir,
      _silent: true
    });

    // Test: Error message should suggest being more specific
    await expect(updateSession({
      insertBefore: '## Changes',
      appendSection: '## Summary',
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow(/more specific pattern/);
  });

  // Optional Enhancement: Better error messages
  it('provides helpful multi-line error for missing section option', async () => {
    await expect(updateSession({
      content: 'Some content without section',
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow(/--appendSection/);
    
    // Should mention all available options
    await expect(updateSession({
      content: 'Some content',
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow(/--prependSection/);
    
    await expect(updateSession({
      content: 'Some content',
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow(/--insert-after/);
    
    await expect(updateSession({
      content: 'Some content',
      targetDir: testDir,
      _silent: true
    })).rejects.toThrow(/--insert-before/);
  });
});
