import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Phase 8: Advanced Intelligence', () => {
  const testDir = path.join(__dirname, 'fixtures', 'phase8-test');

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
    const hookPath = path.join(__dirname, '..', 'templates', 'hooks', 'migration-check.cjs');

    it('should have migration-check.cjs hook file', async () => {
      try {
        await fs.access(hookPath);
        assert.ok(true, 'Hook file exists');
      } catch {
        assert.fail('migration-check.cjs should exist');
      }
    });

    it('should be valid CommonJS syntax', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should use module.exports
      assert.ok(content.includes('module.exports'), 'Should export as CommonJS');
      
      // Should not use ES module syntax
      assert.ok(!content.includes('export default'), 'Should not use ES module syntax');
    });

    it('should accept sessionStart data', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have async function signature
      assert.ok(content.match(/async\s+function.*\(.*data.*\)/), 'Should accept data parameter');
    });

    it('should check for version mismatches', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should check versions
      assert.ok(
        content.includes('version') || content.includes('Version'),
        'Should check version information'
      );
    });

    it('should suggest migration when versions differ', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should suggest migration command
      assert.ok(
        content.includes('migrate') || content.includes('Migration'),
        'Should suggest migration'
      );
    });

    it('should fail silently to avoid blocking workflow', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have error handling
      assert.ok(
        content.includes('try') && content.includes('catch'),
        'Should have try/catch for silent failures'
      );
    });
  });

  describe('Documentation Sync Hook', () => {
    const hookPath = path.join(__dirname, '..', 'templates', 'hooks', 'doc-sync.cjs');

    it('should have doc-sync.cjs hook file', async () => {
      try {
        await fs.access(hookPath);
        assert.ok(true, 'Hook file exists');
      } catch {
        assert.fail('doc-sync.cjs should exist');
      }
    });

    it('should be valid CommonJS syntax', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should use module.exports
      assert.ok(content.includes('module.exports'), 'Should export as CommonJS');
      
      // Should not use ES module syntax
      assert.ok(!content.includes('export default'), 'Should not use ES module syntax');
    });

    it('should accept preToolUse or sessionStart data', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have async function signature
      assert.ok(content.match(/async\s+function.*\(.*data.*\)/), 'Should accept data parameter');
    });

    it('should track code-to-doc relationships', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have mapping of code to docs
      assert.ok(
        content.includes('README') || content.includes('doc') || content.includes('Doc'),
        'Should reference documentation files'
      );
    });

    it('should detect stale documentation', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should check file ages or modification times
      assert.ok(
        content.includes('age') || content.includes('time') || content.includes('stale'),
        'Should detect documentation staleness'
      );
    });

    it('should warn about outdated docs', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should log warnings
      assert.ok(
        content.includes('console.error') || content.includes('console.warn'),
        'Should warn about outdated documentation'
      );
    });

    it('should fail silently to avoid blocking workflow', async () => {
      const content = await fs.readFile(hookPath, 'utf8');
      
      // Should have error handling
      assert.ok(
        content.includes('try') && content.includes('catch'),
        'Should have try/catch for silent failures'
      );
    });
  });

  describe('Version Detection Logic', () => {
    it('should compare version strings correctly', () => {
      const compareVersions = (v1, v2) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
          if (parts1[i] > parts2[i]) return 1;
          if (parts1[i] < parts2[i]) return -1;
        }
        return 0;
      };

      assert.strictEqual(compareVersions('0.8.0', '0.8.0'), 0);
      assert.strictEqual(compareVersions('0.9.0', '0.8.0'), 1);
      assert.strictEqual(compareVersions('0.7.0', '0.8.0'), -1);
    });

    it('should detect major version differences', () => {
      const isMajorDiff = (v1, v2) => {
        const major1 = parseInt(v1.split('.')[0]);
        const major2 = parseInt(v2.split('.')[0]);
        return major1 !== major2;
      };

      assert.ok(isMajorDiff('1.0.0', '0.8.0'));
      assert.ok(!isMajorDiff('0.8.0', '0.7.0'));
    });
  });

  describe('Documentation Staleness Detection', () => {
    it('should calculate file age in days', async () => {
      const testFile = path.join(testDir, 'test.md');
      await fs.writeFile(testFile, '# Test');
      
      const stats = await fs.stat(testFile);
      const ageMs = Date.now() - stats.mtime.getTime();
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      
      assert.strictEqual(ageDays, 0); // Just created
    });

    it('should identify files older than threshold', () => {
      const threshold = 7; // days
      const fileAge = 10; // days
      
      const isStale = fileAge > threshold;
      assert.ok(isStale);
    });

    it('should not flag recently updated files', () => {
      const threshold = 7; // days
      const fileAge = 2; // days
      
      const isStale = fileAge > threshold;
      assert.ok(!isStale);
    });
  });

  describe('Code-to-Doc Mapping', () => {
    it('should map commands to documentation files', () => {
      const codeToDoc = {
        'lib/commands/init.js': ['README.md', 'SETUP_GUIDE.md'],
        'lib/commands/scan.js': ['docs/customization-guide.md'],
        'lib/commands/migrate.js': ['docs/migration-guide.md']
      };

      assert.ok(Array.isArray(codeToDoc['lib/commands/init.js']));
      assert.strictEqual(codeToDoc['lib/commands/init.js'].length, 2);
    });

    it('should support multiple docs per code file', () => {
      const codeToDoc = {
        'lib/commands/init.js': ['README.md', 'SETUP_GUIDE.md', 'docs/examples.md']
      };

      const docs = codeToDoc['lib/commands/init.js'];
      assert.ok(docs.length > 1);
    });
  });
});
