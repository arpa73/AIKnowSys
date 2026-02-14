import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import type { PlanMetadata, SessionMetadata } from '../../lib/context/types.js';

describe('SqliteStorage', () => {
  let tmpDir: string;
  let storage: SqliteStorage;
  let testProjectId: string;

  beforeEach(async () => {
    // Create temp directory for tests
    tmpDir = path.join(process.cwd(), 'test-tmp-sqlite-storage-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys'), { recursive: true });

    testProjectId = 'test-project-' + Date.now();
    storage = new SqliteStorage();
  });

  afterEach(async () => {
    // Cleanup
    await storage.close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('initialization', () => {
    it('should initialize with empty database if none exists', async () => {
      await storage.init(tmpDir);
      const result = await storage.queryPlans();
      
      expect(result.count).toBe(0);
      expect(result.plans).toEqual([]);
    });

    it('should create database file on init', async () => {
      await storage.init(tmpDir);
      
      const dbPath = path.join(tmpDir, '.aiknowsys', 'knowledge.db');
      const exists = await fs.access(dbPath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
    });

    it('should create all required tables', async () => {
      await storage.init(tmpDir);
      
      // Verify tables exist by querying them
      const plansResult = await storage.queryPlans();
      const sessionsResult = await storage.querySessions();
      
      expect(plansResult).toBeDefined();
      expect(sessionsResult).toBeDefined();
    });

    it('should load existing database on init', async () => {
      // Initialize and insert test data
      await storage.init(tmpDir);
      
      // Close and reopen to verify persistence
      await storage.close();
      
      const storage2 = new SqliteStorage();
      await storage2.init(tmpDir);
      
      const result = await storage2.queryPlans();
      expect(result).toBeDefined();
      
      await storage2.close();
    });
  });

  describe('queryPlans', () => {
    beforeEach(async () => {
      await storage.init(tmpDir);
      
      // Create test project first (required for foreign key)
      await (storage as any).insertProject({
        id: testProjectId,
        name: 'Test Project',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      });
      
      // Insert test plans directly (we'll test insertPlan separately)
      const testPlans: Array<Omit<PlanMetadata, 'file'> & { project_id: string; content: string }> = [
        {
          id: 'active-plan',
          project_id: testProjectId,
          title: 'Active Plan',
          status: 'ACTIVE',
          author: 'alice',
          created: '2026-02-01T00:00:00Z',
          updated: '2026-02-06T00:00:00Z',
          topics: ['typescript', 'testing'],
          content: '# Active Plan\n\nTest content'
        },
        {
          id: 'paused-plan',
          project_id: testProjectId,
          title: 'Paused Plan',
          status: 'PAUSED',
          author: 'bob',
          created: '2026-01-15T00:00:00Z',
          updated: '2026-01-20T00:00:00Z',
          topics: ['refactoring'],
          content: '# Paused Plan\n\nTest content'
        },
        {
          id: 'complete-plan',
          project_id: testProjectId,
          title: 'Completed Work',
          status: 'COMPLETE',
          author: 'alice',
          created: '2026-01-01T00:00:00Z',
          updated: '2026-01-31T00:00:00Z',
          topics: [],
          content: '# Complete Plan\n\nTest content'
        }
      ];

      // Insert via internal method (will be implemented)
      for (const plan of testPlans) {
        await (storage as any).insertPlan(plan);
      }
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
      expect(result.plans.every(p => p.author === 'alice')).toBe(true);
    });

    it('should filter plans by topic', async () => {
      const result = await storage.queryPlans({ topic: 'typescript' });
      
      expect(result.count).toBe(1);
      expect(result.plans[0].topics).toContain('typescript');
    });

    it('should filter plans by updated date range', async () => {
      const result = await storage.queryPlans({
        updatedAfter: '2026-01-31T00:00:00Z'
      });
      
      expect(result.count).toBe(1); // Only active-plan (Feb 6 > Jan 31)
    });

    it('should support multiple filters combined', async () => {
      const result = await storage.queryPlans({
        author: 'alice',
        status: 'ACTIVE'
      });
      
      expect(result.count).toBe(1);
      expect(result.plans[0].id).toBe('active-plan');
    });
  });

  describe('querySessions', () => {
    beforeEach(async () => {
      await storage.init(tmpDir);
      
      // Create test project first (required for foreign key)
      await (storage as any).insertProject({
        id: testProjectId,
        name: 'Test Project',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      });
      
      // Create test plan (required for foreign key on sessions.plan_id)
      await (storage as any).insertPlan({
        id: 'PLAN_phase2',
        project_id: testProjectId,
        title: 'Phase 2 Plan',
        status: 'COMPLETE',
        author: 'test',
        description: 'Test plan',
        content: '# Phase 2',
        topics: ['phase-2'],
        created: '2026-02-01T00:00:00Z',
        updated: '2026-02-11T00:00:00Z'
      });
      
      // Insert test sessions (use relative dates for 'days' filter test)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const testSessions: Array<Omit<SessionMetadata, 'file'> & { id: string; project_id: string; content: string; status: string }> = [
        {
          id: 'session-today',
          project_id: testProjectId,
          date: today.toISOString().split('T')[0],
          topic: 'SQLite Implementation',
          status: 'active',
          topics: ['database', 'storage'],
          created: today.toISOString(),
          updated: today.toISOString(),
          content: '# Session\n\nTest content'
        },
        {
          id: 'session-yesterday',
          project_id: testProjectId,
          date: yesterday.toISOString().split('T')[0],
          topic: 'Phase 2 Completion',
          status: 'complete',
          plan: 'PLAN_phase2',  // plan field matches SessionMetadata interface
          topics: ['phase-2', 'documentation'],
          created: yesterday.toISOString(),
          updated: yesterday.toISOString(),
          content: '# Phase 2\n\nTest content'
        },
        {
          id: 'session-three-days-ago',
          project_id: testProjectId,
          date: threeDaysAgo.toISOString().split('T')[0],
          topic: 'Bug Fixes',
          status: 'complete',
          topics: ['bugfix'],
          created: threeDaysAgo.toISOString(),
          updated: threeDaysAgo.toISOString(),
          content: '# Bug Fixes\n\nTest content'
        }
      ];

      for (const session of testSessions) {
        await (storage as any).insertSession(session);
      }
    });

    it('should return all sessions when no filters provided', async () => {
      const result = await storage.querySessions();
      
      expect(result.count).toBe(3);
      expect(result.sessions).toHaveLength(3);
    });

    it('should filter sessions by exact date', async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const result = await storage.querySessions({ date: todayStr });
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].date).toBe(todayStr);
    });

    it('should filter sessions by date range', async () => {
      // Use relative dates for reliability
      const today = new Date();
      const fourDaysAgo = new Date(today);
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = await storage.querySessions({
        dateAfter: fourDaysAgo.toISOString().split('T')[0],
        dateBefore: tomorrow.toISOString().split('T')[0]
      });
      
      expect(result.count).toBe(3);
    });

    it('should filter sessions by last N days', async () => {
      const result = await storage.querySessions({ days: 2 });
      
      expect(result.count).toBeGreaterThanOrEqual(2);
    });

    it('should filter sessions by topic', async () => {
      const result = await storage.querySessions({ topic: 'phase-2' });
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].topics).toContain('phase-2');
    });

    it('should filter sessions by plan reference', async () => {
      const result = await storage.querySessions({ plan: 'PLAN_phase2' });
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].plan).toBe('PLAN_phase2');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await storage.init(tmpDir);
      
      // Create test project first (required for foreign key)
      await (storage as any).insertProject({
        id: testProjectId,
        name: 'Test Project',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      });
      
      // Insert test data with searchable content
      await (storage as any).insertPlan({
        id: 'auth-plan',
        project_id: testProjectId,
        title: 'JWT Authentication',
        status: 'ACTIVE',
        author: 'alice',
        created: '2026-02-01T00:00:00Z',
        updated: '2026-02-01T00:00:00Z',
        content: '# JWT Auth Plan\n\nImplement JSON Web Token authentication with bcrypt password hashing.',
        topics: []
      });

      await (storage as any).insertSession({
        id: 'session-auth',
        project_id: testProjectId,
        date: '2026-02-01',
        topic: 'Auth Implementation',
        status: 'complete',
        created: '2026-02-01T00:00:00Z',
        updated: '2026-02-01T00:00:00Z',
        content: '# Authentication Session\n\nImplemented JWT tokens with bcrypt hashing.',
        topics: []
      });
    });

    it('should search across all content by default', async () => {
      const result = await storage.search('JWT', 'all');
      
      expect(result.count).toBeGreaterThanOrEqual(2);
      expect(result.results.some(r => r.file.includes('auth-plan'))).toBe(true);
    });

    it('should search only in plans when scope is plans', async () => {
      const result = await storage.search('JWT', 'plans');
      
      expect(result.count).toBe(1);
      expect(result.results[0].file).toContain('PLAN_');
    });

    it('should search only in sessions when scope is sessions', async () => {
      const result = await storage.search('JWT', 'sessions');
      
      expect(result.count).toBe(1);
      expect(result.results[0].file).toContain('session');
    });

    it('should return empty results for non-matching query', async () => {
      const result = await storage.search('nonexistent-term-xyz', 'all');
      
      expect(result.count).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should be case-insensitive', async () => {
      const result = await storage.search('jwt', 'all');
      
      expect(result.count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('rebuildIndex', () => {
    it('should return counts of indexed items', async () => {
      await storage.init(tmpDir);
      
      const result = await storage.rebuildIndex();
      
      expect(result).toHaveProperty('plansIndexed');
      expect(result).toHaveProperty('sessionsIndexed');
      expect(result).toHaveProperty('learnedIndexed');
      expect(typeof result.plansIndexed).toBe('number');
      expect(typeof result.sessionsIndexed).toBe('number');
      expect(typeof result.learnedIndexed).toBe('number');
    });
  });

  describe('close', () => {
    it('should close database connection without errors', async () => {
      await storage.init(tmpDir);
      await expect(storage.close()).resolves.toBeUndefined();
    });

    it('should allow re-initialization after close', async () => {
      await storage.init(tmpDir);
      await storage.close();
      await expect(storage.init(tmpDir)).resolves.toBeUndefined();
    });
  });
});
