import type { ToolMetadata } from '../tool-registry.js';
import { z } from 'zod';
import {
  querySessionsSqlite,
  queryPlansSqlite,
  queryLearnedPatternsSqlite,
  searchContextSqlite,
  getDbStatsSqlite,
} from '../../tools/sqlite-query.js';

/**
 * SQLite tools - High-performance database queries
 * These tools provide 10-100x faster query performance with progressive detail modes
 */
export const SQLITE_TOOLS: ToolMetadata[] = [
  {
    name: 'query_sessions_sqlite',
    description:
      'Query sessions with 4 levels of detail for token efficiency. Modes: preview (150 tokens), metadata (500 tokens), section (1.2K tokens), full (22K tokens). Supports natural language (when/about) and structured filters.',
    category: 'sqlite',
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
    handler: querySessionsSqlite,
  },
  {
    name: 'query_plans_sqlite',
    description:
      'Query plans with 4 levels of detail for token efficiency. Modes: preview (150 tokens), metadata (500 tokens), section (1.2K tokens), full (22K tokens). Supports natural language and structured filters.',
    category: 'sqlite',
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
    handler: queryPlansSqlite,
  },
  {
    name: 'query_learned_patterns_sqlite',
    description:
      'Query learned patterns with flexible natural language or structured parameters. Returns metadata-only by default (95% savings).',
    category: 'sqlite',
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
    handler: queryLearnedPatternsSqlite,
  },
  {
    name: 'search_context_sqlite',
    description:
      'Full-text search across all content using SQLite FTS. Returns ranked snippets. 10-100x faster than file-based search.',
    category: 'sqlite',
    tags: ['search', 'database', 'fast', 'full-text'],
    inputSchema: z.object({
      dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
      query: z.string().min(1),
      limit: z.number().int().positive().optional(),
    }),
    handler: searchContextSqlite,
  },
  {
    name: 'get_db_stats_sqlite',
    description:
      'Get SQLite database statistics: record counts, database size, last updated. Use for monitoring and health checks.',
    category: 'sqlite',
    tags: ['database', 'stats', 'monitoring', 'health'],
    inputSchema: z.object({
      dbPath: z.string().optional().default('.aiknowsys/knowledge.db'),
    }),
    handler: getDbStatsSqlite,
  },
];
