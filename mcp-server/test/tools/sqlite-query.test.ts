/**
 * SQLite Query Tools - Tests
 * 
 * Tests for MCP tools that wrap SQLite core query functions.
 * Following TDD: Write tests FIRST, then implement tools.
 * 
 * Phase 1 Week 2 Day 7: MCP Tool Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  querySessionsSqlite,
  queryPlansSqlite,
  queryLearnedPatternsSqlite,
  searchContextSqlite,
  getDbStatsSqlite,
} from '../../src/tools/sqlite-query.js';

// Mock the core SQLite query functions
vi.mock('../../../lib/core/sqlite-query.js', () => ({
  querySessionsSqlite: vi.fn(),
  queryPlansSqlite: vi.fn(),
  queryLearnedPatternsSqlite: vi.fn(),
  searchContextSqlite: vi.fn(),
  getDbStats: vi.fn(),
}));

import {
  querySessionsSqlite as querySessionsCore,
  queryPlansSqlite as queryPlansCore,
  queryLearnedPatternsSqlite as queryLearnedPatternsCore,
  searchContextSqlite as searchContextCore,
  getDbStats as getDbStatsCore,
} from '../../../lib/core/sqlite-query.js';

describe('querySessionsSqlite (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query sessions with filters', async () => {
    // GIVEN: Mock core function returns sessions
    const mockResult = {
      count: 2,
      sessions: [
        {
          date: '2026-02-10',
          topic: 'Test Session 1',
          status: 'complete',
          content: 'Content 1',
        },
        {
          date: '2026-02-11',
          topic: 'Test Session 2',
          status: 'in-progress',
          content: 'Content 2',
        },
      ],
    };
    vi.mocked(querySessionsCore).mockResolvedValue(mockResult);

    // WHEN: Tool is called with filters
    const result = await querySessionsSqlite({
      dbPath: '/tmp/test.db',
      dateAfter: '2026-02-10',
    });

    // THEN: Returns MCP-compliant response
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');

    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(2);
    expect(data.sessions).toHaveLength(2);
  });

  it('should handle errors gracefully', async () => {
    // GIVEN: Core function throws error
    vi.mocked(querySessionsCore).mockRejectedValue(new Error('Database not found'));

    // WHEN: Tool is called
    const result = await querySessionsSqlite({
      dbPath: '/tmp/missing.db',
    });

    // THEN: Returns error in structured format
    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
    expect(data.message).toContain('Database not found');
  });

  it('should pass all filters to core function', async () => {
    vi.mocked(querySessionsCore).mockResolvedValue({ count: 0, sessions: [] });

    const filters = {
      dbPath: '/tmp/test.db',
      dateAfter: '2026-02-01',
      dateBefore: '2026-02-10',
      topic: 'testing',
      status: 'complete',
    };

    await querySessionsSqlite(filters);

    // Expect parsed parameters (includes default includeContent: false)
    expect(querySessionsCore).toHaveBeenCalledWith({
      ...filters,
      includeContent: false, // Default added by parseQueryParams
    });
  });
});

describe('queryPlansSqlite (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query plans with filters', async () => {
    // GIVEN: Mock core function returns plans
    const mockResult = {
      count: 1,
      plans: [
        {
          id: 'PLAN_test',
          title: 'Test Plan',
          status: 'ACTIVE',
          author: 'test-user',
          priority: 'high',
          type: 'feature',
          content: 'Plan content',
          created_at: '2026-02-10T10:00:00Z',
          updated_at: '2026-02-10T10:00:00Z',
        },
      ],
    };
    vi.mocked(queryPlansCore).mockResolvedValue(mockResult);

    // WHEN: Tool is called
    const result = await queryPlansSqlite({
      dbPath: '/tmp/test.db',
      status: 'ACTIVE',
    });

    // THEN: Returns structured data
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(1);
    expect(data.plans[0].id).toBe('PLAN_test');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(queryPlansCore).mockRejectedValue(new Error('Query failed'));

    const result = await queryPlansSqlite({
      dbPath: '/tmp/test.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
  });
});

describe('queryLearnedPatternsSqlite (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query learned patterns with filters', async () => {
    // GIVEN: Mock core function returns patterns
    const mockResult = {
      count: 1,
      patterns: [
        {
          id: 'learned_test_pattern',
          category: 'testing',
          title: 'Test Pattern',
          content: 'Pattern content',
          keywords: ['testing', 'patterns'],
          created_at: '2026-02-10T08:00:00Z',
        },
      ],
    };
    vi.mocked(queryLearnedPatternsCore).mockResolvedValue(mockResult);

    // WHEN: Tool is called
    const result = await queryLearnedPatternsSqlite({
      dbPath: '/tmp/test.db',
      category: 'testing',
    });

    // THEN: Returns structured data
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(1);
    expect(data.patterns[0].category).toBe('testing');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(queryLearnedPatternsCore).mockRejectedValue(new Error('Query failed'));

    const result = await queryLearnedPatternsSqlite({
      dbPath: '/tmp/test.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
  });
});

describe('searchContextSqlite (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search across all content types', async () => {
    // GIVEN: Mock core function returns search results
    const mockResult = {
      count: 3,
      results: [
        {
          type: 'session',
          id: '2026-02-10',
          title: 'Test Session',
          snippet: '...SQLite queries...',
          score: 1.0,
        },
        {
          type: 'plan',
          id: 'PLAN_test',
          title: 'Test Plan',
          snippet: '...SQLite database...',
          score: 0.9,
        },
        {
          type: 'learned',
          id: 'learned_pattern',
          title: 'Pattern',
          snippet: '...SQLite patterns...',
          score: 0.8,
        },
      ],
      query: 'SQLite',
    };
    vi.mocked(searchContextCore).mockResolvedValue(mockResult);

    // WHEN: Tool is called
    const result = await searchContextSqlite({
      dbPath: '/tmp/test.db',
      query: 'SQLite',
    });

    // THEN: Returns search results
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(3);
    expect(data.query).toBe('SQLite');
    expect(data.results).toHaveLength(3);
  });

  it('should support result limiting', async () => {
    vi.mocked(searchContextCore).mockResolvedValue({
      count: 5,
      results: Array(5).fill({ type: 'session', id: 'test', title: 'Test', snippet: '...', score: 1.0 }),
      query: 'test',
    });

    const result = await searchContextSqlite({
      dbPath: '/tmp/test.db',
      query: 'test',
      limit: 5,
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(5);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(searchContextCore).mockRejectedValue(new Error('Search failed'));

    const result = await searchContextSqlite({
      dbPath: '/tmp/test.db',
      query: 'test',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
  });
});

describe('getDbStatsSqlite (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return database statistics', async () => {
    // GIVEN: Mock core function returns stats
    const mockResult = {
      sessions: 10,
      plans: 5,
      learned: 3,
      total: 18,
      dbSize: 1024000,
      dbPath: '/tmp/test.db',
    };
    vi.mocked(getDbStatsCore).mockResolvedValue(mockResult);

    // WHEN: Tool is called
    const result = await getDbStatsSqlite({
      dbPath: '/tmp/test.db',
    });

    // THEN: Returns stats
    const data = JSON.parse(result.content[0].text);
    expect(data.sessions).toBe(10);
    expect(data.plans).toBe(5);
    expect(data.learned).toBe(3);
    expect(data.total).toBe(18);
    expect(data.dbSize).toBe(1024000);
  });

  it('should handle empty database', async () => {
    vi.mocked(getDbStatsCore).mockResolvedValue({
      sessions: 0,
      plans: 0,
      learned: 0,
      total: 0,
      dbSize: 0,
      dbPath: '/tmp/empty.db',
    });

    const result = await getDbStatsSqlite({
      dbPath: '/tmp/empty.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.total).toBe(0);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(getDbStatsCore).mockRejectedValue(new Error('Database error'));

    const result = await getDbStatsSqlite({
      dbPath: '/tmp/test.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
  });
});
