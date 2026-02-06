import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { queryPlans } from '../../lib/commands/query-plans.js';

describe('query-plans command', () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Create temp project directory for tests
    tmpDir = path.join(process.cwd(), 'test-tmp-query-plans-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'plans'), { recursive: true });

    // Create some test plan pointers
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'plans', 'active-alice.md'),
      `# alice's Active Plan

**Currently Working On:** [TypeScript Migration](../PLAN_typescript_migration.md)  
**Status:** 🎯 ACTIVE  
**Started:** 2026-02-01`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'plans', 'active-bob.md'),
      `# bob's Active Plan

**Currently Working On:** [Context Query System](../PLAN_context_query.md)  
**Status:** 🎯 ACTIVE  
**Started:** 2026-02-06`
    );

    // Create plan files
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'PLAN_typescript_migration.md'),
      `# TypeScript Migration

**Status:** 🎯 ACTIVE  
**Created:** 2026-02-01  
**Updated:** 2026-02-05

Migrating entire codebase to TypeScript.`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'PLAN_context_query.md'),
      `# Context Query System

**Status:** 🎯 ACTIVE  
**Created:** 2026-02-06  
**Updated:** 2026-02-06

Implement CLI query commands for context.`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'PLAN_archived_work.md'),
      `# Archived Work

**Status:** ✅ COMPLETE  
**Created:** 2026-01-15  
**Updated:** 2026-01-31

Completed project from last month.`
    );
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('basic functionality', () => {
    it('should return all plans when no filters provided', async () => {
      const result = await queryPlans({ 
        dir: tmpDir,
        json: true,
        _silent: true 
      });

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('plans');
      expect(result.count).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(result.plans)).toBe(true);
    });

    it('should filter plans by status (ACTIVE)', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        status: 'ACTIVE',
        json: true,
        _silent: true
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.plans.every((p: any) => p.status === 'ACTIVE')).toBe(true);
    });

    it('should filter plans by status (COMPLETE)', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        status: 'COMPLETE',
        json: true,
        _silent: true
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.plans.every((p: any) => p.status === 'COMPLETE')).toBe(true);
    });

    it('should filter plans by author', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        author: 'alice',
        json: true,
        _silent: true
      });

      expect(result.count).toBe(1);
      expect(result.plans[0].author).toBe('alice');
    });

    it('should filter plans by topic (fuzzy match)', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        topic: 'TypeScript',
        json: true,
        _silent: true
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.plans.some((p: any) => 
        p.title.toLowerCase().includes('typescript')
      )).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        status: 'ACTIVE',
        author: 'alice',
        json: true,
        _silent: true
      });

      expect(result.count).toBe(1);
      expect(result.plans[0].status).toBe('ACTIVE');
      expect(result.plans[0].author).toBe('alice');
    });
  });

  describe('output formats', () => {
    it('should return JSON when --json flag provided', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('plans');
      expect(Array.isArray(result.plans)).toBe(true);
    });

    it('should include all required fields in plan objects', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      if (result.plans.length > 0) {
        const plan = result.plans[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('title');
        expect(plan).toHaveProperty('status');
        expect(plan).toHaveProperty('author');
        expect(plan).toHaveProperty('created');
        expect(plan).toHaveProperty('updated');
        expect(plan).toHaveProperty('file');
      }
    });

    it('should log to console when --json not provided', async () => {
      // This test just verifies the command runs without json flag
      const result = await queryPlans({
        dir: tmpDir,
        _silent: true // Still silent for testing, but json=false
      });

      // Should still return data for testing purposes
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('plans');
    });
  });

  describe('edge cases', () => {
    it('should return empty results when no plans match filters', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        status: 'CANCELLED',
        json: true,
        _silent: true
      });

      expect(result.count).toBe(0);
      expect(result.plans).toEqual([]);
    });

    it('should handle missing .aiknowsys directory gracefully', async () => {
      const emptyDir = path.join(process.cwd(), 'test-tmp-empty-' + Date.now());
      await fs.mkdir(emptyDir, { recursive: true });

      try {
        const result = await queryPlans({
          dir: emptyDir,
          json: true,
          _silent: true
        });

        expect(result.count).toBe(0);
        expect(result.plans).toEqual([]);
      } finally {
        await fs.rm(emptyDir, { recursive: true, force: true });
      }
    });

    it('should use current directory when no dir specified', async () => {
      // Change to test directory temporarily
      const originalCwd = process.cwd();
      process.chdir(tmpDir);

      try {
        const result = await queryPlans({
          json: true,
          _silent: true
        });

        expect(result.count).toBeGreaterThan(0);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle invalid status value gracefully', async () => {
      await expect(
        queryPlans({
          dir: tmpDir,
          status: 'INVALID_STATUS' as any,
          json: true,
          _silent: true
        })
      ).rejects.toThrow(/invalid.*status/i);
    });
  });

  describe('date range filtering', () => {
    it('should filter plans updated after a date', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        updatedAfter: '2026-02-01',
        json: true,
        _silent: true
      });

      expect(result.plans.every((p: any) => 
        p.updated > '2026-02-01'
      )).toBe(true);
    });

    it('should filter plans updated before a date', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        updatedBefore: '2026-02-06',
        json: true,
        _silent: true
      });

      expect(result.plans.every((p: any) => 
        p.updated < '2026-02-06'
      )).toBe(true);
    });

    it('should combine date range filters', async () => {
      const result = await queryPlans({
        dir: tmpDir,
        updatedAfter: '2026-02-01',
        updatedBefore: '2026-02-06',
        json: true,
        _silent: true
      });

      expect(result.plans.every((p: any) => 
        p.updated > '2026-02-01' && p.updated < '2026-02-06'
      )).toBe(true);
    });
  });
});
