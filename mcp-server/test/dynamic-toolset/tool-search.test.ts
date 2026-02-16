import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../../src/dynamic-toolset/tool-registry.js';
import { ToolSearch } from '../../src/dynamic-toolset/tool-search.js';
import { z } from 'zod';
import type { ToolMetadata } from '../../src/dynamic-toolset/tool-registry.js';

describe('ToolSearch', () => {
  let registry: ToolRegistry;
  let search: ToolSearch;

  beforeEach(() => {
    registry = new ToolRegistry();
    search = new ToolSearch(registry);

    // Register sample tools for search tests
    const sampleTools: ToolMetadata[] = [
      {
        name: 'query_sessions_sqlite',
        description: 'Query sessions from SQLite database with filters',
        category: 'sqlite',
        tags: ['sessions', 'sqlite', 'database', 'fast'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      },
      {
        name: 'create_session',
        description: 'Create a new session file with metadata',
        category: 'mutation',
        tags: ['sessions', 'create', 'new'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      },
      {
        name: 'get_critical_invariants',
        description: 'Returns 8 critical invariants',
        category: 'context',
        tags: ['rules', 'invariants', 'mandatory'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      },
      {
        name: 'query_plans_sqlite',
        description: 'Query plans from SQLite database',
        category: 'sqlite',
        tags: ['plans', 'sqlite', 'database', 'fast'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      },
      {
        name: 'validate_deliverables',
        description: 'Validate template files match non-template equivalents',
        category: 'validation',
        tags: ['templates', 'validate', 'consistency'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      },
    ];

    sampleTools.forEach((tool) => registry.register(tool));
  });

  describe('search', () => {
    it('should find tools by keyword', () => {
      const results = search.search('session');
      const names = results.map((r) => r.name);

      expect(names).toContain('query_sessions_sqlite');
      expect(names).toContain('create_session');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by category using category: prefix', () => {
      const results = search.search('category:sqlite');
      const categories = results.map((r) => r.category);

      expect(categories.every((c) => c === 'sqlite')).toBe(true);
      expect(results.length).toBe(2); // query_sessions_sqlite, query_plans_sqlite
    });

    it('should filter by tags option', () => {
      const results = search.search('query', { tags: ['sqlite'] });
      const names = results.map((r) => r.name);

      expect(names).toContain('query_sessions_sqlite');
      expect(names).toContain('query_plans_sqlite');
      expect(results.length).toBe(2);
    });

    it('should limit results when limit option provided', () => {
      const results = search.search('sqlite', { limit: 1 });
      expect(results.length).toBe(1);
    });

    it('should return all results when no limit specified', () => {
      const results = search.search('sqlite');
      expect(results.length).toBe(2); // query_sessions_sqlite, query_plans_sqlite
    });

    it('should rank results by relevance', () => {
      const results = search.search('session');

      // Tools with "session" in name should rank higher
      expect(results[0].name).toMatch(/session/);
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should handle empty query gracefully', () => {
      const results = search.search('');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return empty array for no matches', () => {
      const results = search.search('nonexistent_keyword_xyz');
      expect(results).toEqual([]);
    });

    it('should combine tag filter with keyword search', () => {
      const results = search.search('database', { tags: ['sqlite'] });
      expect(results.length).toBe(2); // Both SQLite tools have 'database' tag
      expect(results.every((r) => r.tags.includes('sqlite'))).toBe(true);
    });
  });

  describe('searchInCategory', () => {
    it('should return all tools in category when no keywords provided', () => {
      const results = search.searchInCategory('sqlite');
      expect(results.length).toBe(2);
      expect(results.every((r) => r.category === 'sqlite')).toBe(true);
    });

    it('should filter by keywords within category', () => {
      const results = search.searchInCategory('sqlite', 'sessions');
      const names = results.map((r) => r.name);

      expect(names).toContain('query_sessions_sqlite');
      expect(names).not.toContain('query_plans_sqlite');
      expect(results.length).toBe(1);
    });

    it('should handle category with no tools', () => {
      const results = search.searchInCategory('nonexistent');
      expect(results).toEqual([]);
    });

    it('should be case-insensitive for keywords', () => {
      const results1 = search.searchInCategory('sqlite', 'SESSIONS');
      const results2 = search.searchInCategory('sqlite', 'sessions');

      expect(results1.length).toBe(results2.length);
      expect(results1.map((r) => r.name)).toEqual(results2.map((r) => r.name));
    });

    it('should match keywords in description', () => {
      const results = search.searchInCategory('validation', 'template');
      const names = results.map((r) => r.name);

      expect(names).toContain('validate_deliverables');
    });

    it('should match keywords in tags', () => {
      const results = search.searchInCategory('validation', 'consistency');
      const names = results.map((r) => r.name);

      expect(names).toContain('validate_deliverables');
    });
  });

  describe('getAvailableCategories', () => {
    it('should return categories overview', () => {
      const overview = search.getAvailableCategories();

      expect(overview).toContain('context');
      expect(overview).toContain('sqlite');
      expect(overview).toContain('mutation');
      expect(overview).toContain('validation');
    });

    it('should include tool counts', () => {
      const overview = search.getAvailableCategories();

      // Should show counts for each category
      expect(overview).toMatch(/sqlite.*2/); // 2 SQLite tools
      expect(overview).toMatch(/context.*1/); // 1 context tool
      expect(overview).toMatch(/mutation.*1/); // 1 mutation tool
      expect(overview).toMatch(/validation.*1/); // 1 validation tool
    });

    it('should handle empty registry', () => {
      const emptyRegistry = new ToolRegistry();
      const emptySearch = new ToolSearch(emptyRegistry);
      const overview = emptySearch.getAvailableCategories();

      expect(overview).toBeTruthy();
      expect(typeof overview).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in query', () => {
      const results = search.search('session_sqlite');
      expect(Array.isArray(results)).toBe(true);
      // May or may not match, but shouldn't throw
    });

    it('should handle very long queries', () => {
      const longQuery = 'session '.repeat(100);
      const results = search.search(longQuery);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle limit of 0', () => {
      const results = search.search('sqlite', { limit: 0 });
      expect(results.length).toBe(2); // limit of 0 means "no limit"
    });

    it('should handle negative limit gracefully', () => {
      const results = search.search('sqlite', { limit: -5 });
      expect(results.length).toBe(2); // negative limit ignored
    });
  });
});
