import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../../src/dynamic-toolset/tool-registry.js';
import { z } from 'zod';
import type { ToolMetadata } from '../../src/dynamic-toolset/tool-registry.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('register', () => {
    it('should register tools with metadata', () => {
      const tool: ToolMetadata = {
        name: 'test_tool',
        description: 'A test tool for unit tests',
        category: 'context',
        tags: ['test', 'example'],
        inputSchema: z.object({
          query: z.string(),
        }),
        handler: async () => ({ success: true }),
      };

      registry.register(tool);
      const retrieved = registry.get('test_tool');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test_tool');
      expect(retrieved?.category).toBe('context');
      expect(retrieved?.tags).toEqual(['test', 'example']);
    });

    it('should update existing tool when registered again', () => {
      const tool1: ToolMetadata = {
        name: 'test_tool',
        description: 'First version',
        category: 'context',
        tags: ['v1'],
        inputSchema: z.object({}),
        handler: async () => ({ v: 1 }),
      };

      const tool2: ToolMetadata = {
        name: 'test_tool',
        description: 'Second version',
        category: 'query',
        tags: ['v2'],
        inputSchema: z.object({}),
        handler: async () => ({ v: 2 }),
      };

      registry.register(tool1);
      registry.register(tool2);

      const retrieved = registry.get('test_tool');
      expect(retrieved?.description).toBe('Second version');
      expect(retrieved?.category).toBe('query');
    });
  });

  describe('get', () => {
    it('should retrieve tool by exact name', () => {
      const tool: ToolMetadata = {
        name: 'get_critical_invariants',
        description: 'Returns critical invariants',
        category: 'context',
        tags: ['rules', 'invariants'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      };

      registry.register(tool);
      const retrieved = registry.get('get_critical_invariants');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('get_critical_invariants');
    });

    it('should handle missing tools gracefully', () => {
      const retrieved = registry.get('nonexistent_tool');
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const retrieved = registry.get('');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('search', () => {
    beforeEach(() => {
      // Register sample tools for search tests
      registry.register({
        name: 'query_sessions_sqlite',
        description: 'Query sessions from SQLite database with filters',
        category: 'query',
        tags: ['sessions', 'sqlite', 'database'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      });

      registry.register({
        name: 'create_session',
        description: 'Create a new session file with metadata',
        category: 'mutation',
        tags: ['sessions', 'create'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      });

      registry.register({
        name: 'get_critical_invariants',
        description: 'Returns 8 critical invariants',
        category: 'context',
        tags: ['rules', 'invariants'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      });

      registry.register({
        name: 'query_plans_sqlite',
        description: 'Query plans from SQLite database',
        category: 'query',
        tags: ['plans', 'sqlite', 'database'],
        inputSchema: z.object({}),
        handler: async () => ({}),
      });
    });

    it('should search tools by keywords', () => {
      const results = registry.search('session query');
      const names = results.map((r) => r.name);

      expect(names).toContain('query_sessions_sqlite');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by category using category: prefix', () => {
      const results = registry.search('category:query');
      const categories = results.map((r) => r.category);

      expect(categories.every((c) => c === 'query')).toBe(true);
      expect(results.length).toBe(2); // query_sessions_sqlite, query_plans_sqlite
    });

    it('should filter by tags', () => {
      const results = registry.search('sessions', { tags: ['sqlite'] });
      const names = results.map((r) => r.name);

      expect(names).toContain('query_sessions_sqlite');
      expect(names).not.toContain('create_session'); // doesn't have sqlite tag
    });

    it('should return empty array for no matches', () => {
      const results = registry.search('nonexistent_keyword_xyz');
      expect(results).toEqual([]);
    });

    it('should rank results by relevance', () => {
      const results = registry.search('session');

      // Tools with "session" in name should rank higher than just description/tags
      expect(results[0].name).toMatch(/session/);
    });

    it('should handle empty query string', () => {
      const results = registry.search('');
      // Should return all tools or empty array, not throw
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCategoriesOverview', () => {
    beforeEach(() => {
      registry.register({
        name: 'tool1',
        description: 'Test',
        category: 'context',
        tags: [],
        inputSchema: z.object({}),
        handler: async () => ({}),
      });

      registry.register({
        name: 'tool2',
        description: 'Test',
        category: 'query',
        tags: [],
        inputSchema: z.object({}),
        handler: async () => ({}),
      });

      registry.register({
        name: 'tool3',
        description: 'Test',
        category: 'query',
        tags: [],
        inputSchema: z.object({}),
        handler: async () => ({}),
      });
    });

    it('should return tool categories overview', () => {
      const overview = registry.getCategoriesOverview();

      expect(overview).toContain('context');
      expect(overview).toContain('query');
      expect(overview).toMatch(/context.*1/); // 1 tool in context
      expect(overview).toMatch(/query.*2/); // 2 tools in query
    });

    it('should return empty message for empty registry', () => {
      const emptyRegistry = new ToolRegistry();
      const overview = emptyRegistry.getCategoriesOverview();

      expect(overview).toBeTruthy();
      expect(typeof overview).toBe('string');
    });
  });

  describe('getAllTools', () => {
    it('should return all registered tools', () => {
      registry.register({
        name: 'tool1',
        description: 'Test',
        category: 'context',
        tags: [],
        inputSchema: z.object({}),
        handler: async () => ({}),
      });

      registry.register({
        name: 'tool2',
        description: 'Test',
        category: 'query',
        tags: [],
        inputSchema: z.object({}),
        handler: async () => ({}),
      });

      const all = registry.getAllTools();
      expect(all.length).toBe(2);
      expect(all.map((t) => t.name)).toEqual(['tool1', 'tool2']);
    });

    it('should return empty array for empty registry', () => {
      const all = registry.getAllTools();
      expect(all).toEqual([]);
    });
  });
});
