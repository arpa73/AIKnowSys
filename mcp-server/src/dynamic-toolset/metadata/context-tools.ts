import type { ToolMetadata } from '../tool-registry.js';
import { z } from 'zod';
import { getCriticalInvariants, getValidationMatrix } from '../../tools/context.js';
import { findSkillForTask } from '../../tools/skills.js';

/**
 * Context tools - Core project context (invariants, validation, patterns)
 * These tools provide quick access to critical project information
 */
export const CONTEXT_TOOLS: ToolMetadata[] = [
  {
    name: 'get_critical_invariants',
    description:
      'Returns the 8 critical invariants that must ALWAYS be enforced. These are non-optional rules that prevent bugs and maintain code quality. Use this instead of reading CODEBASE_ESSENTIALS.md manually.',
    category: 'context',
    tags: ['rules', 'invariants', 'essentials', 'mandatory'],
    inputSchema: z.object({
      projectId: z.string().optional(),
    }),
    handler: (args) => getCriticalInvariants(args.projectId),
  },
  {
    name: 'get_validation_matrix',
    description:
      'Returns all validation commands with their purpose and expected output. Use this to know which commands to run after making changes (tests, linting, deliverables, etc.).',
    category: 'context',
    tags: ['validation', 'commands', 'testing', 'matrix'],
    inputSchema: z.object({
      projectId: z.string().optional(),
    }),
    handler: (args) => getValidationMatrix(args.projectId),
  },
  {
    name: 'find_skill_for_task',
    description:
      'AI describes a task in natural language, gets the most relevant skill workflow. Returns full skill content if found. Use this instead of trying to match trigger words or reading skills manually.',
    category: 'context',
    tags: ['skills', 'workflow', 'natural-language', 'discovery'],
    inputSchema: z.object({
      task: z.string().min(3),
    }),
    handler: findSkillForTask,
  },
];
