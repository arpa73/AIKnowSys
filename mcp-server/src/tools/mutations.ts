import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { AIFriendlyErrorBuilder } from '../../../lib/utils/error-builder.js';
import { handleZodError } from './utils/error-helpers.js';
import type { FieldErrorMap } from './utils/error-helpers.js';

// Import core business logic directly (NO subprocess spawning!)
import { createSessionCore } from '../../../lib/core/create-session.js';
import type { CreateSessionCoreOptions } from '../../../lib/core/create-session.js';
import { createPlanCore } from '../../../lib/core/create-plan.js';
import { updatePlanCore } from '../../../lib/core/update-plan.js';
import { updateSessionCore } from '../../../lib/core/update-session.js';

// Temporary: Keep execFileAsync for functions not yet refactored
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
const createSessionSchema = z.object({
  title: z.string().min(3),
  topics: z.array(z.string()).optional().default([]),
  plan: z.string().optional()
});

const updateSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD').optional(),
  section: z.string().min(1),
  content: z.string().min(1),
  operation: z.enum(['append', 'prepend', 'insert-after', 'insert-before']).default('append')
});

const createPlanSchema = z.object({
  title: z.string().min(3),
  author: z.string().optional(),
  topics: z.array(z.string()).optional().default([])
});

const updatePlanSchema = z.discriminatedUnion('operation', [
  z.object({
    planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
    operation: z.literal('set-status'),
    status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'])
  }),
  z.object({
    planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
    operation: z.literal('append'),
    content: z.string().min(1)
  })
  // Note: 'prepend' operation removed - not implemented in core yet
  // TODO Phase 2 Batch 2: Add prepend support to lib/core/update-plan.ts
]);

/**
 * Create a new session file
 * 
 * Refactored: Direct import from lib/core (10-50x faster than CLI subprocess)
 */
export async function createSession(params: unknown) {
  try {
    const validated = createSessionSchema.parse(params);
    
    // Direct function call (NO subprocess!)
    const result = await createSessionCore({
      title: validated.title,
      topics: validated.topics,
      plan: validated.plan || null,
      targetDir: PROJECT_ROOT
    });

    // Format MCP response
    if (result.created) {
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Created session: ${result.metadata?.date}-session.md\n📄 File: ${result.filePath}\n📝 Edit session content in the file`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text' as const,
          text: `ℹ️ Session already exists: ${result.filePath}\nUse update-session to modify metadata`
        }]
      };
    }
  } catch (error) {
    // Handle Zod validation errors with conversational responses
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'session creation', {
        title: {
          suggestion: 'Session title must be at least 3 characters',
          examples: ['{ "title": "Implement Feature X" }', '{ "title": "Debug Memory Leak" }']
        },
        topics: {
          suggestion: 'Topics must be an array of strings (optional parameter for categorization)',
          examples: ['{ "topics": ["feature", "backend"] }', '{ "topics": ["bug-fix", "ui"] }']
        }
      });
    }
    
    // Generic validation failure
    const errorResponse = AIFriendlyErrorBuilder.validationFailed(
      'session creation',
      error instanceof Error ? error.message : String(error),
      'Check parameter types and required fields'
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }
}

/**
 * Update an existing session file
 * 
 * Refactored: Direct import from lib/core (10-100x faster than CLI subprocess)
 */
export async function updateSession(params: unknown) {
  try {
    const validated = updateSessionSchema.parse(params);
    
    // Map MCP schema to core function options
    const coreOptions: any = {
      targetDir: PROJECT_ROOT,
      date: validated.date,
      content: validated.content
    };
    
    // Map operation to appropriate section option
    switch (validated.operation) {
      case 'append':
        coreOptions.appendSection = validated.section;
        break;
      case 'prepend':
        coreOptions.prependSection = validated.section;
        break;
      case 'insert-after':
        coreOptions.insertAfter = validated.section;
        break;
      case 'insert-before':
        coreOptions.insertBefore = validated.section;
        break;
    }
    
    // Direct function call (NO subprocess!)
    const result = await updateSessionCore(coreOptions);
    
    // Format MCP response
    if (result.updated) {
      return {
        content: [{
          type: 'text' as const,
          text: `✅ ${result.message}\n📝 Changes:\n${result.changes?.map(c => `  - ${c}`).join('\n') || '  (none)'}`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text' as const,
          text: `ℹ️ ${result.message || 'No changes needed'}`
        }]
      };
    }
  } catch (error) {
    // Handle Zod validation errors with conversational responses
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'session update', {
        date: {
          suggestion: 'Date must be in YYYY-MM-DD format',
          examples: ['{ "date": "2026-02-08" }', '{ "date": "2026-01-15" }']
        },
        operation: {
          suggestion: 'Must be one of: append, prepend, insert-after, insert-before',
          examples: ['{ "operation": "append" }', '{ "operation": "prepend" }']
        },
        section: {
          suggestion: 'Section name must be at least 1 character',
          examples: ['{ "section": "## Progress" }', '{ "section": "Implementation Notes" }']
        }
      });
    }
    
    // Generic validation failure
    const errorResponse = AIFriendlyErrorBuilder.validationFailed(
      'session update',
      error instanceof Error ? error.message : String(error),
      'Check parameter types and required fields'
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }
}

/**
 * Create a new implementation plan
 * 
 * Refactored: Direct import from lib/core (10-100x faster than CLI subprocess)
 */
export async function createPlan(params: unknown) {
  try {
    const validated = createPlanSchema.parse(params);
    
    // Direct function call (NO subprocess!)
    const result = await createPlanCore({
      title: validated.title,
      author: validated.author,
      topics: validated.topics,
      targetDir: PROJECT_ROOT
    });

    // Format MCP response
    if (result.created) {
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Created plan: ${result.planId}\n📄 Plan file: ${result.filePath}\n🔗 Pointer: ${result.pointerPath}\n📝 Edit plan to add implementation steps`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text' as const,
          text: `ℹ️ Plan already exists: ${result.filePath}`
        }]
      };
    }
  } catch (error) {
    // Handle Zod validation errors with conversational responses
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'plan creation', {
        title: {
          suggestion: 'Plan title must be at least 3 characters',
          examples: ['{ "title": "Add Payment Integration" }', '{ "title": "Refactor Auth System" }']
        },
        topics: {
          suggestion: 'Topics must be an array of strings (optional parameter for categorization)',
          examples: ['{ "topics": ["payment", "stripe"] }', '{ "topics": ["auth", "security"] }']
        }
      });
    }
    
    // Generic validation failure
    const errorResponse = AIFriendlyErrorBuilder.validationFailed(
      'plan creation',
      error instanceof Error ? error.message : String(error),
      'Check parameter types and required fields'
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }
}

/**
 * Update an existing implementation plan
 * 
 * Refactored: Direct import from lib/core (10-100x faster than CLI subprocess)
 */
export async function updatePlan(params: unknown) {
  try {
    const validated = updatePlanSchema.parse(params);
    
    // Direct function call (NO subprocess!)
    const result = await updatePlanCore({
      planId: validated.planId,
      setStatus: validated.operation === 'set-status' ? validated.status : undefined,
      append: validated.operation === 'append' ? validated.content : undefined,
      targetDir: PROJECT_ROOT
    });

    // Format MCP response
    const changes = result.changes || [];
    const changeList = changes.map(c => `   • ${c}`).join('\n');
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Plan Updated\n\n📝 Changes:\n${changeList}\n\n📂 File: ${result.filePath}\n🔍 Index: Rebuilt automatically`
      }]
    };
  } catch (error) {
    // Handle Zod validation errors with conversational responses
    if (error instanceof z.ZodError) {
      return handleZodError(error, 'plan update', {
        planId: {
          suggestion: 'Plan ID must start with PLAN_',
          examples: ['{ "planId": "PLAN_feature_auth" }', '{ "planId": "PLAN_refactor_db" }']
        },
        operation: {
          suggestion: 'Must be one of: set-status, append',
          examples: ['{ "operation": "set-status", "status": "ACTIVE" }', '{ "operation": "append", "content": "Phase 1 complete" }']
        },
        content: {
          suggestion: 'Content is required for append operations',
          examples: ['{ "operation": "append", "content": "Completed milestone 1" }']
        },
        status: {
          suggestion: 'Must be one of: ACTIVE, PAUSED, COMPLETE, CANCELLED',
          examples: ['{ "operation": "set-status", "status": "ACTIVE" }', '{ "operation": "set-status", "status": "COMPLETE" }']
        }
      });
    }
    
    // Generic validation failure
    const errorResponse = AIFriendlyErrorBuilder.validationFailed(
      'plan update',
      error instanceof Error ? error.message : String(error),
      'Check parameter types and required fields'
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
      isError: true
    };
  }
}
