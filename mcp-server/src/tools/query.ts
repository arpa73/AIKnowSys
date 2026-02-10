/**
 * Query Tools
 * 
 * Fast access to plans and sessions without terminal spawning
 * or JSON parsing. Direct function calls with structured returns.
 */

import { queryPlans } from '../../../lib/commands/query-plans.js';
import { querySessions } from '../../../lib/commands/query-sessions.js';
import { rebuildIndex } from '../../../lib/commands/rebuild-index.js';
import { syncPlans as syncPlansCommand } from '../../../lib/commands/sync-plans.js';
import type { PlanMetadata, SessionMetadata } from '../../../lib/context/types.js';

/**
 * Get all active implementation plans
 * 
 * Returns structured data about currently active plans.
 * Much faster than reading CURRENT_PLAN.md or using grep_search.
 */
export async function getActivePlans() {
  try {
    // Use existing query-plans command with ACTIVE filter
    const result = await queryPlans({
      status: 'ACTIVE',
      json: true,
      _silent: true,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              count: result.count,
              plans: result.plans.map((plan: PlanMetadata) => ({
                id: plan.id,
                title: plan.title,
                author: plan.author,
                status: plan.status,
                created: plan.created,
                updated: plan.updated,
                file: plan.file,
                topics: plan.topics || [],
              })),
            },
            null,
            2
          ),
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
            message: `Failed to query active plans: ${message}`,
            count: 0,
            plans: [],
          }),
        },
      ],
    };
  }
}

/**
 * Query plans with filters
 * 
 * Full-featured plan querying with multiple filter options:
 * - status: ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED
 * - author: Plan author (git username)
 * - topic: Fuzzy match on topics array
 * - updatedAfter/updatedBefore: Date range filtering
 * 
 * Returns structured data about matching plans.
 */
export async function queryPlansWithFilters(params: {
  status?: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
  author?: string;
  topic?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}) {
  try {
    const result = await queryPlans({
      ...params,
      json: true,
      _silent: true,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              count: result.count,
              filters: params,
              plans: result.plans.map((plan: PlanMetadata) => ({
                id: plan.id,
                title: plan.title,
                author: plan.author,
                status: plan.status,
                created: plan.created,
                updated: plan.updated,
                file: plan.file,
                topics: plan.topics || [],
              })),
            },
            null,
            2
          ),
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
            message: `Failed to query plans: ${message}`,
            filters: params,
            count: 0,
            plans: [],
          }),
        },
      ],
    };
  }
}

/**
 * Query sessions with filters
 * 
 * Full-featured session querying with multiple filter options:
 * - date: Exact date (YYYY-MM-DD)
 * - dateAfter/dateBefore: Date range filtering
 * - topic: Fuzzy match on topics array
 * - plan: Plan reference (PLAN_xyz)
 * - days: Last N days (convenience filter)
 * 
 * Returns structured data about matching sessions.
 */
export async function querySessionsWithFilters(params: {
  date?: string;
  dateAfter?: string;
  dateBefore?: string;
  topic?: string;
  plan?: string;
  days?: number;
}) {
  try {
    const result = await querySessions({
      ...params,
      json: true,
      _silent: true,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              count: result.count,
              filters: params,
              sessions: result.sessions.map((session: SessionMetadata) => ({
                date: session.date,
                topic: session.topic,
                topics: session.topics || [],
                plan: session.plan,
                file: session.file,
              })),
            },
            null,
            2
          ),
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
            message: `Failed to query sessions: ${message}`,
            filters: params,
            count: 0,
            sessions: [],
          }),
        },
      ],
    };
  }
}

/**
 * Get plans by specific status
 * 
 * Simpler wrapper than queryPlansWithFilters for status-only queries.
 * 
 * @param status - Plan status (ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED)
 */
export async function getPlansByStatus(status: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED') {
  return queryPlansWithFilters({ status });
}

/**
 * Get all plans with metadata
 * 
 * Returns complete inventory of all plans regardless of status.
 * No filters applied.
 */
export async function getAllPlans() {
  return queryPlansWithFilters({});
}

/**
 * Get session by specific date
 * 
 * Returns session file for a specific date (YYYY-MM-DD).
 * Simpler wrapper than querySessionsWithFilters for date-only queries.
 * 
 * @param date - Session date in YYYY-MM-DD format
 */
export async function getSessionByDate(date: string) {
  return querySessionsWithFilters({ date });
}

/**
 * Rebuild context index
 * 
 * Rebuilds .aiknowsys/context-index.json from markdown files.
 * Use after manual file edits or when index is corrupted.
 */
export async function rebuildContextIndex() {
  try {
    await rebuildIndex({
      json: true,
      _silent: true,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: 'Context index rebuilt successfully',
          }),
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
            message: `Failed to rebuild index: ${message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Sync developer plan pointers to team index
 * 
 * Reads all .aiknowsys/plans/active-*.md files and generates
 * .aiknowsys/CURRENT_PLAN.md team index.
 * 
 * Critical for multi-developer workflow.
 */
export async function syncPlans() {
  try {
    await syncPlansCommand({
      _silent: true,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: 'Plan synchronization complete',
            file: '.aiknowsys/CURRENT_PLAN.md',
          }),
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
            message: `Failed to sync plans: ${message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Get recent session files with metadata
 * 
 * @param days - Number of days to look back (default: 7)
 * 
 * Returns session metadata (topics, dates, plan references).
 * Faster than list_dir + reading each file.
 * Works with indexed session data from context-index.json.
 */
export async function getRecentSessions(days: number = 7) {
  try {
    // Use existing query-sessions command with days filter
    const result = await querySessions({
      days,
      json: true,
      _silent: true,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              count: result.count,
              daysQueried: days,
              sessions: result.sessions.map((session: SessionMetadata) => ({
                date: session.date,
                topic: session.topic,
                topics: session.topics || [],
                plan: session.plan,
                file: session.file,
              })),
            },
            null,
            2
          ),
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
            message: `Failed to query sessions: ${message}`,
            count: 0,
            sessions: [],
          }),
        },
      ],
    };
  }
}
