import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { querySessions } from '../../lib/commands/query-sessions.js';

describe('query-sessions command', () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Create temp project directory for tests
    tmpDir = path.join(process.cwd(), 'test-tmp-query-sessions-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'sessions'), { recursive: true });

    // Create test session files
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'sessions', '2026-02-06-session.md'),
      `# Session: Context Query Implementation (Feb 6, 2026)

**Goal:** Implement context query commands

##Changes:
- lib/commands/query-plans.ts
- test/commands/query-plans.test.ts`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'sessions', '2026-02-05-session.md'),
      `# Session: TypeScript Migration (Feb 5, 2026)

**Topic:** TypeScript  
**Plan:** PLAN_typescript_migration

## Changes:
- Migrated init.ts
- Updated tests`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'sessions', '2026-01-15-session.md'),
      `# Session: Old Session (Jan 15, 2026)

**Topic:** TDD workflow

## Work Done:
- Implemented TDD workflow skill`
    );
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('basic functionality', () => {
    it('should return all sessions when no filters provided', async () => {
      const result = await querySessions({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('sessions');
      expect(result.count).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(result.sessions)).toBe(true);
    });

    it('should filter sessions by exact date', async () => {
      const result = await querySessions({
        dir: tmpDir,
        date: '2026-02-06',
        json: true,
        _silent: true
      });

      expect(result.count).toBe(1);
      expect(result.sessions[0].date).toBe('2026-02-06');
    });

    it('should filter sessions by date range (dateAfter)', async () => {
      const result = await querySessions({
        dir: tmpDir,
        dateAfter: '2026-02-01',
        json: true,
        _silent: true
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.sessions.every((s: any) => s.date > '2026-02-01')).toBe(true);
    });

    it('should filter sessions by date range (dateBefore)', async () => {
      const result = await querySessions({
        dir: tmpDir,
        dateBefore: '2026-02-01',
        json: true,
        _silent: true
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.sessions.every((s: any) => s.date < '2026-02-01')).toBe(true);
    });

    it('should filter sessions by topic (fuzzy match)', async () => {
      const result = await querySessions({
        dir: tmpDir,
        topic: 'TypeScript',
        json: true,
        _silent: true
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.sessions.some((s: any) =>
        s.topic.toLowerCase().includes('typescript')
      )).toBe(true);
    });

    it('should filter sessions by plan reference', async () => {
      const result = await querySessions({
        dir: tmpDir,
        plan: 'PLAN_typescript_migration',
        json: true,
        _silent: true
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.sessions.some((s: any) =>
        s.plan && s.plan.includes('PLAN_typescript_migration')
      )).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const result = await querySessions({
        dir: tmpDir,
        dateAfter: '2026-02-04',
        topic: 'TypeScript',
        json: true,
        _silent: true
      });

      expect(result.sessions.every((s: any) =>
        s.date > '2026-02-04' &&
        s.topic.toLowerCase().includes('typescript')
      )).toBe(true);
    });
  });

  describe('output formats', () => {
    it('should return JSON when --json flag provided', async () => {
      const result = await querySessions({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('sessions');
      expect(Array.isArray(result.sessions)).toBe(true);
    });

    it('should include all required fields in session objects', async () => {
      const result = await querySessions({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      if (result.sessions.length > 0) {
        const session = result.sessions[0];
        expect(session).toHaveProperty('date');
        expect(session).toHaveProperty('topic');
        expect(session).toHaveProperty('file');
        expect(session).toHaveProperty('created');
        expect(session).toHaveProperty('updated');
      }
    });

    it('should log to console when --json not provided', async () => {
      // This test just verifies the command runs without json flag
      const result = await querySessions({
        dir: tmpDir,
        _silent: true // Still silent for testing, but json=false
      });

      // Should still return data for testing purposes
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('sessions');
    });
  });

  describe('edge cases', () => {
    it('should return empty results when no sessions match filters', async () => {
      const result = await querySessions({
        dir: tmpDir,
        date: '2099-12-31',
        json: true,
        _silent: true
      });

      expect(result.count).toBe(0);
      expect(result.sessions).toEqual([]);
    });

    it('should handle missing .aiknowsys/sessions directory gracefully', async () => {
      const emptyDir = path.join(process.cwd(), 'test-tmp-empty-sessions-' + Date.now());
      await fs.mkdir(emptyDir, { recursive: true });

      try {
        const result = await querySessions({
          dir: emptyDir,
          json: true,
          _silent: true
        });

        expect(result.count).toBe(0);
        expect(result.sessions).toEqual([]);
      } finally {
        await fs.rm(emptyDir, { recursive: true, force: true });
      }
    });

    it('should use current directory when no dir specified', async () => {
      // Change to test directory temporarily
      const originalCwd = process.cwd();
      process.chdir(tmpDir);

      try {
        const result = await querySessions({
          json: true,
          _silent: true
        });

        expect(result.count).toBeGreaterThan(0);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle invalid date format gracefully', async () => {
      await expect(
        querySessions({
          dir: tmpDir,
          date: 'invalid-date',
          json: true,
          _silent: true
        })
      ).rejects.toThrow(/invalid.*date/i);
    });
  });

  describe('sorting and ordering', () => {
    it('should return sessions sorted by date descending (newest first)', async () => {
      const result = await querySessions({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      for (let i = 1; i < result.sessions.length; i++) {
        expect(result.sessions[i-1].date >= result.sessions[i].date).toBe(true);
      }
    });
  });

  describe('convenience date filters', () => {
    it('should support --days filter for recent sessions', async () => {
      const result = await querySessions({
        dir: tmpDir,
        days: 7,
        json: true,
        _silent: true
      });

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      expect(result.sessions.every((s: any) =>
        s.date >= cutoffStr
      )).toBe(true);
    });

    it('should handle days=0 (today only)', async () => {
      const today = new Date().toISOString().split('T')[0];

      const result = await querySessions({
        dir: tmpDir,
        days: 0,
        json: true,
        _silent: true
      });

      expect(result.sessions.every((s: any) =>
        s.date === today
      )).toBe(true);
    });
  });
});
