/**
 * SQLite Query Core Functions - Tests
 * 
 * Tests for pure SQLite query functions that power MCP tools.
 * Following TDD: Write tests FIRST, then implement.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SqliteStorage } from '../../../lib/context/sqlite-storage.js';
import {
  querySessionsSqlite,
  queryPlansSqlite,
  queryLearnedPatternsSqlite,
  searchContextSqlite,
  getDbStats,
} from '../../../lib/core/sqlite-query.js';
import type {
  QuerySessionsOptions,
  QueryPlansOptions,
  QueryLearnedPatternsOptions,
} from '../../../lib/types/index.js';

describe('sqlite-query core functions', () => {
  let storage: SqliteStorage;
  let dbPath: string;

  beforeAll(async () => {
    // Create temporary database
    const testDir = join(tmpdir(), `sqlite-query-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    dbPath = join(testDir, 'test.db');

    storage = new SqliteStorage();
    await storage.init(dbPath);

    // Insert project first (required for foreign key constraints)
    await storage.insertProject({
      id: 'test-project',
      name: 'Test Project',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
    });

    // Populate test data
    await storage.insertSession({
      id: 'session_2026-02-10',
      project_id: 'test-project',
      date: '2026-02-10',
      topic: 'Test Session 1',
      status: 'complete',
      topics: ['testing', 'sqlite'],
      content: 'This is a test session about SQLite queries.',
      created: '2026-02-10T10:00:00Z',
      updated: '2026-02-10T10:00:00Z',
    });

    await storage.insertSession({
      id: 'session_2026-02-11',
      project_id: 'test-project',
      date: '2026-02-11',
      topic: 'Test Session 2',
      status: 'in-progress',
      topics: ['testing', 'mcp'],
      content: 'This session tests MCP tools.',
      created: '2026-02-11T10:00:00Z',
      updated: '2026-02-11T10:00:00Z',
    });

    await storage.insertPlan({
      id: 'test_plan_1',
      project_id: 'test-project',
      title: 'Test Plan 1',
      status: 'ACTIVE',
      author: 'test-user',
      priority: 'high',
      type: 'feature',
      content: 'This is a test plan for SQLite queries.',
      created: '2026-02-10T09:00:00Z',
      updated: '2026-02-10T09:00:00Z',
    });

    await storage.insertPlan({
      id: 'test_plan_2',
      project_id: 'test-project',
      title: 'Test Plan 2',
      status: 'COMPLETE',
      author: 'test-user',
      priority: 'medium',
      type: 'bugfix',
      content: 'This plan tests query functionality.',
      created: '2026-02-09T09:00:00Z',
      updated: '2026-02-10T09:00:00Z',
    });

    // Insert learned patterns (stored as plans with 'learned_' prefix)
    await storage.insertPlan({
      id: 'learned_test_pattern_1',
      project_id: 'test-project',
      title: 'Test Pattern 1',
      status: 'ACTIVE',
      author: 'system',
      type: 'testing',  // category stored as type
      content: 'This is a learned pattern about testing.',
      topics: ['testing', 'patterns'],
      created: '2026-02-10T08:00:00Z',
      updated: '2026-02-10T08:00:00Z',
    });
  });

  afterAll(() => {
    // Clean up test database
    storage.close();
    const testDir = join(tmpdir(), `sqlite-query-test-${Date.now()}`);
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('querySessionsSqlite', () => {
    it('should query all sessions when no filters provided', async () => {
      // GIVEN: Database with 2 sessions
      const options: QuerySessionsOptions = { dbPath };

      // WHEN: Querying without filters
      const result = await querySessionsSqlite(options);

      // THEN: All sessions returned
      expect(result.count).toBe(2);
      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].title).toBeDefined();
      expect(result.sessions[0].content).toBeDefined();
    });

    it('should filter sessions by date range', async () => {
      // GIVEN: Sessions on different dates
      const options: QuerySessionsOptions = {
        dbPath,
        dateAfter: '2026-02-11',
      };

      // WHEN: Filtering by date
      const result = await querySessionsSqlite(options);

      // THEN: Only matching sessions returned
      expect(result.count).toBe(1);
      expect(result.sessions[0].date).toBe('2026-02-11');
    });

    it('should filter sessions by topic', async () => {
      // GIVEN: Sessions with different topics
      const options: QuerySessionsOptions = {
        dbPath,
        topic: 'mcp',
      };

      // WHEN: Filtering by topic
      const result = await querySessionsSqlite(options);

      // THEN: Only sessions with matching topic returned
      expect(result.count).toBe(1);
      expect(result.sessions[0].topics).toContain('mcp');
    });

    it('should filter sessions by status', async () => {
      // GIVEN: Sessions with different statuses
      const options: QuerySessionsOptions = {
        dbPath,
        status: 'complete',
      };

      // WHEN: Filtering by status
      const result = await querySessionsSqlite(options);

      // THEN: Only complete sessions returned
      expect(result.count).toBe(1);
      expect(result.sessions[0].status).toBe('complete');
    });

    it('should combine multiple filters', async () => {
      // GIVEN: Multiple filter criteria
      const options: QuerySessionsOptions = {
        dbPath,
        dateAfter: '2026-02-10',
        topic: 'testing',
      };

      // WHEN: Applying multiple filters
      const result = await querySessionsSqlite(options);

      // THEN: Only sessions matching ALL criteria returned
      expect(result.count).toBeGreaterThan(0);
      result.sessions.forEach((session) => {
        expect(session.date >= '2026-02-10').toBe(true);
        expect(session.topics).toContain('testing');
      });
    });
  });

  describe('queryPlansSqlite', () => {
    it('should query all plans when no filters provided', async () => {
      // GIVEN: Database with 2 plans
      const options: QueryPlansOptions = { dbPath };

      // WHEN: Querying without filters
      const result = await queryPlansSqlite(options);

      // THEN: All plans returned
      expect(result.count).toBe(2);
      expect(result.plans).toHaveLength(2);
    });

    it('should filter plans by status', async () => {
      // GIVEN: Plans with different statuses
      const options: QueryPlansOptions = {
        dbPath,
        status: 'ACTIVE',
      };

      // WHEN: Filtering by status
      const result = await queryPlansSqlite(options);

      // THEN: Only active plans returned
      expect(result.count).toBe(1);
      expect(result.plans[0].status).toBe('ACTIVE');
    });

    it('should filter plans by author', async () => {
      // GIVEN: Plans by specific author
      const options: QueryPlansOptions = {
        dbPath,
        author: 'test-user',
      };

      // WHEN: Filtering by author
      const result = await queryPlansSqlite(options);

      // THEN: Only plans by that author returned
      expect(result.count).toBe(2);
      result.plans.forEach((plan) => {
        expect(plan.author).toBe('test-user');
      });
    });

    it('should filter plans by priority', async () => {
      // GIVEN: Plans with different priorities
      const options: QueryPlansOptions = {
        dbPath,
        priority: 'high',
      };

      // WHEN: Filtering by priority
      const result = await queryPlansSqlite(options);

      // THEN: Only high-priority plans returned
      expect(result.count).toBe(1);
      expect(result.plans[0].priority).toBe('high');
    });
  });

  describe('queryLearnedPatternsSqlite', () => {
    it('should query all patterns when no filters provided', async () => {
      // GIVEN: Database with 1 pattern
      const options: QueryLearnedPatternsOptions = { dbPath };

      // WHEN: Querying without filters
      const result = await queryLearnedPatternsSqlite(options);

      // THEN: All patterns returned
      expect(result.count).toBe(1);
      expect(result.patterns).toHaveLength(1);
    });

    it('should filter patterns by category', async () => {
      // GIVEN: Pattern with specific category
      const options: QueryLearnedPatternsOptions = {
        dbPath,
        category: 'testing',
      };

      // WHEN: Filtering by category
      const result = await queryLearnedPatternsSqlite(options);

      // THEN: Only patterns in that category returned
      expect(result.count).toBe(1);
      expect(result.patterns[0].category).toBe('testing');
    });

    it('should filter patterns by keywords', async () => {
      // GIVEN: Pattern with specific keywords
      const options: QueryLearnedPatternsOptions = {
        dbPath,
        keywords: ['patterns'],
      };

      // WHEN: Filtering by keywords
      const result = await queryLearnedPatternsSqlite(options);

      // THEN: Only patterns with matching keywords returned
      expect(result.count).toBe(1);
      expect(result.patterns[0].keywords).toContain('patterns');
    });
  });

  describe('searchContextSqlite', () => {
    it('should search across all content types', async () => {
      // GIVEN: Content in sessions, plans, and patterns
      const query = 'testing';

      // WHEN: Searching for common term
      const result = await searchContextSqlite({ dbPath, query });

      // THEN: Results from all content types returned
      expect(result.count).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should return ranked results', async () => {
      // GIVEN: Multiple matching documents
      const query = 'test';

      // WHEN: Searching
      const result = await searchContextSqlite({ dbPath, query });

      // THEN: Results include relevance scores
      expect(result.results[0].score).toBeDefined();
      expect(result.results[0].snippet).toBeDefined();
    });

    it('should limit results when specified', async () => {
      // GIVEN: Limit parameter
      const query = 'test';
      const limit = 1;

      // WHEN: Searching with limit
      const result = await searchContextSqlite({ dbPath, query, limit });

      // THEN: Only specified number of results returned
      expect(result.results).toHaveLength(1);
    });
  });

  describe('getDbStats', () => {
    it('should return database statistics', async () => {
      // GIVEN: Database with test data
      // WHEN: Getting stats
      const result = await getDbStats({ dbPath });

      // THEN: Stats include all content types
      expect(result.sessions).toBe(2);
      expect(result.plans).toBe(2);
      expect(result.learned).toBe(1);
      expect(result.total).toBe(5);
      expect(result.dbSize).toBeGreaterThan(0);
      expect(result.dbPath).toBe(dbPath);
    });

    it('should return zero for empty database', async () => {
      // GIVEN: Empty database
      const emptyDbPath = join(tmpdir(), `empty-${Date.now()}.db`);
      const emptyStorage = new SqliteStorage();
      await emptyStorage.init(emptyDbPath);
      await emptyStorage.close();

      // WHEN: Getting stats
      const result = await getDbStats({ dbPath: emptyDbPath });

      // THEN: All counts are zero
      expect(result.sessions).toBe(0);
      expect(result.plans).toBe(0);
      expect(result.learned).toBe(0);
      expect(result.total).toBe(0);

      // Cleanup
      rmSync(emptyDbPath, { force: true });
    });
  });
});
