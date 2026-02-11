/**
 * TDD Tests for updateSessionCore (Pure Business Logic)
 * 
 * Phase 2 Batch 2: Most complex mutation command
 * Written FIRST following strict TDD workflow (RED → GREEN → REFACTOR)
 * 
 * Features to test:
 * - Frontmatter updates (topics, files, status)
 * - Content modes: append, prepend, insert-after, insert-before
 * - Shortcuts: done, wip, append
 * - File appending
 * - Multiple pattern detection
 * - Section finding logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rm, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { updateSessionCore } from '../../lib/core/update-session.js';

describe('updateSessionCore (Pure Business Logic)', () => {
  const TEST_DIR = resolve(process.cwd(), `test-tmp-update-session-${Date.now()}`);
  const TODAY = new Date().toISOString().split('T')[0];

  beforeEach(async () => {
    // Clean slate for each test
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
    await mkdir(TEST_DIR, { recursive: true });
    
    // Create .aiknowsys/sessions directory
    const sessionsDir = resolve(TEST_DIR, '.aiknowsys', 'sessions');
    await mkdir(sessionsDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  /**
   * Helper to create a basic session file
   */
  async function createSession(content?: string) {
    const defaultContent = `---
date: ${TODAY}
topics: []
files: []
status: in-progress
---

# Session: ${TODAY}

## Goal
Test session

## Progress
Initial setup
`;

    const sessionPath = resolve(TEST_DIR, '.aiknowsys', 'sessions', `${TODAY}-session.md`);
    await writeFile(sessionPath, content || defaultContent, 'utf-8');
    return sessionPath;
  }

  describe('🔴 RED Phase - Frontmatter Updates', () => {
    it('should add topic to session', async () => {
      await createSession();

      const result = await updateSessionCore({
        addTopic: 'testing',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Added topic: testing');

      // Verify file content
      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('topics:');
      expect(content).toContain('- testing');
    });

    it('should add file to session', async () => {
      await createSession();

      const result = await updateSessionCore({
        addFile: 'src/test.ts',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Added file: src/test.ts');

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('- src/test.ts');
    });

    it('should update status', async () => {
      await createSession();

      const result = await updateSessionCore({
        setStatus: 'complete',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes?.some(c => c.includes('Status'))).toBe(true);
      expect(result.changes?.some(c => /in-progress.*complete/.test(c))).toBe(true);

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('status: complete');
    });

    it('should throw error for invalid status', async () => {
      await createSession();

      await expect(
        updateSessionCore({
          setStatus: 'invalid-status' as any,
          targetDir: TEST_DIR
        })
      ).rejects.toThrow(/Invalid status/i);
    });

    it('should handle multiple frontmatter updates at once', async () => {
      await createSession();

      const result = await updateSessionCore({
        addTopic: 'refactoring',
        addFile: 'lib/core/test.ts',
        setStatus: 'complete',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toHaveLength(3);
      expect(result.changes).toContain('Added topic: refactoring');
      expect(result.changes).toContain('Added file: lib/core/test.ts');
    });
  });

  describe('🔴 RED Phase - Content Manipulation', () => {
    it('should append section with content', async () => {
      await createSession();

      const result = await updateSessionCore({
        appendSection: '## Test Section',
        content: 'Test content here',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Appended section: ## Test Section');

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('## Test Section');
      expect(content).toContain('Test content here');
      // Should be at the end
      const lines = content.split('\n');
      const testSectionIndex = lines.findIndex(l => l.includes('## Test Section'));
      expect(testSectionIndex).toBeGreaterThan(lines.length - 10);
    });

    it('should prepend section after frontmatter', async () => {
      await createSession();

      const result = await updateSessionCore({
        prependSection: '## Urgent Update',
        content: 'Critical information',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Prepended section: ## Urgent Update');

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('## Urgent Update');
      expect(content).toContain('Critical information');

      // Should be right after frontmatter (before existing content)
      const lines = content.split('\n');
      const urgentIndex = lines.findIndex(l => l.includes('## Urgent Update'));
      const goalIndex = lines.findIndex(l => l.includes('## Goal'));
      expect(urgentIndex).toBeLessThan(goalIndex);
    });

    it('should insert section after pattern', async () => {
      await createSession();

      const result = await updateSessionCore({
        insertAfter: '## Goal',
        appendSection: '## Implementation',
        content: 'Implementation details',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes?.some(c => c.includes('after'))).toBe(true);

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      
      const goalIndex = content.indexOf('## Goal');
      const implIndex = content.indexOf('## Implementation');
      const progressIndex = content.indexOf('## Progress');
      
      expect(implIndex).toBeGreaterThan(goalIndex);
      expect(implIndex).toBeLessThan(progressIndex);
    });

    it('should insert section before pattern', async () => {
      await createSession();

      const result = await updateSessionCore({
        insertBefore: '## Progress',
        appendSection: '## Blockers',
        content: 'Current blockers',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes?.some(c => c.includes('before'))).toBe(true);

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      
      const blockersIndex = content.indexOf('## Blockers');
      const progressIndex = content.indexOf('## Progress');
      
      expect(blockersIndex).toBeLessThan(progressIndex);
    });

    it('should append content from file', async () => {
      await createSession();
      
      // Create a test file to append
      const testFilePath = resolve(TEST_DIR, 'notes.md');
      await writeFile(testFilePath, '## Notes\n\nSome important notes', 'utf-8');

      const result = await updateSessionCore({
        appendFile: 'notes.md',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes?.some(c => c.includes('notes.md'))).toBe(true);

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('Some important notes');
    });

    it('should throw error if pattern not found', async () => {
      await createSession();

      await expect(
        updateSessionCore({
          insertAfter: '## Nonexistent',
          content: 'test',
          targetDir: TEST_DIR
        })
      ).rejects.toThrow(/Pattern not found/i);
    });

    it('should throw error for multiple pattern matches', async () => {
      const sessionWithDuplicates = `---
date: ${TODAY}
topics: []
status: in-progress
---

# Session

## Update
First update

## Progress
Some progress

## Update
Second update
`;
      await createSession(sessionWithDuplicates);

      await expect(
        updateSessionCore({
          insertAfter: '## Update',
          content: 'test',
          targetDir: TEST_DIR
        })
      ).rejects.toThrow(/found 2 times/i);
    });
  });

  describe('🔴 RED Phase - Shortcuts', () => {
    it('should handle --done shortcut (sets status to complete)', async () => {
      await createSession();

      const result = await updateSessionCore({
        done: true,
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes?.some(c => c.includes('complete'))).toBe(true);

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('status: complete');
    });

    it('should handle --wip shortcut (sets status to in-progress)', async () => {
      const sessionComplete = `---
date: ${TODAY}
topics: []
status: complete
---

# Session
`;
      await createSession(sessionComplete);

      const result = await updateSessionCore({
        wip: true,
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      
      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('status: in-progress');
    });

    it('should handle --append shortcut with inline content', async () => {
      await createSession();

      const result = await updateSessionCore({
        append: 'Quick update note',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes?.some(c => c.includes('Update'))).toBe(true);

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('## Update');
      expect(content).toContain('Quick update note');
    });

    it('should handle --append shortcut with file path', async () => {
      await createSession();
      
      const notesPath = resolve(TEST_DIR, 'update.md');
      await writeFile(notesPath, 'File-based update', 'utf-8');

      const result = await updateSessionCore({
        append: 'update.md',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('File-based update');
    });
  });

  describe('🔴 RED Phase - Edge Cases', () => {
    it('should throw error if session file does not exist', async () => {
      await expect(
        updateSessionCore({
          addTopic: 'test',
          targetDir: TEST_DIR
        })
      ).rejects.toThrow(/No session file found/i);
    });

    it('should return updated=false when no changes needed', async () => {
      await createSession();

      const result = await updateSessionCore({
        addTopic: 'test',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);

      // Try to add same topic again
      const result2 = await updateSessionCore({
        addTopic: 'test',
        targetDir: TEST_DIR
      });

      expect(result2.updated).toBe(false);
      expect(result2.message).toContain('No changes');
    });

    it('should throw error if content without section option', async () => {
      await createSession();

      await expect(
        updateSessionCore({
          content: 'orphan content',
          targetDir: TEST_DIR
        })
      ).rejects.toThrow(/requires a section option/i);
    });

    it('should throw error if appendFile does not exist', async () => {
      await createSession();

      await expect(
        updateSessionCore({
          appendFile: 'nonexistent.md',
          targetDir: TEST_DIR
        })
      ).rejects.toThrow(/File not found/i);
    });

    it('should handle session file without any content sections', async () => {
      const minimalSession = `---
date: ${TODAY}
topics: []
status: in-progress
---

# Session: ${TODAY}
`;
      await createSession(minimalSession);

      const result = await updateSessionCore({
        appendSection: '## First Section',
        content: 'First content',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('## First Section');
    });

    it('should NOT log anything (pure function)', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      await createSession();

      await updateSessionCore({
        addTopic: 'silent-test',
        targetDir: TEST_DIR
      });

      // Pure function should NOT have side effects (no console output)
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should update context index after modification', async () => {
      await createSession();

      await updateSessionCore({
        addTopic: 'index-test',
        targetDir: TEST_DIR
      });

      // Verify context index was updated
      const indexPath = resolve(TEST_DIR, '.aiknowsys', 'context-index.json');
      expect(existsSync(indexPath)).toBe(true);
    });
  });
});
