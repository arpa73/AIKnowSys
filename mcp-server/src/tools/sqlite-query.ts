/**
 * SQLite Query Tools
 * 
 * MCP tools for querying SQLite database (10-100x faster than file reading).
 * These wrap the core functions from lib/core/sqlite-query.ts.
 * 
 * Phase 1 Week 2 Day 7: MCP Tool Integration
 * Phase 2: Natural Language Query Support (Feb 2026)
 */

import {
  querySessionsSqlite as querySessionsCore,
  queryPlansSqlite as queryPlansCore,
  queryLearnedPatternsSqlite as queryLearnedPatternsCore,
  searchContextSqlite as searchContextCore,
  getDbStats as getDbStatsCore,
} from '../../../lib/core/sqlite-query.js';

import type {
  QuerySessionsOptions,
  QueryPlansOptions,
  QueryLearnedPatternsOptions,
} from '../../../lib/types/index.js';

import { parseQueryParams } from '../utils/query-parser.js';

/**
 * Query sessions from SQLite database
 * 
 * Supports three query styles:
 * 1. Natural language: { when: "last week", about: "MCP testing" }
 * 2. Relative dates: { last: 7, unit: "days", topic: "sqlite" }
 * 3. Structured: { dateAfter: "2026-02-06", topic: "mcp-tools" }
 * 
 * Much faster than scanning .aiknowsys/sessions/ directory.
 * 
 * @param params - Flexible query filters and database path
 * @returns MCP-compliant response with session data
 */
export async function querySessionsSqlite(params: {
  // Natural language
  when?: string;
  about?: string;
  // Relative dates
  last?: number;
  unit?: 'days' | 'weeks' | 'months';
  // Structured (backwards compatible)
  dbPath?: string;
  dateAfter?: string;
  dateBefore?: string;
  topic?: string;
  status?: string;
  includeContent?: boolean;
}) {
  try {
    // Parse flexible parameters into structured format
    const parsed = parseQueryParams(params);
    
    // Type-safe narrowing: Extract only QuerySessionsOptions fields
    const sessionOptions: QuerySessionsOptions = {
      dbPath: parsed.dbPath,
      dateAfter: parsed.dateAfter,
      dateBefore: parsed.dateBefore,
      topic: parsed.topic,
      status: parsed.status,
      includeContent: parsed.includeContent,
    };
    
    const result = await querySessionsCore(sessionOptions);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: true,
            message: `Failed to query sessions from SQLite: ${message}`,
            count: 0,
            sessions: [],
          }, null, 2),
        },
      ],
    };
  }
}

/**
 * Query plans from SQLite database
 * 
 * Supports three query styles:
 * 1. Natural language: { when: "last month", about: "optimization", status: "ACTIVE" }
 * 2. Relative dates: { last: 30, unit: "days", topic: "mcp-tools" }
 * 3. Structured: { status: "ACTIVE", author: "arno-paffen" }
 * 
 * Much faster than scanning .aiknowsys/PLAN_*.md files.
 * 
 * @param params - Flexible query filters and database path
 * @returns MCP-compliant response with plan data
 */
export async function queryPlansSqlite(params: {
  // Natural language
  when?: string;
  about?: string;
  // Relative dates
  last?: number;
  unit?: 'days' | 'weeks' | 'months';
  // Structured (backwards compatible)
  dbPath?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
  author?: string;
  topic?: string;
  priority?: 'high' | 'medium' | 'low';
  includeContent?: boolean;
}) {
  try {
    // Parse flexible parameters into structured format
    const parsed = parseQueryParams(params);
    
    // Type-safe narrowing: Extract only QueryPlansOptions fields
    const planOptions: QueryPlansOptions = {
      dbPath: parsed.dbPath,
      status: parsed.status as QueryPlansOptions['status'], // Zod validates enum at schema
      author: parsed.author,
      topic: parsed.topic,
      priority: parsed.priority,
      includeContent: parsed.includeContent,
    };
    
    const result = await queryPlansCore(planOptions);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: true,
            message: `Failed to query plans from SQLite: ${message}`,
            count: 0,
            plans: [],
          }, null, 2),
        },
      ],
    };
  }
}

/**
 * Query learned patterns from SQLite database
 * 
 * Supports three query styles:
 * 1. Natural language: { when: "last week", about: "error resolution" }
 * 2. Relative dates: { last: 14, unit: "days", category: "workarounds" }
 * 3. Structured: { category: "error_resolution", keywords: ["yaml", "parsing"] }
 * 
 * Much faster than scanning .aiknowsys/learned/ directory.
 * Patterns are stored as plans with 'learned_' prefix.
 * 
 * @param params - Flexible query filters and database path
 * @returns MCP-compliant response with pattern data
 */
export async function queryLearnedPatternsSqlite(params: {
  // Natural language
  when?: string;
  about?: string;
  // Relative dates
  last?: number;
  unit?: 'days' | 'weeks' | 'months';
  // Structured (backwards compatible)
  dbPath?: string;
  category?: string;
  keywords?: string[];
  includeContent?: boolean;
}) {
  try {
    // Parse flexible parameters into structured format
    const parsed = parseQueryParams(params);
    
    // Type-safe narrowing: Extract only QueryLearnedPatternsOptions fields
    const patternOptions: QueryLearnedPatternsOptions = {
      dbPath: parsed.dbPath,
      category: parsed.category,
      keywords: parsed.keywords,
      includeContent: parsed.includeContent,
    };
    
    const result = await queryLearnedPatternsCore(patternOptions);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: true,
            message: `Failed to query learned patterns from SQLite: ${message}`,
            count: 0,
            patterns: [],
          }, null, 2),
        },
      ],
    };
  }
}

/**
 * Full-text search across all content in SQLite database
 * 
 * Searches sessions, plans, and learned patterns simultaneously.
 * Much faster than grep_search across file system.
 * Returns ranked results with snippets.
 * 
 * @param params - Search query, database path, and optional limit
 * @returns MCP-compliant response with search results
 */
export async function searchContextSqlite(params: {
  dbPath?: string;
  query: string;
  limit?: number;
}) {
  try {
    const dbPath = params.dbPath || '.aiknowsys/knowledge.db';
    const result = await searchContextCore({ ...params, dbPath });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: true,
            message: `Failed to search context in SQLite: ${message}`,
            count: 0,
            results: [],
            query: params.query,
          }, null, 2),
        },
      ],
    };
  }
}

/**
 * Get database statistics
 * 
 * Returns record counts (sessions, plans, learned patterns) and database size.
 * Useful for monitoring and debugging.
 * Uses optimized COUNT(*) queries for speed.
 * 
 * @param params - Database path
 * @returns MCP-compliant response with statistics
 */
export async function getDbStatsSqlite(params: {
  dbPath?: string;
}) {
  try {
    const dbPath = params.dbPath || '.aiknowsys/knowledge.db';
    const result = await getDbStatsCore({ dbPath });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: true,
            message: `Failed to get database stats: ${message}`,
            sessions: 0,
            plans: 0,
            learned: 0,
            total: 0,
            dbSize: 0,
            dbPath: params.dbPath,
          }, null, 2),
        },
      ],
    };
  }
}
