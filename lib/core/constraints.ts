// lib/core/constraints.ts
import { getKnowledgeDb } from '../context/db.js';
import { EventType } from '../events/types.js';
import { AIFriendlyErrorBuilder } from '../utils/error-builder.js';
import { getUserState } from './user-state.js';

export type ActionType = 
  | 'COMPLETE_PLAN' 
  | 'CANCEL_PLAN'
  | 'MERGE_PLAN' 
  | 'START_SESSION' 
  | 'EDIT_CORE_FILE';

export interface ConstraintCheckResult {
  allowed: boolean;
  reason?: string;
  blockers?: string[];
}

/**
 * Constraint Engine: pre-condition checks for state-changing actions.
 *
 * Design:
 * - Fail-fast: block actions that violate system invariants.
 * - Explicit blockers: return structured reasons for debugging/UX.
 * - Event-sourced validation: lifecycle-ending actions require proof of validation.
 *
 * Lifecycle-ending actions (`COMPLETE_PLAN`, `CANCEL_PLAN`, `MERGE_PLAN`) require:
 * 1) No pending/active reviews.
 * 2) At least one `VALIDATION_PASSED` event for the target plan.
 *
 * Edit actions (`EDIT_CORE_FILE`) require:
 * 1) An active plan in user_state.
 */

/**
 * Check if an action is allowed based on current system state (Constraints)
 */
export async function checkConstraints(
  action: ActionType, 
  context: { 
    userId: string; 
    projectId: string; 
    targetId?: string; // planId or sessionId
    targetDir?: string;
  }
): Promise<ConstraintCheckResult> {
  const db = await getKnowledgeDb(context.targetDir ?? process.cwd());
  const blockers: string[] = [];

  switch (action) {
    case 'COMPLETE_PLAN':
    case 'CANCEL_PLAN':
    case 'MERGE_PLAN': {
      if (!context.targetId) {
        throw new Error(`TargetId (planId) required for ${action} check`);
      }
      
      // Rule 1: No completing plan if there are PENDING or ACTIVE reviews
      const pendingReviews = db.prepare(`
        SELECT count(*) as count FROM reviews 
        WHERE target_id = ? AND status IN ('PENDING', 'ACTIVE')
      `).get(context.targetId) as { count: number };

      if (pendingReviews.count > 0) {
        blockers.push(`Plan has ${pendingReviews.count} pending review(s). Address them first.`);
      }

      // Rule 2: Validation event required (Event Sourcing check)
      // Must have at least one validation_passed event in the recent history linked to this plan
      // For now, we simulate this check or check strictly if events table is populated
      const validationEvents = db.prepare(`
        SELECT count(*) as count FROM knowledge_events 
        WHERE plan_id = ? AND event_type = ?
          AND (project_id = ? OR project_id IS NULL)
      `).get(context.targetId, EventType.VALIDATION_PASSED, context.projectId) as { count: number };

      if (validationEvents.count === 0) {
        blockers.push('No \'VALIDATION_PASSED\' event recorded for this plan. Run tests and log success using \'log_work_event\'.');
      }

      break;
    }
    
    case 'START_SESSION':
      // Rule: Check if previous session was closed properly? (Optional)
      break;

    case 'EDIT_CORE_FILE': {
      // Rule: Provide warning if editing core files without a Plan
      const userState = await getUserState(context.userId, context.projectId);
      if (!userState?.activePlanId) {
        blockers.push('Constraint Violation: You are editing core files without an Active Plan. Create or activate a plan first.');
      }
      break;
    }
  }

  if (blockers.length > 0) {
    return {
      allowed: false,
      reason: 'Action blocked by system constraints.',
      blockers
    };
  }

  return { allowed: true };
}

/**
 * Enforce constraints - throws error if blocked
 */
export async function enforceConstraints(
  action: ActionType, 
  context: { userId: string; projectId: string; targetId?: string; targetDir?: string }
): Promise<void> {
  const result = await checkConstraints(action, context);
  
  if (!result.allowed) {
    const friendlyError = AIFriendlyErrorBuilder.validationFailed(
      'constraints',
      result.reason || `Constraint violation for action: ${action}`,
      'Resolve all blockers before trying again.'
    );

    const blockerList = (result.blockers || []).map((blocker) => `- ${blocker}`).join('\n');
    const detailMessage = blockerList
      ? `${friendlyError.error.message}\n\nBlockers:\n${blockerList}`
      : friendlyError.error.message;

    throw new Error(detailMessage);
  }
}
