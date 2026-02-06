import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rebuildIndex } from '../../lib/commands/rebuild-index.js';
import fs from 'fs/promises';
import path from 'path';

describe('rebuild-index command', () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Create temp directory structure
    tmpDir = path.join(process.cwd(), 'test-tmp-rebuild-index-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'plans'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'sessions'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'learned'), { recursive: true });

    // Create test plan files
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'PLAN_auth_system.md'),
      `---
status: ACTIVE
author: developer
created: 2026-02-01
updated: 2026-02-05
topics: [authentication, OAuth2]
---

# Authentication System Plan

Implement OAuth2 authentication.
`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'PLAN_completed_feature.md'),
      `---
status: COMPLETE
author: tester
created: 2026-01-15
updated: 2026-01-30
topics: [testing, TDD]
---

# Completed Feature Plan

Feature was completed successfully.
`
    );

    // Create test session files
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'sessions', '2026-02-05-session.md'),
      `# Session: OAuth2 Implementation (Feb 5, 2026)

Implemented authentication flow.
`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'sessions', '2026-02-04-session.md'),
      `# Session: Bug Fixes (Feb 4, 2026)

Fixed validation issues.
`
    );

    // Create test learned pattern
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'learned', 'tdd-workflow.md'),
      `---
name: tdd-workflow
category: testing
created: 2026-01-20
---

# TDD Workflow Pattern

Always write tests first.
`
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('basic functionality', () => {
    it('should rebuild team index (default)', async () => {
      const result = await rebuildIndex({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result).toHaveProperty('plansIndexed');
      expect(result).toHaveProperty('sessionsIndexed');
      expect(result.plansIndexed).toBe(2);  // 2 plan files
      expect(result.sessionsIndexed).toBe(2);  // 2 session files
    });

    it('should create index file after rebuild', async () => {
      await rebuildIndex({
        dir: tmpDir,
        _silent: true
      });

      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const exists = await fs.access(indexPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);
      expect(index).toHaveProperty('plans');
      expect(index).toHaveProperty('sessions');
      expect(Array.isArray(index.plans)).toBe(true);
      expect(Array.isArray(index.sessions)).toBe(true);
    });

    it('should extract plan metadata correctly', async () => {
      await rebuildIndex({
        dir: tmpDir,
        _silent: true
      });

      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);

      const authPlan = index.plans.find((p: any) => p.id === 'PLAN_auth_system');
      expect(authPlan).toBeDefined();
      expect(authPlan.status).toBe('ACTIVE');
      expect(authPlan.author).toBe('developer');
      expect(authPlan.topics).toContain('authentication');
    });

    it('should extract session metadata correctly', async () => {
      await rebuildIndex({
        dir: tmpDir,
        _silent: true
      });

      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);

      const session = index.sessions.find((s: any) => s.date === '2026-02-05');
      expect(session).toBeDefined();
      expect(session.topic).toBeTruthy();
      expect(session.file).toContain('2026-02-05-session.md');
    });
  });

  describe('output formats', () => {
    it('should return JSON when --json flag provided', async () => {
      const result = await rebuildIndex({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result).toHaveProperty('plansIndexed');
      expect(result).toHaveProperty('sessionsIndexed');
      expect(typeof result.plansIndexed).toBe('number');
      expect(typeof result.sessionsIndexed).toBe('number');
    });

    it('should output to console when --json flag not provided', async () => {
      // Just verify it doesn't throw
      await expect(
        rebuildIndex({ dir: tmpDir, _silent: true })
      ).resolves.toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty directories gracefully', async () => {
      const emptyDir = path.join(process.cwd(), 'test-tmp-empty-' + Date.now());
      await fs.mkdir(emptyDir, { recursive: true });
      await fs.mkdir(path.join(emptyDir, '.aiknowsys'), { recursive: true });

      const result = await rebuildIndex({
        dir: emptyDir,
        json: true,
        _silent: true
      });

      expect(result.plansIndexed).toBe(0);
      expect(result.sessionsIndexed).toBe(0);

      await fs.rm(emptyDir, { recursive: true, force: true });
    });

    it('should handle missing .aiknowsys directory gracefully', async () => {
      const noAiDir = path.join(process.cwd(), 'test-tmp-noai-' + Date.now());
      await fs.mkdir(noAiDir, { recursive: true });

      // Should succeed with 0 items (graceful handling)
      const result = await rebuildIndex({ 
        dir: noAiDir, 
        json: true, 
        _silent: true 
      });
      
      expect(result.plansIndexed).toBe(0);
      expect(result.sessionsIndexed).toBe(0);

      await fs.rm(noAiDir, { recursive: true, force: true });
    });

    it('should use current directory when dir not specified', async () => {
      // Just verify it doesn't throw
      await expect(
        rebuildIndex({ json: true, _silent: true })
      ).resolves.toBeDefined();
    });
  });

  describe('index file content', () => {
    it('should include all required plan fields', async () => {
      await rebuildIndex({ dir: tmpDir, _silent: true });

      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);

      if (index.plans.length > 0) {
        const plan = index.plans[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('title');
        expect(plan).toHaveProperty('status');
        expect(plan).toHaveProperty('author');
        expect(plan).toHaveProperty('created');
        expect(plan).toHaveProperty('updated');
        expect(plan).toHaveProperty('file');
      }
    });

    it('should include all required session fields', async () => {
      await rebuildIndex({ dir: tmpDir, _silent: true });

      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);

      if (index.sessions.length > 0) {
        const session = index.sessions[0];
        expect(session).toHaveProperty('date');
        expect(session).toHaveProperty('topic');
        expect(session).toHaveProperty('file');
        expect(session).toHaveProperty('created');
        expect(session).toHaveProperty('updated');
      }
    });

    it('should overwrite existing index file', async () => {
      // Create existing index
      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      await fs.writeFile(indexPath, JSON.stringify({ plans: [], sessions: [], learned: [] }));

      // Rebuild
      await rebuildIndex({ dir: tmpDir, _silent: true });

      // Verify new index has data
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);
      expect(index.plans.length).toBeGreaterThan(0);
      expect(index.sessions.length).toBeGreaterThan(0);
    });
  });

  describe('learned patterns indexing', () => {
    it('should index learned patterns', async () => {
      await rebuildIndex({ dir: tmpDir, _silent: true });

      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);

      expect(index).toHaveProperty('learned');
      expect(Array.isArray(index.learned)).toBe(true);
      // Should find the tdd-workflow.md pattern
      expect(index.learned.length).toBeGreaterThan(0);
    });

    it('should extract learned pattern metadata', async () => {
      await rebuildIndex({ dir: tmpDir, _silent: true });

      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);

      const pattern = index.learned.find((l: any) => l.name === 'tdd-workflow');
      if (pattern) {
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('category');
        expect(pattern).toHaveProperty('file');
      }
    });
  });
});
