import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';

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

// ============================================================================
// METADATA MUTATION TOOLS (YAML Frontmatter Updates)
// ============================================================================

/**
 * Update session metadata (YAML frontmatter fields)
 * Supports: add-topic, add-file, set-status
 */
const updateSessionMetadataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
  addTopic: z.string().optional(),
  addFile: z.string().optional(),
  setStatus: z.enum(['in-progress', 'complete', 'abandoned']).optional()
}).refine(
  (data) => data.addTopic || data.addFile || data.setStatus,
  { message: 'At least one metadata operation required (addTopic, addFile, or setStatus)' }
);

export async function updateSessionMetadata(params: unknown) {
  try {
    const validated = updateSessionMetadataSchema.parse(params);
    
    const args = ['aiknowsys', 'update-session'];

    if (validated.date) {
      args.push('--date', validated.date);
    }

    if (validated.addTopic) {
      args.push('--add-topic', validated.addTopic);
    }

    if (validated.addFile) {
      args.push('--add-file', validated.addFile);
    }

    if (validated.setStatus) {
      args.push('--set-status', validated.setStatus);
    }

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error updating session metadata: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Update plan metadata (YAML frontmatter fields)
 * Supports: author, topics
 */
const updatePlanMetadataSchema = z.object({
  planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
  author: z.string().optional(),
  topics: z.array(z.string()).optional()
}).refine(
  (data) => data.author || data.topics,
  { message: 'At least one metadata field required (author or topics)' }
);

export async function updatePlanMetadata(params: unknown) {
  try {
    const validated = updatePlanMetadataSchema.parse(params);
    
    const args = ['aiknowsys', 'update-plan', validated.planId];

    if (validated.author) {
      args.push('--author', validated.author);
    }

    if (validated.topics) {
      args.push('--topics', validated.topics.join(','));
    }

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error updating plan metadata: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

// ============================================================================
// ARCHIVE MUTATION TOOLS
// ============================================================================

/**
 * Archive old session files
 */
const archiveSessionsSchema = z.object({
  days: z.number().min(1).optional().default(30),
  dryRun: z.boolean().optional().default(false)
});

export async function archiveSessions(params: unknown) {
  try {
    const validated = archiveSessionsSchema.parse(params);
    
    const args = ['aiknowsys', 'archive-sessions', '--threshold', validated.days.toString()];

    if (validated.dryRun) {
      args.push('--dry-run');
    }

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error archiving sessions: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Archive plans by status
 */
const archivePlansSchema = z.object({
  status: z.enum(['COMPLETE', 'CANCELLED', 'PAUSED']).optional().default('COMPLETE'),
  days: z.number().min(0).optional().default(7),
  dryRun: z.boolean().optional().default(false)
});

export async function archivePlans(params: unknown) {
  try {
    const validated = archivePlansSchema.parse(params);
    
    const args = [
      'aiknowsys', 
      'archive-plans',
      '--status', validated.status,
      '--threshold', validated.days.toString()
    ];

    if (validated.dryRun) {
      args.push('--dry-run');
    }

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error archiving plans: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

// ============================================================================
// PLAN MUTATION TOOLS (Split from update_plan)
// ============================================================================

/**
 * Set plan status (ACTIVE, PAUSED, COMPLETE, CANCELLED)
 */
const setPlanStatusSchema = z.object({
  planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'])
});

export async function setPlanStatus(params: unknown) {
  try {
    const validated = setPlanStatusSchema.parse(params);
    
    const args = [
      'aiknowsys',
      'update-plan',
      validated.planId,
      '--set-status',
      validated.status
    ];

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error setting plan status: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Append content to plan
 */
const appendToPlanSchema = z.object({
  planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
  content: z.string().min(1)
});

export async function appendToPlan(params: unknown) {
  try {
    const validated = appendToPlanSchema.parse(params);
    
    const args = [
      'aiknowsys',
      'update-plan',
      validated.planId,
      '--append',
      validated.content
    ];

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error appending to plan: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Prepend content to plan
 */
const prependToPlanSchema = z.object({
  planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
  content: z.string().min(1)
});

export async function prependToPlan(params: unknown) {
  try {
    const validated = prependToPlanSchema.parse(params);
    
    const args = [
      'aiknowsys',
      'update-plan',
      validated.planId,
      '--prepend',
      validated.content
    ];

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error prepending to plan: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

// ============================================================================
// SESSION MUTATION TOOLS (Split from update_session)
// ============================================================================

/**
 * Append to session section
 */
const appendToSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
  section: z.string().min(1),
  content: z.string().min(1)
});

export async function appendToSession(params: unknown) {
  try {
    const validated = appendToSessionSchema.parse(params);
    
    const args = ['aiknowsys', 'update-session'];

    if (validated.date) {
      args.push('--date', validated.date);
    }

    args.push('--appendSection', validated.section);
    args.push('--content', validated.content);

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error appending to session: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Prepend to session section
 */
const prependToSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
  section: z.string().min(1),
  content: z.string().min(1)
});

export async function prependToSession(params: unknown) {
  try {
    const validated = prependToSessionSchema.parse(params);
    
    const args = ['aiknowsys', 'update-session'];

    if (validated.date) {
      args.push('--date', validated.date);
    }

    args.push('--prependSection', validated.section);
    args.push('--content', validated.content);

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error prepending to session: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Insert section after pattern
 */
const insertAfterSectionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
  pattern: z.string().min(1),
  section: z.string().optional().default('## Update'),
  content: z.string().min(1)
});

export async function insertAfterSection(params: unknown) {
  try {
    const validated = insertAfterSectionSchema.parse(params);
    
    const args = ['aiknowsys', 'update-session'];

    if (validated.date) {
      args.push('--date', validated.date);
    }

    args.push('--insert-after', validated.pattern);
    args.push('--appendSection', validated.section);
    args.push('--content', validated.content);

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error inserting after section: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Insert section before pattern
 */
const insertBeforeSectionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
  pattern: z.string().min(1),
  section: z.string().optional().default('## Update'),
  content: z.string().min(1)
});

export async function insertBeforeSection(params: unknown) {
  try {
    const validated = insertBeforeSectionSchema.parse(params);
    
    const args = ['aiknowsys', 'update-session'];

    if (validated.date) {
      args.push('--date', validated.date);
    }

    args.push('--insert-before', validated.pattern);
    args.push('--appendSection', validated.section);
    args.push('--content', validated.content);

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error inserting before section: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}
