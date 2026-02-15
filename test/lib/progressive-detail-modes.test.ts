import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { querySessionsSqlite, queryPlansSqlite } from '../../lib/core/sqlite-query.js';

describe('Progressive Detail Modes (Feature 2)', () => {
  let tmpDir: string;
  let dbPath: string;
  let storage: SqliteStorage;

  beforeAll(async () => {
    // Create temporary test database
    tmpDir = path.join(os.tmpdir(), `test-progressive-detail-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    dbPath = path.join(tmpDir, 'test.db');

    storage = new SqliteStorage();
    await storage.init(dbPath);

    // Insert test project (required by FK constraint)
    await storage.insertProject({
      id: 'test-project',
      name: 'Test Project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Insert test data  
    await storage.insertPlan({
      id: 'PLAN_feature_x',
      project_id: 'test-project',
      title: 'Implement Feature X',
      status: 'ACTIVE',
      author: 'test-user',
      priority: 'high',
      topics: ['feature', 'testing'],
      content: '# PLAN: Feature X\n\n## Goal\nImplement feature X\n\n## Implementation\nStep 1: Design\nStep 2: Code\n\n## Progress\n50% complete',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    });

    await storage.insertPlan({
      id: 'PLAN_refactor_y',
      project_id: 'test-project',
      title: 'Refactor Component Y',
      status: 'COMPLETE',
      author: 'test-user',
      priority: 'medium',
      topics: ['refactor', 'cleanup'],
      content: '# PLAN: Refactor Y\n\n## Goal\nRefactor legacy component\n\n## Done\nAll tests passing',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    });

    await storage.insertSession({
      id: 'session-2026-02-14',
      project_id: 'test-project',
      date: '2026-02-14',
      topic: 'Testing progressive detail modes',
      status: 'active',
      topics: ['testing', 'modes'],
      content: '# Session: 2026-02-14\n\n## Goal\nTest preview mode\n\n## Progress\nImplementing tests\n\n## Results\nAll passing',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    });

    await storage.insertSession({
      id: 'session-2026-02-13',
      project_id: 'test-project',
      date: '2026-02-13',
      topic: 'Previous session',
      status: 'complete',
      topics: ['setup', 'database'],
      content: '# Session: 2026-02-13\n\n## Goal\nSet up database\n\n## Done\nDatabase ready',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    });

    storage.close();
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('Session Query Modes', () => {
    it('preview mode: should return ultra-lightweight stats (150 tokens)', async () => {
      const result = await querySessionsSqlite({
        dbPath,
        mode: 'preview'
      }) as unknown as { count: number; date_range?: string; topics: string[]; status_counts: Array<{status: string; count: number}>; sessions: Array<{date: string; title: string; topics_count: number; status?: string}> };

      expect(result.count).toBe(2);
      expect(result.date_range).toContain('2026-02-13');
      expect(result.date_range).toContain('2026-02-14');
      expect(result.topics).toBeInstanceOf(Array);
      expect(result.topics.length).toBeGreaterThan(0);
      expect(result.status_counts).toBeInstanceOf(Array);
      expect(result.sessions).toBeInstanceOf(Array);
      expect(result.sessions.length).toBeLessThanOrEqual(20); // Limited to 20

      // Preview sessions should have minimal fields
      const firstSession = result.sessions[0];
      expect(firstSession).toHaveProperty('date');
      expect(firstSession).toHaveProperty('title');
      expect(firstSession).toHaveProperty('topics_count');
      expect(firstSession).toHaveProperty('status');
      expect(firstSession).not.toHaveProperty('content'); // No content in preview
    });

    it('metadata mode: should return metadata without content (500 tokens)', async () => {
      const result = await querySessionsSqlite({
        dbPath,
        mode: 'metadata'
      });

      expect(result.count).toBe(2);
      expect(result.sessions).toBeInstanceOf(Array);

      const firstSession = result.sessions[0];
      expect(firstSession).toHaveProperty('date');
      expect(firstSession).toHaveProperty('title');
      expect(firstSession).toHaveProperty('topics');
      expect(firstSession).toHaveProperty('status');
      expect(firstSession).toHaveProperty('created_at');
      expect(firstSession).not.toHaveProperty('content'); // No content in metadata mode
    });

    it('full mode: should return everything including content (22K tokens)', async () => {
      const result = await querySessionsSqlite({
        dbPath,
        mode: 'full'
      });

      expect(result.count).toBe(2);
      expect(result.sessions).toBeInstanceOf(Array);

      const firstSession = result.sessions[0] as unknown as { date: string; title: string; topics: string[]; status: string; content: string; created_at: string; updated_at: string };
      expect(firstSession).toHaveProperty('date');
      expect(firstSession).toHaveProperty('title');
      expect(firstSession).toHaveProperty('topics');
      expect(firstSession).toHaveProperty('status');
      expect(firstSession).toHaveProperty('content'); // Content included in full mode
      expect(firstSession.content).toContain('Session');
    });

    it('section mode: should extract specific section from content', async () => {
      const result = await querySessionsSqlite({
        dbPath,
        mode: 'section',
        section: '## Progress',
        dateAfter: '2026-02-14'
      }) as unknown as { count: number; sessions: Array<{date: string; title: string; section: string; section_content: string}> };

      expect(result.count).toBe(1);
      const session = result.sessions[0];
      expect(session).toHaveProperty('section');
      expect(session.section).toBe('## Progress');
      expect(session).toHaveProperty('section_content');
      expect(session.section_content).toContain('Implementing tests');
    });

    it('default mode: should use metadata when mode not specified', async () => {
      const result = await querySessionsSqlite({ dbPath });

      expect(result.count).toBe(2);
      const firstSession = result.sessions[0];
      expect(firstSession).not.toHaveProperty('content'); // Metadata mode by default
    });

    it('legacy includeContent=true: should use full mode', async () => {
      const result = await querySessionsSqlite({
        dbPath,
        includeContent: true
      });

      expect(result.count).toBe(2);
      const firstSession = result.sessions[0];
      expect(firstSession).toHaveProperty('content'); // Full mode via legacy flag
    });
  });

  describe('Plan Query Modes', () => {
    it('preview mode: should return ultra-lightweight stats (150 tokens)', async () => {
      const result = await queryPlansSqlite({
        dbPath,
        mode: 'preview'
      }) as unknown as { count: number; date_range?: string; topics: string[]; status_counts: Array<{status: string; count: number}>; plans: Array<{id: string; title: string; status: string; topics_count: number}> };

      expect(result.count).toBe(2);
      expect(result.date_range).toBeDefined();
      expect(result.topics).toBeInstanceOf(Array);
      expect(result.topics.length).toBeGreaterThan(0);
      expect(result.status_counts).toBeInstanceOf(Array);
      expect(result.plans).toBeInstanceOf(Array);

      // Preview plans should have minimal fields
      const firstPlan = result.plans[0];
      expect(firstPlan).toHaveProperty('id');
      expect(firstPlan).toHaveProperty('title');
      expect(firstPlan).toHaveProperty('status');
      expect(firstPlan).toHaveProperty('topics_count');
      expect(firstPlan).not.toHaveProperty('content'); // No content in preview
    });

    it('metadata mode: should return metadata without content (500 tokens)', async () => {
      const result = await queryPlansSqlite({
        dbPath,
        mode: 'metadata'
      });

      expect(result.count).toBe(2);
      const firstPlan = result.plans[0];
      expect(firstPlan).toHaveProperty('id');
      expect(firstPlan).toHaveProperty('title');
      expect(firstPlan).toHaveProperty('status');
      expect(firstPlan).toHaveProperty('author');
      expect(firstPlan).toHaveProperty('priority');
      expect(firstPlan).not.toHaveProperty('content'); // No content
    });

    it('full mode: should return everything including content (22K tokens)', async () => {
      const result = await queryPlansSqlite({
        dbPath,
        mode: 'full'
      });

      expect(result.count).toBe(2);
      const firstPlan = result.plans[0] as unknown as { id: string; content: string };
      expect(firstPlan).toHaveProperty('id');
      expect(firstPlan).toHaveProperty('content'); // Content included
      expect(firstPlan.content).toContain('PLAN');
    });

    it('section mode: should extract specific section from plan', async () => {
      const result = await queryPlansSqlite({
        dbPath,
        mode: 'section',
        section: '## Implementation'
      }) as unknown as { count: number; plans: Array<{id: string; section: string; section_content: string}> };

      expect(result.count).toBeGreaterThanOrEqual(1);
      const plan = result.plans.find((p) => p.id === 'PLAN_feature_x');
      expect(plan).toBeDefined();
      if (plan) {
        expect(plan.section).toBe('## Implementation');
        expect(plan.section_content).toContain('Step 1');
      }
    });

    it('should filter by status in preview mode', async () => {
      const result = await queryPlansSqlite({
        dbPath,
        mode: 'preview',
        status: 'ACTIVE'
      }) as { count: number; plans: Array<{id: string}> };

      expect(result.count).toBe(1);
      expect(result.plans[0].id).toBe('PLAN_feature_x');
    });
  });
});
