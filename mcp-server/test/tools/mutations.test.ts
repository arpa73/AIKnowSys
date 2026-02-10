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

    it('should handle missing required parameters', async () => {
      const { createSession } = await import('../../src/tools/mutations.js');
      
      const result = await createSession({ title: '' });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating session');
    });

    it.skip('should handle CLI execution errors', async () => {
      // This test validated execFileAsync error handling when createSession used CLI subprocess.
      // Now it uses createSessionCore() directly which handles errors via structured returns.
      // See test/core/create-session.test.ts for comprehensive error handling tests.
    });
  });

  describe('update_session', () => {
    it('should append section to session', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Session Updated' 
      });

      const { updateSession } = await import('../../src/tools/mutations.js');
      const result = await updateSession({
        date: '2026-02-08',
        section: 'Progress',
        content: 'Completed Phase 2',
        operation: 'append'
      });

      expect(result.content[0].text).toContain('Session Updated');
    });

    it('should prepend section to session', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Session Updated' });

      const { updateSession } = await import('../../src/tools/mutations.js');
      const result = await updateSession({
        section: 'Critical Issue',
        content: 'Bug found',
        operation: 'prepend'
      });

      expect(result.content[0].text).toContain('Session Updated');
    });

    it('should validate operation parameter', async () => {
      const { updateSession } = await import('../../src/tools/mutations.js');
      
      const result = await updateSession({
        section: 'Test',
        content: 'Content',
        operation: 'invalid'
      });
      
      expect(result.isError).toBe(true);
    });

    it('should validate date format (YYYY-MM-DD)', async () => {
      const { updateSession } = await import('../../src/tools/mutations.js');
      
      const result = await updateSession({
        date: 'invalid-date',
        section: 'Test',
        content: 'Content',
        operation: 'append'
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid date format');
    });

    it('should reject malformed dates', async () => {
      const { updateSession } = await import('../../src/tools/mutations.js');
      
      const result = await updateSession({
        date: '2026-13-45',  // Invalid month and day
        section: 'Test',
        content: 'Content',
        operation: 'append'
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating session');
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
    it('should update plan with append operation', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Plan updated' });

      const { updatePlan } = await import('../../src/tools/mutations.js');
      const result = await updatePlan({
        planId: 'PLAN_feature_x',
        operation: 'append',
        content: 'Progress update'
      });

      expect(result.content[0].text).toContain('Plan updated');
    });

    it('should update plan status', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Plan updated' });

      const { updatePlan } = await import('../../src/tools/mutations.js');
      const result = await updatePlan({
        planId: 'PLAN_feature_x',
        operation: 'set-status',
        status: 'COMPLETE'
      });

      expect(result.content[0].text).toContain('Plan updated');
    });

    it('should validate planId format', async () => {
      const { updatePlan } = await import('../../src/tools/mutations.js');
      
      const result = await updatePlan({
        planId: 'invalid',
        operation: 'append',
        content: 'Test'
      });
      
      expect(result.isError).toBe(true);
    });

    it('should reject append operation without content', async () => {
      const { updatePlan } = await import('../../src/tools/mutations.js');
      
      const result = await updatePlan({
        planId: 'PLAN_test',
        operation: 'append'
        // Missing content
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating plan');
    });

    it('should reject prepend operation without content', async () => {
      const { updatePlan } = await import('../../src/tools/mutations.js');
      
      const result = await updatePlan({
        planId: 'PLAN_test',
        operation: 'prepend'
        // Missing content
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating plan');
    });

    it('should reject set-status operation without status', async () => {
      const { updatePlan } = await import('../../src/tools/mutations.js');
      
      const result = await updatePlan({
        planId: 'PLAN_test',
        operation: 'set-status'
        // Missing status
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating plan');
    });
  });
});
