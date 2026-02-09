import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

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
 */
export async function validateDeliverables(params: unknown) {
  try {
    const validated = validateDeliverablesSchema.parse(params);
    
    const args = ['aiknowsys', 'validate-deliverables'];
    
    if (validated.fix) {
      args.push('--fix');
    }

    const { stdout } = await execFileAsync('npx', args);
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error validating deliverables: ${error instanceof Error ? error.message : String(error)}` 
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

    const { stdout } = await execFileAsync('node', args.slice(1));
    
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
    
    const { stdout } = await execFileAsync('npx', args);
    
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
