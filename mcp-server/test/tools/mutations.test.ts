import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a mock for the promisified execFile
const mockExecFileAsync = vi.fn();

// Mock child_process
vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

// Mock util.promisify to return our mock
vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecFileAsync),
}));

describe('Mutation Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileAsync.mockReset();
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

    it('should return conversational error for prepend without content', async () => {
      const { updatePlan } = await import('../../src/tools/mutations.js');
      
      const result = await updatePlan({
        planId: 'PLAN_test',
        operation: 'prepend'
        // Missing content
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameter');
      expect(result.content[0].text).toContain('content');
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
});
