import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock child_process and util for CLI command execution
const mockExecFileAsync = vi.fn();

vi.mock('child_process', () => ({
  execFile: vi.fn()
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecFileAsync)
}));

describe('Enhanced Query Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileAsync.mockReset();
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
    it('should get skill by exact name', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '📖 Skill: feature-implementation\n\n# Feature Implementation Skill\n\nUse when...' 
      });

      const { getSkillByName } = await import('../../src/tools/enhanced-query.js');
      const result = await getSkillByName({
        skillName: 'feature-implementation'
      });

      expect(result.content[0].text).toContain('feature-implementation');
      expect(result.content[0].text).toContain('Use when');
    });

    it('should return skill not found error', async () => {
      mockExecFileAsync.mockResolvedValue({ 
        stdout: '❌ Skill not found: nonexistent-skill' 
      });

      const { getSkillByName } = await import('../../src/tools/enhanced-query.js');
      const result = await getSkillByName({
        skillName: 'nonexistent-skill'
      });

      expect(result.content[0].text).toContain('Skill not found');
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

    it('should handle CLI execution errors', async () => {
      mockExecFileAsync.mockRejectedValue(new Error('Command failed'));

      const { getSkillByName } = await import('../../src/tools/enhanced-query.js');
      const result = await getSkillByName({ skillName: 'test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });
});
