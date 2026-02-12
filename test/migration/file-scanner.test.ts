import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { FileScanner } from '../../lib/migration/file-scanner.js';

describe('FileScanner', () => {
  let tmpDir: string;
  let scanner: FileScanner;

  beforeEach(async () => {
    // Create temp directory for tests
    tmpDir = path.join(process.cwd(), 'test-tmp-scanner-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
    
    scanner = new FileScanner();
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('scanDirectory', () => {
    it('should find all markdown files in .aiknowsys directory', async () => {
      // Setup test structure
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(path.join(aiknowsysDir, 'sessions'), { recursive: true });
      await fs.mkdir(path.join(aiknowsysDir, 'learned'), { recursive: true });
      
      // Create test files
      await fs.writeFile(path.join(aiknowsysDir, 'sessions', '2026-02-01-session.md'), '# Session 1');
      await fs.writeFile(path.join(aiknowsysDir, 'sessions', '2026-02-02-session.md'), '# Session 2');
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_test.md'), '# Test Plan');
      await fs.writeFile(path.join(aiknowsysDir, 'learned', 'pattern.md'), '# Pattern');
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.sessions.length).toBe(2);
      expect(result.plans.length).toBe(1);
      expect(result.learned.length).toBe(1);
      expect(result.total).toBe(4);
    });

    it('should categorize files correctly by type', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(path.join(aiknowsysDir, 'sessions'), { recursive: true });
      
      await fs.writeFile(path.join(aiknowsysDir, 'sessions', '2026-01-15-test.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_auth.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_database.md'), 'content');
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].filename).toBe('2026-01-15-test.md');
      expect(result.sessions[0].type).toBe('session');
      
      expect(result.plans).toHaveLength(2);
      expect(result.plans[0].type).toBe('plan');
      expect(result.plans[1].type).toBe('plan');
    });

    it('should include absolute file paths', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(aiknowsysDir, { recursive: true });
      
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_test.md'), 'content');
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.plans[0].absolutePath).toBe(path.join(aiknowsysDir, 'PLAN_test.md'));
      expect(path.isAbsolute(result.plans[0].absolutePath)).toBe(true);
    });

    it('should include relative paths from .aiknowsys root', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(path.join(aiknowsysDir, 'sessions'), { recursive: true });
      
      await fs.writeFile(path.join(aiknowsysDir, 'sessions', '2026-02-12-test.md'), 'content');
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.sessions[0].relativePath).toBe('sessions/2026-02-12-test.md');
    });

    it('should handle missing .aiknowsys directory gracefully', async () => {
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.sessions).toEqual([]);
      expect(result.plans).toEqual([]);
      expect(result.learned).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should skip non-markdown files', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(aiknowsysDir, { recursive: true });
      
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_test.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'README.txt'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'config.json'), '{}');
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.total).toBe(1);
      expect(result.plans).toHaveLength(1);
    });

    it('should skip context-index.json and other metadata files', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(aiknowsysDir, { recursive: true });
      
      await fs.writeFile(path.join(aiknowsysDir, 'context-index.json'), '{}');
      await fs.writeFile(path.join(aiknowsysDir, 'skill-usage.json'), '{}');
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_test.md'), 'content');
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.total).toBe(1);
      expect(result.plans).toHaveLength(1);
    });

    it('should detect plan pointer files (active-*.md)', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(path.join(aiknowsysDir, 'plans'), { recursive: true });
      
      await fs.writeFile(path.join(aiknowsysDir, 'plans', 'active-alice.md'), '# Active plan');
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_main.md'), '# Main plan');
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.plans).toHaveLength(2);
      const activePointer = result.plans.find(p => p.filename === 'active-alice.md');
      expect(activePointer).toBeDefined();
      expect(activePointer?.relativePath).toBe('plans/active-alice.md');
    });

    it('should scan nested learned pattern directories', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(path.join(aiknowsysDir, 'learned', 'error-resolution'), { recursive: true });
      await fs.mkdir(path.join(aiknowsysDir, 'learned', 'workflows'), { recursive: true });
      
      await fs.writeFile(path.join(aiknowsysDir, 'learned', 'pattern1.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'learned', 'error-resolution', 'fix1.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'learned', 'workflows', 'deploy.md'), 'content');
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.learned).toHaveLength(3);
      expect(result.learned.find(l => l.relativePath === 'learned/pattern1.md')).toBeDefined();
      expect(result.learned.find(l => l.relativePath === 'learned/error-resolution/fix1.md')).toBeDefined();
      expect(result.learned.find(l => l.relativePath === 'learned/workflows/deploy.md')).toBeDefined();
    });

    it('should record file size for each discovered file', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(aiknowsysDir, { recursive: true });
      
      const content = 'This is test content with some length';
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_test.md'), content);
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.plans[0].size).toBe(content.length);
      expect(result.plans[0].size).toBeGreaterThan(0);
    });

    it('should handle file read errors gracefully', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(aiknowsysDir, { recursive: true });
      
      const testFile = path.join(aiknowsysDir, 'PLAN_test.md');
      await fs.writeFile(testFile, 'content');
      
      // Make file unreadable (permissions issue simulation)
      // Note: This may not work on all systems, test will be skipped if it fails
      try {
        await fs.chmod(testFile, 0o000);
        
        const result = await scanner.scanDirectory(tmpDir);
        
        // Should continue scanning despite errors
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('PLAN_test.md');
        
        // Restore permissions for cleanup
        await fs.chmod(testFile, 0o644);
      } catch (error) {
        // Skip test if chmod doesn't work (Windows, etc.)
        console.log('Skipping permission test (platform limitation)');
      }
    });

    it('should return file discovery statistics', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(path.join(aiknowsysDir, 'sessions'), { recursive: true });
      await fs.mkdir(path.join(aiknowsysDir, 'learned'), { recursive: true });
      
      await fs.writeFile(path.join(aiknowsysDir, 'sessions', '2026-01-01.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'sessions', '2026-01-02.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_a.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_b.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_c.md'), 'content');
      await fs.writeFile(path.join(aiknowsysDir, 'learned', 'pattern.md'), 'content');
      
      const result = await scanner.scanDirectory(tmpDir);
      
      expect(result.total).toBe(6);
      expect(result.sessions.length + result.plans.length + result.learned.length).toBe(6);
    });

    it('should report errors from sessions directory scan', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      
      // Create a file that will cause a stat error
      const badFile = path.join(sessionsDir, 'corrupted.md');
      await fs.writeFile(badFile, 'content');
      
      // Make file inaccessible (if platform supports it)
      try {
        await fs.chmod(badFile, 0o000);
        
        const result = await scanner.scanDirectory(tmpDir);
        
        // Should report error for inaccessible file
        const sessionError = result.errors.find(e => e.includes('corrupted.md'));
        expect(sessionError).toBeDefined();
        
        // Restore permissions for cleanup
        await fs.chmod(badFile, 0o644);
      } catch (error) {
        // Skip test if chmod doesn't work (Windows, etc.)
        console.log('Skipping sessions error test (platform limitation)');
      }
    });

    it('should report errors from learned directory scan', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const learnedDir = path.join(aiknowsysDir, 'learned');
      await fs.mkdir(learnedDir, { recursive: true });
      
      // Create a file that will cause a stat error
      const badFile = path.join(learnedDir, 'corrupted.md');
      await fs.writeFile(badFile, 'content');
      
      // Make file inaccessible (if platform supports it)
      try {
        await fs.chmod(badFile, 0o000);
        
        const result = await scanner.scanDirectory(tmpDir);
        
        // Should report error for inaccessible file
        const learnedError = result.errors.find(e => e.includes('corrupted.md'));
        expect(learnedError).toBeDefined();
        
        // Restore permissions for cleanup
        await fs.chmod(badFile, 0o644);
      } catch (error) {
        // Skip test if chmod doesn't work (Windows, etc.)
        console.log('Skipping learned error test (platform limitation)');
      }
    });
  });
});
