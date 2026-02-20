import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { closeAllKnowledgeDbs } from '../../lib/context/db.js';

describe('SQLite review/link round-trip', () => {
  const testDir = path.join(process.cwd(), 'test-tmp-create-review-link-core');

  beforeEach(async () => {
    closeAllKnowledgeDbs();
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    closeAllKnowledgeDbs();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('persists reviews and links and returns them from subsequent queries', async () => {
    const storage = new SqliteStorage();
    await storage.init(testDir);

    const now = new Date().toISOString();
    const projectId = 'project_review_link_test';

    await storage.insertProject({
      id: projectId,
      name: projectId,
      created_at: now,
      updated_at: now,
    });

    await storage.insertReview({
      id: 'review_roundtrip_1',
      project_id: projectId,
      target_id: 'PLAN_roundtrip_1',
      author: 'roundtrip-test',
      status: 'PENDING',
      content: 'Needs changes',
      created_at: now,
      updated_at: now,
    });

    await storage.insertLink({
      source_id: 'PLAN_roundtrip_1',
      target_id: 'PLAN_roundtrip_2',
      type: 'depends_on',
      created_at: now,
    });

    const reviews = await storage.queryReviews({ targetId: 'PLAN_roundtrip_1' });
    const links = await storage.queryLinks({ sourceId: 'PLAN_roundtrip_1', type: 'depends_on' });

    expect(reviews.count).toBe(1);
    expect(reviews.reviews[0].id).toBe('review_roundtrip_1');
    expect(reviews.reviews[0].status).toBe('PENDING');

    expect(links.count).toBe(1);
    expect(links.links[0].sourceId).toBe('PLAN_roundtrip_1');
    expect(links.links[0].targetId).toBe('PLAN_roundtrip_2');
    expect(links.links[0].type).toBe('depends_on');

    await storage.close();
  });
});
