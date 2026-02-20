import type { ToolMetadata } from '../tool-registry.js';
import { z } from 'zod';
import {
  queryPlansWithFilters,
  querySessionsWithFilters,
  getPlansByStatus,
  getAllPlans,
  getSessionByDate,
  rebuildContextIndex,
  syncPlans,
} from '../../tools/query.js';
import { searchContext, findPattern, getSkillByName } from '../../tools/enhanced-query.js';
import { getActivePlanPointer } from '../../tools/mutations.js';

/**
 * Query tools - Query sessions, plans, and learned patterns
 * These tools provide flexible filtering and search capabilities
 */
export const QUERY_TOOLS: ToolMetadata[] = [
  {
    name: 'query_plans',
    description:
      'Query plans with flexible filters: status (ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED), author, topic, date range. Returns structured plan metadata.',
    category: 'query',
    tags: ['plans', 'filter', 'search', 'metadata'],
    inputSchema: z.object({
      status: z
        .enum(['ACTIVE', 'PAUSED', 'PLANNED', 'COMPLETE', 'CANCELLED'])
        .optional(),
      author: z.string().optional(),
      topic: z.string().optional(),
      updatedAfter: z.string().optional(),
      updatedBefore: z.string().optional(),
    }),
    handler: queryPlansWithFilters,
  },
  {
    name: 'query_sessions',
    description:
      'Query sessions with flexible filters: exact date, date range (dateAfter/dateBefore), topic, plan reference, or last N days. Returns structured session metadata.',
    category: 'query',
    tags: ['sessions', 'filter', 'search', 'metadata', 'date'],
    inputSchema: z.object({
      date: z.string().optional(),
      dateAfter: z.string().optional(),
      dateBefore: z.string().optional(),
      topic: z.string().optional(),
      plan: z.string().optional(),
      days: z.number().optional(),
    }),
    handler: querySessionsWithFilters,
  },
  {
    name: 'get_plans_by_status',
    description:
      'Get all plans with a specific status. Simpler than query_plans for status-only queries. Status values: ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED.',
    category: 'query',
    tags: ['plans', 'status', 'filter'],
    inputSchema: z.object({
      status: z.enum(['ACTIVE', 'PAUSED', 'PLANNED', 'COMPLETE', 'CANCELLED']),
    }),
    handler: async ({ status }) => getPlansByStatus(status),
  },
  {
    name: 'get_all_plans',
    description:
      'Get complete inventory of all plans with metadata (id, title, author, status, dates). No filters applied.',
    category: 'query',
    tags: ['plans', 'all', 'inventory', 'metadata'],
    inputSchema: z.object({}),
    handler: getAllPlans,
  },
  {
    name: 'get_session_by_date',
    description:
      'Get session file for a specific date (YYYY-MM-DD). Returns session metadata and content reference.',
    category: 'query',
    tags: ['sessions', 'date', 'specific'],
    inputSchema: z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD'),
    }),
    handler: async ({ date }) => getSessionByDate(date),
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
    name: 'sync_plans',
    description:
      'Sync plan metadata into the generated team plan index for human-readable overview output.',
    category: 'query',
    tags: ['plans', 'sync', 'maintenance', 'team'],
    inputSchema: z.object({}),
    handler: syncPlans,
  },
  {
    name: 'search_context',
    description:
      'Full-text search across plans, sessions, and learned patterns. Faster than grep_search for finding historical work.',
    category: 'query',
    tags: ['search', 'full-text', 'context', 'history'],
    inputSchema: z.object({
      query: z.string(),
      type: z.enum(['all', 'sessions', 'plans', 'learned']).optional(),
    }),
    handler: searchContext,
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
