import type { ToolMetadata } from '../tool-registry.js';
import { z } from 'zod';
import { createSession, createPlan, createReview, createLink, checkConstraintsTool } from '../../tools/mutations.js';
import {
  setPlanStatus,
  appendToPlan,
  prependToPlan,
  appendToSession,
  prependToSession,
  insertAfterSection,
  insertBeforeSection,
  updateSessionMetadata,
  updatePlanMetadata,
  archiveSessions,
  archivePlans,
} from '../../tools/split-mutations.js';

/**
 * Mutation tools - Create and modify sessions and plans
 * These tools provide write operations for session and plan management
 */
export const MUTATION_TOOLS: ToolMetadata[] = [
  {
    name: 'create_session',
    description:
      'Create a new session file with YAML frontmatter. Use when starting work on a new task or feature.',
    category: 'mutation',
    tags: ['sessions', 'create', 'new', 'yaml'],
    inputSchema: z.object({
      title: z.string().min(3),
      topics: z.array(z.string()).optional().default([]),
      status: z
        .enum(['active', 'paused', 'complete'])
        .optional()
        .default('active'),
    }),
    handler: createSession,
  },
  {
    name: 'create_review',
    description:
      'Create a review entry linked to a plan or session. Use for review workflows and constraint checks.',
    category: 'mutation',
    tags: ['reviews', 'create', 'workflow', 'constraints'],
    inputSchema: z.object({
      targetId: z.string().min(1),
      content: z.string().min(1),
      author: z.string().optional(),
      status: z.enum(['PENDING', 'ACTIVE', 'ADDRESSED']).optional().default('PENDING'),
    }),
    handler: createReview,
  },
  {
    name: 'create_link',
    description:
      'Create an explicit relationship link between entities (plan/session/review).',
    category: 'mutation',
    tags: ['links', 'relationships', 'graph', 'create'],
    inputSchema: z.object({
      sourceId: z.string().min(1),
      targetId: z.string().min(1),
      type: z.enum(['depends_on', 'relates_to', 'blocks', 'implements']),
      metadata: z.record(z.unknown()).optional(),
    }),
    handler: createLink,
  },
  {
    name: 'check_constraints',
    description:
      'Check whether an action is currently allowed by workflow constraints and return blockers if any.',
    category: 'mutation',
    tags: ['constraints', 'validation', 'workflow', 'guardrails'],
    inputSchema: z.object({
      action: z.enum(['COMPLETE_PLAN', 'MERGE_PLAN', 'START_SESSION', 'EDIT_CORE_FILE']),
      targetId: z.string().optional(),
      userId: z.string().optional(),
      projectId: z.string().optional(),
    }),
    handler: checkConstraintsTool,
  },
  {
    name: 'append_to_session',
    description:
      'Append content to a session section. Use for adding progress updates or notes.',
    category: 'mutation',
    tags: ['sessions', 'append', 'update', 'content'],
    inputSchema: z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
        .optional(),
      section: z.string().min(1),
      content: z.string().min(1),
    }),
    handler: appendToSession,
  },
  {
    name: 'prepend_to_session',
    description:
      'Prepend content to a session section. Use for adding critical updates or blockers at the top.',
    category: 'mutation',
    tags: ['sessions', 'prepend', 'update', 'critical'],
    inputSchema: z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
        .optional(),
      section: z.string().min(1),
      content: z.string().min(1),
    }),
    handler: prependToSession,
  },
  {
    name: 'insert_after_section',
    description:
      'Insert a new section after a pattern in the session file. Use for surgical placement of content.',
    category: 'mutation',
    tags: ['sessions', 'insert', 'section', 'placement'],
    inputSchema: z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
        .optional(),
      pattern: z.string().min(1),
      section: z.string().optional(),
      content: z.string().min(1),
    }),
    handler: insertAfterSection,
  },
  {
    name: 'insert_before_section',
    description:
      'Insert a new section before a pattern in the session file. Use for ordered content placement.',
    category: 'mutation',
    tags: ['sessions', 'insert', 'section', 'placement'],
    inputSchema: z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
        .optional(),
      pattern: z.string().min(1),
      section: z.string().optional(),
      content: z.string().min(1),
    }),
    handler: insertBeforeSection,
  },
  {
    name: 'create_plan',
    description:
      'Create a new implementation plan. Use when starting a significant feature or refactoring.',
    category: 'mutation',
    tags: ['plans', 'create', 'new', 'yaml'],
    inputSchema: z.object({
      id: z.string().min(1).regex(/^[a-z0-9_]+$/),
      title: z.string().min(3),
      type: z
        .enum(['feature', 'refactor', 'bugfix', 'research'])
        .optional()
        .default('feature'),
      priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
    }),
    handler: createPlan,
  },
  {
    name: 'set_plan_status',
    description:
      "Set a plan's status. Use for marking plans as ACTIVE, PAUSED, COMPLETE, or CANCELLED.",
    category: 'mutation',
    tags: ['plans', 'status', 'update', 'workflow'],
    inputSchema: z.object({
      planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
      status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED']),
    }),
    handler: setPlanStatus,
  },
  {
    name: 'append_to_plan',
    description:
      'Append progress notes to a plan. Use for documenting progress, decisions, or updates.',
    category: 'mutation',
    tags: ['plans', 'append', 'update', 'progress'],
    inputSchema: z.object({
      planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
      content: z.string().min(1),
    }),
    handler: appendToPlan,
  },
  {
    name: 'prepend_to_plan',
    description:
      'Prepend critical updates to a plan. Use for adding blockers, urgent changes, or breaking news at the top.',
    category: 'mutation',
    tags: ['plans', 'prepend', 'update', 'critical'],
    inputSchema: z.object({
      planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
      content: z.string().min(1),
    }),
    handler: prependToPlan,
  },
  {
    name: 'update_session_metadata',
    description:
      'Update session YAML frontmatter metadata. Use for adding topics, file references, or changing status. At least one operation required.',
    category: 'mutation',
    tags: ['sessions', 'metadata', 'yaml', 'update'],
    inputSchema: z
      .object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
          .optional(),
        addTopic: z.string().optional(),
        addFile: z.string().optional(),
        setStatus: z.enum(['in-progress', 'complete', 'abandoned']).optional(),
      })
      .refine((data) => data.addTopic || data.addFile || data.setStatus, {
        message:
          'At least one metadata operation required (addTopic, addFile, or setStatus)',
      }),
    handler: updateSessionMetadata,
  },
  {
    name: 'update_plan_metadata',
    description:
      'Update plan YAML frontmatter metadata. Use for updating author or adding topics. At least one field required.',
    category: 'mutation',
    tags: ['plans', 'metadata', 'yaml', 'update'],
    inputSchema: z
      .object({
        planId: z.string().regex(/^PLAN_[a-z0-9_]+$/),
        author: z.string().optional(),
        topics: z.array(z.string()).optional(),
      })
      .refine((data) => data.author || data.topics, {
        message: 'At least one metadata field required (author or topics)',
      }),
    handler: updatePlanMetadata,
  },
  {
    name: 'archive_sessions',
    description:
      'Archive old session files to archive folder. Moves sessions older than specified days (default: 30). Use dry-run to preview.',
    category: 'mutation',
    tags: ['sessions', 'archive', 'cleanup', 'maintenance'],
    inputSchema: z.object({
      days: z.number().min(1).optional().default(30),
      dryRun: z.boolean().optional().default(false),
    }),
    handler: archiveSessions,
  },
  {
    name: 'archive_plans',
    description:
      'Archive plans by status to archive folder. Moves plans with specified status (COMPLETE, CANCELLED, PAUSED) older than threshold days. Use dry-run to preview.',
    category: 'mutation',
    tags: ['plans', 'archive', 'cleanup', 'maintenance'],
    inputSchema: z.object({
      status: z
        .enum(['COMPLETE', 'CANCELLED', 'PAUSED'])
        .optional()
        .default('COMPLETE'),
      days: z.number().min(0).optional().default(7),
      dryRun: z.boolean().optional().default(false),
    }),
    handler: archivePlans,
  },
];
