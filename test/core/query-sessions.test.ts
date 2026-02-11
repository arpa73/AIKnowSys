/**
 * TDD Tests for querySessionsCore (Pure Business Logic)
 * 
 * Phase 2 Batch 2: Query commands extraction
 * Written FIRST following strict TDD workflow (RED → GREEN → REFACTOR)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rm, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { querySessionsCore } from '../../lib/core/query-sessions.js';

describe('querySessionsCore (Pure Business Logic)', () => {
  const TEST_DIR = resolve(process.cwd(), `test-tmp-query-sessions-${Date.now()}`);

  beforeEach(async () => {
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
    await mkdir(TEST_DIR, { recursive: true });
    
    const sessionsDir = resolve(TEST_DIR, '.aiknowsys', 'sessions');
    await mkdir(sessionsDir, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  async function createSession(date: string, data: any) {
    const sessionPath = resolve(TEST_DIR, '.aiknowsys', 'sessions', `${date}-session.md`);
    
    // Session parser extracts 'topic' from markdown heading pattern: # Session: <topic> (time)
    // YAML fields: plan, duration, phases, topics (array)
    const content = `---
date: ${date}
plan: ${data.plan || ''}
duration: ${data.duration || ''}
phases: [${(data.phases || []).map((p: string) => `"${p}"`).join(', ')}]
---

# Session: ${data.topic || 'Default Topic'} (00:00)

## Notes
Session content here
`;
    
    await writeFile(sessionPath, content, 'utf-8');
    return sessionPath;
  }

  describe('Basic Queries', () => {
    it('should return empty results when no sessions exist', async () => {
      const result = await querySessionsCore({}, TEST_DIR);
      
      expect(result.count).toBe(0);
      expect(result.sessions).toEqual([]);
    });

    it('should return all sessions with no filters', async () => {
      await createSession('2026-02-08', { topic: 'Session One' });
      await createSession('2026-02-09', { topic: 'Session Two' });
      
      const result = await querySessionsCore({}, TEST_DIR);
      
      expect(result.count).toBe(2);
      expect(result.sessions).toHaveLength(2);
    });

    it('should sort sessions by date descending (newest first)', async () => {
      await createSession('2026-02-08', { topic: 'Older' });
      await createSession('2026-02-10', { topic: 'Newer' });
      await createSession('2026-02-09', { topic: 'Middle' });
      
      const result = await querySessionsCore({}, TEST_DIR);
      
      expect(result.sessions[0].date).toBe('2026-02-10');
      expect(result.sessions[1].date).toBe('2026-02-09');
      expect(result.sessions[2].date).toBe('2026-02-08');
    });

    it('should filter by exact date', async () => {
      await createSession('2026-02-08', { topic: 'Day 8' });
      await createSession('2026-02-09', { topic: 'Day 9' });
      await createSession('2026-02-10', { topic: 'Day 10' });
      
      const result = await querySessionsCore({ date: '2026-02-09' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].topic).toBe('Day 9');
    });

    it('should filter by topic (fuzzy match)', async () => {
      await createSession('2026-02-08', { topic: 'TDD Workflow' });
      await createSession('2026-02-09', { topic: 'Refactoring' });
      await createSession('2026-02-10', { topic: 'TDD Practice' });
      
      const result = await querySessionsCore({ topic: 'TDD' }, TEST_DIR);
      
      expect(result.count).toBe(2);
      expect(result.sessions.map(s => s.topic)).toContain('TDD Workflow');
      expect(result.sessions.map(s => s.topic)).toContain('TDD Practice');
    });

    it('should filter by plan reference', async () => {
      await createSession('2026-02-08', { topic: 'Work', plan: 'PLAN_feature_x' });
      await createSession('2026-02-09', { topic: 'Work', plan: 'PLAN_feature_y' });
      await createSession('2026-02-10', { topic: 'Work', plan: '' });
      
      const result = await querySessionsCore({ plan: 'PLAN_feature_x' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].plan).toBe('PLAN_feature_x');
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter by dateAfter', async () => {
      await createSession('2026-01-25', { topic: 'Old' });
      await createSession('2026-02-05', { topic: 'Recent' });
      await createSession('2026-02-10', { topic: 'Very Recent' });
      
      const result = await querySessionsCore({ dateAfter: '2026-02-01' }, TEST_DIR);
      
      expect(result.count).toBe(2);
      expect(result.sessions.map(s => s.topic)).toContain('Recent');
      expect(result.sessions.map(s => s.topic)).toContain('Very Recent');
    });

    it('should filter by dateBefore', async () => {
      await createSession('2026-01-25', { topic: 'Old' });
      await createSession('2026-02-05', { topic: 'Recent' });
      await createSession('2026-02-10', { topic: 'Very Recent' });
      
      const result = await querySessionsCore({ dateBefore: '2026-02-01' }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].topic).toBe('Old');
    });

    it('should combine date range filters', async () => {
      await createSession('2026-01-15', { topic: 'Very Old' });
      await createSession('2026-01-28', { topic: 'In Range' });
      await createSession('2026-02-10', { topic: 'Too Recent' });
      
      const result = await querySessionsCore({
        dateAfter: '2026-01-20',
        dateBefore: '2026-02-01'
      }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].topic).toBe('In Range');
    });

    it('should handle days convenience filter (last N days)', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const tenDaysAgo = new Date(today);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      await createSession(tenDaysAgo.toISOString().split('T')[0], { topic: 'Old' });
      await createSession(threeDaysAgo.toISOString().split('T')[0], { topic: 'Recent' });
      await createSession(yesterday.toISOString().split('T')[0], { topic: 'Yesterday' });
      
      const result = await querySessionsCore({ days: 7 }, TEST_DIR);
      
      expect(result.count).toBe(2);
      expect(result.sessions.map(s => s.topic)).toContain('Recent');
      expect(result.sessions.map(s => s.topic)).toContain('Yesterday');
      expect(result.sessions.map(s => s.topic)).not.toContain('Old');
    });
  });

  describe('Combined Filters', () => {
    it('should combine topic and date filters', async () => {
      await createSession('2026-01-15', { topic: 'TDD Old' });
      await createSession('2026-02-08', { topic: 'TDD Recent' });
      await createSession('2026-02-09', { topic: 'Other Recent' });
      
      const result = await querySessionsCore({
        topic: 'TDD',
        dateAfter: '2026-02-01'
      }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].topic).toBe('TDD Recent');
    });

    it('should combine all filter types', async () => {
      await createSession('2026-02-08', { topic: 'TDD Work', plan: 'PLAN_feature_x' });
      await createSession('2026-02-09', { topic: 'TDD Work', plan: 'PLAN_feature_y' });
      await createSession('2026-02-10', { topic: 'Other Work', plan: 'PLAN_feature_x' });
      
      const result = await querySessionsCore({
        topic: 'TDD',
        plan: 'PLAN_feature_x',
        dateAfter: '2026-02-07'
      }, TEST_DIR);
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].date).toBe('2026-02-08');
    });
  });

  describe('Date Validation', () => {
    it('should throw error for invalid date format', async () => {
      await expect(
        querySessionsCore({ date: 'invalid' }, TEST_DIR)
      ).rejects.toThrow('Invalid date format: invalid. Expected YYYY-MM-DD');
    });

    it('should throw error for invalid dateAfter format', async () => {
      await expect(
        querySessionsCore({ dateAfter: '2026/02/01' }, TEST_DIR)
      ).rejects.toThrow('Invalid dateAfter format: 2026/02/01. Expected YYYY-MM-DD');
    });

    it('should throw error for invalid dateBefore format', async () => {
      await expect(
        querySessionsCore({ dateBefore: '02-01-2026' }, TEST_DIR)
      ).rejects.toThrow('Invalid dateBefore format: 02-01-2026. Expected YYYY-MM-DD');
    });

    it('should accept valid YYYY-MM-DD dates', async () => {
      await createSession('2026-02-10', { topic: 'Test' });
      
      const result = await querySessionsCore({ date: '2026-02-10' }, TEST_DIR);
      
      expect(result.count).toBe(1);
    });
  });

  describe('Purity & Structure', () => {
    it('should NOT log anything (pure function)', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      await createSession('2026-02-10', { topic: 'Test' });
      await querySessionsCore({}, TEST_DIR);
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should return structured result with count and sessions array', async () => {
      await createSession('2026-02-10', { topic: 'Test' });
      
      const result = await querySessionsCore({}, TEST_DIR);
      
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('sessions');
      expect(Array.isArray(result.sessions)).toBe(true);
      expect(typeof result.count).toBe('number');
    });
  });
});
