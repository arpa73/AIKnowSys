/**
 * SQLite Query Tools
 * 
 * MCP tools for querying SQLite database (10-100x faster than file reading).
 * These wrap the core functions from lib/core/sqlite-query.ts.
 * 
 * Phase 1 Week 2 Day 7: MCP Tool Integration
 */

import {
  querySessionsSqlite as querySessionsCore,
  queryPlansSqlite as queryPlansCore,
  queryLearnedPatternsSqlite as queryLearnedPatternsCore,
  searchContextSqlite as searchContextCore,
  getDbStats as getDbStatsCore,
} from '../../../lib/core/sqlite-query.js';

/**
 * Query sessions from SQLite database
 * 
 * Much faster than scanning .aiknowsys/sessions/ directory.
 * Supports filtering by date range, topic, and status.
 * 
 * @param params - Query filters and database path
 * @returns MCP-compliant response with session data
 */
export async function querySessionsSqlite(params: {
  dbPath: string;
  dateAfter?: string;
  dateBefore?: string;
  topic?: string;
  status?: string;
}) {
  try {
    const result = await querySessionsCore(params);

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
 * Much faster than scanning .aiknowsys/PLAN_*.md files.
 * Supports filtering by status, author, topic, and priority.
 * 
 * @param params - Query filters and database path
 * @returns MCP-compliant response with plan data
 */
export async function queryPlansSqlite(params: {
  dbPath: string;
  status?: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
  author?: string;
  topic?: string;
  priority?: 'high' | 'medium' | 'low';
}) {
  try {
    const result = await queryPlansCore(params);

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
 * Much faster than scanning .aiknowsys/learned/ directory.
 * Patterns are stored as plans with 'learned_' prefix.
 * Supports filtering by category and keywords.
 * 
 * @param params - Query filters and database path
 * @returns MCP-compliant response with pattern data
 */
export async function queryLearnedPatternsSqlite(params: {
  dbPath: string;
  category?: string;
  keywords?: string[];
}) {
  try {
    const result = await queryLearnedPatternsCore(params);

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
  dbPath: string;
  query: string;
  limit?: number;
}) {
  try {
    const result = await searchContextCore(params);

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
  dbPath: string;
}) {
  try {
    const result = await getDbStatsCore(params);

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
