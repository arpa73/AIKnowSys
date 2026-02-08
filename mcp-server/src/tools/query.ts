/**
 * Query Tools
 * 
 * Fast access to plans and sessions without terminal spawning
 * or JSON parsing. Direct function calls with structured returns.
 */

import { queryPlans } from '../../../lib/commands/query-plans.js';
import { querySessions } from '../../../lib/commands/query-sessions.js';
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
