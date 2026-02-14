/**
 * TDD Tests for queryPlansCore (Pure Business Logic)
 * 
 * Phase 2 Batch 2: Query commands extraction
 * Written FIRST following strict TDD workflow (RED → GREEN → REFACTOR)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rm, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { queryPlansCore } from '../../lib/core/query-plans.js';

describe('queryPlansCore (Pure Business Logic)', () => {
  const TEST_DIR = resolve(process.cwd(), `test-tmp-query-plans-${Date.now()}`);

  beforeEach(async () => {
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
    await mkdir(TEST_DIR, { recursive: true });
    
    const plansDir = resolve(TEST_DIR, '.aiknowsys', 'plans');
    await mkdir(plansDir, { recursive: true });
    
    // DON'T create index file - let storage auto-build it from plan files
  });

  afterEach(async () => {
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  async function createPlan(planId: string, data: any) {
    const planPath = resolve(TEST_DIR, '.aiknowsys', `PLAN_${planId}.md`);
    
    const content = `---
title: "${data.title || 'Test Plan'}"
created: ${data.created || '2026-02-10'}
updated: ${data.updated || '2026-02-11'}
author: ${data.author || 'test-user'}
status: ${data.status || 'ACTIVE'}
topics: [${(data.topics || []).map((t: string) => `"${t}"`).join(', ')}]
---

# ${data.title || 'Test Plan'}

## Goal
Test plan content
`;
    
    await writeFile(planPath, content, 'utf-8');
    
    // DON'T manually update index - let storage.rebuildIndex() or autoRebuild do it!
    // The auto-indexer will detect the new file and rebuild the index automatically
    
    return planPath;
  }

  describe('Basic Queries', () => {
    it('should return empty results when no plans exist', async () => {
      const result = await queryPlansCore({}, TEST_DIR);
      
      expect(result.count).toBe(0);
      expect(result.plans).toEqual([]);
    });

    it('should return all plans with no filters', async () => {
      await createPlan('test_one', { title: 'Plan One', status: 'ACTIVE' });
      await createPlan('test_two', { title: 'Plan Two', status: 'PAUSED' });
      
      const result = await queryPlansCore({}, TEST_DIR);
      
      expect(result.count).toBe(2);
      expect(result.plans).toHaveLength(2);
      expect(result.plans.map((p: any) => p.title)).toContain('Plan One');
      expect(result.plans.map((p: any) => p.title)).toContain('Plan Two');
    });

    it('should filter by status: ACTIVE', async () => {
      await createPlan('active', { title: 'Active Plan', status: 'ACTIVE' });
      await createPlan('paused', { title: 'Paused Plan', status: 'PAUSED' });
      await createPlan('complete', { title: 'Complete Plan', status: 'COMPLETE' });
      
      const result = await queryPlansCore({ status: 'ACTIVE' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].title).toBe('Active Plan');
      expect(result.plans[0].status).toBe('ACTIVE');
    });

    it('should filter by author', async () => {
      await createPlan('alice_plan', { title: 'Alice Plan', author: 'alice' });
      await createPlan('bob_plan', { title: 'Bob Plan', author: 'bob' });
      
      const result = await queryPlansCore({ author: 'alice' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].title).toBe('Alice Plan');
      expect(result.plans[0].author).toBe('alice');
    });

    it('should filter by topic (fuzzy match)', async () => {
      await createPlan('frontend', { title: 'Frontend Plan', topics: ['react', 'typescript'] });
      await createPlan('backend', { title: 'Backend Plan', topics: ['node', 'database'] });
      
      const result = await queryPlansCore({ topic: 'react' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].title).toBe('Frontend Plan');
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter by updatedAfter', async () => {
      await createPlan('old', { title: 'Old Plan', updated: '2026-01-15' });
      await createPlan('recent', { title: 'Recent Plan', updated: '2026-02-10' });
      
      const result = await queryPlansCore({ updatedAfter: '2026-02-01' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].title).toBe('Recent Plan');
    });

    it('should filter by updatedBefore', async () => {
      await createPlan('old', { title: 'Old Plan', updated: '2026-01-15' });
      await createPlan('recent', { title: 'Recent Plan', updated: '2026-02-10' });
      
      const result = await queryPlansCore({ updatedBefore: '2026-02-01' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].title).toBe('Old Plan');
    });

    it('should combine date range filters', async () => {
      await createPlan('very_old', { title: 'Very Old', updated: '2025-12-01' });
      await createPlan('in_range', { title: 'In Range', updated: '2026-01-15' });
      await createPlan('too_recent', { title: 'Too Recent', updated: '2026-02-15' });
      
      const result = await queryPlansCore({
        updatedAfter: '2026-01-01',
        updatedBefore: '2026-02-01'
      }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].title).toBe('In Range');
    });
  });

  describe('Combined Filters', () => {
    it('should combine multiple filters (status + author)', async () => {
      await createPlan('alice_active', { title: 'Alice Active', author: 'alice', status: 'ACTIVE' });
      await createPlan('alice_paused', { title: 'Alice Paused', author: 'alice', status: 'PAUSED' });
      await createPlan('bob_active', { title: 'Bob Active', author: 'bob', status: 'ACTIVE' });
      
      const result = await queryPlansCore({
        status: 'ACTIVE',
        author: 'alice'
      }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].title).toBe('Alice Active');
    });

    it('should combine all filter types', async () => {
      await createPlan('match', {
        title: 'Perfect Match',
        author: 'alice',
        status: 'ACTIVE',
        topics: ['typescript'],
        updated: '2026-02-10'
      });
      await createPlan('wrong_author', {
        title: 'Wrong Author',
        author: 'bob',
        status: 'ACTIVE',
        topics: ['typescript'],
        updated: '2026-02-10'
      });
      await createPlan('wrong_status', {
        title: 'Wrong Status',
        author: 'alice',
        status: 'PAUSED',
        topics: ['typescript'],
        updated: '2026-02-10'
      });
      
      const result = await queryPlansCore({
        status: 'ACTIVE',
        author: 'alice',
        topic: 'typescript',
        updatedAfter: '2026-02-01'
      }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].title).toBe('Perfect Match');
    });
  });

  describe('Purity & Structure', () => {
    it('should NOT log anything (pure function)', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      await createPlan('test', { title: 'Test Plan' });
      await queryPlansCore({}, TEST_DIR);
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should return structured result with count and plans array', async () => {
      await createPlan('test', { title: 'Test Plan' });
      const result = await queryPlansCore({}, TEST_DIR);
      
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('plans');
      expect(Array.isArray(result.plans)).toBe(true);
      expect(typeof result.count).toBe('number');
    });
  });
});
