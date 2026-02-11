/**
 * Validation Tools
 * 
 * Fast validation of deliverables without subprocess spawning.
 * Direct function calls with structured returns.
 * 
 * Phase 2 Batch 3: validateDeliverablesCore uses direct import
 * for 10-100x faster execution vs CLI subprocess spawning.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import { validateDeliverablesCore } from '../../../lib/core/validate-deliverables.js';

const execFileAsync = promisify(execFile);

// Get actual file location (works in any execution context)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find project root by searching for .aiknowsys/ directory
// This works in both development (src/) and production (dist/) environments
function findProjectRoot(): string {
  let current = __dirname;
  
  // Try up to 10 levels (should be more than enough)
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(current, '.aiknowsys'))) {
      return current;
    }
    const parent = resolve(current, '..');
    if (parent === current) {
      // Reached filesystem root
      break;
    }
    current = parent;
  }
  
  throw new Error('Could not locate project root (.aiknowsys/ not found)');
}

const PROJECT_ROOT = findProjectRoot();

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
 */
export async function validateSkill(params: unknown) {
  try {
    const validated = validateSkillSchema.parse(params);
    
    // Use the validate command with skills type
    // Note: Currently validates ALL skills (--file flag doesn't exist in CLI)
    const args = ['aiknowsys', 'validate', '--type', 'skills'];
    
    // Future enhancement: Filter output for specific skill path
    // For now, returns validation results for all skills
    
    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error validating skill: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}
