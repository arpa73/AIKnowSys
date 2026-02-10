import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import { promisify } from 'util';
import { execFile } from 'child_process';

// Import core business logic directly (NO subprocess spawning!)
import { createSessionCore } from '../../../lib/core/create-session.js';
import type { CreateSessionCoreOptions } from '../../../lib/core/create-session.js';
import { createPlanCore } from '../../../lib/core/create-plan.js';

// Temporary: Keep execFileAsync for functions not yet refactored
// TODO Phase 2: Migrate updateSession, createPlan, updatePlan to lib/core
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
  }),
  z.object({
    planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
    operation: z.literal('prepend'),
    content: z.string().min(1)
  })
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
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error creating session: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Update an existing session file
 */
export async function updateSession(params: unknown) {
  try {
    const validated = updateSessionSchema.parse(params);
    
    const args = ['aiknowsys', 'update-session'];

    if (validated.date) {
      args.push('--date', validated.date);
    }

    // Operation-specific arguments
    switch (validated.operation) {
      case 'append':
        args.push('--appendSection', validated.section);
        break;
      case 'prepend':
        args.push('--prependSection', validated.section);
        break;
      case 'insert-after':
        args.push('--insert-after', validated.section);
        break;
      case 'insert-before':
        args.push('--insert-before', validated.section);
        break;
    }

    args.push('--content', validated.content);

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error updating session: ${error instanceof Error ? error.message : String(error)}` 
      }],
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
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error creating plan: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}

/**
 * Update an existing implementation plan
 */
export async function updatePlan(params: unknown) {
  try {
    const validated = updatePlanSchema.parse(params);
    
    const args = ['aiknowsys', 'update-plan', validated.planId];

    // Discriminated union guarantees correct fields exist for each operation
    if (validated.operation === 'set-status') {
      args.push('--set-status', validated.status);
    } else if (validated.operation === 'append') {
      args.push('--append', validated.content);
    } else if (validated.operation === 'prepend') {
      args.push('--prepend', validated.content);
    }

    const { stdout } = await execFileAsync('npx', args, { cwd: PROJECT_ROOT });
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text' as const, 
        text: `Error updating plan: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
}
