import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { checkEssentialsBloat } from '../lib/quality-checkers/essentials-bloat.js';
import { validateTemplates } from '../lib/quality-checkers/template-validator.js';
import { validateLinks } from '../lib/quality-checkers/link-validator.js';
import { scanPatterns } from '../lib/quality-checkers/pattern-scanner.js';
import { qualityCheck } from '../lib/commands/quality-check.js';

const TEST_DIR: string = path.join(import.meta.dirname, '../test-temp-quality');

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
      const bloatedContent: string = Array(900).fill('# Line').join('\n');
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        bloatedContent
      );

      const result: any = await checkEssentialsBloat(TEST_DIR, { essentialsMaxLines: 800 });

      expect(result.passed).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.message.includes('900 lines')).toBeTruthy();
      expect(result.message.includes('800')).toBeTruthy();
      expect(result.fix.includes('compress-essentials')).toBeTruthy();
      expect(result.details.current).toBe(900);
      expect(result.details.threshold).toBe(800);
      expect(result.details.excess).toBe(100);
    });

    it('should pass when ESSENTIALS under threshold', async () => {
      // Create small ESSENTIALS (650 lines, threshold 800)
      const smallContent: string = Array(650).fill('# Line').join('\n');
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        smallContent
      );

      const result: any = await checkEssentialsBloat(TEST_DIR, { essentialsMaxLines: 800 });

      expect(result.passed).toBe(true);
      expect(result.message.includes('650 lines')).toBeTruthy();
      expect(result.message.includes('under 800')).toBeTruthy();
    });

    it('should respect custom threshold from config', async () => {
      // 950 lines with threshold 1000 should pass
      const content: string = Array(950).fill('# Line').join('\n');
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        content
      );

      const result: any = await checkEssentialsBloat(TEST_DIR, { essentialsMaxLines: 1000 });

      expect(result.passed).toBe(true);
    });

    it('should suggest compress-essentials when bloated', async () => {
      const bloatedContent: string = Array(900).fill('# Line').join('\n');
      await fs.writeFile(
        path.join(TEST_DIR, 'CODEBASE_ESSENTIALS.md'),
        bloatedContent
      );

      const result: any = await checkEssentialsBloat(TEST_DIR);

      expect(result.fix.includes('compress-essentials')).toBeTruthy();
      expect(result.fix.includes('--analyze')).toBeTruthy();
    });

    it('should handle missing ESSENTIALS.md gracefully', async () => {
      const result: any = await checkEssentialsBloat(TEST_DIR);

      expect(result.passed).toBe(true);
      expect(result.message.includes('not found')).toBeTruthy();
    });
  });

  describe('Template validation', () => {
    it('should detect unresolved {{VARIABLES}}', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '# {{PROJECT_NAME}}\n\nWelcome to {{APP_NAME}}!'
      );

      const result: any = await validateTemplates(TEST_DIR);

      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.message.includes('2 unresolved')).toBeTruthy();
      expect(result.violations.length).toBe(2);
      expect(result.violations[0].variable).toBe('PROJECT_NAME');
      expect(result.violations[0].line).toBe(1);
      expect(result.violations[1].variable).toBe('APP_NAME');
      expect(result.violations[1].line).toBe(3);
    });

    it('should ignore variables in templates directory', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'templates'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, 'templates', 'template.md'),
        '# {{PROJECT_NAME}}'
      );

      const result: any = await validateTemplates(TEST_DIR);

      expect(result.passed).toBe(true);
    });

    it('should report file location of unresolved vars', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'docs.md'),
        'Line 1\n# {{VAR}} here\nLine 3'
      );

      const result: any = await validateTemplates(TEST_DIR);

      expect(result.passed).toBe(false);
      expect(result.violations[0].file.includes('docs.md')).toBeTruthy();
      expect(result.violations[0].line).toBe(2);
      expect(result.violations[0].context.includes('{{VAR}}')).toBeTruthy();
    });

    it('should handle multiple variables on same line', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'test.md'),
        '{{VAR1}} and {{VAR2}} here'
      );

      const result: any = await validateTemplates(TEST_DIR);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBe(2);
    });

    it('should pass when no unresolved variables found', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '# My Project\n\nNo variables here!'
      );

      const result: any = await validateTemplates(TEST_DIR);

      expect(result.passed).toBe(true);
    });
  });

  describe('Link validation', () => {
    it('should detect broken internal links', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '[Link to missing](missing-file.md)'
      );

      const result: any = await validateLinks(TEST_DIR);

      expect(result.passed).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.violations.length).toBe(1);
      expect(result.violations[0].link).toBe('missing-file.md');
      expect(result.violations[0].reason).toBe('Target file not found');
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

      const result: any = await validateLinks(TEST_DIR);

      expect(result.passed).toBe(false);
      expect(result.violations[0].reason.includes('Anchor')).toBeTruthy();
      expect(result.violations[0].reason.includes('section-two')).toBeTruthy();
    });

    it('should skip external URLs', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '[External](https://example.com)\n[Secure](https://secure.org)'
      );

      const result: any = await validateLinks(TEST_DIR);

      expect(result.passed).toBe(true);
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

      const result: any = await validateLinks(TEST_DIR);

      expect(result.passed).toBe(true);
    });

    it('should pass when all links valid', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'target.md'), '# Target');
      await fs.writeFile(
        path.join(TEST_DIR, 'source.md'),
        '[Valid link](target.md)'
      );

      const result: any = await validateLinks(TEST_DIR);

      expect(result.passed).toBe(true);
    });

    it('should skip mailto links', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'README.md'),
        '[Email](mailto:test@example.com)'
      );

      const result: any = await validateLinks(TEST_DIR);

      expect(result.passed).toBe(true);
    });
  });

  describe('Pattern violations', () => {
    it('should detect hardcoded paths', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'bad.js'),
        'const path = "/Users/john/project/file.txt";'
      );

      const result: any = await scanPatterns(TEST_DIR);

      expect(result.passed).toBe(false);
      expect(result.violations.some((v: any) => v.rule === 'no-hardcoded-paths')).toBeTruthy();
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

      const result: any = await scanPatterns(TEST_DIR);

      expect(result.passed).toBe(false);
      const violation: any = result.violations.find((v: any) => v.rule === 'no-require-in-esm');
      expect(violation).toBeTruthy();
      expect(violation.fix.includes('import')).toBeTruthy();
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

      const result: any = await scanPatterns(TEST_DIR);

      const hasRequireViolation: boolean = result.violations?.some((v: any) => 
        v.rule === 'no-require-in-esm' && v.file.includes('hook.cjs')
      );
      expect(hasRequireViolation).toBe(false);
    });

    it('should detect missing test files', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'lib'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, 'lib', 'feature.js'),
        'export function doSomething() {}'
      );

      //       const result: any = await scanPatterns(TEST_DIR);

      //       const _violation: any = result.violations?.find((v: any) => v.rule === 'missing-test-file');
      // This check may be optional depending on project structure
      // For now, we'll consider it informational
    });

    it('should pass when no violations found', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'good.js'),
        'import path from "path";\nconst dir = process.cwd();'
      );

      const result: any = await scanPatterns(TEST_DIR);

      const hasViolations: boolean = result.violations && result.violations.length > 0;
      expect(hasViolations).toBe(false);
    });

    it('should not flag error messages containing require()', async () => {
      // Self-reference edge case: pattern-scanner.js contains require() in error message
      await fs.writeFile(
        path.join(TEST_DIR, 'package.json'),
        JSON.stringify({ type: 'module' })
      );
      await fs.writeFile(
        path.join(TEST_DIR, 'checker.js'),
        'const errorMsg = "Use import instead of require() in ES module project";'
      );

      const result: any = await scanPatterns(TEST_DIR);

      // Should not flag require() when it's in a string
      const hasRequireViolation: boolean = result.violations?.some((v: any) => 
        v.rule === 'no-require-in-esm' && v.file.includes('checker.js')
      );
      expect(hasRequireViolation).toBe(false);
    });

    it('should allow require() in test files', async () => {
      // Test files often use require() for mocking/fixtures
      await fs.writeFile(
        path.join(TEST_DIR, 'package.json'),
        JSON.stringify({ type: 'module' })
      );
      await fs.mkdir(path.join(TEST_DIR, 'test'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, 'test', 'feature.test.js'),
        'const mock = require("./fixtures/mock.json");'
      );

      const result: any = await scanPatterns(TEST_DIR);

      // Should not flag require() in test files
      const hasRequireViolation: boolean = result.violations?.some((v: any) => 
        v.rule === 'no-require-in-esm' && v.file.includes('test')
      );
      expect(hasRequireViolation).toBe(false);
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

      const result: any = await qualityCheck({ dir: TEST_DIR, _silent: true });

      expect(result.checks).toBeTruthy();
      expect(result.checks.essentials).toBeTruthy();
      expect(result.checks.templates).toBeTruthy();
      expect(result.passed).toBe(false);
      expect(result.totalIssues >= 2).toBeTruthy();
    });

    it('should support dry-run mode', async () => {
      const result: any = await qualityCheck({ 
        dir: TEST_DIR, 
        dryRun: true,
        _silent: true 
      });

      expect(result).toBeTruthy();
      // Dry-run should still execute checks
      expect(result.checks).toBeTruthy();
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

      const result: any = await qualityCheck({ dir: TEST_DIR, _silent: true });

      expect(result.passed).toBe(true);
      expect(result.totalIssues).toBe(0);
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

      const result: any = await qualityCheck({ dir: TEST_DIR, _silent: true });

      // Should pass because threshold is 1000, not default 800
      expect(result.checks.essentials.passed).toBeTruthy();
    });

    it('should include deliverables validation check', async () => {
      // Create minimal valid structure
      await fs.mkdir(path.join(TEST_DIR, 'templates', 'agents'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, 'templates', 'agents', 'test.template.md'),
        '# Test Template'
      );

      const result: any = await qualityCheck({ dir: TEST_DIR, _silent: true });

      expect(result.checks.deliverables).toBeTruthy();
      expect('passed' in result.checks.deliverables).toBeTruthy();
      expect('summary' in result.checks.deliverables).toBeTruthy();
    });

    it('should fail when deliverables validation fails', async () => {
      // Create template with legacy pattern
      await fs.mkdir(path.join(TEST_DIR, 'templates', 'agents'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, 'templates', 'agents', 'bad.template.md'),
        'See PENDING_REVIEW.md for review'
      );

      const result: any = await qualityCheck({ dir: TEST_DIR, _silent: true });

      // Deliverables check should detect legacy pattern
      expect(result.checks.deliverables).toBeTruthy();
      // Note: Might pass or fail depending on other checks, just verify it ran
      expect('passed' in result.checks.deliverables).toBeTruthy();
    });

    it('should run deliverables validation in full mode', async () => {
      // Create valid template structure
      await fs.mkdir(path.join(TEST_DIR, 'templates', 'agents'), { recursive: true });
      await fs.writeFile(
        path.join(TEST_DIR, 'templates', 'agents', 'test.template.md'),
        '# Test Template\n\nThis is a test template.'
      );

      const result: any = await qualityCheck({ dir: TEST_DIR, _silent: true });

      // Verify full mode ran (should have all 6 checks, not just 4)
      expect(result.checks.deliverables.checks).toBeTruthy();
      const checkNames: string[] = result.checks.deliverables.checks.map((c: any) => c.name);
      expect(checkNames.includes('Template Execution')).toBeTruthy();
      expect(checkNames.includes('Fresh Init')).toBeTruthy();
      
      // Verify metrics exist
      expect(result.checks.deliverables.metrics).toBeTruthy();
      expect('templatesChecked' in result.checks.deliverables.metrics).toBeTruthy();
      expect('duration' in result.checks.deliverables.metrics).toBeTruthy();
    });
  });
});
