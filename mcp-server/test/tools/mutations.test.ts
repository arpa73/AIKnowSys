import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsertReview = vi.fn();
const mockInsertLink = vi.fn();
const mockInsertProject = vi.fn();
const mockInsertSession = vi.fn();
const mockInsertEvent = vi.fn();
const mockGetActivePlanId = vi.fn();
const mockStorageClose = vi.fn();
const mockStorageInit = vi.fn();
const mockCheckConstraints = vi.fn();

vi.mock('../../../lib/context/sqlite-storage.js', () => {
  class MockSqliteStorage {
    async init(...args: unknown[]) {
      return mockStorageInit(...args);
    }

    async insertReview(...args: unknown[]) {
      return mockInsertReview(...args);
    }

    async insertLink(...args: unknown[]) {
      return mockInsertLink(...args);
    }

    async insertProject(...args: unknown[]) {
      return mockInsertProject(...args);
    }

    async insertSession(...args: unknown[]) {
      return mockInsertSession(...args);
    }

    async insertEvent(...args: unknown[]) {
      return mockInsertEvent(...args);
    }

    async getActivePlanId(...args: unknown[]) {
      return mockGetActivePlanId(...args);
    }

    close(...args: unknown[]) {
      return mockStorageClose(...args);
    }
  }

  return { SqliteStorage: MockSqliteStorage };
});

vi.mock('../../../lib/utils/find-knowledge-db.js', () => ({
  findKnowledgeDb: vi.fn(() => '.aiknowsys/knowledge.db'),
}));

vi.mock('../../../lib/core/constraints.js', () => ({
  async checkConstraints(...args: unknown[]) {
    return mockCheckConstraints(...args);
  },
}));

describe('Mutation Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertReview.mockReset();
    mockInsertLink.mockReset();
    mockInsertProject.mockReset();
    mockInsertSession.mockReset();
    mockInsertEvent.mockReset();
    mockGetActivePlanId.mockReset();
    mockStorageClose.mockReset();
    mockStorageInit.mockReset();
    mockCheckConstraints.mockReset();
    mockStorageInit.mockResolvedValue(undefined);
    mockInsertReview.mockResolvedValue(undefined);
    mockInsertLink.mockResolvedValue(undefined);
    mockInsertProject.mockResolvedValue(undefined);
    mockInsertSession.mockResolvedValue(undefined);
    mockInsertEvent.mockResolvedValue(undefined);
    mockGetActivePlanId.mockResolvedValue('PLAN_auto_from_state');
    mockCheckConstraints.mockResolvedValue({ allowed: true, blockers: [] });
  });

  describe('create_session', () => {
    it('should create session with title and topics', async () => {
      // NOTE: createSession now uses direct lib/core import (no CLI mock needed)
      // This test will create actual session file (in today's date)
      const { createSession } = await import('../../src/tools/mutations.js');
      const result = await createSession({
        title: 'Test MCP Integration',
        topics: ['MCP', 'tools']
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      // New format: "✅ Created session: YYYY-MM-DD-session.md" or "ℹ️ Session already exists: ..."
      expect(result.content[0].text).toMatch(/Created session:|Session already exists:/);
      expect(result.content[0].text).toMatch(/session\.md/);
      expect(mockStorageInit).toHaveBeenCalledTimes(1);
      expect(mockStorageClose).toHaveBeenCalledTimes(1);
    });

    it('should close storage when session creation fails', async () => {
      mockStorageInit.mockRejectedValueOnce(new Error('DB init failed'));

      const { createSession } = await import('../../src/tools/mutations.js');
      const result = await createSession({
        title: 'Test MCP Integration',
        topics: ['MCP', 'tools']
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed during createSession storage operation: DB init failed');
      expect(mockStorageInit).toHaveBeenCalledTimes(1);
      expect(mockStorageClose).toHaveBeenCalledTimes(1);
    });

    // NOTE: These tests are SKIPPED because createSession() now uses direct lib/core import
    // instead of CLI subprocess, so CLI argument mocking is no longer relevant.
    // See test/core/create-session.test.ts for comprehensive pure function tests.
    it.skip('should use --title flag, not --goal', async () => {
      // This test validated CLI arguments when createSession used execFileAsync.
      // Now it uses createSessionCore() directly - see lib/core tests instead.
    });

    it('should return conversational error for missing title', async () => {
      const { createSession } = await import('../../src/tools/mutations.js');
      
      const result = await createSession({ title: '' });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter \'title\'');
      expect(result.content[0].text).toContain('at least 3 characters');
    });

    it('should return conversational error for invalid topics type', async () => {
      const { createSession } = await import('../../src/tools/mutations.js');
      
      const result = await createSession({ 
        title: 'Valid Title',
        topics: 'not-an-array'
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter \'topics\'');
      expect(result.content[0].text).toContain('array of strings');
    });

    it.skip('should handle CLI execution errors', async () => {
      // This test validated execFileAsync error handling when createSession used CLI subprocess.
      // Now it uses createSessionCore() directly which handles errors via structured returns.
      // See test/core/create-session.test.ts for comprehensive error handling tests.
    });
  });

  describe('update_session', () => {
    // NOTE: These tests are SKIPPED because updateSession() now uses direct lib/core import
    // instead of CLI subprocess, so CLI mocking is no longer relevant.
    // See test/core/update-session.test.ts for comprehensive pure function tests.
    it.skip('should append section to session', async () => {
      // This test validated execFileAsync when updateSession used CLI subprocess.
      // Now it uses updateSessionCore() directly - see lib/core tests instead.
    });

    it.skip('should prepend section to session', async () => {
      // This test validated execFileAsync when updateSession used CLI subprocess.
      // Now it uses updateSessionCore() directly - see lib/core tests instead.
    });

    it('should return conversational error for invalid operation', async () => {
      const { updateSession } = await import('../../src/tools/mutations.js');
      
      const result = await updateSession({
        section: 'Test',
        content: 'Content',
        operation: 'invalid'
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter \'operation\'');
      expect(result.content[0].text).toMatch(/append|prepend|insert-after|insert-before/);
    });

    it('should return conversational error for invalid date format', async () => {
      const { updateSession } = await import('../../src/tools/mutations.js');
      
      const result = await updateSession({
        date: 'invalid-date',
        section: 'Test',
        content: 'Content',
        operation: 'append'
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter \'date\'');
      expect(result.content[0].text).toContain('YYYY-MM-DD');
    });

    it('should return conversational error for missing section', async () => {
      const { updateSession } = await import('../../src/tools/mutations.js');
      
      const result = await updateSession({
        date: '2026-02-08',
        section: '',  // Too short
        content: 'Content',
        operation: 'append'
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter \'section\'');
      expect(result.content[0].text).toContain('at least 1 character');
    });
  });

  describe('create_plan', () => {
    it('should create plan with title', async () => {
      // NOTE: createPlan now uses direct lib/core import (no CLI mock needed)
      const { createPlan } = await import('../../src/tools/mutations.js');
      const result = await createPlan({
        title: `Test Plan ${Date.now()}`
      });

      expect(result.content[0].text).toMatch(/Created plan:|Plan already exists:/);
      expect(result.content[0].text).toMatch(/PLAN_/);
    });

    it('should return conversational error for missing title', async () => {
      const { createPlan } = await import('../../src/tools/mutations.js');
      
      const result = await createPlan({ title: 'ab' });  // Too short
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter \'title\'');
      expect(result.content[0].text).toContain('at least 3 characters');
    });

    it('should return conversational error for invalid topics type', async () => {
      const { createPlan } = await import('../../src/tools/mutations.js');
      
      const result = await createPlan({
        title: 'Valid Plan Title',
        topics: 'not-an-array'
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter \'topics\'');
      expect(result.content[0].text).toContain('array of strings');
    });

    // NOTE: These tests are SKIPPED because createPlan() now uses direct lib/core import
    // instead of CLI subprocess, so CLI argument mocking is no longer relevant.
    // See test/core/create-plan.test.ts for comprehensive pure function tests.
    it.skip('should use --title flag correctly', async () => {
      // This test validated CLI arguments when createPlan used execFileAsync.
      // Now it uses createPlanCore() directly - see lib/core tests instead.
    });

    it.skip('should handle optional parameters', async () => {
      // This test validated CLI parameter handling when createPlan used execFileAsync.
      // Now it uses createPlanCore() directly - see lib/core tests instead.
    });
  });

  describe('update_plan', () => {
    // NOTE: These tests are SKIPPED because updatePlan() now uses direct lib/core import
    // instead of CLI subprocess. Integration tests would require creating real plans.
    // See test/core/update-plan.test.ts for comprehensive pure function tests.
    it.skip('should update plan with append operation', async () => {
      // This test validated CLI execution when updatePlan used execFileAsync.
      // Now it uses updatePlanCore() directly - see lib/core tests instead.
    });

    it.skip('should update plan status', async () => {
      // This test validated CLI execution when updatePlan used execFileAsync.
      // Now it uses updatePlanCore() directly - see lib/core tests instead.
    });

    it('should return conversational error for invalid planId format', async () => {
      const { updatePlan } = await import('../../src/tools/mutations.js');
      
      const result = await updatePlan({
        planId: 'invalid',
        operation: 'append',
        content: 'Test'
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter \'planId\'');
      expect(result.content[0].text).toContain('PLAN_');
    });

    it('should return conversational error for append without content', async () => {
      const { updatePlan } = await import('../../src/tools/mutations.js');
      
      const result = await updatePlan({
        planId: 'PLAN_test',
        operation: 'append'
        // Missing content
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter');
      expect(result.content[0].text).toContain('content');
    });

    it('should return conversational error for unsupported prepend operation', async () => {
      const { updatePlan } = await import('../../src/tools/mutations.js');
      
      const result = await updatePlan({
        planId: 'PLAN_test',
        operation: 'prepend'
        // Note: 'prepend' not in discriminated union - unsupported operation
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter');
      expect(result.content[0].text).toContain('operation');
    });

    it('should return conversational error for set-status without status', async () => {
      const { updatePlan } = await import('../../src/tools/mutations.js');
      
      const result = await updatePlan({
        planId: 'PLAN_test',
        operation: 'set-status'
        // Missing status
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter');
      expect(result.content[0].text).toContain('status');
    });
  });

  describe('create_review', () => {
    it('should create a review entry', async () => {
      const { createReview } = await import('../../src/tools/mutations.js');
      const result = await createReview({
        targetId: 'PLAN_test',
        content: 'Looks good',
      });

      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Review created');
      expect(mockInsertReview).toHaveBeenCalledTimes(1);
      expect(mockStorageInit).toHaveBeenCalledTimes(1);
      expect(mockStorageClose).toHaveBeenCalledTimes(1);
    });

    it('should close storage when review creation fails', async () => {
      mockInsertReview.mockRejectedValueOnce(new Error('DB locked'));

      const { createReview } = await import('../../src/tools/mutations.js');
      const result = await createReview({
        targetId: 'PLAN_test',
        content: 'Looks good',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed during createReview storage operation: DB locked');
      expect(mockStorageInit).toHaveBeenCalledTimes(1);
      expect(mockStorageClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('create_link', () => {
    it('should create a link entry', async () => {
      const { createLink } = await import('../../src/tools/mutations.js');
      const result = await createLink({
        sourceId: 'PLAN_a',
        targetId: 'PLAN_b',
        type: 'depends_on',
      });

      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Link created');
      expect(mockInsertLink).toHaveBeenCalledTimes(1);
      expect(mockStorageInit).toHaveBeenCalledTimes(1);
      expect(mockStorageClose).toHaveBeenCalledTimes(1);
    });

    it('should close storage when link creation fails', async () => {
      mockInsertLink.mockRejectedValueOnce(new Error('DB locked'));

      const { createLink } = await import('../../src/tools/mutations.js');
      const result = await createLink({
        sourceId: 'PLAN_a',
        targetId: 'PLAN_b',
        type: 'depends_on',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed during createLink storage operation: DB locked');
      expect(mockStorageInit).toHaveBeenCalledTimes(1);
      expect(mockStorageClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('check_constraints', () => {
    it('should return constraint check result', async () => {
      mockCheckConstraints.mockResolvedValue({
        allowed: false,
        blockers: ['Missing validation event'],
      });

      const { checkConstraintsTool } = await import('../../src/tools/mutations.js');
      const result = await checkConstraintsTool({
        action: 'COMPLETE_PLAN',
        targetId: 'PLAN_test',
      });

      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('"allowed": false');
      expect(mockCheckConstraints).toHaveBeenCalledTimes(1);
    });
  });
});
