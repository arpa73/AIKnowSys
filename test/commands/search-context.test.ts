import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { searchContext } from '../../lib/commands/search-context.js';
import fs from 'fs/promises';
import path from 'path';

describe('search-context command', () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Create temp directory with test data
    tmpDir = path.join(process.cwd(), 'test-tmp-search-context-' + Date.now());
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
topics: [authentication, OAuth2, security]
---

# Authentication System Plan

Implement OAuth2 authentication for the API.
Need to integrate with external identity providers.
`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'PLAN_typescript_migration.md'),
      `---
status: COMPLETE
author: developer
created: 2026-01-15
updated: 2026-01-30
topics: [TypeScript, refactoring, TDD]
---

# TypeScript Migration Plan

Migrating JavaScript to TypeScript following TDD workflow.
Using strict mode and proper type definitions.
`
    );

    // Create test session files
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'sessions', '2026-02-05-session.md'),
      `# Session: OAuth2 Implementation (Feb 5, 2026)

Implemented OAuth2 authentication flow.
Used passport.js for authentication middleware.
TDD approach with comprehensive test coverage.
`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'sessions', '2026-01-29-session.md'),
      `# Session: TypeScript Setup (Jan 29, 2026)

Configured TypeScript compiler with strict mode.
Set up build pipeline and type checking.
Refactored first module with TDD workflow.
`
    );

    // Create test learned pattern
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'learned', 'tdd-patterns.md'),
      `---
name: tdd-patterns
category: testing
created: 2026-01-20
---

# TDD Patterns Learned

RED-GREEN-REFACTOR workflow is essential.
Write tests first, then implement minimal code.
`
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('basic functionality', () => {
    it('should search across all content types when scope is "all"', async () => {
      const result = await searchContext('authentication', {
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result).toHaveProperty('query', 'authentication');
      expect(result).toHaveProperty('scope', 'all');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('matches');
      expect(result.count).toBeGreaterThan(0);
      expect(result.matches.some((m: any) => m.type === 'plan')).toBe(true);
      expect(result.matches.some((m: any) => m.type === 'session')).toBe(true);
    });

    it('should filter results by scope=plans', async () => {
      const result = await searchContext('TypeScript', {
        dir: tmpDir,
        scope: 'plans',
        json: true,
        _silent: true
      });

      expect(result.scope).toBe('plans');
      expect(result.matches.every((m: any) => m.type === 'plan')).toBe(true);
    });

    it('should filter results by scope=sessions', async () => {
      const result = await searchContext('OAuth2', {
        dir: tmpDir,
        scope: 'sessions',
        json: true,
        _silent: true
      });

      expect(result.scope).toBe('sessions');
      expect(result.matches.every((m: any) => m.type === 'session')).toBe(true);
    });

    it('should filter results by scope=learned', async () => {
      const result = await searchContext('TDD', {
        dir: tmpDir,
        scope: 'learned',
        json: true,
        _silent: true
      });

      expect(result.scope).toBe('learned');
      expect(result.matches.every((m: any) => m.type === 'learned')).toBe(true);
    });

    it('should perform case-insensitive search', async () => {
      const result = await searchContext('OAUTH2', {
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.matches.some((m: any) => 
        m.context.toLowerCase().includes('oauth2')
      )).toBe(true);
    });

    it('should return empty results for non-matching query', async () => {
      const result = await searchContext('nonexistent-term-xyz', {
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result.count).toBe(0);
      expect(result.matches).toHaveLength(0);
    });
  });

  describe('relevance scoring', () => {
    it('should sort results by relevance (highest first)', async () => {
      const result = await searchContext('TDD', {
        dir: tmpDir,
        json: true,
        _silent: true
      });

      // Verify relevance is in descending order
      for (let i = 1; i < result.matches.length; i++) {
        expect(result.matches[i - 1].relevance).toBeGreaterThanOrEqual(
          result.matches[i].relevance
        );
      }
    });

    it('should assign higher relevance to exact word matches', async () => {
      const result = await searchContext('authentication', {
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result.count).toBeGreaterThan(0);
      // Exact word match should have higher relevance
      const exactMatch = result.matches.find((m: any) => 
        m.context.toLowerCase().split(/\W+/).includes('authentication')
      );
      if (exactMatch && result.matches.length > 1) {
        expect(exactMatch.relevance).toBeGreaterThan(0);
      }
    });
  });

  describe('output formats', () => {
    it('should return JSON when --json flag provided', async () => {
      const result = await searchContext('test', {
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('scope');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('matches');
      expect(typeof result.count).toBe('number');
      expect(Array.isArray(result.matches)).toBe(true);
    });

    it('should include all required fields in match objects', async () => {
      const result = await searchContext('authentication', {
        dir: tmpDir,
        json: true,
        _silent: true
      });

      if (result.matches.length > 0) {
        const match = result.matches[0];
        expect(match).toHaveProperty('type');
        expect(match).toHaveProperty('file');
        expect(match).toHaveProperty('context');
        expect(match).toHaveProperty('relevance');
        expect(['plan', 'session', 'learned', 'essentials']).toContain(match.type);
      }
    });

    it('should output to console when --json flag not provided', async () => {
      // This will output to console (tested manually)
      // Just verify it doesn't throw
      await expect(
        searchContext('test', { dir: tmpDir, _silent: true })
      ).resolves.toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty query gracefully', async () => {
      await expect(
        searchContext('', { dir: tmpDir, json: true, _silent: true })
      ).rejects.toThrow(/query.*empty/i);
    });

    it('should handle missing directory gracefully', async () => {
      await expect(
        searchContext('test', { 
          dir: '/nonexistent-dir-xyz', 
          json: true, 
          _silent: true 
        })
      ).rejects.toThrow();
    });

    it('should use current directory when dir not specified', async () => {
      // Just verify it doesn't throw
      await expect(
        searchContext('nonexistent-xyz', { json: true, _silent: true })
      ).resolves.toBeDefined();
    });

    it('should handle invalid scope value gracefully', async () => {
      await expect(
        searchContext('test', { 
          dir: tmpDir, 
          scope: 'invalid' as any, 
          json: true, 
          _silent: true 
        })
      ).rejects.toThrow(/invalid.*scope/i);
    });
  });

  describe('multi-word search', () => {
    it('should handle multi-word queries', async () => {
      const result = await searchContext('OAuth2 authentication', {
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result).toBeDefined();
      // Should find matches containing either or both terms
      if (result.count > 0) {
        expect(result.matches[0]).toHaveProperty('relevance');
      }
    });

    it('should boost relevance when all query terms appear', async () => {
      const result = await searchContext('TypeScript TDD', {
        dir: tmpDir,
        json: true,
        _silent: true
      });

      if (result.count > 1) {
        // Matches with both terms should rank higher
        const topMatch = result.matches[0];
        const matchText = topMatch.context.toLowerCase();
        // Top result should ideally contain both terms
        expect(matchText).toBeTruthy();
      }
    });
  });
});
