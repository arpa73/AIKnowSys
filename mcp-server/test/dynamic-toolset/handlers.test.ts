import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../../src/dynamic-toolset/tool-registry.js';
import { TOOL_METADATA } from '../../src/dynamic-toolset/tool-metadata.js';
import {
  searchToolsHandler,
  describeToolsHandler,
  executeToolHandler,
} from '../../src/dynamic-toolset/handlers.js';

describe('Dynamic Toolset Handlers', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    // Fresh registry for each test
    registry = new ToolRegistry();
    TOOL_METADATA.forEach((tool) => registry.register(tool));
  });

  describe('searchToolsHandler', () => {
    it('should return tools matching query', async () => {
      const response = await searchToolsHandler(registry, {
        query: 'sessions',
        limit: 5,
      });

      expect(response.content).toBeDefined();
      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.tools.length).toBeLessThanOrEqual(5);
      expect(result.total_found).toBeGreaterThan(0);
    });

    it('should include tool metadata in results', async () => {
      const response = await searchToolsHandler(registry, {
        query: 'query_sessions_sqlite',
        limit: 1,
      });

      expect(response.content).toBeDefined();
      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools[0]).toHaveProperty('name');
      expect(result.tools[0]).toHaveProperty('description');
      expect(result.tools[0]).toHaveProperty('category');
      expect(result.tools[0]).toHaveProperty('relevance_score');
      expect(result.tools[0].name).toBe('query_sessions_sqlite');
    });

    it('should include categories overview', async () => {
      const response = await searchToolsHandler(registry, {
        query: 'plans',
        limit: 5,
      });

      expect(response.content).toBeDefined();
      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.categories_overview).toBeDefined();
      expect(result.categories_overview).toContain('context');
      expect(result.categories_overview).toContain('query');
    });

    it('should handle tag filters', async () => {
      const response = await searchToolsHandler(registry, {
        query: 'sessions',
        tags: ['sqlite'],
        limit: 10,
      });

      expect(response.content).toBeDefined();
      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools).toBeDefined();
      
      // All results should have 'sqlite' tag
      result.tools.forEach((tool: any) => {
        const metadata = registry.get(tool.name);
        expect(metadata?.tags).toContain('sqlite');
      });
    });

    it('should limit results to specified limit', async () => {
      const response = await searchToolsHandler(registry, {
        query: 'query',
        limit: 3,
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools.length).toBeLessThanOrEqual(3);
    });

    it('should default to limit of 5', async () => {
      const response = await searchToolsHandler(registry, {
        query: 'session',
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools.length).toBeLessThanOrEqual(5);
    });

    it('should handle category filter syntax', async () => {
      const response = await searchToolsHandler(registry, {
        query: 'category:sqlite',
        limit: 10,
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);
      
      // All results should be in sqlite category
      result.tools.forEach((tool: any) => {
        expect(tool.category).toBe('sqlite');
      });
    });

    it('should return empty array for no matches', async () => {
      const response = await searchToolsHandler(registry, {
        query: 'nonexistent_keyword_xyz',
        limit: 5,
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools).toEqual([]);
      expect(result.total_found).toBe(0);
    });

    it('should handle empty query gracefully', async () => {
      const response = await searchToolsHandler(registry, {
        query: '',
        limit: 5,
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools).toEqual([]);
      expect(result.total_found).toBe(0);
    });
  });

  describe('describeToolsHandler', () => {
    it('should return schemas for requested tools', async () => {
      const response = await describeToolsHandler(registry, {
        tools: ['get_critical_invariants', 'query_sessions_sqlite'],
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools).toHaveLength(2);
      expect(result.tools[0].name).toBe('get_critical_invariants');
      expect(result.tools[1].name).toBe('query_sessions_sqlite');
    });

    it('should include full metadata for each tool', async () => {
      const response = await describeToolsHandler(registry, {
        tools: ['create_session'],
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools[0]).toHaveProperty('name');
      expect(result.tools[0]).toHaveProperty('description');
      expect(result.tools[0]).toHaveProperty('category');
      expect(result.tools[0]).toHaveProperty('tags');
      expect(result.tools[0]).toHaveProperty('inputSchema');
    });

    it('should include JSON schema for input validation', async () => {
      const response = await describeToolsHandler(registry, {
        tools: ['create_session'],
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools[0].inputSchema).toBeDefined();
      expect(result.tools[0].inputSchema).toHaveProperty('type');
      expect(result.tools[0].inputSchema.type).toBe('object');
    });

    it('should handle missing tools gracefully', async () => {
      const response = await describeToolsHandler(registry, {
        tools: ['nonexistent_tool'],
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0]).toHaveProperty('type');
      expect(result.tools[0].type).toBe('ToolNotFound');
      expect(result.tools[0]).toHaveProperty('message');
      expect(result.tools[0].message).toContain('not found');
      expect(result.tools[0]).toHaveProperty('suggestion');
    });

    it('should handle mix of valid and invalid tools', async () => {
      const response = await describeToolsHandler(registry, {
        tools: ['get_critical_invariants', 'nonexistent_tool', 'create_session'],
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools).toHaveLength(3);
      
      // First and third should have schemas
      expect(result.tools[0]).not.toHaveProperty('type'); // No error type
      expect(result.tools[0]).toHaveProperty('inputSchema');
      
      // Second should have error structure
      expect(result.tools[1]).toHaveProperty('type');
      expect(result.tools[1].type).toBe('ToolNotFound');
      
      // Third should have schema
      expect(result.tools[2]).not.toHaveProperty('type'); // No error type
      expect(result.tools[2]).toHaveProperty('inputSchema');
    });

    it('should return empty array for empty request', async () => {
      const response = await describeToolsHandler(registry, {
        tools: [],
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.tools).toEqual([]);
    });
  });

  describe('executeToolHandler', () => {
    it('should execute tool with valid arguments', async () => {
      const response = await executeToolHandler(registry, {
        tool: 'get_critical_invariants',
        arguments: {},
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.content).toBeDefined();
    });

    it('should validate arguments against schema', async () => {
      const response = await executeToolHandler(registry, {
        tool: 'create_session',
        arguments: {
          // Missing required 'title' field
          topics: ['test'],
        },
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('ValidationFailed');
      expect(result.error.message).toContain('title');
      expect(result.error).toHaveProperty('suggestion');
    });

    it('should handle missing tools', async () => {
      const response = await executeToolHandler(registry, {
        tool: 'nonexistent_tool',
        arguments: {},
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('ToolNotFound');
      expect(result.error.message).toContain('not found');
      expect(result.error).toHaveProperty('suggestion');
    });

    it('should pass through successful results', async () => {
      const response = await executeToolHandler(registry, {
        tool: 'get_validation_matrix',
        arguments: {},
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.content).toBeDefined();
    });

    it('should reject invalid argument types', async () => {
      const response = await executeToolHandler(registry, {
        tool: 'get_recent_sessions',
        arguments: {
          days: 'not-a-number', // Should be number
        },
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('ValidationFailed');
    });

    it('should handle tool execution errors', async () => {
      // Use a tool that will throw when given invalid data structure
      const response = await executeToolHandler(registry, {
        tool: 'create_session',
        arguments: {
          title: 'a', // Too short (min 3 chars)
        },
      });

      const result = JSON.parse(response.content[0].text);
      
      // Should fail validation (title too short)
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('ValidationFailed');
    });
  });
});
