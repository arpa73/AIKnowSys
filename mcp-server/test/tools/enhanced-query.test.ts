import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock child_process and util for CLI command execution (used by searchContext and findPattern)
const mockExecFileAsync = vi.fn();

// Mock fs/promises for file reading (used by getSkillByName)
const mockReadFile = vi.fn();

vi.mock('child_process', () => ({
  execFile: vi.fn()
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecFileAsync)
}));

vi.mock('fs/promises', () => ({
  default: {
    readFile: mockReadFile
  }
}));

describe('Enhanced Query Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileAsync.mockReset();
    mockReadFile.mockReset();
  });

  describe('search_context', () => {
    it('should search all context types', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '📁 Found 3 matches:\n- Session 2026-02-08: MCP server Phase 2\n- Plan PLAN_mcp_phase2: Active' 
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'MCP server',
        type: 'all'
      });

      expect(result.content[0].text).toContain('Found 3 matches');
    });

    it('should search sessions only', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '📁 Found 1 match:\n- 2026-02-08-session.md: MCP Phase 2A complete' 
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'Phase 2A',
        type: 'sessions'
      });

      expect(result.content[0].text).toContain('2026-02-08-session.md');
      // Verify correct CLI flag is used (--scope, not --type)
      expect(mockExecFileAsync).toHaveBeenCalledWith('npx', 
        ['aiknowsys', 'search-context', 'Phase 2A', '--scope', 'sessions']
      );
    });

    it('should search plans only', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '📁 Found 1 match:\n- PLAN_mcp_phase2.md: 10 new tools' 
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'tools',
        type: 'plans'
      });

      expect(result.content[0].text).toContain('PLAN_mcp_phase2.md');
    });

    it('should search learned patterns only', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '📁 Found 1 match:\n- .aiknowsys/learned/mcp-sdk-patterns.md' 
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'registerTool',
        type: 'learned'
      });

      expect(result.content[0].text).toContain('mcp-sdk-patterns.md');
    });

    it('should require query parameter', async () => {
      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({ type: 'all' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error searching context');
    });

    it('should validate type enum', async () => {
      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'test',
        type: 'invalid'
      });

      expect(result.isError).toBe(true);
    });

    it('should handle no results', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '📁 No matches found for query: nonexistent' 
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'nonexistent',
        type: 'all'
      });

      expect(result.content[0].text).toContain('No matches found');
    });
  });

  describe('find_pattern', () => {
    it('should find patterns by keywords', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '📚 Found 2 patterns:\n- mcp-sdk-patterns.md: MCP SDK v2 patterns\n- vscode-file-operations.md: VSCode conflicts' 
      });

      const { findPattern } = await import('../../src/tools/enhanced-query.js');
      const result = await findPattern({
        keywords: ['mcp', 'sdk'],
        category: 'all'
      });

      expect(result.content[0].text).toContain('Found 2 patterns');
    });

    it('should filter by category', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '📚 Found 1 pattern:\n- hook-troubleshooting.md' 
      });

      const { findPattern } = await import('../../src/tools/enhanced-query.js');
      const result = await findPattern({
        keywords: ['hook'],
        category: 'workarounds'
      });

      expect(result.content[0].text).toContain('hook-troubleshooting.md');
    });

    it('should handle no keywords', async () => {
      const { findPattern } = await import('../../src/tools/enhanced-query.js');
      const result = await findPattern({ category: 'all' });

      expect(result.isError).toBe(true);
    });

    it('should validate keywords is array', async () => {
      const { findPattern } = await import('../../src/tools/enhanced-query.js');
      const result = await findPattern({
        keywords: 'not-an-array',
        category: 'all'
      });

      expect(result.isError).toBe(true);
    });

    it('should handle no results', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '📚 No patterns found matching keywords' 
      });

      const { findPattern } = await import('../../src/tools/enhanced-query.js');
      const result = await findPattern({
        keywords: ['nonexistent'],
        category: 'all'
      });

      expect(result.content[0].text).toContain('No patterns found');
    });
  });

  describe('get_skill_by_name', () => {
    it('should get skill by exact name via file reading', async () => {
      const skillContent = '# Feature Implementation Skill\n\nUse when planning new features...';
      mockReadFile.mockResolvedValue(skillContent);

      const { getSkillByName } = await import('../../src/tools/enhanced-query.js');
      const result = await getSkillByName({
        skillName: 'feature-implementation'
      });

      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('.github/skills/feature-implementation/SKILL.md'),
        'utf-8'
      );
      expect(result.content[0].text).toContain('Feature Implementation Skill');
    });

    it('should return skill not found error when file does not exist', async () => {
      const error = new Error('ENOENT: no such file or directory');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      const { getSkillByName } = await import('../../src/tools/enhanced-query.js');
      const result = await getSkillByName({
        skillName: 'nonexistent-skill'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting skill');
    });

    it('should require skillName parameter', async () => {
      const { getSkillByName } = await import('../../src/tools/enhanced-query.js');
      const result = await getSkillByName({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting skill');
    });

    it('should validate skillName is non-empty', async () => {
      const { getSkillByName } = await import('../../src/tools/enhanced-query.js');
      const result = await getSkillByName({ skillName: '' });

      expect(result.isError).toBe(true);
    });

    it('should handle file read errors gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('Permission denied'));

      const { getSkillByName } = await import('../../src/tools/enhanced-query.js');
      const result = await getSkillByName({ skillName: 'test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting skill');
    });
  });
});
