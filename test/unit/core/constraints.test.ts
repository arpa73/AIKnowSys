import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import Database from 'better-sqlite3';
import { checkConstraints } from '../../../lib/core/constraints.js';
import { getKnowledgeDb } from '../../../lib/context/db.js';
import { EventType } from '../../../lib/events/types.js';

// Mock getKnowledgeDb
vi.mock('../../../lib/context/db.js', () => ({
  getKnowledgeDb: vi.fn(),
}));

describe('Constraint Engine', () => {
  let db: Database.Database;
  const mockedGetKnowledgeDb = getKnowledgeDb as MockedFunction<typeof getKnowledgeDb>;

  beforeEach(() => {
    db = new Database(':memory:');
    
    // Setup schema for tests
    db.exec(`
      CREATE TABLE reviews (
        id TEXT PRIMARY KEY,
        target_id TEXT,
        status TEXT
      );
      CREATE TABLE knowledge_events (
        event_id TEXT PRIMARY KEY,
        plan_id TEXT,
        event_type TEXT
      );
      CREATE TABLE user_state (
        user_id TEXT, 
        project_id TEXT,
        active_plan_id TEXT,
        last_session_id TEXT,
        focus_context TEXT,
        updated_at TEXT
      );
    `);

    // Mock getKnowledgeDb to return our in-memory db
    mockedGetKnowledgeDb.mockResolvedValue(db);
  });

  afterEach(() => {
    db.close();
    vi.clearAllMocks();
  });

  it('should BLOCK completing a plan if pending reviews exist', async () => {
    // Setup: Insert a pending review
    db.prepare('INSERT INTO reviews (id, target_id, status) VALUES (\'rev1\', \'PLAN_A\', \'PENDING\')').run();

    const result = await checkConstraints('COMPLETE_PLAN', { 
      userId: 'user1', 
      projectId: 'proj1', 
      targetId: 'PLAN_A' 
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers).toBeDefined();
      expect(result.blockers?.[0]).toContain('pending review');
  });

  it('should ALLOW completing a plan if all reviews are ADDRESSED', async () => {
    // Setup: Insert an addressed review and a validation pass event
    db.prepare('INSERT INTO reviews (id, target_id, status) VALUES (\'rev1\', \'PLAN_A\', \'ADDRESSED\')').run();
    db.prepare('INSERT INTO knowledge_events (event_id, plan_id, event_type) VALUES (?, ?, ?)')
      .run('evt1', 'PLAN_A', EventType.VALIDATION_PASSED);

    const result = await checkConstraints('COMPLETE_PLAN', { 
      userId: 'user1', 
      projectId: 'proj1', 
      targetId: 'PLAN_A' 
    });

    expect(result.allowed).toBe(true);
  });

  it('should BLOCK completing a plan if NO validation event exists', async () => {
    // Setup: No validation events
    const result = await checkConstraints('COMPLETE_PLAN', { 
      userId: 'user1', 
      projectId: 'proj1', 
      targetId: 'PLAN_A' 
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers?.[0]).toContain('No \'VALIDATION_PASSED\' event');
  });

  it('should BLOCK merging a plan if NO validation event exists', async () => {
    const result = await checkConstraints('MERGE_PLAN', {
      userId: 'user1',
      projectId: 'proj1',
      targetId: 'PLAN_A'
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers?.[0]).toContain('No \'VALIDATION_PASSED\' event');
  });

  it('should BLOCK canceling a plan if NO validation event exists', async () => {
    const result = await checkConstraints('CANCEL_PLAN', {
      userId: 'user1',
      projectId: 'proj1',
      targetId: 'PLAN_A'
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers?.[0]).toContain('No \'VALIDATION_PASSED\' event');
  });

  it('should ALLOW canceling a plan when reviews are addressed and validation exists', async () => {
    db.prepare('INSERT INTO reviews (id, target_id, status) VALUES (\'rev1\', \'PLAN_A\', \'ADDRESSED\')').run();
    db.prepare('INSERT INTO knowledge_events (event_id, plan_id, event_type) VALUES (?, ?, ?)')
      .run('evt1', 'PLAN_A', EventType.VALIDATION_PASSED);

    const result = await checkConstraints('CANCEL_PLAN', {
      userId: 'user1',
      projectId: 'proj1',
      targetId: 'PLAN_A'
    });

    expect(result.allowed).toBe(true);
  });

  it('should BLOCK editing core files without an active plan', async () => {
    // Setup: User state has no active plan
    db.prepare('INSERT INTO user_state (user_id, project_id, active_plan_id) VALUES (\'user1\', \'proj1\', NULL)').run();

    const result = await checkConstraints('EDIT_CORE_FILE', { 
      userId: 'user1', 
      projectId: 'proj1' 
    });

    expect(result.allowed).toBe(false);
      expect(result.blockers?.[0]).toContain('without an Active Plan');
  });

  it('should ALLOW editing core files WITH an active plan', async () => {
    // Setup: User state has active plan
    db.prepare('INSERT INTO user_state (user_id, project_id, active_plan_id) VALUES (\'user1\', \'proj1\', \'PLAN_A\')').run();

    const result = await checkConstraints('EDIT_CORE_FILE', { 
      userId: 'user1', 
      projectId: 'proj1' 
    });

    expect(result.allowed).toBe(true);
  });
});
