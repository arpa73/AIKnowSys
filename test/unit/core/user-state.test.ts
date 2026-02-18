import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import Database from 'better-sqlite3';
import {
  getUserState,
  setUserFocus,
  clearUserFocus,
  setActivePlan,
} from '../../../lib/core/user-state.js';
import { getKnowledgeDb } from '../../../lib/context/db.js';

vi.mock('../../../lib/context/db.js', () => ({
  getKnowledgeDb: vi.fn(),
}));

describe('User State', () => {
  let db: Database.Database;
  const mockedGetKnowledgeDb = getKnowledgeDb as MockedFunction<typeof getKnowledgeDb>;

  beforeEach(() => {
    db = new Database(':memory:');

    db.exec(`
      CREATE TABLE user_state (
        user_id TEXT PRIMARY KEY,
        project_id TEXT,
        active_plan_id TEXT,
        last_session_id TEXT,
        focus_context TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE plans (
        id TEXT PRIMARY KEY
      );
    `);

    mockedGetKnowledgeDb.mockResolvedValue(db);
  });

  afterEach(() => {
    db.close();
    vi.clearAllMocks();
  });

  it('returns null when no user state exists', async () => {
    const state = await getUserState('user1', 'proj1');
    expect(state).toBeNull();
  });

  it('sets focus and returns parsed focus context', async () => {
    await setUserFocus('user1', 'proj1', {
      files: ['lib/core/constraints.ts'],
      topics: ['constraints'],
      task: 'validate',
    });

    const state = await getUserState('user1', 'proj1');

    expect(state).not.toBeNull();
    expect(state?.userId).toBe('user1');
    expect(state?.projectId).toBe('proj1');
    expect(state?.focusContext).toEqual({
      files: ['lib/core/constraints.ts'],
      topics: ['constraints'],
      task: 'validate',
    });
  });

  it('clears focus context for an existing user state row', async () => {
    await setUserFocus('user1', 'proj1', {
      files: ['lib/core/user-state.ts'],
    });

    await clearUserFocus('user1', 'proj1');

    const state = await getUserState('user1', 'proj1');
    expect(state).not.toBeNull();
    expect(state?.focusContext).toBeUndefined();
  });

  it('throws when setting active plan that does not exist', async () => {
    await expect(setActivePlan('user1', 'proj1', 'PLAN_MISSING')).rejects.toThrow(
      'Plan PLAN_MISSING does not exist'
    );
  });

  it('sets active plan when plan exists', async () => {
    db.prepare('INSERT INTO plans (id) VALUES (?)').run('PLAN_OK');

    await setActivePlan('user1', 'proj1', 'PLAN_OK');

    const state = await getUserState('user1', 'proj1');
    expect(state).not.toBeNull();
    expect(state?.activePlanId).toBe('PLAN_OK');
    expect(state?.projectId).toBe('proj1');
  });
});
