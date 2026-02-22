import type { ToolMetadata } from '../tool-registry.js';
import { z } from 'zod';
import {
  querySessions,
  getSession,
  queryPlans,
  queryLearnedPatterns,
  searchContext,
  getDbStats,
} from '../../tools/sqlite-query.js';
import { findPattern, getSkillByName } from '../../tools/enhanced-query.js';
import { getActivePlanPointer } from '../../tools/mutations.js';
import { rebuildContextIndex } from '../../tools/context.js';

/**
 * Query tools - High-performance SQLite queries for context finding
 */
export const QUERY_TOOLS: ToolMetadata[] = [
  {
    name: 'query_sessions',
    description:
      'Query sessions with 4 levels of detail for token efficiency. Modes: preview (150 tokens), metadata (500 tokens), section (1.2K tokens), full (22K tokens). Supports natural language (when/about) and structured filters.',
    category: 'query',
    tags: ['sessions', 'database', 'fast', 'progressive', 'natural-language'],
    inputSchema: z.object({
      mode: z
        .enum(['preview', 'metadata', 'section', 'full'])
        .optional()
        .default('metadata'),
      section: z.string().optional(),
      when: z.string().optional(),
      about: z.string().optional(),
      last: z.number().optional(),
      unit: z.enum(['days', 'weeks', 'months']).optional(),
      dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
      dateAfter: z.string().optional(),
      dateBefore: z.string().optional(),
      topic: z.string().optional(),
      status: z.string().optional(),
      includeContent: z.boolean().optional().default(false),
    }),
    handler: querySessions,
  },
  {
    name: 'get_session',
    description:
      'Get a single session with related entities (plan, reviews, events) in one response.',
    category: 'query',
    tags: ['sessions', 'database', 'related', 'single-record'],
    inputSchema: z.object({
      sessionId: z.string().min(1),
      dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
    }),
    handler: getSession,
  },
  {
    name: 'query_plans',
    description:
      'Query plans with 4 levels of detail for token efficiency. Modes: preview (150 tokens), metadata (500 tokens), section (1.2K tokens), full (22K tokens). Supports natural language and structured filters.',
    category: 'query',
    tags: ['plans', 'database', 'fast', 'progressive', 'natural-language'],
    inputSchema: z.object({
      mode: z
        .enum(['preview', 'metadata', 'section', 'full'])
        .optional()
        .default('metadata'),
      section: z.string().optional(),
      when: z.string().optional(),
      about: z.string().optional(),
      last: z.number().optional(),
      unit: z.enum(['days', 'weeks', 'months']).optional(),
      dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
      status: z
        .enum(['ACTIVE', 'PAUSED', 'PLANNED', 'COMPLETE', 'CANCELLED'])
        .optional(),
      author: z.string().optional(),
      topic: z.string().optional(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
      includeContent: z.boolean().optional().default(false),
    }),
    handler: queryPlans,
  },
  {
    name: 'query_learned_patterns',
    description:
      'Query learned patterns with flexible natural language or structured parameters. Returns metadata-only by default (95% savings).',
    category: 'query',
    tags: ['patterns', 'database', 'fast', 'natural-language'],
    inputSchema: z.object({
      when: z.string().optional(),
      about: z.string().optional(),
      last: z.number().optional(),
      unit: z.enum(['days', 'weeks', 'months']).optional(),
      dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
      category: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      includeContent: z.boolean().optional().default(false),
    }),
    handler: queryLearnedPatterns,
  },
  {
    name: 'search_context',
    description:
      'Full-text search across all content using SQLite FTS. Returns ranked snippets. 10-100x faster than file-based search.',
    category: 'query',
    tags: ['search', 'database', 'fast', 'full-text'],
    inputSchema: z.object({
      dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
      query: z.string().min(1),
      limit: z.number().int().positive().optional(),
    }),
    handler: searchContext,
  },
  {
    name: 'get_db_stats',
    description:
      'Get SQLite database statistics: record counts, database size, last updated. Use for monitoring and health checks.',
    category: 'query',
    tags: ['database', 'stats', 'monitoring', 'health'],
    inputSchema: z.object({
      dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
    }),
    handler: getDbStats,
  },
  {
    name: 'get_active_plan_pointer',
    description:
      'Get active plan pointer for a user from SQLite user_state. Returns activePlanId or null.',
    category: 'query',
    tags: ['plans', 'pointer', 'user-state', 'active-plan'],
    inputSchema: z.object({
      userId: z.string().optional(),
      projectId: z.string().optional(),
    }),
    handler: getActivePlanPointer,
  },
  {
    name: 'rebuild_index',
    description:
      'Rebuild context index (.aiknowsys/context-index.json) from markdown files. Use after manual file edits or when index is corrupted.',
    category: 'query',
    tags: ['index', 'rebuild', 'maintenance', 'sync'],
    inputSchema: z.object({}),
    handler: rebuildContextIndex,
  },
  {
    name: 'find_pattern',
    description:
      'Find learned patterns by keywords and category. Use for discovering project-specific solutions.',
    category: 'query',
    tags: ['patterns', 'learned', 'search', 'keywords'],
    inputSchema: z.object({
      keywords: z.array(z.string()),
      category: z.string().optional(),
    }),
    handler: findPattern,
  },
  {
    name: 'get_skill_by_name',
    description:
      'Get a specific skill by exact name. Returns full skill content with metadata.',
    category: 'query',
    tags: ['skills', 'exact', 'name', 'workflow'],
    inputSchema: z.object({
      skillName: z.string(),
    }),
    handler: getSkillByName,
  },
];
