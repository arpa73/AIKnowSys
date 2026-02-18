import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import type { PlanMetadata, SessionMetadata } from '../../lib/context/types.js';

type TestStorageInternals = SqliteStorage & {
  insertProject(project: {
    id: string;
    name: string;
    path?: string;
    tech_stack?: unknown;
    created_at: string;
    updated_at: string;
  }): Promise<void>;
  insertPlan(plan: {
    id: string;
    project_id: string;
    title: string;
    status: string;
    author: string;
    created: string;
    updated: string;
    content: string;
    topics?: string[];
    description?: string;
    priority?: string;
    type?: string;
  }): Promise<void>;
  insertSession(session: {
    id: string;
    project_id: string;
    date: string;
    topic: string;
    status: string;
    created: string;
    updated: string;
    content: string;
    topics?: string[];
    plan?: string;
    duration?: string;
    phases?: string[];
  }): Promise<void>;
  insertReview(review: {
    id: string;
    project_id?: string;
    target_id: string;
    author: string;
    status: 'PENDING' | 'ACTIVE' | 'ADDRESSED';
    content: string;
    created_at: string;
    updated_at: string;
  }): Promise<void>;
  queryReviews(filters?: {
    projectId?: string;
    targetId?: string;
    status?: 'PENDING' | 'ACTIVE' | 'ADDRESSED';
    author?: string;
  }): Promise<{
    count: number;
    items: Array<{ id: string; status: 'PENDING' | 'ACTIVE' | 'ADDRESSED' }>;
    reviews: Array<{ id: string; status: 'PENDING' | 'ACTIVE' | 'ADDRESSED' }>;
  }>;
  updateReviewStatus(id: string, status: 'PENDING' | 'ACTIVE' | 'ADDRESSED', updatedAt: string): Promise<void>;
  insertLink(link: {
    source_id: string;
    target_id: string;
    type: string;
    metadata?: Record<string, unknown>;
    created_at: string;
  }): Promise<void>;
  queryLinks(filters?: {
    sourceId?: string;
    targetId?: string;
    type?: string;
  }): Promise<{
    count: number;
    items: Array<{ sourceId: string; targetId: string; type: string }>;
    links: Array<{ sourceId: string; targetId: string; type: string; metadata: Record<string, unknown> | null }>;
  }>;
  upsertUserState(state: {
    user_id: string;
    project_id?: string | null;
    active_plan_id?: string | null;
    last_session_id?: string | null;
    focus_context?: Record<string, unknown> | null;
    updated_at: string;
  }): Promise<void>;
  getUserState(userId: string): Promise<{
    userId: string;
    projectId: string | null;
    activePlanId: string | null;
    lastSessionId: string | null;
    focusContext: Record<string, unknown> | null;
    updatedAt: string;
  } | undefined>;
};

describe('SqliteStorage', () => {
  let tmpDir: string;
  let storage: SqliteStorage;
  let storageInternal: TestStorageInternals;
  let testProjectId: string;

  beforeEach(async () => {
    // Create temp directory for tests
    tmpDir = path.join(process.cwd(), 'test-tmp-sqlite-storage-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys'), { recursive: true });

    testProjectId = 'test-project-' + Date.now();
    storage = new SqliteStorage();
    storageInternal = storage as unknown as TestStorageInternals;
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
      await storageInternal.insertProject({
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
        await storageInternal.insertPlan(plan);
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
      await storageInternal.insertProject({
        id: testProjectId,
        name: 'Test Project',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      });
      
      // Create test plan (required for foreign key on sessions.plan_id)
      await storageInternal.insertPlan({
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
        await storageInternal.insertSession(session);
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

  describe('metadata queries', () => {
    beforeEach(async () => {
      await storage.init(tmpDir);

      await storageInternal.insertProject({
        id: testProjectId,
        name: 'Test Project',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      });

      await storageInternal.insertPlan({
        id: 'PLAN_meta',
        project_id: testProjectId,
        title: 'Metadata Plan',
        status: 'ACTIVE',
        author: 'meta-author',
        description: 'metadata test plan',
        content: '# Metadata Plan\n\nPlan content',
        topics: ['meta', 'testing'],
        created: '2026-02-01T00:00:00Z',
        updated: '2026-02-02T00:00:00Z'
      });

      await storageInternal.insertPlan({
        id: 'learned_pattern_meta',
        project_id: testProjectId,
        title: 'Learned Pattern',
        status: 'COMPLETE',
        author: 'meta-author',
        description: 'learned pattern test',
        content: '# Learned Pattern\n\nPattern content',
        topics: ['sqlite', 'types'],
        type: 'project_specific',
        created: '2026-02-03T00:00:00Z',
        updated: '2026-02-04T00:00:00Z'
      });

      await storageInternal.insertSession({
        id: 'session-meta',
        project_id: testProjectId,
        date: '2026-02-03',
        topic: 'Metadata Session',
        status: 'complete',
        plan: 'PLAN_meta',
        created: '2026-02-03T00:00:00Z',
        updated: '2026-02-04T00:00:00Z',
        content: '# Metadata Session\n\nSession content',
        topics: ['meta', 'session']
      });
    });

    it('should return session metadata without content and with typed fields', async () => {
      const result = await storage.querySessionsMetadata({ status: 'complete' });

      expect(result.count).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe('session-meta');
      expect(result.sessions[0].projectId).toBe(testProjectId);
      expect(result.sessions[0].planId).toBe('PLAN_meta');
      expect(result.sessions[0].createdAt).toBe('2026-02-03T00:00:00Z');
      expect((result.sessions[0] as Record<string, unknown>).content).toBeUndefined();
    });

    it('should return plan metadata without content and with typed fields', async () => {
      const result = await storage.queryPlansMetadata({ author: 'meta-author' });

      expect(result.count).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.plans[0].projectId).toBe(testProjectId);
      expect(result.plans[0].createdAt).toBeDefined();
      expect((result.plans[0] as Record<string, unknown>).content).toBeUndefined();
    });

    it('should return learned pattern metadata with typed fields', async () => {
      const result = await storage.queryLearnedPatternsMetadata({ category: 'project_specific' });

      expect(result.count).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.patterns[0].id).toBe('learned_pattern_meta');
      expect(result.patterns[0].type).toBe('project_specific');
      expect(Array.isArray(result.patterns[0].topics)).toBe(true);
      expect(result.patterns[0].createdAt).toBe('2026-02-03T00:00:00Z');
    });
  });

  describe('phase 1 schema entities', () => {
    beforeEach(async () => {
      await storage.init(tmpDir);

      await storageInternal.insertProject({
        id: testProjectId,
        name: 'Test Project',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      });

      await storageInternal.insertPlan({
        id: 'PLAN_phase1_schema',
        project_id: testProjectId,
        title: 'Phase 1 Schema Plan',
        status: 'ACTIVE',
        author: 'architect',
        description: 'schema phase 1 work',
        content: '# Phase 1',
        topics: ['schema'],
        created: '2026-02-01T00:00:00Z',
        updated: '2026-02-01T00:00:00Z'
      });

      await storageInternal.insertSession({
        id: 'session-phase1-schema',
        project_id: testProjectId,
        date: '2026-02-01',
        topic: 'Schema work',
        status: 'active',
        plan: 'PLAN_phase1_schema',
        created: '2026-02-01T00:00:00Z',
        updated: '2026-02-01T00:00:00Z',
        content: '# Session content',
        topics: ['schema']
      });
    });

    it('should insert, query, and update reviews', async () => {
      await storageInternal.insertReview({
        id: 'REVIEW_001',
        project_id: testProjectId,
        target_id: 'PLAN_phase1_schema',
        author: 'architect',
        status: 'PENDING',
        content: 'Please add CRUD support for new schema tables.',
        created_at: '2026-02-17T20:10:00Z',
        updated_at: '2026-02-17T20:10:00Z'
      });

      const pending = await storageInternal.queryReviews({
        projectId: testProjectId,
        status: 'PENDING'
      });

      expect(pending.count).toBe(1);
      expect(pending.reviews[0].id).toBe('REVIEW_001');

      await storageInternal.updateReviewStatus('REVIEW_001', 'ADDRESSED', '2026-02-17T20:20:00Z');

      const addressed = await storageInternal.queryReviews({ status: 'ADDRESSED' });
      expect(addressed.count).toBe(1);
      expect(addressed.reviews[0].status).toBe('ADDRESSED');
    });

    it('should insert and query links with metadata', async () => {
      await storageInternal.insertLink({
        source_id: 'PLAN_phase1_schema',
        target_id: 'session-phase1-schema',
        type: 'relates_to',
        metadata: { createdBy: 'test', weight: 1 },
        created_at: '2026-02-17T20:12:00Z'
      });

      const links = await storageInternal.queryLinks({
        sourceId: 'PLAN_phase1_schema',
        type: 'relates_to'
      });

      expect(links.count).toBe(1);
      expect(links.links[0].targetId).toBe('session-phase1-schema');
      expect(links.links[0].metadata).toEqual({ createdBy: 'test', weight: 1 });
    });

    it('should upsert and retrieve user state', async () => {
      await storageInternal.upsertUserState({
        user_id: 'arno-paffen',
        project_id: testProjectId,
        active_plan_id: 'PLAN_phase1_schema',
        last_session_id: 'session-phase1-schema',
        focus_context: { files: ['lib/context/*'], topic: 'schema' },
        updated_at: '2026-02-17T20:15:00Z'
      });

      await storageInternal.upsertUserState({
        user_id: 'arno-paffen',
        project_id: testProjectId,
        active_plan_id: 'PLAN_phase1_schema',
        last_session_id: 'session-phase1-schema',
        focus_context: { files: ['lib/context/sqlite-storage.ts'], topic: 'reviews' },
        updated_at: '2026-02-17T20:18:00Z'
      });

      const userState = await storageInternal.getUserState('arno-paffen');
      expect(userState).toBeDefined();
      expect(userState?.projectId).toBe(testProjectId);
      expect(userState?.activePlanId).toBe('PLAN_phase1_schema');
      expect(userState?.focusContext).toEqual({
        files: ['lib/context/sqlite-storage.ts'],
        topic: 'reviews'
      });
      expect(userState?.updatedAt).toBe('2026-02-17T20:18:00Z');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await storage.init(tmpDir);
      
      // Create test project first (required for foreign key)
      await storageInternal.insertProject({
        id: testProjectId,
        name: 'Test Project',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      });
      
      // Insert test data with searchable content
      await storageInternal.insertPlan({
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

      await storageInternal.insertSession({
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
