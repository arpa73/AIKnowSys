/**
 * Integration Tests for Fixed MCP Tools
 * 
 * These tests run against the REAL CLI (no mocks) to verify
 * bug fixes actually work end-to-end.
 * 
 * Context: Unit tests with mocks can hide CLI flag bugs.
 * These integration tests catch issues before distribution.
 */

import { describe, it, expect } from 'vitest';
import { createSession, createPlan } from '../../src/tools/mutations.js';
import { validateSkill } from '../../src/tools/validation.js';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Integration: Fixed MCP Tools', () => {
  const testSessionPath = join(process.cwd(), '../.aiknowsys/sessions/test-integration-session.md');
  const testPlanPath = join(process.cwd(), '../.aiknowsys/PLAN_integration_test_plan.md');

  // Cleanup function
  const cleanup = () => {
    try {
      if (existsSync(testSessionPath)) unlinkSync(testSessionPath);
      if (existsSync(testPlanPath)) unlinkSync(testPlanPath);
      // Also clean up any auto-generated plan pointer
      const planPointer = join(process.cwd(), '../.aiknowsys/plans/active-test.md');
      if (existsSync(planPointer)) unlinkSync(planPointer);
    } catch (err) {
      // Ignore cleanup errors
    }
  };

  describe('create_session (Fixed: --goal → --title)', () => {
    it('should create session with --title flag', async () => {
      cleanup();

      const result = await createSession({
        title: 'Integration Test Session',
        topics: ['integration', 'testing']
      });

      // Debug: Print actual result if error
      if (result.isError) {
        console.log('ERROR:', result.content[0].text);
      }

      // Verify success (no error)
      expect(result.isError).not.toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      // Verify output mentions success
      const output = result.content[0].text;
      expect(output).toMatch(/session|created|✅/i);

      cleanup();
    }, 10000); // 10s timeout for CLI execution

    it('should reject missing title', async () => {
      const result = await createSession({
        title: '',
        topics: []
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('create_plan (Fixed: --goal → --title, removed --id/--type/--priority)', () => {
    it('should create plan with --title flag only', async () => {
      cleanup();

      const result = await createPlan({
        title: 'Integration Test Plan'
      });

      // Verify success
      expect(result.isError).not.toBe(true);
      expect(result.content).toHaveLength(1);

      // Verify output mentions plan creation
      const output = result.content[0].text;
      expect(output).toMatch(/plan|created|PLAN_|✅/i);

      cleanup();
    }, 10000);

    it('should reject missing title', async () => {
      const result = await createPlan({
        title: ''
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('validate_skill (Fixed: removed --file flag)', () => {
    it('should validate all skills without --file flag', async () => {
      const result = await validateSkill({
        skillPath: '.github/skills/tdd-workflow/SKILL.md'
      });

      // Verify success (no error)
      expect(result.isError).not.toBe(true);
      expect(result.content).toHaveLength(1);

      // Verify output contains validation results
      const output = result.content[0].text;
      // Should mention skills (validates ALL, not individual file)
      expect(output.toLowerCase()).toMatch(/skill|valid|check/i);
    }, 15000); // 15s timeout (validation can be slow)

    it('should still require skillPath parameter', async () => {
      const result = await validateSkill({
        skillPath: ''
      });

      expect(result.isError).toBe(true);
    });
  });
});
