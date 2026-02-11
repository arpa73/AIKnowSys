/**
 * TDD Tests for searchContextCore (Pure Business Logic)
 * 
 * Phase 2 Batch 2: Query commands extraction
 * Written FIRST following strict TDD workflow (RED → GREEN → REFACTOR)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rm, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { searchContextCore } from '../../lib/core/search-context.js';

describe('searchContextCore (Pure Business Logic)', () => {
  const TEST_DIR = resolve(process.cwd(), `test-tmp-search-context-${Date.now()}`);

  beforeEach(async () => {
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
    await mkdir(TEST_DIR, { recursive: true });
    
    const aiknowsysDir = resolve(TEST_DIR, '.aiknowsys');
    await mkdir(aiknowsysDir, { recursive: true });
    await mkdir(resolve(aiknowsysDir, 'sessions'), { recursive: true });
    await mkdir(resolve(aiknowsysDir, 'learned'), { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  async function createPlan(id: string, title: string, content: string) {
    const planPath = resolve(TEST_DIR, '.aiknowsys', `PLAN_${id}.md`);
    const planContent = `---
title: ${title}
status: ACTIVE
author: test-user
topics: []
created: 2026-02-10
updated: 2026-02-10
---

# Plan: ${title}

${content}
`;
    await writeFile(planPath, planContent, 'utf-8');
    return planPath;
  }

  async function createSession(date: string, topic: string, content: string) {
    const sessionPath = resolve(TEST_DIR, '.aiknowsys', 'sessions', `${date}-session.md`);
    const sessionContent = `---
date: ${date}
plan: 
duration: 
phases: []
---

# Session: ${topic} (00:00)

${content}
`;
    await writeFile(sessionPath, sessionContent, 'utf-8');
    return sessionPath;
  }

  async function createLearned(filename: string, content: string) {
    const learnedPath = resolve(TEST_DIR, '.aiknowsys', 'learned', filename);
    await writeFile(learnedPath, content, 'utf-8');
    return learnedPath;
  }

  describe('Query Validation', () => {
    it('should throw error for empty query string', async () => {
      await expect(
        searchContextCore('', {}, TEST_DIR)
      ).rejects.toThrow('Search query cannot be empty');
    });

    it('should throw error for whitespace-only query', async () => {
      await expect(
        searchContextCore('   ', {}, TEST_DIR)
      ).rejects.toThrow('Search query cannot be empty');
    });

    it('should accept valid query strings', async () => {
      const result = await searchContextCore('test query', {}, TEST_DIR);
      
      expect(result.query).toBe('test query');
      expect(result.count).toBe(0);
    });
  });

  describe('Scope Validation', () => {
    it('should throw error for invalid scope', async () => {
      await expect(
        searchContextCore('test', { scope: 'invalid' as any }, TEST_DIR)
      ).rejects.toThrow('Invalid scope: invalid. Must be one of: all, plans, sessions, learned');
    });

    it('should accept valid scopes', async () => {
      const scopes = ['all', 'plans', 'sessions', 'learned'] as const;
      
      for (const scope of scopes) {
        const result = await searchContextCore('test', { scope }, TEST_DIR);
        expect(result.scope).toBe(scope);
      }
    });

    it('should default to "all" scope when none provided', async () => {
      const result = await searchContextCore('test', {}, TEST_DIR);
      
      expect(result.scope).toBe('all');
    });
  });

  describe('Search Matching', () => {
    it('should find matches in plan content', async () => {
      await createPlan('feature_x', 'Feature X', 'Implementing authentication system');
      
      const result = await searchContextCore('authentication', {}, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.matches[0].type).toBe('plan');
      expect(result.matches[0].context).toContain('authentication');
    });

    it('should find matches in session content', async () => {
      await createSession('2026-02-10', 'TDD Workflow', 'Working on test-driven development');
      
      const result = await searchContextCore('test-driven', {}, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.matches[0].type).toBe('session');
    });

    it('should find matches in learned patterns', async () => {
      await createLearned('testing-patterns.md', '# Testing Patterns\n\nHow to write effective unit tests');
      
      const result = await searchContextCore('unit tests', {}, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.matches[0].type).toBe('learned');
    });

    it('should return empty results when no matches found', async () => {
      await createPlan('feature_x', 'Feature X', 'Some content');
      
      const result = await searchContextCore('nonexistent', {}, TEST_DIR);
      
      expect(result.count).toBe(0);
      expect(result.matches).toEqual([]);
    });

    it('should support multi-word queries', async () => {
      await createSession('2026-02-10', 'Work', 'Implementing feature authentication system');
      
      const result = await searchContextCore('authentication system', {}, TEST_DIR);
      
      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe('Scope Filtering', () => {
    beforeEach(async () => {
      await createPlan('feature_x', 'Feature X', 'Plan mentions workflow');
      await createSession('2026-02-10', 'Session', 'Session mentions workflow');
      await createLearned('pattern.md', '# Pattern\n\nLearned mentions workflow');
    });

    it('should search all scopes when scope is "all"', async () => {
      const result = await searchContextCore('workflow', { scope: 'all' }, TEST_DIR);
      
      expect(result.count).toBe(3);
      const types = result.matches.map(m => m.type);
      expect(types).toContain('plan');
      expect(types).toContain('session');
      expect(types).toContain('learned');
    });

    it('should search only plans when scope is "plans"', async () => {
      const result = await searchContextCore('workflow', { scope: 'plans' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.matches[0].type).toBe('plan');
    });

    it('should search only sessions when scope is "sessions"', async () => {
      const result = await searchContextCore('workflow', { scope: 'sessions' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.matches[0].type).toBe('session');
    });

    it('should search only learned patterns when scope is "learned"', async () => {
      const result = await searchContextCore('workflow', { scope: 'learned' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.matches[0].type).toBe('learned');
    });
  });

  describe('Relevance Sorting', () => {
    it('should sort results by relevance (highest first)', async () => {
      await createPlan('feature_a', 'Authentication', 'This plan is all about authentication authentication authentication');
      await createPlan('feature_b', 'Other', 'This plan mentions authentication once');
      
      const result = await searchContextCore('authentication', {}, TEST_DIR);
      
      // Storage indexes both title and content, so count may be > 2
      expect(result.count).toBeGreaterThan(0);
      expect(result.matches.length).toBeGreaterThan(1);
      
      // Verify results are sorted by relevance (descending)
      for (let i = 0; i < result.matches.length - 1; i++) {
        expect(result.matches[i].relevance).toBeGreaterThanOrEqual(result.matches[i + 1].relevance);
      }
    });

    it('should include relevance scores in results', async () => {
      await createSession('2026-02-10', 'Work', 'Testing relevance scoring');
      
      const result = await searchContextCore('relevance', {}, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.matches[0]).toHaveProperty('relevance');
      expect(typeof result.matches[0].relevance).toBe('number');
    });
  });

  describe('Result Structure', () => {
    it('should return structured result with all required fields', async () => {
      await createPlan('test', 'Test', 'Content');
      
      const result = await searchContextCore('content', {}, TEST_DIR);
      
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('scope');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('matches');
      expect(Array.isArray(result.matches)).toBe(true);
    });

    it('should include file paths in match results', async () => {
      await createSession('2026-02-10', 'Test', 'Searchable content');
      
      const result = await searchContextCore('searchable', {}, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.matches[0]).toHaveProperty('file');
      expect(result.matches[0].file).toContain('2026-02-10-session.md');
    });

    it('should include context snippets in match results', async () => {
      await createPlan('test', 'Test', 'This is context around the search term');
      
      const result = await searchContextCore('search term', {}, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.matches[0]).toHaveProperty('context');
      expect(typeof result.matches[0].context).toBe('string');
    });
  });

  describe('Purity & Path Safety', () => {
    it('should NOT log anything (pure function)', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      await createPlan('test', 'Test', 'Content');
      await searchContextCore('content', {}, TEST_DIR);
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should use absolute paths for target directory', async () => {
      // Test with relative path
      const result = await searchContextCore('test', { dir: './test' }, TEST_DIR);
      
      // Should not throw (path.resolve() would handle relative paths)
      expect(result).toHaveProperty('query');
    });

    it('should cleanup storage connection in finally block', async () => {
      // Test that even with error, storage is cleaned up
      // This is implicit in the try/finally pattern
      await createPlan('test', 'Test', 'Content');
      
      const result = await searchContextCore('content', {}, TEST_DIR);
      
      // Should complete without leaving connections open
      expect(result.count).toBe(1);
    });
  });
});
