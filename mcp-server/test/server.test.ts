import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { AIKnowSysServer } from '../src/server.js';

describe('MCP Server Registration', () => {
  it('should register all 27 tools', async () => {
    const server = new AIKnowSysServer();
    
    // Access the internal low-level server instance
    const internalServer = (server as any).server.server;
    
    // Simulate ListToolsRequest
    const response = await internalServer._requestHandlers.get('tools/list')({
      method: 'tools/list',
      params: {}
    });

    expect(response.tools).toHaveLength(27);
    
    // Verify tool names (split mutation tools + new query tools)
    const toolNames = response.tools.map((t: any) => t.name);
    
    // Context tools
    expect(toolNames).toContain('get_critical_invariants');
    expect(toolNames).toContain('get_validation_matrix');
    
    // Query tools (Phase 1)
    expect(toolNames).toContain('get_active_plans');
    expect(toolNames).toContain('get_recent_sessions');
    expect(toolNames).toContain('find_skill_for_task');
    
    // Advanced Query tools (Phase 1.2 - NEW)
    expect(toolNames).toContain('query_plans');
    expect(toolNames).toContain('query_sessions');
    expect(toolNames).toContain('get_plans_by_status');
    expect(toolNames).toContain('get_all_plans');
    expect(toolNames).toContain('get_session_by_date');
    expect(toolNames).toContain('rebuild_index');
    expect(toolNames).toContain('sync_plans');
    
    // Mutation tools (creation - unchanged)
    expect(toolNames).toContain('create_session');
    expect(toolNames).toContain('create_plan');
    
    // Session mutation tools (split from update_session)
    expect(toolNames).toContain('append_to_session');
    expect(toolNames).toContain('prepend_to_session');
    expect(toolNames).toContain('insert_after_section');
    expect(toolNames).toContain('insert_before_section');
    
    // Plan mutation tools (split from update_plan)
    expect(toolNames).toContain('set_plan_status');
    expect(toolNames).toContain('append_to_plan');
    expect(toolNames).toContain('prepend_to_plan');
    
    // Validation tools
    expect(toolNames).toContain('validate_deliverables');
    expect(toolNames).toContain('check_tdd_compliance');
    expect(toolNames).toContain('validate_skill');
    
    // Enhanced query tools
    expect(toolNames).toContain('search_context');
    expect(toolNames).toContain('find_pattern');
    expect(toolNames).toContain('get_skill_by_name');
  });
});

describe('MCP Server Input Validation', () => {
  describe('days parameter validation', () => {
    const schema = z.object({ 
      days: z.number().min(1).max(365).optional().default(7) 
    });

    it('should reject days parameter less than 1', () => {
      expect(() => schema.parse({ days: 0 })).toThrow();
      expect(() => schema.parse({ days: -5 })).toThrow();
    });

    it('should reject days parameter greater than 365', () => {
      expect(() => schema.parse({ days: 366 })).toThrow();
      expect(() => schema.parse({ days: 9999 })).toThrow();
    });

    it('should accept valid days parameter', () => {
      expect(schema.parse({ days: 1 }).days).toBe(1);
      expect(schema.parse({ days: 7 }).days).toBe(7);
      expect(schema.parse({ days: 30 }).days).toBe(30);
      expect(schema.parse({ days: 365 }).days).toBe(365);
    });

    it('should default to 7 days when omitted', () => {
      expect(schema.parse({}).days).toBe(7);
      expect(schema.parse({ days: undefined }).days).toBe(7);
    });
  });

  describe('task parameter validation', () => {
    const schema = z.object({ task: z.string().min(3) });

    it('should reject task parameter with less than 3 characters', () => {
      expect(() => schema.parse({ task: '' })).toThrow();
      expect(() => schema.parse({ task: 'ab' })).toThrow();
    });

    it('should accept task parameter with 3 or more characters', () => {
      expect(schema.parse({ task: 'abc' }).task).toBe('abc');
      expect(schema.parse({ task: 'refactor' }).task).toBe('refactor');
      expect(schema.parse({ task: 'write tests first' }).task).toBe('write tests first');
    });
  });
});
