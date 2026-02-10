import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock child_process and util for CLI command execution
const mockExecFileAsync = vi.fn();

vi.mock('child_process', () => ({
  execFile: vi.fn()
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecFileAsync)
}));

describe('Validation Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileAsync.mockReset();
  });

  describe('validate_deliverables', () => {
    it('should validate deliverables without fix flag', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ All deliverables valid\n0 errors found' 
      });

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      const result = await validateDeliverables({ fix: false });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('All deliverables valid');
    });

    it('should validate and fix deliverables when fix is true', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '✅ Fixed 3 template issues\n✅ All deliverables valid' 
      });

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      const result = await validateDeliverables({ fix: true });

      expect(result.content[0].text).toContain('Fixed 3 template issues');
    });

    it('should report validation errors', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '❌ 5 errors found:\n- Template mismatch in skill-creator/SKILL.md' 
      });

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      const result = await validateDeliverables({ fix: false });

      expect(result.content[0].text).toContain('5 errors found');
    });

    it('should handle CLI execution errors', async () => {
      mockExecFileAsync.mockRejectedValue(new Error('Command failed'));

      const { validateDeliverables } = await import('../../src/tools/validation.js');
      const result = await validateDeliverables({ fix: false });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
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
