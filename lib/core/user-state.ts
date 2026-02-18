import { z } from 'zod';
import { getKnowledgeDb } from '../context/index.js';

// Types
export interface FocusContext {
  files?: string[];
  topics?: string[];
  task?: string;
}

export interface UserState {
  userId: string;
  projectId: string;
  activePlanId?: string;
  lastSessionId?: string;
  focusContext?: FocusContext;
  updatedAt: string;
}

interface UserStateRow {
  user_id: string;
  project_id: string;
  active_plan_id: string | null;
  last_session_id: string | null;
  focus_context: string | null;
  updated_at: string;
}

interface UserStateUpsertUpdates {
  focus_context?: string;
  active_plan_id?: string;
  last_session_id?: string;
}

// Zod Schema for FocusContext
export const FocusContextSchema = z.object({
  files: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  task: z.string().optional()
});

/**
 * Upsert user_state with provided field updates.
 */
async function upsertUserState(
  userId: string,
  projectId: string,
  updates: UserStateUpsertUpdates
): Promise<void> {
  const db = await getKnowledgeDb();
  const now = new Date().toISOString();

  const fields = Object.keys(updates) as Array<keyof UserStateUpsertUpdates>;
  if (fields.length === 0) {
    return;
  }

  const insertColumns = ['user_id', 'project_id', ...fields, 'updated_at'];
  const placeholders = insertColumns.map(() => '?').join(', ');
  const updateAssignments = [
    'project_id = excluded.project_id',
    ...fields.map((field) => `${field} = excluded.${field}`),
    'updated_at = excluded.updated_at'
  ].join(',\n      ');

  const values = [
    userId,
    projectId,
    ...fields.map((field) => updates[field]),
    now
  ];

  db.prepare(`
    INSERT INTO user_state (${insertColumns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT(user_id) DO UPDATE SET
      ${updateAssignments}
  `).run(...values);
}

/**
 * Get the current state for a user in a project
 */
export async function getUserState(userId: string, projectId: string): Promise<UserState | null> {
  const db = await getKnowledgeDb();
  const row = db.prepare(`
    SELECT user_id, project_id, active_plan_id, last_session_id, focus_context, updated_at
    FROM user_state
    WHERE user_id = ? AND project_id = ?
  `).get(userId, projectId) as UserStateRow | undefined;

  if (!row) return null;

  return {
    userId: row.user_id,
    projectId: row.project_id,
    activePlanId: row.active_plan_id ?? undefined,
    lastSessionId: row.last_session_id ?? undefined,
    focusContext: row.focus_context ? JSON.parse(row.focus_context) : undefined,
    updatedAt: row.updated_at
  };
}

/**
 * Set the user's focus context (files, topics) to constrain AI tools
 */
export async function setUserFocus(userId: string, projectId: string, context: FocusContext): Promise<void> {
  // Validate context
  const validContext = FocusContextSchema.parse(context);
  await upsertUserState(userId, projectId, {
    focus_context: JSON.stringify(validContext)
  });
}

/**
 * Clear the user's focus
 */
export async function clearUserFocus(userId: string, projectId: string): Promise<void> {
  const db = await getKnowledgeDb();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE user_state
    SET focus_context = NULL, updated_at = ?
    WHERE user_id = ? AND project_id = ?
  `).run(now, userId, projectId);
}

/**
 * Set the Active Plan pointer in the database
 * @throws Error if plan does not exist
 */
export async function setActivePlan(userId: string, projectId: string, planId: string): Promise<void> {
  const db = await getKnowledgeDb();
  
  // Verify plan exists
  const plan = db.prepare('SELECT id FROM plans WHERE id = ?').get(planId);
  if (!plan) {
    throw new Error(`Plan ${planId} does not exist`);
  }

  await upsertUserState(userId, projectId, {
    active_plan_id: planId
  });
}
