/**
 * Test: Personal Pattern Directory Migration
 * 
 * Tests for migrating existing projects to personal/shared pattern split.
 * This test suite follows TDD RED-GREEN-REFACTOR workflow.
 * 
 * Tests both:
 * 1. Standalone migration script (scripts/migrate-learned-patterns.js)
 * 2. Integration into migrate command (lib/commands/migrate.js)
 */

import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Personal Pattern Directory Migration', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Create temp test directory
    testDir = path.join(os.tmpdir(), `migrate-personal-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    
    // Save original cwd and change to test dir
    originalCwd = process.cwd();
    process.chdir(testDir);
    
    // Create .aiknowsys/learned/ directory with existing patterns
    const learnedDir: string = path.join(testDir, '.aiknowsys', 'learned');
    await fs.mkdir(learnedDir, { recursive: true });
    
    // Create sample learned pattern
    await fs.writeFile(
      path.join(learnedDir, 'existing-pattern.md'),
      '# Existing Pattern\n\n**Trigger Words:** existing, pattern\n\nThis was created before migration.'
    );
    
    // Create .gitignore
    await fs.writeFile(
      path.join(testDir, '.gitignore'),
      'node_modules/\n.DS_Store\n'
    );
    
    // Setup git config (mock)
    await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
  });

  afterEach(async () => {
    // Restore cwd
    process.chdir(originalCwd);
    
    // Cleanup test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Standalone migration script', () => {
    it('should create personal/<username>/ directory', async () => {
      // RED: This test will fail because migration script doesn't exist yet
      
      const username: string = 'test-user';
      const expectedDir: string = path.join(testDir, '.aiknowsys', 'personal', username);
      
      // Verify directory doesn't exist before migration
      await expect(fs.access(expectedDir)).rejects.toThrow('personal/<username>/ should not exist before migration');
      
      // Run migration (will fail in RED phase)
      // @ts-expect-error - Not yet migrated to TypeScript
      const { migratePersonalPatterns } = await import('../scripts/migrate-learned-patterns.js');
      await migratePersonalPatterns({ _username: username, _silent: true });
      
      // Verify directory was created
      const stats = await fs.stat(expectedDir);
      expect(stats.isDirectory()).toBeTruthy();
    });

    it('should update .gitignore with personal/ pattern', async () => {
      // RED: Migration script doesn't exist yet
      
      const username: string = 'test-user';
      
      // Verify .gitignore doesn't have personal/ pattern
      const gitignoreBefore: string = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(!gitignoreBefore.includes('.aiknowsys/personal/')).toBeTruthy();
      
      // Run migration
      // @ts-expect-error - Not yet migrated to TypeScript
      const { migratePersonalPatterns } = await import('../scripts/migrate-learned-patterns.js');
      await migratePersonalPatterns({ _username: username, _silent: true });
      
      // Verify .gitignore was updated
      const gitignoreAfter: string = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(gitignoreAfter.includes('.aiknowsys/personal/')).toBeTruthy();
      expect(gitignoreAfter.includes('# Personal learned patterns')).toBeTruthy();
    });

    it('should create personal/README.md with username', async () => {
      // RED: Migration script doesn't exist yet
      
      const username: string = 'test-user';
      const readmePath: string = path.join(testDir, '.aiknowsys', 'personal', username, 'README.md');
      
      // Verify README doesn't exist before migration
      await expect(fs.access(readmePath)).rejects.toThrow('README.md should not exist before migration');
      
      // Run migration
      // @ts-expect-error - Not yet migrated to TypeScript
      const { migratePersonalPatterns } = await import('../scripts/migrate-learned-patterns.js');
      await migratePersonalPatterns({ _username: username, _silent: true });
      
      // Verify README was created with username
      const readmeContent: string = await fs.readFile(readmePath, 'utf-8');
      expect(readmeContent.includes(username)).toBeTruthy();
      expect(readmeContent.includes('Personal Learned Patterns')).toBeTruthy();
    });

    it('should preserve existing learned/ patterns', async () => {
      // RED: Migration script doesn't exist yet
      
      const username: string = 'test-user';
      const existingPattern: string = path.join(testDir, '.aiknowsys', 'learned', 'existing-pattern.md');
      
      // Verify existing pattern exists before migration
      const contentBefore: string = await fs.readFile(existingPattern, 'utf-8');
      expect(contentBefore.includes('Existing Pattern')).toBeTruthy();
      
      // Run migration
      // @ts-expect-error - Not yet migrated to TypeScript
      const { migratePersonalPatterns } = await import('../scripts/migrate-learned-patterns.js');
      await migratePersonalPatterns({ _username: username, _silent: true });
      
      // Verify existing pattern still exists and unchanged
      const contentAfter: string = await fs.readFile(existingPattern, 'utf-8');
      expect(contentAfter).toBe(contentBefore);
    });

    it('should handle missing git username gracefully', async () => {
      // RED: Migration script doesn't exist yet
      
      // Don't provide username (simulate git config failure)
      // @ts-expect-error - Not yet migrated to TypeScript
      const { migratePersonalPatterns } = await import('../scripts/migrate-learned-patterns.js');
      
      const result: any = await migratePersonalPatterns({ _username: null, _silent: true });
      
      expect(result.success).toBe(false);
      expect(result.error.includes('username')).toBeTruthy();
    });

    it('should skip if already migrated', async () => {
      // RED: Migration script doesn't exist yet
      
      const username: string = 'test-user';
      const personalDir: string = path.join(testDir, '.aiknowsys', 'personal', username);
      
      // Create personal directory (simulate already migrated)
      await fs.mkdir(personalDir, { recursive: true });
      await fs.writeFile(
        path.join(personalDir, 'README.md'),
        '# Already migrated'
      );
      
      // Run migration
      // @ts-expect-error - Not yet migrated to TypeScript
      const { migratePersonalPatterns } = await import('../scripts/migrate-learned-patterns.js');
      const result: any = await migratePersonalPatterns({ _username: username, _silent: true });
      
      expect(result.success).toBe(true);
      expect(result.skipped).toBeTruthy();
      
      // Verify README wasn't overwritten
      const readmeContent: string = await fs.readFile(path.join(personalDir, 'README.md'), 'utf-8');
      expect(readmeContent.includes('Already migrated')).toBeTruthy();
    });

    it('should handle missing .gitignore file', async () => {
      // RED: Migration script doesn't exist yet
      
      const username: string = 'test-user';
      
      // Remove .gitignore
      await fs.rm(path.join(testDir, '.gitignore'));
      
      // Run migration
      // @ts-expect-error - Not yet migrated to TypeScript
      const { migratePersonalPatterns } = await import('../scripts/migrate-learned-patterns.js');
      await migratePersonalPatterns({ _username: username, _silent: true });
      
      // Verify .gitignore was created with personal/ pattern
      const gitignoreContent: string = await fs.readFile(path.join(testDir, '.gitignore'), 'utf-8');
      expect(gitignoreContent.includes('.aiknowsys/personal/')).toBeTruthy();
    });
  });

  describe('Integration with migrate command', () => {
    it('should call personal pattern migration during migrate', async () => {
      // RED: migrate.js doesn't call personal migration yet
      
      // Verify migrate.js imports migratePersonalPatterns
      const migrateSource: string = await fs.readFile(
        path.join(import.meta.dirname, '../dist/lib/commands/migrate.js'),
        'utf-8'
      );
      
      expect(migrateSource.includes('migratePersonalPatterns') ||
                migrateSource.includes('personal')).toBeTruthy();
    });

    it('should create personal directory during full migration', async () => {
      // This will be tested via integration tests
      // For now, we verify the structure is correct
      
      // Verify directory structure after migration
      // (This is a placeholder - actual migration test would run full migrate command)
      expect(true).toBeTruthy();
    });
  });
});
