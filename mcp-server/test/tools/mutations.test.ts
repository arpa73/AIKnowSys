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
    it('should create session with goal and topics', async () => {
     mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Session created: .aiknowsys/sessions/2026-02-08-session.md' 
      });

      const { createSession } = await import('../../src/tools/mutations.js');
      const result = await createSession({
        goal: 'Implement Phase 2',
        topics: ['MCP', 'tools'],
        status: 'active'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Session created');
      expect(result.content[0].text).toContain('2026-02-08-session.md');
    });

    it('should handle missing required parameters', async () => {
      const { createSession } = await import('../../src/tools/mutations.js');
      
      const result = await createSession({ goal: '' });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating session');
    });

    it('should handle CLI execution errors', async () => {
      mockExecFileAsync.mockRejectedValue(new Error('Command failed'));

      const { createSession } = await import('../../src/tools/mutations.js');
      const result = await createSession({
        goal: 'Test error',
        topics: []
      });

      expect(result.content[0].text).toContain('Error');
      expect(result.isError).toBe(true);
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
    it('should create plan with required parameters', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Plan created: .aiknowsys/PLAN_feature_x.md' 
      });

      const { createPlan } = await import('../../src/tools/mutations.js');
      const result = await createPlan({
        id: 'feature_x',
        goal: 'Implement feature X',
        type: 'feature',
        priority: 'high'
      });

      expect(result.content[0].text).toContain('Plan created');
      expect(result.content[0].text).toContain('PLAN_feature_x.md');
    });

    it('should handle optional parameters', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Plan created' });

      const { createPlan } = await import('../../src/tools/mutations.js');
      const result = await createPlan({
        id: 'simple_plan',
        goal: 'Simple goal'
      });

      expect(result.content[0].text).toContain('Plan created');
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
