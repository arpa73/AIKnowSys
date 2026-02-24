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
  querySessions,
  getSession,
  getPlan,
  queryPlans,
  queryLearnedPatterns,
  searchContext,
  getDbStats,
  queryReviews,
  queryEvents,
} from '../../src/tools/sqlite-query.js';

const mockStorageInit = vi.fn();
const mockGetSessionWithRelations = vi.fn();
const mockGetPlanById = vi.fn();
const mockGetPlanWithRelations = vi.fn();
const mockQueryReviews = vi.fn();
const mockQueryEvents = vi.fn();
const mockStorageClose = vi.fn();

vi.mock('../../../lib/context/sqlite-storage.js', () => {
  class MockSqliteStorage {
    async init(...args: unknown[]) {
      return mockStorageInit(...args);
    }

    async getSessionWithRelations(...args: unknown[]) {
      return mockGetSessionWithRelations(...args);
    }

    async getPlanById(...args: unknown[]) {
      return mockGetPlanById(...args);
    }

    async getPlanWithRelations(...args: unknown[]) {
      return mockGetPlanWithRelations(...args);
    }

    async queryReviews(...args: unknown[]) {
      return mockQueryReviews(...args);
    }

    async queryEvents(...args: unknown[]) {
      return mockQueryEvents(...args);
    }

    async close(...args: unknown[]) {
      return mockStorageClose(...args);
    }
  }

  return { SqliteStorage: MockSqliteStorage };
});

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

describe('querySessions (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageInit.mockReset();
    mockGetSessionWithRelations.mockReset();
    mockGetPlanById.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
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
    const result = await querySessions({
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
    const result = await querySessions({
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
      planId: 'PLAN_test',
    };

    await querySessions(filters);

    // Expect parsed parameters (includes default includeContent: false)
    expect(querySessionsCore).toHaveBeenCalledWith({
      ...filters,
      includeContent: false, // Default added by parseQueryParams
    });
  });
});

describe('queryPlans (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageInit.mockReset();
    mockGetSessionWithRelations.mockReset();
    mockGetPlanById.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
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
    const result = await queryPlans({
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

    const result = await queryPlans({
      dbPath: '/tmp/test.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
  });
});

describe('queryLearnedPatterns (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageInit.mockReset();
    mockGetSessionWithRelations.mockReset();
    mockGetPlanById.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
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
    const result = await queryLearnedPatterns({
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

    const result = await queryLearnedPatterns({
      dbPath: '/tmp/test.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
  });
});

describe('searchContext (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageInit.mockReset();
    mockGetSessionWithRelations.mockReset();
    mockGetPlanById.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
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
    const result = await searchContext({
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

    const result = await searchContext({
      dbPath: '/tmp/test.db',
      query: 'test',
      limit: 5,
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(5);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(searchContextCore).mockRejectedValue(new Error('Search failed'));

    const result = await searchContext({
      dbPath: '/tmp/test.db',
      query: 'test',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
  });
});

describe('getDbStats (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageInit.mockReset();
    mockGetSessionWithRelations.mockReset();
    mockGetPlanById.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
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
    const result = await getDbStats({
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

    const result = await getDbStats({
      dbPath: '/tmp/empty.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.total).toBe(0);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(getDbStatsCore).mockRejectedValue(new Error('Database error'));

    const result = await getDbStats({
      dbPath: '/tmp/test.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
  });
});

describe('getSession (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageInit.mockReset();
    mockGetSessionWithRelations.mockReset();
    mockGetPlanById.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
  });

  it('should return session with related entities', async () => {
    mockGetSessionWithRelations.mockResolvedValue({
      session: { id: 'sess-1', topic: 'Work' },
      plan: { id: 'PLAN_x', title: 'Plan X' },
      reviews: [{ id: 'rev-1', status: 'PENDING' }],
      events: [{ eventId: 'evt-1', eventType: 'SESSION_STARTED' }],
    });

    const result = await getSession({ sessionId: 'sess-1', dbPath: '/tmp/test.db' });

    const data = JSON.parse(result.content[0].text);
    expect(data.session.id).toBe('sess-1');
    expect(data.plan.id).toBe('PLAN_x');
    expect(data.reviews).toHaveLength(1);
    expect(data.events).toHaveLength(1);
    expect(mockStorageInit).toHaveBeenCalledTimes(1);
    expect(mockStorageClose).toHaveBeenCalledTimes(1);
  });

  it('should return structured not-found response', async () => {
    mockGetSessionWithRelations.mockResolvedValue(undefined);

    const result = await getSession({ sessionId: 'missing', dbPath: '/tmp/test.db' });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
    expect(data.message).toContain('Session not found: missing');
    expect(mockStorageClose).toHaveBeenCalledTimes(1);
  });

  it('should close storage when initialization fails', async () => {
    mockStorageInit.mockRejectedValueOnce(new Error('DB init failed'));

    const result = await getSession({ sessionId: 'sess-1', dbPath: '/tmp/test.db' });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
    expect(data.message).toContain('DB init failed');
    expect(mockStorageClose).toHaveBeenCalledTimes(1);
  });
});

describe('getPlan (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageInit.mockReset();
    mockGetSessionWithRelations.mockReset();
    mockGetPlanById.mockReset();
    mockGetPlanWithRelations.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
  });

  it('should return a single plan by id with relations', async () => {
    mockGetPlanWithRelations.mockResolvedValue({
      plan: {
        id: 'PLAN_test',
        title: 'Test plan',
        status: 'ACTIVE',
      },
      sessions: [],
      reviews: [],
      events: []
    });

    const result = await getPlan({ planId: 'PLAN_test', dbPath: '/tmp/test.db' });
    const data = JSON.parse(result.content[0].text);

    expect(data.plan.id).toBe('PLAN_test');
    expect(data.plan.title).toBe('Test plan');
    expect(mockStorageInit).toHaveBeenCalledTimes(1);
    expect(mockGetPlanWithRelations).toHaveBeenCalledWith('PLAN_test');
    expect(mockStorageClose).toHaveBeenCalledTimes(1);
  });

  it('should return structured not-found response', async () => {
    mockGetPlanWithRelations.mockResolvedValue(undefined);

    const result = await getPlan({ planId: 'PLAN_missing', dbPath: '/tmp/test.db' });
    const data = JSON.parse(result.content[0].text);

    expect(data.error).toBe(true);
    expect(data.message).toContain('Plan not found: PLAN_missing');
    expect(mockStorageClose).toHaveBeenCalledTimes(1);
  });
});

describe('queryReviews (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageInit.mockReset();
    mockQueryReviews.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
  });

  it('should query reviews with targetId and status filters', async () => {
    // GIVEN: Mock storage returns reviews
    const mockResult = {
      count: 1,
      reviews: [
        {
          id: 'rev-1',
          target_id: 'PLAN_test',
          content: 'review content',
          status: 'PENDING',
        }
      ]
    };
    mockQueryReviews.mockResolvedValue(mockResult);

    // WHEN: Tool is called
    const result = await queryReviews({
      dbPath: '/tmp/test.db',
      targetId: 'PLAN_test',
      status: 'PENDING'
    });

    // THEN: Returns MCP-compliant response
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(1);
    expect(data.reviews).toHaveLength(1);

    // Core function verified
    expect(mockQueryReviews).toHaveBeenCalledWith({
      targetId: 'PLAN_test',
      status: 'PENDING'
    });
  });

  it('should handle errors gracefully', async () => {
    mockQueryReviews.mockRejectedValue(new Error('Query failed'));

    const result = await queryReviews({
      dbPath: '/tmp/test.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
    expect(data.message).toContain('Failed to query reviews: Query failed');
  });
});

describe('queryEvents (MCP Tool)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageInit.mockReset();
    mockQueryEvents.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
  });

  it('should query events with planId, sessionId, and eventType filters', async () => {
    // GIVEN: Mock storage returns events
    const mockEvents = [
      {
        id: 'evt-1',
        event_type: 'task_completed',
        plan_id: 'PLAN_test',
        session_id: 'sess-1'
      }
    ];
    mockQueryEvents.mockResolvedValue(mockEvents);

    // WHEN: Tool is called
    const result = await queryEvents({
      dbPath: '/tmp/test.db',
      planId: 'PLAN_test',
      sessionId: 'sess-1',
      eventType: 'task_completed'
    });

    // THEN: Returns MCP-compliant response
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(1);
    expect(data.events).toHaveLength(1);

    // Core function verified
    expect(mockQueryEvents).toHaveBeenCalledWith({
      planId: 'PLAN_test',
      sessionId: 'sess-1',
      eventType: 'task_completed',
      limit: 500
    });
  });

  it('should support custom limit', async () => {
    mockQueryEvents.mockResolvedValue([]);

    await queryEvents({
      dbPath: '/tmp/test.db',
      limit: 100
    });

    expect(mockQueryEvents).toHaveBeenCalledWith({
      limit: 100
    });
  });

  it('should handle errors gracefully', async () => {
    mockQueryEvents.mockRejectedValue(new Error('Query failed'));

    const result = await queryEvents({
      dbPath: '/tmp/test.db',
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.error).toBe(true);
    expect(data.message).toContain('Failed to query events: Query failed');
  });
});
