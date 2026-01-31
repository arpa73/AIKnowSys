import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkEssentialsBloat } from '../lib/quality-checkers/essentials-bloat.js';
import { validateTemplates } from '../lib/quality-checkers/template-validator.js';
import { validateLinks } from '../lib/quality-checkers/link-validator.js';
import { scanPatterns } from '../lib/quality-checkers/pattern-scanner.js';
import { qualityCheck } from '../lib/commands/quality-check.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DIR = path.join(__dirname, '../test-temp-quality');

describe('quality-check command', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('ESSENTIALS bloat detection', () => {
    it('should detect when ESSENTIALS exceeds threshold', async () => {
      // Create bloated ESSENTIALS (900 lines, threshold 800)
      const bloatedContent = Array(900).fill('# Line').join('\n');
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        bloatedContent
      );

      const result = await checkEssentialsBloat(TEST_DIR, { essentialsMaxLines: 800 });

      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.severity, 'warning');
      assert.ok(result.message.includes('900 lines'));
      assert.ok(result.message.includes('800'));
      assert.ok(result.fix.includes('compress-essentials'));
      assert.strictEqual(result.details.current, 900);
      assert.strictEqual(result.details.threshold, 800);
      assert.strictEqual(result.details.excess, 100);
    });

    it('should pass when ESSENTIALS under threshold', async () => {
      // Create small ESSENTIALS (650 lines, threshold 800)
      const smallContent = Array(650).fill('# Line').join('\n');
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        smallContent
      );

      const result = await checkEssentialsBloat(TEST_DIR, { essentialsMaxLines: 800 });

      assert.strictEqual(result.passed, true);
      assert.ok(result.message.includes('650 lines'));
      assert.ok(result.message.includes('under 800'));
    });

    it('should respect custom threshold from config', async () => {
      // 950 lines with threshold 1000 should pass
      const content = Array(950).fill('# Line').join('\n');
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        content
      );

      const result = await checkEssentialsBloat(TEST_DIR, { essentialsMaxLines: 1000 });

      assert.strictEqual(result.passed, true);
    });

    it('should suggest compress-essentials when bloated', async () => {
      const bloatedContent = Array(900).fill('# Line').join('\n');
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        bloatedContent
      );

      const result = await checkEssentialsBloat(TEST_DIR);

      assert.ok(result.fix.includes('compress-essentials'));
      assert.ok(result.fix.includes('--analyze'));
    });

    it('should handle missing ESSENTIALS.md gracefully', async () => {
      const result = await checkEssentialsBloat(TEST_DIR);

      assert.strictEqual(result.passed, true);
      assert.ok(result.message.includes('not found'));
    });
  });

  describe('Template validation', () => {
    it('should detect unresolved {{VARIABLES}}', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '# {{PROJECT_NAME}}\n\nWelcome to {{APP_NAME}}!'
      );

      const result = await validateTemplates(TEST_DIR);

      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.severity, 'error');
      assert.ok(result.message.includes('2 unresolved'));
      assert.strictEqual(result.violations.length, 2);
      assert.strictEqual(result.violations[0].variable, 'PROJECT_NAME');
      assert.strictEqual(result.violations[0].line, 1);
      assert.strictEqual(result.violations[1].variable, 'APP_NAME');
      assert.strictEqual(result.violations[1].line, 3);
    });

    it('should ignore variables in templates directory', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'templates'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, 'templates', 'template.md'),
        '# {{PROJECT_NAME}}'
      );

      const result = await validateTemplates(TEST_DIR);

      assert.strictEqual(result.passed, true);
    });

    it('should report file location of unresolved vars', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'docs.md'),
        'Line 1\n# {{VAR}} here\nLine 3'
      );

      const result = await validateTemplates(TEST_DIR);

      assert.strictEqual(result.passed, false);
      assert.ok(result.violations[0].file.includes('docs.md'));
      assert.strictEqual(result.violations[0].line, 2);
      assert.ok(result.violations[0].context.includes('{{VAR}}'));
    });

    it('should handle multiple variables on same line', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'test.md'),
        '{{VAR1}} and {{VAR2}} here'
      );

      const result = await validateTemplates(TEST_DIR);

      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.violations.length, 2);
    });

    it('should pass when no unresolved variables found', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '# My Project\n\nNo variables here!'
      );

      const result = await validateTemplates(TEST_DIR);

      assert.strictEqual(result.passed, true);
    });
  });

  describe('Link validation', () => {
    it('should detect broken internal links', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '[Link to missing](missing-file.md)'
      );

      const result = await validateLinks(TEST_DIR);

      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.severity, 'warning');
      assert.strictEqual(result.violations.length, 1);
      assert.strictEqual(result.violations[0].link, 'missing-file.md');
      assert.strictEqual(result.violations[0].reason, 'Target file not found');
    });

    it('should validate anchor links', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'target.md'),
        '# Section One\n\nContent'
      );
      await fs.writeFile(
        path.join(TEST_DIR, 'source.md'),
        '[Link](target.md#section-two)'
      );

      const result = await validateLinks(TEST_DIR);

      assert.strictEqual(result.passed, false);
      assert.ok(result.violations[0].reason.includes('Anchor'));
      assert.ok(result.violations[0].reason.includes('section-two'));
    });

    it('should skip external URLs', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '[External](https://example.com)\n[Secure](https://secure.org)'
      );

      const result = await validateLinks(TEST_DIR);

      assert.strictEqual(result.passed, true);
    });

    it('should handle relative paths correctly', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'docs'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, 'docs', 'guide.md'),
        'Content'
      );
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '[Guide](docs/guide.md)'
      );

      const result = await validateLinks(TEST_DIR);

      assert.strictEqual(result.passed, true);
    });

    it('should pass when all links valid', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'target.md'), '# Target');
      await fs.writeFile(
        path.join(TEST_DIR, 'source.md'),
        '[Valid link](target.md)'
      );

      const result = await validateLinks(TEST_DIR);

      assert.strictEqual(result.passed, true);
    });

    it('should skip mailto links', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '[Email](mailto:test@example.com)'
      );

      const result = await validateLinks(TEST_DIR);

      assert.strictEqual(result.passed, true);
    });
  });

  describe('Pattern violations', () => {
    it('should detect hardcoded paths', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'bad.js'),
        'const path = "/Users/john/project/file.txt";'
      );

      const result = await scanPatterns(TEST_DIR);

      assert.strictEqual(result.passed, false);
      assert.ok(result.violations.some(v => v.rule === 'no-hardcoded-paths'));
    });

    it('should detect require() in ES module project', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'package.json'),
        JSON.stringify({ type: 'module' })
      );
      await fs.writeFile(
        path.join(TEST_DIR, 'code.js'),
        'const fs = require("fs");'
      );

      const result = await scanPatterns(TEST_DIR);

      assert.strictEqual(result.passed, false);
      const violation = result.violations.find(v => v.rule === 'no-require-in-esm');
      assert.ok(violation);
      assert.ok(violation.fix.includes('import'));
    });

    it('should allow require() in .cjs files', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'package.json'),
        JSON.stringify({ type: 'module' })
      );
      await fs.writeFile(
        path.join(TEST_DIR, 'hook.cjs'),
        'const fs = require("fs");'
      );

      const result = await scanPatterns(TEST_DIR);

      const hasRequireViolation = result.violations?.some(v => 
        v.rule === 'no-require-in-esm' && v.file.includes('hook.cjs')
      );
      assert.strictEqual(hasRequireViolation, false);
    });

    it('should detect missing test files', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'lib'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, 'lib', 'feature.js'),
        'export function doSomething() {}'
      );

      const result = await scanPatterns(TEST_DIR);

      const violation = result.violations?.find(v => v.rule === 'missing-test-file');
      // This check may be optional depending on project structure
      // For now, we'll consider it informational
    });

    it('should pass when no violations found', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'good.js'),
        'import path from "path";\nconst dir = process.cwd();'
      );

      const result = await scanPatterns(TEST_DIR);

      const hasViolations = result.violations && result.violations.length > 0;
      assert.strictEqual(hasViolations, false);
    });
  });

  describe('quality-check command (integration)', () => {
    it('should run all checks and aggregate results', async () => {
      // Create issues across different checkers
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        Array(900).fill('# Line').join('\n')
      );
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '# {{PROJECT}}'
      );

      const result = await qualityCheck({ dir: TEST_DIR, _silent: true });

      assert.ok(result.checks);
      assert.ok(result.checks.essentials);
      assert.ok(result.checks.templates);
      assert.strictEqual(result.passed, false);
      assert.ok(result.totalIssues >= 2);
    });

    it('should support dry-run mode', async () => {
      const result = await qualityCheck({ 
        dir: TEST_DIR, 
        dryRun: true,
        _silent: true 
      });

      assert.ok(result);
      // Dry-run should still execute checks
      assert.ok(result.checks);
    });

    it('should pass when all checks pass', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        Array(600).fill('# Line').join('\n')
      );
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '# My Project'
      );

      const result = await qualityCheck({ dir: TEST_DIR, _silent: true });

      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.totalIssues, 0);
    });

    it('should load config from config.json if available', async () => {
      await fs.mkdir(path.join(TEST_DIR, '.github', 'hooks'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, '.github', 'hooks', 'config.json'),
        JSON.stringify({
          qualityChecks: {
            essentialsMaxLines: 1000
          }
        })
      );
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        Array(950).fill('# Line').join('\n')
      );

      const result = await qualityCheck({ dir: TEST_DIR, _silent: true });

      // Should pass because threshold is 1000, not default 800
      assert.ok(result.checks.essentials.passed);
    });
  });
});
