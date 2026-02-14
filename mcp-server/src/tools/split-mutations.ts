import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { getProjectRoot } from './utils/project-root.js';
import { handleZodError, MCPErrorResponse } from './utils/error-helpers.js';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = getProjectRoot();

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
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'updating session metadata', {
        date: {
          suggestion: 'Date must be in YYYY-MM-DD format (optional, defaults to today)',
          examples: ['{"addTopic": "refactoring", "date": "2026-02-14"}', '{"setStatus": "complete"}']
        },
        addTopic: {
          suggestion: 'Provide at least one operation: addTopic, addFile, or setStatus',
          examples: ['{"addTopic": "mcp-tools"}', '{"addFile": "src/server.ts", "addTopic": "bugfix"}']
        }
      });
    }
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
  } catch (error) {    if (error instanceof z.ZodError) {
      return handleZodError(error, 'updating plan metadata', {
        planId: {
          suggestion: 'Plan ID must be in format PLAN_<name> (lowercase with underscores)',
          examples: ['{"planId": "PLAN_mcp_phase2", "author": "arno"}', '{"planId": "PLAN_terminal_ux", "topics": ["ux", "errors"]}']
        },
        author: {
          suggestion: 'Provide at least one field to update: author or topics',
          examples: ['{"planId": "PLAN_test", "author": "developer"}', '{"planId": "PLAN_test", "topics": ["testing"]}']
        }
      });
    }    return {
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
  } catch (error) {    if (error instanceof z.ZodError) {
      return handleZodError(error, 'updating session metadata', {
        date: {
          suggestion: 'Date must be in YYYY-MM-DD format (optional, defaults to today)',
          examples: ['{\"addTopic\": \"refactoring\", \"date\": \"2026-02-14\"}', '{\"setStatus\": \"complete\"}']
        },
        addTopic: {
          suggestion: 'Provide at least one operation: addTopic, addFile, or setStatus',
          examples: ['{\"addTopic\": \"mcp-tools\"}', '{\"addFile\": \"src/server.ts\", \"addTopic\": \"bugfix\"}']
        }
      });
    }    return {
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
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'archiving plans', {
        status: {
          suggestion: 'Status must be one of: COMPLETE, CANCELLED, PAUSED (defaults to COMPLETE)',
          examples: ['{"status": "COMPLETE", "days": 14}', '{"status": "CANCELLED", "dryRun": true}']
        },
        days: {
          suggestion: 'Days must be a non-negative number (defaults to 7)',
          examples: ['{"days": 30}', '{"status": "PAUSED", "days": 60}']
        }
      });
    }
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
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'setting plan status', {
        planId: {
          suggestion: 'Plan ID must be in format PLAN_<name> (lowercase with underscores)',
          examples: ['{"planId": "PLAN_mcp_phase2", "status": "ACTIVE"}', '{"planId": "PLAN_terminal_ux", "status": "COMPLETE"}']
        },
        status: {
          suggestion: 'Status must be one of: ACTIVE, PAUSED, COMPLETE, CANCELLED',
          examples: ['{"planId": "PLAN_test", "status": "ACTIVE"}', '{"planId": "PLAN_test", "status": "PAUSED"}']
        }
      });
    }
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
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'appending to plan', {
        planId: {
          suggestion: 'Plan ID must be in format PLAN_<name> (lowercase with underscores)',
          examples: ['{"planId": "PLAN_test", "content": "Phase 1 complete"}', '{"planId": "PLAN_mcp_phase2", "content": "Added 10 tools"}']
        },
        content: {
          suggestion: 'Content must be a non-empty string to append',
          examples: ['{"planId": "PLAN_test", "content": "Updated status"}', '{"planId": "PLAN_test", "content": "## Progress\\nAll tests passing"}']
        }
      });
    }
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
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'prepending to plan', {
        planId: {
          suggestion: 'Plan ID must be in format PLAN_<name> (lowercase with underscores)',
          examples: ['{"planId": "PLAN_test", "content": "URGENT: Security fix needed"}', '{"planId": "PLAN_mcp", "content": "## Critical Issue"}']
        },
        content: {
          suggestion: 'Content must be a non-empty string to prepend',
          examples: ['{"planId": "PLAN_test", "content": "Priority update"}', '{"planId": "PLAN_test", "content": "⚠️ Blocker found"}']
        }
      });
    }
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

    args.push('--append-section', validated.section);
    args.push('--content', validated.content);

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'appending to session', {
        date: {
          suggestion: 'Date must be in YYYY-MM-DD format (optional, defaults to today)',
          examples: ['{\"section\": \"## Progress\", \"content\": \"Fixed bug X\", \"date\": \"2026-02-14\"}', '{\"section\": \"## Notes\", \"content\": \"Testing complete\"}']
        },
        section: {
          suggestion: 'Section heading (optional, defaults to \"## Update\")',
          examples: ['{\"section\": \"## Changes\", \"content\": \"Updated tests\"}', '{\"section\": \"## Key Learning\", \"content\": \"Pattern discovered\"}']
        },
        content: {
          suggestion: 'Content must be a non-empty string to append',
          examples: ['{\"content\": \"Phase 1 complete\"}', '{\"section\": \"## Validation\", \"content\": \"✅ All tests passing\"}']
        }
      });
    }
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

    args.push('--prepend-section', validated.section);
    args.push('--content', validated.content);

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {    if (error instanceof z.ZodError) {
      return handleZodError(error, 'appending to session', {
        date: {
          suggestion: 'Date must be in YYYY-MM-DD format (optional, defaults to today)',
          examples: ['{"section": "## Progress", "content": "Fixed bug X", "date": "2026-02-14"}', '{"section": "## Notes", "content": "Testing complete"}']
        },
        section: {
          suggestion: 'Section heading (optional, defaults to "## Update")',
          examples: ['{"section": "## Changes", "content": "Updated tests"}', '{"section": "## Key Learning", "content": "Pattern discovered"}']
        },
        content: {
          suggestion: 'Content must be a non-empty string to append',
          examples: ['{"content": "Phase 1 complete"}', '{"section": "## Validation", "content": "✅ All tests passing"}']
        }
      });
    }    if (error instanceof z.ZodError) {
      return handleZodError(error, 'prepending to session', {
        date: {
          suggestion: 'Date must be in YYYY-MM-DD format (optional, defaults to today)',
          examples: ['{"section": "## Critical Issue", "content": "Security bug found", "date": "2026-02-14"}', '{"section": "## Blocker", "content": "Test failing"}']
        },
        section: {
          suggestion: 'Section heading (optional, defaults to "## Update")',
          examples: ['{"section": "## Urgent", "content": "Breaking change"}', '{"section": "## ⚠️ Warning", "content": "API deprecated"}']
        },
        content: {
          suggestion: 'Content must be a non-empty string to prepend',
          examples: ['{"content": "HIGH PRIORITY: Fix regression"}', '{"section": "## Alert", "content": "Production issue"}']
        }
      });
    }
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
    args.push('--append-section', validated.section);
    args.push('--content', validated.content);

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'inserting after section', {
        date: {
          suggestion: 'Date must be in YYYY-MM-DD format (optional, defaults to today)',
          examples: ['{"pattern": "## Goal", "content": "Step 1 complete", "date": "2026-02-14"}', '{"pattern": "## Changes", "section": "## Progress", "content": "Tests passing"}']
        },
        pattern: {
          suggestion: 'Pattern must be a non-empty string to search for (typically a section heading)',
          examples: ['{"pattern": "## Goal", "content": "Progress update"}', '{"pattern": "## Phase 1", "section": "## Phase 1 Results", "content": "Complete"}']
        },
        content: {
          suggestion: 'Content must be a non-empty string to insert',
          examples: ['{"pattern": "## Implementation", "content": "Added feature X"}', '{"pattern": "## Testing", "content": "✅ All green"}']
        }
      });
    }
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
    args.push('--append-section', validated.section);
    args.push('--content', validated.content);

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'inserting before section', {
        date: {
          suggestion: 'Date must be in YYYY-MM-DD format (optional, defaults to today)',
          examples: ['{"pattern": "## Summary", "content": "Prerequisites note", "date": "2026-02-14"}', '{"pattern": "## Results", "section": "## Setup", "content": "Environment ready"}']
        },
        pattern: {
          suggestion: 'Pattern must be a non-empty string to search for (typically a section heading)',
          examples: ['{"pattern": "## Conclusion", "content": "Important context"}', '{"pattern": "## Next Steps", "section": "## Current State", "content": "Ready for next phase"}']
        },
        content: {
          suggestion: 'Content must be a non-empty string to insert',
          examples: ['{"pattern": "## Summary", "content": "Key point to remember"}', '{"pattern": "## End", "content": "Final notes"}']
        }
      });
    }
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error inserting before section: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}
