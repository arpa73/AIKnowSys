/**
 * Tests for AutoIndexer - Auto-rebuild on stale index
 * Phase A.6 - Context Query Completion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { AutoIndexer } from '../../lib/context/auto-index.js';
import { JsonStorage } from '../../lib/context/json-storage.js';

describe('AutoIndexer', () => {
  const testDir = path.join(process.cwd(), 'test-fixtures', 'auto-index-test');
  let storage: JsonStorage;
  let autoIndexer: AutoIndexer;

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(path.join(testDir, '.aiknowsys', 'plans'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.aiknowsys', 'sessions'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.aiknowsys', 'learned'), { recursive: true });

    // Initialize storage
    storage = new JsonStorage();
    await storage.init(testDir);

    // Initialize auto-indexer
    autoIndexer = new AutoIndexer(testDir);
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('isIndexStale', () => {
    it('detects stale index when files are newer than index', async () => {
      // Build initial index
      await storage.rebuildIndex();

      // Wait to ensure filesystem mtime difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new session file (newer than index)
      const sessionPath = path.join(testDir, '.aiknowsys', 'sessions', '2026-02-07-session.md');
      await fs.writeFile(sessionPath, `# Session: Test (Feb 7, 2026)\n\n## Goal\nTest auto-rebuild`);

      // Should detect staleness
      const stale = await autoIndexer.isIndexStale(storage);
      expect(stale).toBe(true);
    });

    it('reports fresh index when no files changed', async () => {
      // Build index
      await storage.rebuildIndex();

      // No new files created

      // Should be fresh
      const stale = await autoIndexer.isIndexStale(storage);
      expect(stale).toBe(false);
    });

    it('detects staleness when plan file is newer', async () => {
      // Build initial index
      await storage.rebuildIndex();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new plan file
      const planPath = path.join(testDir, '.aiknowsys', 'PLAN_test.md');
      await fs.writeFile(planPath, `# Implementation Plan: Test\n\n**Status:** ACTIVE`);

      // Should detect staleness
      const stale = await autoIndexer.isIndexStale(storage);
      expect(stale).toBe(true);
    });

    it('returns true when index does not exist', async () => {
      // Delete index file (created by init in beforeEach)
      const indexPath = storage.getIndexPath();
      await fs.rm(indexPath, { force: true });

      // Should be stale (index missing)
      const stale = await autoIndexer.isIndexStale(storage);
      expect(stale).toBe(true);
    });

    it('handles non-existent source directories gracefully', async () => {
      // Build index
      await storage.rebuildIndex();

      // Remove sessions directory
      await fs.rm(path.join(testDir, '.aiknowsys', 'sessions'), { recursive: true });

      // Should not throw, should report as fresh
      const stale = await autoIndexer.isIndexStale(storage);
      expect(stale).toBe(false);
    });
  });

  describe('ensureFreshIndex', () => {
    it('rebuilds index when stale', async () => {
      // Create initial index
      await storage.rebuildIndex();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new session
      const sessionPath = path.join(testDir, '.aiknowsys', 'sessions', '2026-02-07-new.md');
      await fs.writeFile(sessionPath, `# Session: New (Feb 7, 2026)\n\n## Goal\nTest`);

      // Ensure fresh (should rebuild)
      const wasRebuilt = await autoIndexer.ensureFreshIndex(storage, { verbose: false });

      expect(wasRebuilt).toBe(true);

      // Verify index now contains new session
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];
      
      const { sessions } = await storage.querySessions({ dateAfter: todayISO });
      expect(sessions.some(s => s.file.includes('2026-02-07-new'))).toBe(true);
    });

    it('does not rebuild when index is fresh', async () => {
      // Create index
      await storage.rebuildIndex();

      // Spy on rebuildIndex
      const rebuildSpy = vi.spyOn(storage, 'rebuildIndex');

      // Ensure fresh (should NOT rebuild)
      const wasRebuilt = await autoIndexer.ensureFreshIndex(storage, { verbose: false });

      expect(wasRebuilt).toBe(false);
      expect(rebuildSpy).not.toHaveBeenCalled();
    });

    it('forces rebuild when force=true even if fresh', async () => {
      // Create index
      await storage.rebuildIndex();

      // Force rebuild
      const wasRebuilt = await autoIndexer.ensureFreshIndex(storage, { force: true, verbose: false });

      expect(wasRebuilt).toBe(true);
    });

    it('logs rebuild events when verbose=true', async () => {
      // Create initial index
      await storage.rebuildIndex();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new file
      const sessionPath = path.join(testDir, '.aiknowsys', 'sessions', '2026-02-07-test.md');
      await fs.writeFile(sessionPath, `# Session: Test (Feb 7, 2026)\n\n## Goal\nTest`);

      // Mock console to capture logs
      const logSpy = vi.spyOn(console, 'log');

      // Ensure fresh with verbose
      await autoIndexer.ensureFreshIndex(storage, { verbose: true });

      // Should have logged rebuild
      expect(logSpy).toHaveBeenCalled();
      const logs = logSpy.mock.calls.map(call => call.join(' '));
      const hasRebuildLog = logs.some(log => log.includes('stale') || log.includes('rebuild'));
      expect(hasRebuildLog).toBe(true);

      logSpy.mockRestore();
    });
  });

  describe('integration with queries', () => {
    it('auto-rebuilds when querying with stale index', async () => {
      // Create initial index
      await storage.rebuildIndex();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new session file
      const sessionPath = path.join(testDir, '.aiknowsys', 'sessions', '2026-02-07-integration.md');
      const sessionContent = `# Session: Integration Test (Feb 7, 2026)

**Topics:** test, auto-rebuild

## Goal
Test integration
`;
      await fs.writeFile(sessionPath, sessionContent);

      // Query should trigger auto-rebuild via ensureFreshIndex
      // (This will be integrated in Step A6.2)
      await autoIndexer.ensureFreshIndex(storage, { verbose: false });

      // Should find new session
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];
      
      const { sessions } = await storage.querySessions({ dateAfter: todayISO });
      expect(sessions.some(s => s.file.includes('integration'))).toBe(true);
    });
  });

  describe('performance', () => {
    it('completes rebuild in <1 second for <100 files', async () => {
      // Create 50 session files
      for (let i = 0; i < 50; i++) {
        const sessionPath = path.join(testDir, '.aiknowsys', 'sessions', `2026-02-${String(i + 1).padStart(2, '0')}-session.md`);
        await fs.writeFile(sessionPath, `# Session: Test ${i} (Feb ${i + 1}, 2026)\n\n## Goal\nTest`);
      }

      // Initial build
      await storage.rebuildIndex();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Create one more file
      const newSession = path.join(testDir, '.aiknowsys', 'sessions', '2026-03-01-new.md');
      await fs.writeFile(newSession, `# Session: New (Mar 1, 2026)\n\n## Goal\nTest`);

      // Measure rebuild time
      const start = Date.now();
      await autoIndexer.ensureFreshIndex(storage, { verbose: false });
      const duration = Date.now() - start;

      // Should be <1000ms
      expect(duration).toBeLessThan(1000);
    });
  });
});
