import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fs/promises for file reading (used by getSkillByName)
const mockReadFile = vi.fn();

// Mock searchContextCore (used by searchContext)
vi.mock('../../../lib/core/search-context.js', () => ({
  searchContextCore: vi.fn()
}));

vi.mock('fs/promises', () => ({
  default: {
    readFile: mockReadFile
  }
}));

// Import after mocking
import { searchContextCore } from '../../../lib/core/search-context.js';

describe('Enhanced Query Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockReset();
  });

  describe('search_context', () => {
    it('should search all context types', async () => {
      vi.mocked(searchContextCore).mockResolvedValue({
        query: 'MCP server',
        scope: 'all',
        count: 3,
        matches: [
          { type: 'session', context: 'MCP server Phase 2', file: '2026-02-08-session.md', relevance: 10 },
          { type: 'plan', context: 'MCP Phase 2 Active', file: 'PLAN_mcp_phase2.md', relevance: 9 }
        ]
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'MCP server',
        type: 'all'
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(3);
      expect(data.query).toBe('MCP server');
    });

    it('should search sessions only', async () => {
      vi.mocked(searchContextCore).mockResolvedValue({
        query: 'Phase 2A',
        scope: 'sessions',
        count: 1,
        matches: [
          { type: 'session', context: 'MCP Phase 2A complete', file: '2026-02-08-session.md', relevance: 10 }
        ]
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'Phase 2A',
        type: 'sessions'
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(1);
      expect(data.scope).toBe('sessions');
      // Verify searchContextCore was called with correct parameters
      expect(searchContextCore).toHaveBeenCalledWith('Phase 2A', { scope: 'sessions' });
    });

    it('should search plans only', async () => {
      vi.mocked(searchContextCore).mockResolvedValue({
        query: 'tools',
        scope: 'plans',
        count: 1,
        matches: [
          { type: 'plan', context: '10 new tools', file: 'PLAN_mcp_phase2.md', relevance: 10 }
        ]
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'tools',
        type: 'plans'
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(1);
      expect(data.scope).toBe('plans');
    });

    it('should search learned patterns only', async () => {
      vi.mocked(searchContextCore).mockResolvedValue({
        query: 'registerTool',
        scope: 'learned',
        count: 1,
        matches: [
          { type: 'learned', context: 'MCP SDK patterns', file: '.aiknowsys/learned/mcp-sdk-patterns.md', relevance: 10 }
        ]
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'registerTool',
        type: 'learned'
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(1);
      expect(data.scope).toBe('learned');
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
      vi.mocked(searchContextCore).mockResolvedValue({
        query: 'nonexistent',
        scope: 'all',
        count: 0,
        matches: []
      });

      const { searchContext } = await import('../../src/tools/enhanced-query.js');
      const result = await searchContext({
        query: 'nonexistent',
        type: 'all'
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(0);
      expect(data.matches).toEqual([]);
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
