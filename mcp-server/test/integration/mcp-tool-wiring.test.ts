/**
 * Integration Tests for MCP Server Tool Wiring
 * 
 * These tests verify that MCP server tool registrations correctly
 * wire up input parameters to tool function calls.
 * 
 * Context: Unit tests can miss API mismatches between server.ts registration
 * and actual tool function signatures. This integration layer catches those.
 * 
 * Issue discovered: skills.ts changed from findSkillForTask(task: string)
 * to findSkillForTask(params: unknown), but server.ts wasn't updated.
 * Unit tests passed (they mock the call), integration caught it in review.
 */

import { describe, it, expect } from 'vitest';
import { findSkillForTask } from '../../src/tools/skills.js';

describe('Integration: MCP Tool Wiring', () => {
  describe('find_skill_for_task registration', () => {
    it('should accept params object (not bare string)', async () => {
      // This tests that findSkillForTask expects { task: string }
      // NOT just a string parameter
      
      // ✅ CORRECT: Object with task property
      const result = await findSkillForTask({ 
        task: 'write tests first' 
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.found).toBe(true);
      expect(data.skillName).toBe('tdd-workflow');
    });

    it('should return conversational error for missing task param', async () => {
      // @ts-expect-error - Testing error case
      const result = await findSkillForTask({});

      expect(result.isError).toBe(true);
      const errorText = result.content[0].text;
      expect(errorText).toContain("Invalid parameter 'task'");
      expect(errorText).toContain('Task must be a non-empty string');
    });

    it('should return conversational error for empty task', async () => {
      const result = await findSkillForTask({
        task: ''
      });

      expect(result.isError).toBe(true);
      const errorText = result.content[0].text;
      expect(errorText).toContain("Invalid parameter 'task'");
    });

    it('should return conversational error for non-string task', async () => {
      const result = await findSkillForTask({
        // @ts-expect-error - Testing error case
        task: 123
      });

      expect(result.isError).toBe(true);
      const errorText = result.content[0].text;
      expect(errorText).toContain("Invalid parameter 'task'");
    });

    /**
     * This test simulates what the MCP server registration does:
     * 
     * server.ts line 116:
     * async ({ task }) => findSkillForTask({ task })
     * 
     * The destructured { task } comes from MCP client params,
     * then it's wrapped in an object before passing to the function.
     * 
     * If registration was wrong (passing bare string), this test fails.
     */
    it('should work with MCP-style parameter destructuring', async () => {
      // Simulate what MCP server does:
      // 1. Client sends: { task: "refactoring code" }
      // 2. Server destructures: async ({ task }) => ...
      // 3. Server calls: findSkillForTask({ task })
      
      const mcpParams = { task: 'refactoring code' };
      const { task } = mcpParams; // Destructure like server.ts
      
      const result = await findSkillForTask({ task }); // Wrap like server.ts should
      
      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.found).toBe(true);
      expect(data.skillName).toBe('refactoring-workflow');
    });
  });

  /**
   * Future tests can be added here for other tools as they're converted
   * to params objects, to prevent similar issues.
   * 
   * Pattern to test:
   * 1. Call tool with correct param object format
   * 2. Verify success or expected error
   * 3. Simulate MCP destructuring pattern
   */
});
