import { execFile } from 'child_process';
import { promisify } from 'util';
import {z} from 'zod';

const execFileAsync = promisify(execFile);

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
 */
export async function createSession(params: unknown) {
  try {
    const validated = createSessionSchema.parse(params);
    
    const args = [
      'aiknowsys',
      'create-session',
      '--title', validated.title
    ];

    if (validated.topics.length > 0) {
      args.push('--topics', validated.topics.join(','));
    }

    if (validated.plan) {
      args.push('--plan', validated.plan);
    }

    const { stdout } = await execFileAsync('npx', args);
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
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

    const { stdout } = await execFileAsync('npx', args);
    
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
 */
export async function createPlan(params: unknown) {
  try {
    const validated = createPlanSchema.parse(params);
    
    const args = [
      'aiknowsys',
      'create-plan',
      '--title', validated.title
    ];

    if (validated.author) {
      args.push('--author', validated.author);
    }

    if (validated.topics.length > 0) {
      args.push('--topics', validated.topics.join(','));
    }

    const { stdout } = await execFileAsync('npx', args);
    
    return {
      content: [{ type: 'text' as const, text: stdout.trim() }]
    };
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

    const { stdout } = await execFileAsync('npx', args);
    
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
