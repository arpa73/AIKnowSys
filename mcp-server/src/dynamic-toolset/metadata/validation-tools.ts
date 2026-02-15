import type { ToolMetadata } from '../tool-registry.js';
import { z } from 'zod';
import {
  validateDeliverables,
  checkTddCompliance,
  validateSkill,
} from '../../tools/validation.js';

/**
 * Validation tools - Validate deliverables, TDD, and skills
 * These tools ensure code quality and consistency
 */
export const VALIDATION_TOOLS: ToolMetadata[] = [
  {
    name: 'validate_deliverables',
    description:
      'Validate all template files match non-template equivalents. Use before committing changes to skills or templates.',
    category: 'validation',
    tags: ['templates', 'validate', 'consistency', 'quality'],
    inputSchema: z.object({
      fix: z.boolean().optional().default(false),
    }),
    handler: validateDeliverables,
  },
  {
    name: 'check_tdd_compliance',
    description:
      'Check if changed files have corresponding test files. Use before committing code changes.',
    category: 'validation',
    tags: ['testing', 'tdd', 'compliance', 'quality'],
    inputSchema: z.object({
      changedFiles: z.array(z.string()),
    }),
    handler: checkTddCompliance,
  },
  {
    name: 'validate_skill',
    description:
      'Validate skill file format and content. Use when creating or modifying skills.',
    category: 'validation',
    tags: ['skills', 'validate', 'format', 'quality'],
    inputSchema: z.object({
      skillPath: z.string(),
    }),
    handler: validateSkill,
  },
];
