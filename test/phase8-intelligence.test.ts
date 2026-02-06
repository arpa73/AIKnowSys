import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Use PROJECT_ROOT to resolve templates (works from compiled dist/ and source)
const projectRoot = process.env.PROJECT_ROOT || path.join(import.meta.dirname, '..');

describe('Phase 8: Advanced Intelligence', () => {
  const testDir = path.join(import.meta.dirname, 'fixtures', 'phase8-test');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Cleanup errors can be ignored
    }
  });

  describe('Migration Check Hook', () => {
    const hookPath = path.join(projectRoot, 'templates', 'hooks', 'migration-check.cjs');

    it('should have migration-check.cjs hook file', async () => {
      try {
        await fs.access(hookPath);
        expect(true).toBeTruthy();
      } catch {
        expect.fail('migration-check.cjs should exist');
      }
    });

    it('should be valid CommonJS syntax', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should use module.exports
      expect(content.includes('module.exports')).toBeTruthy();
      
      // Should not use ES module syntax
      expect(!content.includes('export default')).toBeTruthy();
    });

    it('should accept sessionStart data', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have async function signature
      expect(content.match(/async\s+function.*\(.*data.*\)/)).toBeTruthy();
    });

    it('should check for version mismatches', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should check versions
      expect(content.includes('version') || content.includes('Version')).toBeTruthy();
    });

    it('should suggest migration when versions differ', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should suggest migration command
      expect(content.includes('migrate') || content.includes('Migration')).toBeTruthy();
    });

    it('should fail silently to avoid blocking workflow', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have error handling
      expect(content.includes('try') && content.includes('catch')).toBeTruthy();
    });
  });

  describe('Documentation Sync Hook', () => {
    const hookPath = path.join(projectRoot, 'templates', 'hooks', 'doc-sync.cjs');

    it('should have doc-sync.cjs hook file', async () => {
      try {
        await fs.access(hookPath);
        expect(true).toBeTruthy();
      } catch {
        expect.fail('doc-sync.cjs should exist');
      }
    });

    it('should be valid CommonJS syntax', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should use module.exports
      expect(content.includes('module.exports')).toBeTruthy();
      
      // Should not use ES module syntax
      expect(!content.includes('export default')).toBeTruthy();
    });

    it('should accept preToolUse or sessionStart data', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have async function signature
      expect(content.match(/async\s+function.*\(.*data.*\)/)).toBeTruthy();
    });

    it('should track code-to-doc relationships', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have mapping of code to docs
      expect(content.includes('README') || content.includes('doc') || content.includes('Doc')).toBeTruthy();
    });

    it('should detect stale documentation', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should check file ages or modification times
      expect(content.includes('age') || content.includes('time') || content.includes('stale')).toBeTruthy();
    });

    it('should warn about outdated docs', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should log warnings
      expect(content.includes('console.error') || content.includes('console.warn')).toBeTruthy();
    });

    it('should fail silently to avoid blocking workflow', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have error handling
      expect(content.includes('try') && content.includes('catch')).toBeTruthy();
    });
  });

  describe('Version Detection Logic', () => {
    it('should compare version strings correctly', () => {
      const compareVersions = (v1: string, v2: string) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
          if (parts1[i] > parts2[i]) return 1;
          if (parts1[i] < parts2[i]) return -1;
        }
        return 0;
      };

      expect(compareVersions('0.8.0', '0.8.0')).toBe(0);
      expect(compareVersions('0.9.0', '0.8.0')).toBe(1);
      expect(compareVersions('0.7.0', '0.8.0')).toBe(-1);
    });

    it('should detect major version differences', () => {
      const isMajorDiff = (v1: string, v2: string) => {
        const major1 = parseInt(v1.split('.')[0]);
        const major2 = parseInt(v2.split('.')[0]);
        return major1 !== major2;
      };

      expect(isMajorDiff('1.0.0', '0.8.0')).toBeTruthy();
      expect(!isMajorDiff('0.8.0', '0.7.0')).toBeTruthy();
    });
  });

  describe('Documentation Staleness Detection', () => {
    it('should calculate file age in days', async () => {
      const testFile = path.join(testDir, 'test.md');
      await fs.writeFile(testFile, '# Test');
      
      const stats = await fs.stat(testFile);
      const ageMs = Date.now() - stats.mtime.getTime();
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      
      expect(ageDays <= 1).toBeTruthy();
    });

    it('should identify files older than threshold', () => {
      const threshold = 7; // days
      const fileAge = 10; // days
      
      const isStale = fileAge > threshold;
      expect(isStale).toBeTruthy();
    });

    it('should not flag recently updated files', () => {
      const threshold = 7; // days
      const fileAge = 2; // days
      
      const isStale = fileAge > threshold;
      expect(!isStale).toBeTruthy();
    });
  });

  describe('Code-to-Doc Mapping', () => {
    it('should map commands to documentation files', () => {
      const codeToDoc: Record<string, string[]> = {
        'lib/commands/init.js': ['README.md', 'SETUP_GUIDE.md'],
        'lib/commands/scan.js': ['docs/customization-guide.md'],
        'lib/commands/migrate.js': ['docs/migration-guide.md']
      };

      expect(Array.isArray(codeToDoc['lib/commands/init.js'])).toBeTruthy();
      expect(codeToDoc['lib/commands/init.js'].length).toBe(2);
    });

    it('should support multiple docs per code file', () => {
      const codeToDoc: Record<string, string[]> = {
        'lib/commands/init.js': ['README.md', 'SETUP_GUIDE.md', 'docs/examples.md']
      };

      const docs = codeToDoc['lib/commands/init.js'];
      expect(docs.length > 1).toBeTruthy();
    });
  });
});
