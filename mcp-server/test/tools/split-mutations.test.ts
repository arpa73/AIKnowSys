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

const mockCheckConstraints = vi.fn();

vi.mock('../../../lib/core/constraints.js', () => ({
  checkConstraints: (...args: unknown[]) => mockCheckConstraints(...args),
}));

describe('Split Plan Mutation Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileAsync.mockReset();
    mockCheckConstraints.mockResolvedValue({ allowed: true, blockers: [] });
  });

  describe('set_plan_status', () => {
    it('should set plan status to COMPLETE', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Plan Updated\n📝 Changes: • Status: ACTIVE → COMPLETE' 
      });

      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      const result = await setPlanStatus({
        planId: 'PLAN_feature_x',
        status: 'COMPLETE'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Plan Updated');
      expect(result.content[0].text).toContain('COMPLETE');
      expect(mockCheckConstraints).toHaveBeenCalledWith('COMPLETE_PLAN', expect.objectContaining({
        targetId: 'PLAN_feature_x'
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
      expect(mockExecFileAsync).not.toHaveBeenCalled();
    });

    it('should check CANCEL_PLAN constraints when setting status to CANCELLED', async () => {
      mockExecFileAsync.mockResolvedValue({
        stdout: '✅ Plan Updated\n📝 Changes: • Status: ACTIVE → CANCELLED'
      });

      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      const result = await setPlanStatus({
        planId: 'PLAN_feature_x',
        status: 'CANCELLED'
      });

      expect(result.isError).not.toBe(true);
      expect(mockCheckConstraints).toHaveBeenCalledWith('CANCEL_PLAN', expect.objectContaining({
        targetId: 'PLAN_feature_x'
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
      expect(mockExecFileAsync).not.toHaveBeenCalled();
    });

    it('should use correct CLI arguments', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Plan Updated' });

      const { setPlanStatus } = await import('../../src/tools/split-mutations.js');
      await setPlanStatus({
        planId: 'PLAN_test',
        status: 'ACTIVE'
      });

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'aiknowsys',
          'update-plan',
          'PLAN_test',
          '--set-status',
          'ACTIVE'
        ]),
        expect.anything()
      );
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
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Plan Updated\n📝 Changes: • Appended progress note' 
      });

      const { appendToPlan } = await import('../../src/tools/split-mutations.js');
      const result = await appendToPlan({
        planId: 'PLAN_feature_x',
        content: 'Phase 1 complete'
      });

      expect(result.content[0].text).toContain('Plan Updated');
    });

    it('should use correct CLI arguments', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Plan Updated' });

      const { appendToPlan } = await import('../../src/tools/split-mutations.js');
      await appendToPlan({
        planId: 'PLAN_test',
        content: 'Progress note'
      });

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'aiknowsys',
          'update-plan',
          'PLAN_test',
          '--append',
          'Progress note'
        ]),
        expect.anything()
      );
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
  });

  describe('prepend_to_plan', () => {
    it('should prepend content to plan', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Plan Updated\n📝 Changes: • Prepended critical update' 
      });

      const { prependToPlan } = await import('../../src/tools/split-mutations.js');
      const result = await prependToPlan({
        planId: 'PLAN_feature_x',
        content: '⚠️ Blocker found: API rate limit'
      });

      expect(result.content[0].text).toContain('Plan Updated');
    });

    it('should use correct CLI arguments', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Plan Updated' });

      const { prependToPlan } = await import('../../src/tools/split-mutations.js');
      await prependToPlan({
        planId: 'PLAN_test',
        content: 'Critical update'
      });

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'aiknowsys',
          'update-plan',
          'PLAN_test',
          '--prepend',
          'Critical update'
        ]),
        expect.anything()
      );
    });
  });
});

describe('Split Session Mutation Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileAsync.mockReset();
  });

  describe('append_to_session', () => {
    it('should append to session section', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Session Updated' 
      });

      const { appendToSession } = await import('../../src/tools/split-mutations.js');
      const result = await appendToSession({
        section: '## Progress',
        content: 'Completed Phase 2'
      });

      expect(result.content[0].text).toContain('Session Updated');
    });

    it('should use correct CLI arguments', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Session Updated' });

      const { appendToSession } = await import('../../src/tools/split-mutations.js');
      await appendToSession({
        section: '## Changes',
        content: 'Fixed bug X'
      });

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'aiknowsys',
          'update-session',
          '--append-section',
          '## Changes',
          '--content',
          'Fixed bug X'
        ]),
        expect.anything()
      );
    });

    it('should support optional date parameter', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Session Updated' });

      const { appendToSession } = await import('../../src/tools/split-mutations.js');
      await appendToSession({
        date: '2026-02-09',
        section: '## Progress',
        content: 'Yesterday update'
      });

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'aiknowsys',
          'update-session',
          '--date',
          '2026-02-09'
        ]),
        expect.anything()
      );
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
  });

  describe('prepend_to_session', () => {
    it('should prepend to session section', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Session Updated' 
      });

      const { prependToSession } = await import('../../src/tools/split-mutations.js');
      const result = await prependToSession({
        section: '## Critical Issue',
        content: 'Security vulnerability found'
      });

      expect(result.content[0].text).toContain('Session Updated');
    });

    it('should use correct CLI arguments', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Session Updated' });

      const { prependToSession } = await import('../../src/tools/split-mutations.js');
      await prependToSession({
        section: '## Blocker',
        content: 'Deployment failed'
      });

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'aiknowsys',
          'update-session',
          '--prepend-section',
          '## Blocker',
          '--content',
          'Deployment failed'
        ]),
        expect.anything()
      );
    });
  });

  describe('insert_after_section', () => {
    it('should insert section after pattern', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Session Updated' 
      });

      const { insertAfterSection } = await import('../../src/tools/split-mutations.js');
      const result = await insertAfterSection({
        pattern: '## Goal',
        section: '## Progress',
        content: 'Step 1 complete'
      });

      expect(result.content[0].text).toContain('Session Updated');
    });

    it('should use correct CLI arguments', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Session Updated' });

      const { insertAfterSection } = await import('../../src/tools/split-mutations.js');
      await insertAfterSection({
        pattern: '## Goal',
        section: '## Implementation',
        content: 'Phase 1 steps'
      });

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'aiknowsys',
          'update-session',
          '--insert-after',
          '## Goal',
          '--append-section',
          '## Implementation',
          '--content',
          'Phase 1 steps'
        ]),
        expect.anything()
      );
    });

    it('should use default section title if not provided', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Session Updated' });

      const { insertAfterSection } = await import('../../src/tools/split-mutations.js');
      await insertAfterSection({
        pattern: '## Goal',
        content: 'Update'
      });

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          '--append-section',
          '## Update'
        ]),
        expect.anything()
      );
    });
  });

  describe('insert_before_section', () => {
    it('should insert section before pattern', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Session Updated' 
      });

      const { insertBeforeSection } = await import('../../src/tools/split-mutations.js');
      const result = await insertBeforeSection({
        pattern: '## Next Steps',
        section: '## Validation',
        content: 'All tests passing'
      });

      expect(result.content[0].text).toContain('Session Updated');
    });

    it('should use correct CLI arguments', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ Session Updated' });

      const { insertBeforeSection } = await import('../../src/tools/split-mutations.js');
      await insertBeforeSection({
        pattern: '## Complete',
        section: '## Testing',
        content: '15 tests added'
      });

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'aiknowsys',
          'update-session',
          '--insert-before',
          '## Complete',
          '--append-section',
          '## Testing',
          '--content',
          '15 tests added'
        ]),
        expect.anything()
      );
    });
  });
});
