import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getActivePlans, getRecentSessions } from '../../src/tools/query.js';

// Mock the query commands
vi.mock('../../../lib/commands/query-plans.js', () => ({
  queryPlans: vi.fn(),
}));

vi.mock('../../../lib/commands/query-sessions.js', () => ({
  querySessions: vi.fn(),
}));

import { queryPlans } from '../../../lib/commands/query-plans.js';
import { querySessions } from '../../../lib/commands/query-sessions.js';

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

    vi.mocked(queryPlans).mockResolvedValue(mockPlans);

    const result = await getActivePlans();
    const data = JSON.parse(result.content[0].text);

    expect(data.count).toBe(2);
    expect(data.plans).toHaveLength(2);
    expect(data.plans[0].id).toBe('PLAN_test1');
    expect(data.plans[0].status).toBe('ACTIVE');
  });

  it('should call queryPlans with correct filters', async () => {
    vi.mocked(queryPlans).mockResolvedValue({ count: 0, plans: [] });

    await getActivePlans();

    expect(queryPlans).toHaveBeenCalledWith({
      status: 'ACTIVE',
      json: true,
      _silent: true,
    });
  });

  it('should handle empty plans list', async () => {
    vi.mocked(queryPlans).mockResolvedValue({ count: 0, plans: [] });

    const result = await getActivePlans();
    const data = JSON.parse(result.content[0].text);

    expect(data.count).toBe(0);
    expect(data.plans).toHaveLength(0);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(queryPlans).mockRejectedValue(new Error('Database error'));

    const result = await getActivePlans();
    const data = JSON.parse(result.content[0].text);

    expect(data.error).toBe(true);
    expect(data.message).toContain('Database error');
    expect(data.count).toBe(0);
    expect(data.plans).toEqual([]);
  });

  it('should return MCP-compliant response format', async () => {
    vi.mocked(queryPlans).mockResolvedValue({ count: 0, plans: [] });

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

    vi.mocked(querySessions).mockResolvedValue(mockSessions);

    const result = await getRecentSessions(7);
    const data = JSON.parse(result.content[0].text);

    expect(data.count).toBe(2);
    expect(data.daysQueried).toBe(7);
    expect(data.sessions).toHaveLength(2);
    expect(data.sessions[0].date).toBe('2026-02-08');
  });

  it('should use default days parameter (7)', async () => {
    vi.mocked(querySessions).mockResolvedValue({ count: 0, sessions: [] });

    await getRecentSessions();

    expect(querySessions).toHaveBeenCalledWith({
      days: 7,
      json: true,
      _silent: true,
    });
  });

  it('should accept custom days parameter', async () => {
    vi.mocked(querySessions).mockResolvedValue({ count: 0, sessions: [] });

    await getRecentSessions(30);

    expect(querySessions).toHaveBeenCalledWith({
      days: 30,
      json: true,
      _silent: true,
    });
  });

  it('should handle empty sessions list', async () => {
    vi.mocked(querySessions).mockResolvedValue({ count: 0, sessions: [] });

    const result = await getRecentSessions(7);
    const data = JSON.parse(result.content[0].text);

    expect(data.count).toBe(0);
    expect(data.sessions).toHaveLength(0);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(querySessions).mockRejectedValue(new Error('File read error'));

    const result = await getRecentSessions(7);
    const data = JSON.parse(result.content[0].text);

    expect(data.error).toBe(true);
    expect(data.message).toContain('File read error');
    expect(data.count).toBe(0);
    expect(data.sessions).toEqual([]);
  });

  it('should return MCP-compliant response format', async () => {
    vi.mocked(querySessions).mockResolvedValue({ count: 0, sessions: [] });

    const result = await getRecentSessions(7);

    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
  });
});
