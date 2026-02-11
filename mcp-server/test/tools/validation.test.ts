import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the core validation function (Phase 2 Batch 3: direct import, no subprocess)
vi.mock('../../../lib/core/validate-deliverables.js', () => ({
  validateDeliverablesCore: vi.fn(),
}));

// Mock child_process for other tools (checkTddCompliance, validateSkill still use subprocess)
const mockExecFileAsync = vi.fn();

vi.mock('child_process', () => ({
  execFile: vi.fn()
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecFileAsync)
}));

import { validateDeliverablesCore } from '../../../lib/core/validate-deliverables.js';

describe('Validation Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileAsync.mockReset();
  });

  describe('validate_deliverables - Phase 2 Batch 3 Direct Core Import', () => {
    it('should validate deliverables without fix flag', async () => {
      const mockResult = {
        passed: true,
        checks: [
          { name: 'Template Schema', passed: true, issues: [] },
          { name: 'Pattern Consistency', passed: true, issues: [] }
        ],
        summary: 'All deliverables valid',
        exitCode: 0,
        metrics: { templatesChecked: 10, patternsValidated: 5, duration: 123 }
      };
      
      vi.mocked(validateDeliverablesCore).mockResolvedValue(mockResult);

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      const result = await validateDeliverables({ fix: false });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const data = JSON.parse(result.content[0].text);
      expect(data.passed).toBe(true);
      expect(data.summary).toContain('All deliverables valid');
      expect(data.metrics).toEqual({ templatesChecked: 10, patternsValidated: 5, duration: 123 });
    });

    it('should validate and fix deliverables when fix is true', async () => {
      const mockResult = {
        passed: true,
        checks: [
          { name: 'Template Schema', passed: true, issues: [] },
          { name: 'Legacy Patterns', passed: true, issues: [] }
        ],
        summary: 'All deliverables valid',
        exitCode: 0,
        fixed: ['Fixed patterns in .github/agents/architect.agent.md'],
        metrics: { templatesChecked: 10, patternsValidated: 5, duration: 156 }
      };
      
      vi.mocked(validateDeliverablesCore).mockResolvedValue(mockResult);

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      const result = await validateDeliverables({ fix: true });

      const data = JSON.parse(result.content[0].text);
      expect(data.passed).toBe(true);
      expect(data.fixed).toContain('Fixed patterns in .github/agents/architect.agent.md');
    });

    it('should report validation errors', async () => {
      const mockResult = {
        passed: false,
        checks: [
          { name: 'Template Schema', passed: false, issues: ['Template mismatch in skill-creator/SKILL.md'] },
          { name: 'Pattern Consistency', passed: true, issues: [] }
        ],
        summary: 'Validation failed: 1 error found',
        exitCode: 1,
        metrics: { templatesChecked: 10, patternsValidated: 5, duration: 145 }
      };
      
      vi.mocked(validateDeliverablesCore).mockResolvedValue(mockResult);

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      const result = await validateDeliverables({ fix: false });

      const data = JSON.parse(result.content[0].text);
      expect(data.passed).toBe(false);
      expect(data.checks[0].issues).toContain('Template mismatch in skill-creator/SKILL.md');
    });

    it('should call validateDeliverablesCore with correct options', async () => {
      vi.mocked(validateDeliverablesCore).mockResolvedValue({
        passed: true,
        checks: [],
        summary: 'All valid',
        exitCode: 0
      });

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      await validateDeliverables({ fix: true });

      expect(validateDeliverablesCore).toHaveBeenCalledWith(
        expect.objectContaining({
          fix: true,
          projectRoot: expect.any(String)
        })
      );
    });

    it('should handle core function errors gracefully', async () => {
      vi.mocked(validateDeliverablesCore).mockRejectedValue(new Error('Template parsing failed'));

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      const result = await validateDeliverables({ fix: false });

      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBe(true);
      expect(data.message).toContain('Template parsing failed');
    });

    it('should return MCP-compliant response format', async () => {
      vi.mocked(validateDeliverablesCore).mockResolvedValue({
        passed: true,
        checks: [],
        summary: 'All valid',
        exitCode: 0
      });

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      const result = await validateDeliverables({ fix: false });

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
      
      // Verify JSON structure
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveProperty('passed');
      expect(data).toHaveProperty('checks');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('exitCode');
    });

    it('should validate parameter schema', async () => {
      vi.mocked(validateDeliverablesCore).mockResolvedValue({
        passed: true,
        checks: [],
        summary: 'Valid',
        exitCode: 0
      });

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      
      // Valid parameter (boolean)
      await validateDeliverables({ fix: true });
      expect(validateDeliverablesCore).toHaveBeenCalled();

      // Should use default (false) if not provided
      vi.clearAllMocks();
      await validateDeliverables({});
      expect(validateDeliverablesCore).toHaveBeenCalledWith(
        expect.objectContaining({
          fix: false
        })
      );
    });
  });

  describe('check_tdd_compliance', () => {
    it('should check TDD compliance for changed files', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ TDD compliant: All modified files have corresponding tests' 
      });

      const { checkTddCompliance } = await import('../../src/tools/validation.js');
      const result = await checkTddCompliance({
        changedFiles: ['lib/commands/update-session.ts']
      });

      expect(result.content[0].text).toContain('TDD compliant');
    });

    it('should report TDD violations', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '❌ TDD violation:\n- lib/utils/parser.ts modified without test file' 
      });

      const { checkTddCompliance } = await import('../../src/tools/validation.js');
      const result = await checkTddCompliance({
        changedFiles: ['lib/utils/parser.ts']
      });

      expect(result.content[0].text).toContain('TDD violation');
      expect(result.content[0].text).toContain('without test file');
    });

    it('should handle empty file list', async () => {
      const { checkTddCompliance } = await import('../../src/tools/validation.js');
      const result = await checkTddCompliance({ changedFiles: [] });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error checking TDD compliance');
    });

    it('should validate changedFiles is array', async () => {
      const { checkTddCompliance } = await import('../../src/tools/validation.js');
      const result = await checkTddCompliance({ changedFiles: 'not-an-array' });

      expect(result.isError).toBe(true);
    });
  });

  describe('validate_skill', () => {
    it('should validate all skills (skill validation is global)', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ All skills valid\n10 skills checked' 
      });

      const { validateSkill } = await import('../../src/tools/validation.js');
      const result = await validateSkill({
        skillPath: '.github/skills/feature-implementation/SKILL.md'
      });

      expect(result.content[0].text).toContain('skills');
      // Note: Validates ALL skills, not individual file
      // skillPath parameter is accepted but not used (validates all)
    });

    it('should use --type skills flag only', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '✅ All skills valid' });

      const { validateSkill } = await import('../../src/tools/validation.js');
      await validateSkill({
        skillPath: '.github/skills/tdd-workflow/SKILL.md'
      });

      // Verify correct CLI arguments (NO --file flag)
      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'aiknowsys',
          'validate',
          '--type', 'skills'
        ]),
        expect.anything()  // Accept cwd options object
      );
      
      // Verify --file is NOT used (doesn't exist in CLI)
      const callArgs = mockExecFileAsync.mock.calls[0][1];
      expect(callArgs).not.toContain('--file');
    });

    it('should report skill validation errors', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '❌ Skill validation failed:\n- Missing YAML frontmatter\n- No trigger_words field' 
      });

      const { validateSkill } = await import('../../src/tools/validation.js');
      const result = await validateSkill({
        skillPath: '.github/skills/broken-skill/SKILL.md'
      });

      expect(result.content[0].text).toContain('validation failed');
      expect(result.content[0].text).toContain('Missing YAML frontmatter');
    });

    it('should require skillPath parameter (even if not used)', async () => {
      const { validateSkill } = await import('../../src/tools/validation.js');
      const result = await validateSkill({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error validating skill');
    });

    it('should validate path format', async () => {
      const { validateSkill } = await import('../../src/tools/validation.js');
      const result = await validateSkill({ skillPath: '' });

      expect(result.isError).toBe(true);
    });
  });
});
