import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getActivePlans, getRecentSessions, queryPlansWithFilters, querySessionsWithFilters } from '../../src/tools/query.js';

// Mock the core query functions
vi.mock('../../../lib/core/query-plans.js', () => ({
  queryPlansCore: vi.fn(),
}));

vi.mock('../../../lib/core/query-sessions.js', () => ({
  querySessionsCore: vi.fn(),
}));

import { queryPlansCore } from '../../../lib/core/query-plans.js';
import { querySessionsCore } from '../../../lib/core/query-sessions.js';

describe('getActivePlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return active plans with correct structure', async () => {
    const mockPlans = {
      count: 2,
      plans: [
        {
          id: 'PLAN_test1',
          title: 'Test Plan 1',
          author: 'alice',
          status: 'ACTIVE',
          created: '2026-02-01T10:00:00Z',
          updated: '2026-02-08T10:00:00Z',
          file: 'PLAN_test1.md',
          topics: ['testing', 'mcp'],
        },
        {
          id: 'PLAN_test2',
          title: 'Test Plan 2',
          author: 'bob',
          status: 'ACTIVE',
          created: '2026-02-05T10:00:00Z',
          updated: '2026-02-08T12:00:00Z',
          file: 'PLAN_test2.md',
          topics: [],
        },
      ],
    };

    vi.mocked(queryPlansCore).mockResolvedValue(mockPlans);

    const result = await getActivePlans();
    const data = JSON.parse(result.content[0].text);

    expect(data.count).toBe(2);
    expect(data.plans).toHaveLength(2);
    expect(data.plans[0].id).toBe('PLAN_test1');
    expect(data.plans[0].status).toBe('ACTIVE');
  });

  it('should call queryPlansCore with correct filters', async () => {
    vi.mocked(queryPlansCore).mockResolvedValue({ count: 0, plans: [] });

    await getActivePlans();

    expect(queryPlansCore).toHaveBeenCalledWith({
      status: 'ACTIVE',
    });
  });

  it('should handle empty plans list', async () => {
    vi.mocked(queryPlansCore).mockResolvedValue({ count: 0, plans: [] });

    const result = await getActivePlans();
    const data = JSON.parse(result.content[0].text);

    expect(data.count).toBe(0);
    expect(data.plans).toHaveLength(0);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(queryPlansCore).mockRejectedValue(new Error('Database error'));

    const result = await getActivePlans();
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(false);
    expect(data.error.message).toContain('Database error');
    expect(data.error.type).toBe('ValidationFailed');
    expect(data.error.suggestion).toBeDefined();
  });

  it('should return MCP-compliant response format', async () => {
    vi.mocked(queryPlansCore).mockResolvedValue({ count: 0, plans: [] });

    const result = await getActivePlans();

    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
  });
});

describe('getRecentSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return recent sessions with correct structure', async () => {
    const mockSessions = {
      count: 2,
      sessions: [
        {
          date: '2026-02-08',
          topic: 'MCP Implementation',
          topics: ['mcp', 'testing'],
          plan: 'PLAN_mcp',
          file: '2026-02-08-session.md',
        },
        {
          date: '2026-02-07',
          topic: 'Documentation Update',
          topics: ['docs'],
          plan: undefined,
          file: '2026-02-07-session.md',
        },
      ],
    };

    vi.mocked(querySessionsCore).mockResolvedValue(mockSessions);

    const result = await getRecentSessions(7);
    const data = JSON.parse(result.content[0].text);

    expect(data.count).toBe(2);
    expect(data.daysQueried).toBe(7);
    expect(data.sessions).toHaveLength(2);
    expect(data.sessions[0].date).toBe('2026-02-08');
  });

  it('should use default days parameter (7)', async () => {
    vi.mocked(querySessionsCore).mockResolvedValue({ count: 0, sessions: [] });

    await getRecentSessions();

    expect(querySessionsCore).toHaveBeenCalledWith({
      days: 7,
    });
  });

  it('should accept custom days parameter', async () => {
    vi.mocked(querySessionsCore).mockResolvedValue({ count: 0, sessions: [] });

    await getRecentSessions(30);

    expect(querySessionsCore).toHaveBeenCalledWith({
      days: 30,
    });
  });

  it('should handle empty sessions list', async () => {
    vi.mocked(querySessionsCore).mockResolvedValue({ count: 0, sessions: [] });

    const result = await getRecentSessions(7);
    const data = JSON.parse(result.content[0].text);

    expect(data.count).toBe(0);
    expect(data.sessions).toHaveLength(0);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(querySessionsCore).mockRejectedValue(new Error('File read error'));

    const result = await getRecentSessions(7);
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(false);
    expect(data.error.message).toContain('File read error');
    expect(data.error.type).toBe('ValidationFailed');
    expect(data.error.suggestion).toBeDefined();
  });

  it('should return MCP-compliant response format', async () => {
    vi.mocked(querySessionsCore).mockResolvedValue({ count: 0, sessions: [] });

    const result = await getRecentSessions(7);

    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
  });
});

describe('conversational error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return structured errors for database failures', async () => {
    vi.mocked(queryPlansCore).mockRejectedValue(new Error('SQLITE_ERROR: database locked'));

    const result = await getActivePlans();
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.type).toBe('ValidationFailed');
    expect(data.error.message).toContain('database locked');
    expect(data.error.suggestion).toBeDefined();
    expect(data.error.docs_url).toBeDefined();
  });

  it('should return structured errors for query filter errors', async () => {
    vi.mocked(queryPlansCore).mockRejectedValue(new Error('Invalid status value'));

    const result = await queryPlansWithFilters({ status: 'INVALID' as any });
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(false);
    expect(data.error.type).toBe('InvalidParameter');
    expect(data.error.parameter).toBe('status');
    expect(data.error.message).toBe("Invalid parameter 'status'");
    expect(data.error.suggestion).toContain('ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED');
  });

  it('should return structured errors for session filter errors', async () => {
    vi.mocked(querySessionsCore).mockRejectedValue(new Error('Invalid date format'));

    const result = await querySessionsWithFilters({ date: 'invalid' });
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(false);
    expect(data.error.type).toBe('InvalidParameter');
    expect(data.error.parameter).toBe('date');
    expect(data.error.message).toBe("Invalid parameter 'date'");
    expect(data.error.suggestion).toContain('YYYY-MM-DD');
  });

  it('should return structured errors with usage examples', async () => {
    vi.mocked(querySessionsCore).mockRejectedValue(new Error('No parameters provided'));

    const result = await querySessionsWithFilters({});
    const data = JSON.parse(result.content[0].text);

    expect(data.success).toBe(false);
    expect(data.error.suggestion).toBeDefined();
    expect(data.error.docs_url).toMatch(/AIKnowSys|aiknowsys/i);
  });
});
