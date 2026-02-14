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

import { execFile } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { z } from 'zod';
import { validateDeliverablesCore } from '../../../lib/core/validate-deliverables.js';
import { handleZodError } from './utils/error-helpers.js';
import type { FieldErrorMap } from './utils/error-helpers.js';
import { getProjectRoot } from './utils/project-root.js';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = getProjectRoot();

// Zod schemas for validation
const validateDeliverablesSchema = z.object({
  fix: z.boolean().default(false)
});

const checkTddComplianceSchema = z.object({
  changedFiles: z.array(z.string()).min(1, 'At least one file required')
});

const validateSkillSchema = z.object({
  skillPath: z.string().min(1, 'Skill path is required')
});

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
    
    // For now, wrap the pre-commit TDD check logic
    // In practice, this would call the actual TDD check from hooks
    const args = ['node', '.github/hooks/tdd-check.js', ...validated.changedFiles];

    const { stdout } = await execFileAsync('node', args.slice(1), { cwd: PROJECT_ROOT });
    
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
 * Validate skill format and content
 * 
 * NOTE: Validates ALL skills in the project, not just the specified skillPath.
 * The skillPath parameter is required for future individual validation support.
 * 
 * Note: Uses subprocess execution (not yet optimized like validateDeliverables).
 * Future: Could import validation logic directly for 10-100x speed improvement.
 */
export async function validateSkill(params: unknown) {
  try {
    const validated = validateSkillSchema.parse(params);
    
    // Use the validate command with skills type
    // Note: Currently validates ALL skills (--file flag doesn't exist in CLI)
    // Use node + bin/cli.js directly to avoid npx resolving to stale node_modules version
    const cliPath = join(PROJECT_ROOT, 'bin', 'cli.js');
    const args = [cliPath, 'validate', '-t', 'skills'];
    
    // Future enhancement: Filter output for specific skill path
    // For now, returns validation results for all skills
    
    const { stdout } = await execFileAsync('node', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    // Handle Zod validation errors with conversational responses
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'validating skill', {
        skillPath: {
          suggestion: 'Skill path must be at least 1 character (e.g., skill file path)',
          examples: ['{ "skillPath": ".github/skills/tdd-workflow/SKILL.md" }', '{ "skillPath": ".github/skills/feature-implementation/SKILL.md" }']
        }
      });
    }
    
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error validating skill: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}
