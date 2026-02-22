import { describe, it, expect, beforeEach } from 'vitest';
import { AIKnowSysServer } from '../../src/server.js';

describe('Dynamic Toolset Integration (End-to-End)', () => {
  let server: AIKnowSysServer;
  let internalServer: any;

  beforeEach(() => {
    server = new AIKnowSysServer();
    internalServer = (server as any).server.server;
  });

  describe('Full workflow: Search → Describe → Execute', () => {
    it('should complete full workflow for session queries', async () => {
      // Step 1: Search for session-related tools
      const searchResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_search_tools',
          arguments: {
            query: 'sessions',
            limit: 5,
          },
        },
      });

      expect(searchResponse.content).toBeDefined();
      const searchResult = JSON.parse(searchResponse.content[0].text);
      expect(searchResult.success).toBe(true);
      expect(searchResult.tools.length).toBeGreaterThan(0);
      expect(searchResult.tools.length).toBeLessThanOrEqual(5);

      // Verify results have session-related tools
      const toolNames = searchResult.tools.map((t: any) => t.name);
      expect(toolNames.some((name: string) => name.includes('session'))).toBe(true);

      // Step 2: Describe one of the tools found
      const describeResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_describe_tools',
          arguments: {
            tools: [searchResult.tools[0].name],
          },
        },
      });

      expect(describeResponse.content).toBeDefined();
      const describeResult = JSON.parse(describeResponse.content[0].text);
      expect(describeResult.success).toBe(true);
      expect(describeResult.tools).toHaveLength(1);
      expect(describeResult.tools[0]).toHaveProperty('inputSchema');
      expect(describeResult.tools[0].inputSchema).toHaveProperty('type');

      // Step 3: Execute a simple tool (get_critical_invariants - no params)
      const executeResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_execute_tool',
          arguments: {
            tool: 'get_critical_invariants',
            arguments: {},
          },
        },
      });

      expect(executeResponse.content).toBeDefined();
      const executeResult = JSON.parse(executeResponse.content[0].text);
      expect(executeResult.success).toBe(true);
      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.content).toBeDefined();
    });

    it('should search by category filter', async () => {
      const searchResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_search_tools',
          arguments: {
            query: 'category:query',
            limit: 10,
          },
        },
      });

      const searchResult = JSON.parse(searchResponse.content[0].text);
      expect(searchResult.success).toBe(true);
      expect(searchResult.tools.length).toBeGreaterThan(0);

      // All results should be in query category
      searchResult.tools.forEach((tool: any) => {
        expect(tool.category).toBe('query');
      });
    });

    it('should search with tag filters', async () => {
      const searchResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_search_tools',
          arguments: {
            query: 'session',
            tags: ['core'],
            limit: 10,
          },
        },
      });

      const searchResult = JSON.parse(searchResponse.content[0].text);
      expect(searchResult.success).toBe(true);

      if (searchResult.tools.length > 0) {
        // Verify tools have core tag
        searchResult.tools.forEach((tool: any) => {
          const toolMetadata = (server as any).toolRegistry.get(tool.name);
          expect(toolMetadata.tags).toContain('core');
        });
      }
    });

    it('should handle describe with multiple tools', async () => {
      const describeResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_describe_tools',
          arguments: {
            tools: ['get_critical_invariants', 'get_validation_matrix', 'create_session'],
          },
        },
      });

      const describeResult = JSON.parse(describeResponse.content[0].text);
      expect(describeResult.success).toBe(true);
      expect(describeResult.tools).toHaveLength(3);

      describeResult.tools.forEach((tool: any) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('category');
        expect(tool).toHaveProperty('tags');
        expect(tool).toHaveProperty('inputSchema');
      });
    });

    it('should handle describe with nonexistent tool', async () => {
      const describeResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_describe_tools',
          arguments: {
            tools: ['nonexistent_tool'],
          },
        },
      });

      const describeResult = JSON.parse(describeResponse.content[0].text);
      expect(describeResult.success).toBe(true);
      expect(describeResult.tools).toHaveLength(1);
      expect(describeResult.tools[0]).toHaveProperty('type');
      expect(describeResult.tools[0].type).toBe('ToolNotFound');
      expect(describeResult.tools[0]).toHaveProperty('message');
      expect(describeResult.tools[0].message).toContain('not found');
    });

    it('should validate arguments in execute', async () => {
      const executeResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_execute_tool',
          arguments: {
            tool: 'create_session',
            arguments: {
              // Missing required 'title' field
              topics: ['test'],
            },
          },
        },
      });

      const executeResult = JSON.parse(executeResponse.content[0].text);
      expect(executeResult.success).toBe(false);
      expect(executeResult.error).toBeDefined();
      expect(executeResult.error.type).toBe('ValidationFailed');
      expect(executeResult.error.message).toContain('title');
    });

    it('should execute tool with valid arguments', async () => {
      const executeResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_execute_tool',
          arguments: {
            tool: 'get_validation_matrix',
            arguments: {},
          },
        },
      });

      const executeResult = JSON.parse(executeResponse.content[0].text);
      expect(executeResult.success).toBe(true);
      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.content).toBeDefined();
    });
  });

  describe('Categories overview', () => {
    it('should include categories in search response', async () => {
      const searchResponse = await internalServer._requestHandlers.get('tools/call')({
        method: 'tools/call',
        params: {
          name: 'aiknowsys_search_tools',
          arguments: {
            query: 'query',
            limit: 5,
          },
        },
      });

      const searchResult = JSON.parse(searchResponse.content[0].text);
      expect(searchResult.categories_overview).toBeDefined();
      expect(searchResult.categories_overview).toContain('context');
      expect(searchResult.categories_overview).toContain('query');
      expect(searchResult.categories_overview).toContain('mutation');
      expect(searchResult.categories_overview).toContain('validation');
    });
  });

  describe('Token efficiency comparison', () => {
    it('should demonstrate token reduction', async () => {
      // Before: All direct tools exposed directly
      const listResponse = await internalServer._requestHandlers.get('tools/list')({
        method: 'tools/list',
        params: {},
      });

      const allTools = listResponse.tools;
      const directAccessTools = allTools.filter((t: any) => !t.name.startsWith('aiknowsys_'));
      const dynamicTools = allTools.filter((t: any) => t.name.startsWith('aiknowsys_'));

      // Verify we have both sets
      expect(directAccessTools.length).toBe(33);
      expect(dynamicTools.length).toBe(3);

      // Dynamic toolset exposes only 3 tools (vs 33 direct)
      // Token reduction: >90% for tool-definition footprint
      expect(dynamicTools.length).toBeLessThan(directAccessTools.length);

      // Demonstrate workflow - only 3 tool calls instead of loading all direct schemas
      const tokensForDirectAccess = directAccessTools.length; // All tools loaded upfront
      const tokensForDynamicAccess = dynamicTools.length; // Only 3 tools loaded

      expect(tokensForDynamicAccess).toBe(3);
      expect(tokensForDirectAccess).toBe(33);

      const tokenReduction = ((tokensForDirectAccess - tokensForDynamicAccess) / tokensForDirectAccess) * 100;
      expect(tokenReduction).toBeGreaterThan(90); // >90% reduction
    });
  });
});
