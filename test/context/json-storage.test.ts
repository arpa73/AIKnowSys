import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { JsonStorage } from '../../lib/context/json-storage.js';
import type { PlanMetadata, SessionMetadata, SearchResult } from '../../lib/context/types.js';

describe('JsonStorage', () => {
  let tmpDir: string;
  let storage: JsonStorage;

  beforeEach(async () => {
    // Create temp directory for tests
    tmpDir = path.join(process.cwd(), 'test-tmp-json-storage-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'plans'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'sessions'), { recursive: true });

    storage = new JsonStorage();
  });

  afterEach(async () => {
    // Cleanup
    await storage.close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('initialization', () => {
    it('should initialize with empty index if none exists', async () => {
      await storage.init(tmpDir);
      const result = await storage.queryPlans();
      
      expect(result.count).toBe(0);
      expect(result.plans).toEqual([]);
    });

    it('should create index directory if not exists', async () => {
      await storage.init(tmpDir);
      
      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const exists = await fs.access(indexPath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
    });

    it('should load existing index on init', async () => {
      // Create a mock index
      const mockIndex = {
        version: 1,
        updated: new Date().toISOString(),
        plans: [
          {
            id: 'test-plan',
            title: 'Test Plan',
            status: 'ACTIVE' as const,
            author: 'test-user',
            created: '2026-02-06T00:00:00Z',
            updated: '2026-02-06T00:00:00Z',
            file: 'PLAN_test.md'
          }
        ],
        sessions: [],
        learned: []
      };

      await fs.writeFile(
        path.join(tmpDir, '.aiknowsys', 'context-index.json'),
        JSON.stringify(mockIndex, null, 2)
      );

      await storage.init(tmpDir);
      const result = await storage.queryPlans();

      expect(result.count).toBe(1);
      expect(result.plans[0].id).toBe('test-plan');
    });
  });

  describe('queryPlans', () => {
    beforeEach(async () => {
      // Setup test plans
      const testPlans: PlanMetadata[] = [
        {
          id: 'active-plan',
          title: 'Active Plan',
          status: 'ACTIVE',
          author: 'alice',
          created: '2026-02-01T00:00:00Z',
          updated: '2026-02-06T00:00:00Z',
          topics: ['typescript', 'testing'],
          file: 'PLAN_active.md'
        },
        {
          id: 'paused-plan',
          title: 'Paused Plan',
          status: 'PAUSED',
          author: 'bob',
          created: '2026-01-15T00:00:00Z',
          updated: '2026-01-20T00:00:00Z',
          topics: ['refactoring'],
          file: 'PLAN_paused.md'
        },
        {
          id: 'complete-plan',
          title: 'Completed Work',
          status: 'COMPLETE',
          author: 'alice',
          created: '2026-01-01T00:00:00Z',
          updated: '2026-01-31T00:00:00Z',
          file: 'PLAN_complete.md'
        }
      ];

      const mockIndex = {
        version: 1,
        updated: new Date().toISOString(),
        plans: testPlans,
        sessions: [],
        learned: []
      };

      await fs.writeFile(
        path.join(tmpDir, '.aiknowsys', 'context-index.json'),
        JSON.stringify(mockIndex, null, 2)
      );

      await storage.init(tmpDir);
    });

    it('should return all plans when no filters provided', async () => {
      const result = await storage.queryPlans();
      
      expect(result.count).toBe(3);
      expect(result.plans).toHaveLength(3);
    });

    it('should filter plans by status', async () => {
      const result = await storage.queryPlans({ status: 'ACTIVE' });
      
      expect(result.count).toBe(1);
      expect(result.plans[0].status).toBe('ACTIVE');
    });

    it('should filter plans by author', async () => {
      const result = await storage.queryPlans({ author: 'alice' });
      
      expect(result.count).toBe(2);
      expect(result.plans.every((p: PlanMetadata) => p.author === 'alice')).toBe(true);
    });

    it('should filter plans by topic (fuzzy match)', async () => {
      const result = await storage.queryPlans({ topic: 'typescript' });
      
      expect(result.count).toBe(1);
      expect(result.plans[0].topics).toContain('typescript');
    });

    it('should support multiple filters combined', async () => {
      const result = await storage.queryPlans({ 
        status: 'ACTIVE',
        author: 'alice'
      });
      
      expect(result.count).toBe(1);
      expect(result.plans[0].id).toBe('active-plan');
    });

    it('should return empty array when no plans match', async () => {
      const result = await storage.queryPlans({ status: 'CANCELLED' });
      
      expect(result.count).toBe(0);
      expect(result.plans).toEqual([]);
    });
  });

  describe('querySessions', () => {
    beforeEach(async () => {
      const testSessions: SessionMetadata[] = [
        {
          date: '2026-02-06',
          topic: 'TypeScript Migration',
          plan: 'typescript-migration',
          phases: ['Phase 8', 'Error Fixes'],
          file: 'sessions/2026-02-06-session.md',
          created: '2026-02-06T10:00:00Z',
          updated: '2026-02-06T12:00:00Z'
        },
        {
          date: '2026-02-05',
          topic: 'Context Query System Planning',
          plan: 'context-query-system',
          phases: ['Phase 0'],
          file: 'sessions/2026-02-05-session.md',
          created: '2026-02-05T14:00:00Z',
          updated: '2026-02-05T16:00:00Z'
        },
        {
          date: '2026-01-15',
          topic: 'Old Session',
          file: 'sessions/2026-01-15-session.md',
          created: '2026-01-15T10:00:00Z',
          updated: '2026-01-15T11:00:00Z'
        }
      ];

      const mockIndex = {
        version: 1,
        updated: new Date().toISOString(),
        plans: [],
        sessions: testSessions,
        learned: []
      };

      await fs.writeFile(
        path.join(tmpDir, '.aiknowsys', 'context-index.json'),
        JSON.stringify(mockIndex, null, 2)
      );

      await storage.init(tmpDir);
    });

    it('should return all sessions when no filters provided', async () => {
      const result = await storage.querySessions();
      
      expect(result.count).toBe(3);
      expect(result.sessions).toHaveLength(3);
    });

    it('should filter sessions by exact date', async () => {
      const result = await storage.querySessions({ date: '2026-02-06' });
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].date).toBe('2026-02-06');
    });

    it('should filter sessions by date range (dateAfter)', async () => {
      const result = await storage.querySessions({ dateAfter: '2026-02-01' });
      
      expect(result.count).toBe(2);
      expect(result.sessions.every((s: SessionMetadata) => s.date > '2026-02-01')).toBe(true);
    });

    it('should filter sessions by date range (dateBefore)', async () => {
      const result = await storage.querySessions({ dateBefore: '2026-02-01' });
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].date).toBe('2026-01-15');
    });

    it('should filter sessions by topic (fuzzy match)', async () => {
      const result = await storage.querySessions({ topic: 'TypeScript' });
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].topic).toContain('TypeScript');
    });

    it('should filter sessions by plan', async () => {
      const result = await storage.querySessions({ plan: 'context-query-system' });
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].plan).toBe('context-query-system');
    });

    it('should support multiple filters combined', async () => {
      const result = await storage.querySessions({
        dateAfter: '2026-02-01',
        topic: 'Context'
      });
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].date).toBe('2026-02-05');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Create mock content files to search
      await fs.writeFile(
        path.join(tmpDir, '.aiknowsys', 'PLAN_test.md'),
        '# Test Plan\n\nThis plan involves TypeScript migration.\n\n## Phase 1\nSetup TypeScript compilation.'
      );

      await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'sessions'), { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, '.aiknowsys', 'sessions', '2026-02-06-session.md'),
        '# Session\n\nWorking on TypeScript fixes today.'
      );

      await storage.init(tmpDir);
    });

    it('should search across all content when scope is "all"', async () => {
      const result = await storage.search('TypeScript', 'all');
      
      expect(result.count).toBeGreaterThan(0);
      expect(result.query).toBe('TypeScript');
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should return results with file, line, and context', async () => {
      const result = await storage.search('TypeScript', 'all');
      
      const firstResult = result.results[0];
      expect(firstResult).toHaveProperty('file');
      expect(firstResult).toHaveProperty('line');
      expect(firstResult).toHaveProperty('context');
      expect(firstResult).toHaveProperty('relevance');
      expect(firstResult).toHaveProperty('type');
    });

    it('should filter results by scope=plans', async () => {
      const result = await storage.search('TypeScript', 'plans');
      
      expect(result.results.every((r: SearchResult) => r.type === 'plan')).toBe(true);
    });

    it('should filter results by scope=sessions', async () => {
      const result = await storage.search('TypeScript', 'sessions');
      
      expect(result.results.every((r: SearchResult) => r.type === 'session')).toBe(true);
    });

    it('should return empty results for non-matching query', async () => {
      const result = await storage.search('nonexistentterm12345', 'all');
      
      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should handle case-insensitive search', async () => {
      const result = await storage.search('typescript', 'all'); // lowercase
      
      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe('rebuildIndex', () => {
    it('should rebuild index from markdown files', async () => {
      // Create test files
      await fs.writeFile(
        path.join(tmpDir, '.aiknowsys', 'plans', 'active-test.md'),
        '# test\'s Active Plan\n\n**Status:** 🎯 ACTIVE\n**Plan:** PLAN_test.md'
      );

      await fs.writeFile(
        path.join(tmpDir, '.aiknowsys', 'PLAN_test.md'),
        '# Test Plan\n\n**Status:** ACTIVE\n**Created:** 2026-02-06\n**Updated:** 2026-02-06'
      );

      await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'sessions'), { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, '.aiknowsys', 'sessions', '2026-02-06-session.md'),
        '# Session: Test Session (Feb 6, 2026)\n\n**Goal:** Testing'
      );

      await storage.init(tmpDir);
      await storage.rebuildIndex();

      const plans = await storage.queryPlans();
      const sessions = await storage.querySessions();

      expect(plans.count).toBeGreaterThan(0);
      expect(sessions.count).toBeGreaterThan(0);
    });

    it('should update index file after rebuild', async () => {
      await storage.init(tmpDir);
      await storage.rebuildIndex();

      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);

      expect(index).toHaveProperty('version');
      expect(index).toHaveProperty('updated');
      expect(index).toHaveProperty('plans');
      expect(index).toHaveProperty('sessions');
    });
  });

  describe('close', () => {
    it('should cleanup resources without errors', async () => {
      await storage.init(tmpDir);
      await expect(storage.close()).resolves.not.toThrow();
    });
  });
});
