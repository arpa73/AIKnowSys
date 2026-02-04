import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { migrateToMultidev } from '../../lib/commands/migrate-to-multidev.js';

describe('migrate-to-multidev command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `aiknowsys-migrate-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(path.join(testDir, '.git'), { recursive: true });
    mkdirSync(path.join(testDir, '.aiknowsys'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('RED: Migration detection', () => {
    it('should skip if already migrated (plans/ exists)', async () => {
      mkdirSync(path.join(testDir, '.aiknowsys', 'plans'), { recursive: true });

      const result: any = await migrateToMultidev({ dir: testDir, _silent: true });

      assert.equal(result.alreadyMigrated, true);
      assert.equal(result.success, true);
    });

    it('should migrate if plans/ directory does not exist', async () => {
      // Create old single-dev structure
      writeFileSync(
        path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md'),
        '# Current Plan\n\nWork in progress...'
      );

      const result: any = await migrateToMultidev({ dir: testDir, _silent: true, username: 'testuser' });

      assert.equal(result.migrated, true);
      assert.equal(result.success, true);
    });
  });

  describe('RED: Directory creation', () => {
    it('should create plans/ directory', async () => {
      await migrateToMultidev({ dir: testDir, _silent: true, username: 'testuser' });

      assert.equal(existsSync(path.join(testDir, '.aiknowsys', 'plans')), true);
    });

    it('should create reviews/ directory', async () => {
      await migrateToMultidev({ dir: testDir, _silent: true, username: 'testuser' });

      assert.equal(existsSync(path.join(testDir, '.aiknowsys', 'reviews')), true);
    });

    it('should create plans/README.md explaining workflow', async () => {
      await migrateToMultidev({ dir: testDir, _silent: true, username: 'testuser' });

      const readmePath: string = path.join(testDir, '.aiknowsys', 'plans', 'README.md');
      assert.equal(existsSync(readmePath), true);

      const content: string = readFileSync(readmePath, 'utf-8');
      assert.match(content, /Multi-Developer Plan Management/);
      assert.match(content, /active-<username>\.md/);
    });

    it('should create reviews/README.md explaining workflow', async () => {
      await migrateToMultidev({ dir: testDir, _silent: true, username: 'testuser' });

      const readmePath: string = path.join(testDir, '.aiknowsys', 'reviews', 'README.md');
      assert.equal(existsSync(readmePath), true);

      const content: string = readFileSync(readmePath, 'utf-8');
      assert.match(content, /Code Review Workflow/);
      assert.match(content, /PENDING_<username>\.md/);
    });
  });

  describe('RED: File migration', () => {
    it('should migrate CURRENT_PLAN.md to plans/active-<username>.md', async () => {
      const oldContent: string = '# Current Plan\n\n**Status:** 🎯 ACTIVE\n**Working On:** Feature X';
      writeFileSync(path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md'), oldContent);

      await migrateToMultidev({ dir: testDir, _silent: true, username: 'alice' });

      const newPath: string = path.join(testDir, '.aiknowsys', 'plans', 'active-alice.md');
      assert.equal(existsSync(newPath), true);

      const content: string = readFileSync(newPath, 'utf-8');
      assert.match(content, /Feature X/);
    });

    it('should migrate PENDING_REVIEW.md to reviews/PENDING_<username>.md', async () => {
      const reviewContent: string = '# Pending Review\n\n⚠️ Issues found...';
      writeFileSync(path.join(testDir, '.aiknowsys', 'PENDING_REVIEW.md'), reviewContent);

      await migrateToMultidev({ dir: testDir, _silent: true, username: 'bob' });

      const newPath: string = path.join(testDir, '.aiknowsys', 'reviews', 'PENDING_bob.md');
      assert.equal(existsSync(newPath), true);

      const content: string = readFileSync(newPath, 'utf-8');
      assert.match(content, /Issues found/);
    });

    it('should handle missing CURRENT_PLAN.md gracefully', async () => {
      const result: any = await migrateToMultidev({ dir: testDir, _silent: true, username: 'charlie' });

      assert.equal(result.success, true);
      assert.equal(result.createdDefaultPlan, true);
    });

    it('should handle missing PENDING_REVIEW.md gracefully', async () => {
      const result: any = await migrateToMultidev({ dir: testDir, _silent: true, username: 'diana' });

      assert.equal(result.success, true);
      // Should not create PENDING_ review if none existed
      assert.equal(existsSync(path.join(testDir, '.aiknowsys', 'reviews', 'PENDING_diana.md')), false);
    });
  });

  describe('RED: CURRENT_PLAN.md regeneration', () => {
    it('should regenerate CURRENT_PLAN.md as team index', async () => {
      writeFileSync(
        path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md'),
        '# Old Plan\nManual edits here...'
      );

      await migrateToMultidev({ dir: testDir, _silent: true, username: 'eve' });

      const newContent: string = readFileSync(path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md'), 'utf-8');
      assert.match(newContent, /Current Team Plans/);
      assert.match(newContent, /AUTO-GENERATED FILE/);
    });
  });

  describe('RED: .gitignore updates', () => {
    it('should update .gitignore with reviews/ and personal/', async () => {
      writeFileSync(path.join(testDir, '.gitignore'), '# Existing ignores\nnode_modules/\n');

      await migrateToMultidev({ dir: testDir, _silent: true, username: 'frank' });

      const gitignore: string = readFileSync(path.join(testDir, '.gitignore'), 'utf-8');
      assert.match(gitignore, /\.aiknowsys\/reviews\//);
      assert.match(gitignore, /\.aiknowsys\/personal\//);
    });

    it('should not duplicate .gitignore entries if already present', async () => {
      writeFileSync(
        path.join(testDir, '.gitignore'),
        '# Existing\n.aiknowsys/reviews/\n.aiknowsys/personal/\n'
      );

      await migrateToMultidev({ dir: testDir, _silent: true, username: 'grace' });

      const gitignore: string = readFileSync(path.join(testDir, '.gitignore'), 'utf-8');
      const reviewMatches: number = (gitignore.match(/\.aiknowsys\/reviews\//g) || []).length;
      const personalMatches: number = (gitignore.match(/\.aiknowsys\/personal\//g) || []).length;

      assert.equal(reviewMatches, 1);
      assert.equal(personalMatches, 1);
    });

    it('should create .gitignore if it does not exist', async () => {
      await migrateToMultidev({ dir: testDir, _silent: true, username: 'henry' });

      assert.equal(existsSync(path.join(testDir, '.gitignore')), true);
      const gitignore: string = readFileSync(path.join(testDir, '.gitignore'), 'utf-8');
      assert.match(gitignore, /\.aiknowsys\/reviews\//);
    });
  });

  describe('RED: Idempotency', () => {
    it('should be safe to run multiple times', async () => {
      // First run
      const result1: any = await migrateToMultidev({ dir: testDir, _silent: true, username: 'iris' });
      assert.equal(result1.migrated, true);

      // Second run
      const result2: any = await migrateToMultidev({ dir: testDir, _silent: true, username: 'iris' });
      assert.equal(result2.alreadyMigrated, true);
      assert.equal(result2.success, true);
    });
  });

  describe('RED: Username normalization', () => {
    it('should normalize username with spaces', async () => {
      await migrateToMultidev({ dir: testDir, _silent: true, username: 'John Doe' });

      const planPath: string = path.join(testDir, '.aiknowsys', 'plans', 'active-john-doe.md');
      assert.equal(existsSync(planPath), true);
    });

    it('should normalize username to lowercase', async () => {
      await migrateToMultidev({ dir: testDir, _silent: true, username: 'Alice_Smith' });

      const planPath: string = path.join(testDir, '.aiknowsys', 'plans', 'active-alice-smith.md');
      assert.equal(existsSync(planPath), true);
    });
  });

  describe('RED: Return values', () => {
    it('should return migration details', async () => {
      writeFileSync(path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md'), '# Old plan');

      const result: any = await migrateToMultidev({ dir: testDir, _silent: true, username: 'jack' });

      assert.equal(result.success, true);
      assert.equal(result.migrated, true);
      assert.equal(result.username, 'jack');
      assert.equal(typeof result.plansCreated, 'number');
      assert.equal(typeof result.reviewsMigrated, 'boolean');
    });
  });
});
