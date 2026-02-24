import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecFileAsync = vi.fn();
const mockStorageInit = vi.fn();
const mockStorageClose = vi.fn();
const mockUpsertUserState = vi.fn();
const mockGetUserState = vi.fn();
const mockQueryFullSessions = vi.fn();
const mockGetPlanById = vi.fn();
const mockUpdatePlan = vi.fn();
const mockUpdateSessionFields = vi.fn();
const mockUpdateSessionContent = vi.fn();
const mockPrepare = vi.fn();
const mockGetDatabaseConfig = vi.fn();

vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecFileAsync),
}));

const mockCheckConstraints = vi.fn();
const mockEnforceConstraints = vi.fn();

vi.mock('../../../lib/core/constraints.js', () => ({
  checkConstraints: (...args: unknown[]) => mockCheckConstraints(...args),
  enforceConstraints: (...args: unknown[]) => mockEnforceConstraints(...args),
}));

vi.mock('../../../lib/utils/find-knowledge-db.js', () => ({
  findKnowledgeDb: vi.fn(() => '.aiknowsys/knowledge.db'),
}));

vi.mock('../../../lib/context/database-locator.js', () => {
  class MockDatabaseLocator {
    async getDatabaseConfig(...args: unknown[]) {
      return mockGetDatabaseConfig(...args);
    }
  }

  return { DatabaseLocator: MockDatabaseLocator };
});

vi.mock('../../../lib/context/sqlite-storage.js', () => {
  class MockSqliteStorage {
    async init(...args: unknown[]) {
      return mockStorageInit(...args);
    }

    async upsertUserState(...args: unknown[]) {
      return mockUpsertUserState(...args);
    }

    async getUserState(...args: unknown[]) {
      return mockGetUserState(...args);
    }

    async queryFullSessions(...args: unknown[]) {
      return mockQueryFullSessions(...args);
    }

    async getPlanById(...args: unknown[]) {
      return mockGetPlanById(...args);
    }

    async updatePlan(...args: unknown[]) {
      return mockUpdatePlan(...args);
    }

    async updateSessionFields(...args: unknown[]) {
      return mockUpdateSessionFields(...args);
    }

    async updateSessionContent(...args: unknown[]) {
      return mockUpdateSessionContent(...args);
    }

    async close(...args: unknown[]) {
      return mockStorageClose(...args);
    }

    get db() {
      return {
        prepare: mockPrepare
      };
    }
  }

  return { SqliteStorage: MockSqliteStorage };
});

describe('Split Plan Mutation Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileAsync.mockReset();
    mockCheckConstraints.mockResolvedValue({ allowed: true, blockers: [] });
    mockEnforceConstraints.mockResolvedValue(undefined);
    mockStorageInit.mockReset();
    mockStorageClose.mockReset();
    mockUpsertUserState.mockReset();
    mockGetUserState.mockReset();
    mockQueryFullSessions.mockReset();
    mockGetPlanById.mockReset();
    mockUpdatePlan.mockReset();
    mockUpdateSessionFields.mockReset();
    mockUpdateSessionContent.mockReset();
    mockPrepare.mockReset();
    mockGetDatabaseConfig.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
    mockUpsertUserState.mockResolvedValue(undefined);
    mockGetUserState.mockResolvedValue({ activePlanId: 'PLAN_feature_x' });
    mockGetPlanById.mockResolvedValue({
      id: 'PLAN_feature_x',
      title: 'Test Plan',
      content: `---
id: PLAN_feature_x
title: Test Plan
status: ACTIVE
author: test
---

# Test Plan

## Goal
Test the plan mutations.`,
      status: 'ACTIVE'
    });
    mockUpdatePlan.mockResolvedValue({ changes: 1 });
    mockUpdateSessionFields.mockResolvedValue({ changes: 1 });
    mockUpdateSessionContent.mockResolvedValue({ changes: 1 });
    mockGetDatabaseConfig.mockResolvedValue({
      dbPath: '/tmp/test.db',
      projectId: 'resolved-project-id',
      projectName: 'test-project',
    });
    mockPrepare.mockReturnValue({
      run: vi.fn().mockReturnValue({ changes: 1 })
    });
  });

  describe('set_plan_status', () => {
    it('should set plan status to COMPLETE', async () => {
      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      const result = await setPlanStatus({
        planId: 'PLAN_feature_x',
        status: 'COMPLETE'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Plan status updated');
      expect(result.content[0].text).toContain('COMPLETE');
      expect(mockCheckConstraints).toHaveBeenCalledWith('COMPLETE_PLAN', expect.objectContaining({
        projectId: 'resolved-project-id',
        targetId: 'PLAN_feature_x',
        targetDir: expect.any(String),
      }));
    });

    it('should block COMPLETE when constraints fail', async () => {
      mockCheckConstraints.mockResolvedValue({
        allowed: false,
        blockers: ['Plan has 1 pending review(s). Address them first.']
      });

      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      const result = await setPlanStatus({
        planId: 'PLAN_feature_x',
        status: 'COMPLETE'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Plan completion blocked by constraints');
    });

    it('should check CANCEL_PLAN constraints when setting status to CANCELLED', async () => {
      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      const result = await setPlanStatus({
        planId: 'PLAN_feature_x',
        status: 'CANCELLED'
      });

      expect(result.isError).not.toBe(true);
      expect(mockCheckConstraints).toHaveBeenCalledWith('CANCEL_PLAN', expect.objectContaining({
        projectId: 'resolved-project-id',
        targetId: 'PLAN_feature_x',
        targetDir: expect.any(String),
      }));
    });

    it('should block CANCELLED when constraints fail', async () => {
      mockCheckConstraints.mockResolvedValue({
        allowed: false,
        blockers: ['No \'VALIDATION_PASSED\' event recorded for this plan.']
      });

      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      const result = await setPlanStatus({
        planId: 'PLAN_feature_x',
        status: 'CANCELLED'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Plan completion blocked by constraints');
    });

    it('should sync pointer to user_state when setting ACTIVE', async () => {
      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      await setPlanStatus({
        planId: 'PLAN_test',
        status: 'ACTIVE'
      });

      expect(mockUpsertUserState).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'mcp-agent',
        project_id: 'resolved-project-id',
        active_plan_id: 'PLAN_test'
      }));
    });

    it('should clear pointer when pausing currently active plan', async () => {
      mockGetUserState.mockResolvedValue({ activePlanId: 'PLAN_feature_x' });

      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      await setPlanStatus({
        planId: 'PLAN_feature_x',
        status: 'PAUSED'
      });

      expect(mockUpsertUserState).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'mcp-agent',
        project_id: 'resolved-project-id',
        active_plan_id: null
      }));
    });

    it('should still succeed when pointer sync fails', async () => {
      mockUpsertUserState.mockRejectedValueOnce(new Error('DB unavailable'));

      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      const result = await setPlanStatus({
        planId: 'PLAN_feature_x',
        status: 'ACTIVE'
      });

      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Plan status updated');
      expect(result.content[0].text).toContain('Pointer sync warning');
    });

    it('should validate planId format', async () => {
      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');

      const result = await setPlanStatus({
        planId: 'invalid',
        status: 'COMPLETE'
      });

      expect(result.isError).toBe(true);
      const errorText = result.content[0].text;
      expect(errorText).toContain("Invalid parameter 'planId'");
      expect(errorText).toContain('Plan ID must be in format PLAN_<name>');
    });

    it('should validate status enum', async () => {
      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');

      const result = await setPlanStatus({
        planId: 'PLAN_test',
        status: 'INVALID'
      });

      expect(result.isError).toBe(true);
      const errorText = result.content[0].text;
      expect(errorText).toContain("Invalid parameter 'status'");
      expect(errorText).toContain('Status must be one of: ACTIVE, PAUSED, COMPLETE, CANCELLED');
    });
  });

  describe('append_to_plan', () => {
    it('should append content to plan', async () => {
      const { appendToPlan } = await import('../../src/tools/split-mutations.js');
      const result = await appendToPlan({
        planId: 'PLAN_feature_x',
        content: 'Phase 1 complete'
      });

      expect(result.content[0].text).toContain('Plan appended successfully');
    });

    it('should validate planId format', async () => {
      const { appendToPlan } = await import('../../src/tools/split-mutations.js');

      const result = await appendToPlan({
        planId: 'invalid',
        content: 'Test'
      });

      expect(result.isError).toBe(true);
      const errorText = result.content[0].text;
      expect(errorText).toContain("Invalid parameter 'planId'");
      expect(errorText).toContain('Plan ID must be in format PLAN_<name>');
    });

    it('should require content field', async () => {
      const { appendToPlan } = await import('../../src/tools/split-mutations.js');

      const result = await appendToPlan({
        planId: 'PLAN_test'
        // Missing content
      });

      expect(result.isError).toBe(true);
      const errorText = result.content[0].text;
      expect(errorText).toContain("Invalid parameter 'content'");
      expect(errorText).toContain('Content must be a non-empty string');
    });

    it('should succeed when stored plan content is missing frontmatter', async () => {
      mockGetPlanById.mockResolvedValue({
        id: 'PLAN_feature_x',
        title: 'Test Plan',
        content: '# Test Plan\n\n## Goal\nLegacy content without frontmatter.',
        status: 'ACTIVE',
        author: 'test',
      });

      const { appendToPlan } = await import('../../src/tools/split-mutations.js');
      const result = await appendToPlan({
        planId: 'PLAN_feature_x',
        content: 'Recovered append works'
      });

      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Plan appended successfully');
      expect(mockUpdatePlan).toHaveBeenCalled();
    });
  });

  describe('prepend_to_plan', () => {
    it('should prepend content to plan', async () => {
      const { prependToPlan } = await import('../../src/tools/split-mutations.js');
      const result = await prependToPlan({
        planId: 'PLAN_feature_x',
        content: '⚠️ Blocker found: API rate limit'
      });

      expect(result.content[0].text).toContain('Plan prepended successfully');
    });
  });
});

describe('Split Session Mutation Tools', () => {
  const mockSessionContent = `---
date: 2026-02-21
topics: []
status: active
---

# Session: Test Session

## Goal
Test the session mutations.
`;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileAsync.mockReset();
    mockQueryFullSessions.mockResolvedValue({
      sessions: [{
        id: '2026-02-21',
        content: mockSessionContent
      }]
    });
    mockUpdateSessionFields.mockResolvedValue({ changes: 1 });
    mockUpdateSessionContent.mockResolvedValue({ changes: 1 });
    mockPrepare.mockReturnValue({
      run: vi.fn().mockReturnValue({ changes: 1 })
    });
  });

  describe('append_to_session', () => {
    it('should append to session section', async () => {
      const { appendToSession } = await import('../../src/tools/split-mutations.js');
      const result = await appendToSession({
        section: '## Progress',
        content: 'Completed Phase 2'
      });

      expect(result.content[0].text).toContain('Updated session');
    });

    it('should call queryFullSessions with correct date', async () => {
      const { appendToSession } = await import('../../src/tools/split-mutations.js');
      await appendToSession({
        date: '2026-02-09',
        section: '## Progress',
        content: 'Yesterday update'
      });

      expect(mockQueryFullSessions).toHaveBeenCalledWith({ date: '2026-02-09' });
    });

    it('should validate content is required', async () => {
      const { appendToSession } = await import('../../src/tools/split-mutations.js');

      const result = await appendToSession({
        section: '## Test'
        // Missing content
      });

      expect(result.isError).toBe(true);
      const errorText = result.content[0].text;
      expect(errorText).toContain("Invalid parameter 'content'");
      expect(errorText).toContain('Content must be a non-empty string');
    });

    it('should succeed when stored session content is missing frontmatter', async () => {
      mockQueryFullSessions.mockResolvedValue({
        sessions: [{
          id: '2026-02-21',
          content: '# Session: Legacy\n\n## Goal\nNo frontmatter block.'
        }]
      });

      const { appendToSession } = await import('../../src/tools/split-mutations.js');
      const result = await appendToSession({
        section: '## Progress',
        content: 'Recovered append works'
      });

      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Updated session');
      expect(mockUpdateSessionFields).toHaveBeenCalled();
      expect(mockUpdateSessionContent).toHaveBeenCalled();
    });
  });

  describe('prepend_to_session', () => {
    it('should prepend to session section', async () => {
      const { prependToSession } = await import('../../src/tools/split-mutations.js');
      const result = await prependToSession({
        section: '## Critical Issue',
        content: 'Security vulnerability found'
      });

      expect(result.content[0].text).toContain('Updated session');
    });
  });

  describe('insert_after_section', () => {
    it('should insert section after pattern', async () => {
      const { insertAfterSection } = await import('../../src/tools/split-mutations.js');
      const result = await insertAfterSection({
        pattern: '## Goal',
        section: '## Progress',
        content: 'Step 1 complete'
      });

      expect(result.content[0].text).toContain('Updated session');
    });

    it('should use default section title if not provided', async () => {
      const { insertAfterSection } = await import('../../src/tools/split-mutations.js');
      const result = await insertAfterSection({
        pattern: '## Goal',
        content: 'Update'
      });

      expect(result.content[0].text).toContain('Updated session');
    });
  });

  describe('insert_before_section', () => {
    it('should insert section before pattern', async () => {
      const { insertBeforeSection } = await import('../../src/tools/split-mutations.js');
      const result = await insertBeforeSection({
        pattern: '## Goal',
        section: '## Validation',
        content: 'All tests passing'
      });

      expect(result.content[0].text).toContain('Updated session');
    });
  });
});
