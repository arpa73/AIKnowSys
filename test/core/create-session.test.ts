/**
 * Tests for lib/core/create-session.ts
 * 
 * Testing pure business logic for session creation.
 * TDD Step 1: Write tests FIRST (RED phase)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { createSessionCore } from '../../lib/core/create-session.js';
import type { CreateSessionCoreOptions, CreateSessionCoreResult } from '../../lib/core/create-session.js';

describe('createSessionCore (Pure Business Logic)', () => {
  const testDir = path.join(process.cwd(), 'test-tmp-session-core');
  const sessionsDir = path.join(testDir, '.aiknowsys', 'sessions');

  beforeEach(async () => {
    // Create clean test directory
    await fs.mkdir(sessionsDir, { recursive: true });
    
    // Create minimal context-index.json (required by storage)
    const indexPath = path.join(testDir, '.aiknowsys', 'context-index.json');
    await fs.writeFile(
      indexPath,
      JSON.stringify({ version: 1, updated: new Date().toISOString(), plans: [], sessions: [], learned: [] }),
      'utf-8'
    );
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('🔴 RED Phase - These tests should FAIL initially', () => {
    it('should create a new session file with proper structure', async () => {
      // Arrange
      const options: CreateSessionCoreOptions = {
        title: 'Test Session',
        topics: ['test', 'core'],
        plan: null,
        targetDir: testDir
      };

      // Act
      const result: CreateSessionCoreResult = await createSessionCore(options);

      // Assert - Structured return value
      expect(result.created).toBe(true);
      expect(result.filePath).toContain('.aiknowsys/sessions');
      expect(result.filePath).toMatch(/\d{4}-\d{2}-\d{2}-session\.md$/);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.title).toBe('Test Session');
      expect(result.metadata?.topics).toEqual(['test', 'core']);

      // Assert - File exists
      const fileExists = await fs.access(result.filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Assert - File content has YAML frontmatter
      const content = await fs.readFile(result.filePath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('# Session: Test Session'); // Title in heading, not frontmatter
      expect(content).toContain('topics: ["test", "core"]');
      expect(content).toContain('status: "in-progress"');
    });

    it('should return created=false if session already exists', async () => {
      // Arrange - Create session first time
      const options: CreateSessionCoreOptions = {
        title: 'Existing Session',
        topics: [],
        plan: null,
        targetDir: testDir
      };

      const firstResult = await createSessionCore(options);
      expect(firstResult.created).toBe(true);

      // Act - Try to create again
      const secondResult = await createSessionCore(options);

      // Assert - Should not recreate
      expect(secondResult.created).toBe(false);
      expect(secondResult.message).toContain('already exists');
      expect(secondResult.filePath).toBe(firstResult.filePath);
    });

    it('should handle missing topics gracefully', async () => {
      // Arrange
      const options: CreateSessionCoreOptions = {
        title: 'No Topics Session',
        topics: [],
        plan: null,
        targetDir: testDir
      };

      // Act
      const result = await createSessionCore(options);

      // Assert
      expect(result.created).toBe(true);
      expect(result.metadata?.topics).toEqual([]);
    });

    it('should throw error for invalid title (< 3 chars)', async () => {
      // Arrange
      const options: CreateSessionCoreOptions = {
        title: 'AB', // Too short
        topics: [],
        plan: null,
        targetDir: testDir
      };

      // Act & Assert
      await expect(createSessionCore(options)).rejects.toThrow();
    });

    it('should NOT log anything (pure function)', async () => {
      // This test verifies the function is pure - no console.log calls
      const consoleSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // Arrange
      const options: CreateSessionCoreOptions = {
        title: 'Pure Test',
        topics: ['testing'],
        plan: null,
        targetDir: testDir
      };

      // Act
      await createSessionCore(options);

      // Assert - NO console calls
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should update context index after creation', async () => {
      // Arrange
      const options: CreateSessionCoreOptions = {
        title: 'Index Test',
        topics: ['indexing'],
        plan: 'PLAN_test',
        targetDir: testDir
      };

      // Act
      await createSessionCore(options);

      // Assert - Index should be updated
      const indexPath = path.join(testDir, '.aiknowsys', 'context-index.json');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);

      expect(index.sessions).toBeDefined();
      expect(index.sessions.length).toBeGreaterThan(0);
      
      const session = index.sessions.find((s: any) => s.topic?.includes('Index Test'));
      expect(session).toBeDefined();
    });
  });
});
