/**
 * Validation Tools
 * 
 * Fast validation of deliverables without subprocess spawning.
 * Direct function calls with structured returns.
 * 
 * Optimizations:
 * - Phase 2 Batch 3: Direct validateDeliverablesCore import (10-100x faster vs subprocess)
 * - Phase 1.3: Conversational error responses via handleZodError() helper
 */

import { join } from 'path';
import { z } from 'zod';
import { validateDeliverablesCore } from '../../../lib/core/validate-deliverables.js';
import { validateSkillsCore } from '../../../lib/core/validate-skills.js';
import { handleZodError } from './utils/error-helpers.js';
import type { FieldErrorMap } from './utils/error-helpers.js';
import { getProjectRoot } from './utils/project-root.js';

const PROJECT_ROOT = getProjectRoot();

// Zod schemas for validation
const validateDeliverablesSchema = z.object({
  fix: z.boolean().default(false)
});

const checkTddComplianceSchema = z.object({
  changedFiles: z.array(z.string()).min(1, 'At least one file required')
});

const validateSkillSchema = z.object({});

/**
 * Validate all deliverable files (templates)
 * 
 * Phase 2 Batch 3: Direct core function call (10-100x faster than CLI subprocess)
 * Returns structured validation results with checks, fixes, and metrics.
 * 
 * @param params.fix - Auto-fix fixable issues (default: false)
 * @returns Structured validation results
 */
export async function validateDeliverables(params: unknown) {
  try {
    const validated = validateDeliverablesSchema.parse(params);

    // Direct core function call (10-100x faster than CLI)
    const result = await validateDeliverablesCore({
      projectRoot: PROJECT_ROOT,
      fix: validated.fix,
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    // Handle Zod validation errors with conversational responses
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'validating deliverables', {
        fix: {
          suggestion: 'Fix parameter must be a boolean (true or false)',
          examples: ['{ "fix": true }', '{ "fix": false }']
        }
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          error: true,
          message: `Failed to validate deliverables: ${message}`,
          passed: false,
          checks: [],
          summary: 'Validation error',
          exitCode: 1
        })
      }],
      isError: true
    };
  }
}

/**
 * Check TDD compliance for changed files
 * 
 * Note: Uses subprocess execution (not yet optimized like validateDeliverables).
 * Future: Could import TDD check logic directly for 10-100x speed improvement.
 */
export async function checkTddCompliance(params: unknown) {
  try {
    const validated = checkTddComplianceSchema.parse(params);

    const libChanged = validated.changedFiles.filter((file) => file.startsWith('lib/'));
    const testChanged = validated.changedFiles.filter((file) => file.startsWith('test/'));

    let stdout: string;
    if (libChanged.length === 0) {
      stdout = 'ℹ️ No changes in lib/ directory\n✅ TDD compliance check passed!';
    } else if (testChanged.length === 0) {
      const violations = libChanged.map((file) => `- ${file} modified without test file`).join('\n');
      stdout = `❌ TDD violation:\n${violations}`;
    } else {
      stdout = '✅ TDD compliant: Staged lib/ changes include staged test/ changes';
    }

    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    // Handle Zod validation errors with conversational responses
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'checking TDD compliance', {
        changedFiles: {
          suggestion: 'Changed files must be an array of file paths with at least 1 file',
          examples: ['{ "changedFiles": ["lib/utils/parser.ts"] }', '{ "changedFiles": ["lib/core/index.ts", "test/core/index.test.ts"] }']
        }
      });
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Error checking TDD compliance: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Validate aiknowsys skill format and structure native core behavior.
 * Phase 2 Batch 3: Fully decoupled from context7 plugin, executing directly within core.
 */
export async function validateSkill(params: unknown) {
  try {
    const validated = validateSkillSchema.parse(params);

    // Call the native core execution directly - no fallbacks or subprocesses
    const result = await validateSkillsCore(PROJECT_ROOT);

    if (result.passed) {
      return {
        content: [{ type: 'text' as const, text: `✅ ${result.summary}` }]
      };
    } else {
      const issueList = result.issues.map(i => `- ${i}`).join('\n');
      return {
        content: [{ type: 'text' as const, text: `❌ Skill validation failed:\n${issueList}` }]
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{
        type: 'text' as const,
        text: `Error validating skills: ${message}`
      }],
      isError: true
    };
  }
}
