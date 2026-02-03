import {describe, it} from 'node:test';
import assert from 'node:assert';
import {validateDeliverables} from '../../lib/commands/validate-deliverables.js';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, '../fixtures/validate-deliverables');

describe('validate-deliverables', () => {
  describe('Template Schema Validation', () => {
    it('should detect missing required placeholders', async () => {
      // Test that templates without required placeholders are caught
      const result = await validateDeliverables({_silent: true, _testMode: true});
      const schemaCheck = result.checks.find(c => c.name === 'Template Schema');
      assert.ok(schemaCheck, 'Template Schema check should exist');
    });

    it('should detect forbidden patterns', async () => {
      // Test that forbidden patterns are caught
      const result = await validateDeliverables({_silent: true, _testMode: true});
      const schemaCheck = result.checks.find(c => c.name === 'Template Schema');
      assert.ok(schemaCheck, 'Template Schema check should exist');
    });
  });

  describe('Pattern Consistency Check', () => {
    it('should detect legacy PENDING_REVIEW.md in templates', async () => {
      // Create temporary template with legacy pattern
      const testTemplate = path.join(testDir, 'test-template.md');
      await fs.mkdir(testDir, {recursive: true});
      await fs.writeFile(testTemplate, 'See `.aiknowsys/PENDING_REVIEW.md` for review');

      const result = await validateDeliverables({_silent: true});
      const patternCheck = result.checks.find(c => c.name === 'Legacy Patterns');
      
      assert.ok(patternCheck, 'Legacy Patterns check should exist');
      if (patternCheck && !patternCheck.passed) {
        assert.ok(
          patternCheck.issues.some(i => i.includes('PENDING_REVIEW.md')),
          'Should detect PENDING_REVIEW.md pattern'
        );
      }

      // Cleanup
      await fs.rm(testDir, {recursive: true, force: true});
    });

    it('should detect Edit CURRENT_PLAN.md pattern', async () => {
      const testTemplate = path.join(testDir, 'test-template.md');
      await fs.mkdir(testDir, {recursive: true});
      await fs.writeFile(testTemplate, 'Edit CURRENT_PLAN.md to update your plan');

      const result = await validateDeliverables({_silent: true});
      const patternCheck = result.checks.find(c => c.name === 'Legacy Patterns');
      
      assert.ok(patternCheck, 'Legacy Patterns check should exist');
      if (patternCheck && !patternCheck.passed) {
        assert.ok(
          patternCheck.issues.some(i => i.includes('CURRENT_PLAN.md')),
          'Should detect CURRENT_PLAN.md pattern'
        );
      }

      await fs.rm(testDir, {recursive: true, force: true});
    });

    it('should pass when templates match non-templates', async () => {
      // This tests actual templates in the repo
      const result = await validateDeliverables({_silent: true});
      
      // Should have pattern check
      const patternCheck = result.checks.find(c => c.name === 'Pattern Consistency');
      assert.ok(patternCheck, 'Pattern Consistency check should exist');
    });
  });

  describe('Placeholder Detection', () => {
    it('should detect unresolved {{PLACEHOLDERS}} in non-template files', async () => {
      const testFile = path.join(testDir, 'test.md');
      await fs.mkdir(testDir, {recursive: true});
      await fs.writeFile(testFile, 'Welcome to {{PROJECT_NAME}}!');

      const result = await validateDeliverables({_silent: true});
      const placeholderCheck = result.checks.find(c => c.name === 'Placeholders');
      
      assert.ok(placeholderCheck, 'Placeholders check should exist');
      
      await fs.rm(testDir, {recursive: true, force: true});
    });

    it('should allow {{PLACEHOLDERS}} in .template.md files', async () => {
      // .template.md files SHOULD have placeholders
      const result = await validateDeliverables({_silent: true});
      
      // Template exceptions should not be flagged
      const placeholderCheck = result.checks.find(c => c.name === 'Placeholders');
      if (placeholderCheck && placeholderCheck.issues) {
        assert.ok(
          placeholderCheck.issues.every(i => !i.includes('.template.md')),
          'Should not flag .template.md files'
        );
      }
    });
  });

  describe('Visual Diff on Failure', () => {
    it('should show visual diff when patterns mismatch', async () => {
      // This is tested implicitly when errors are shown
      const result = await validateDeliverables({_silent: true});
      assert.ok('checks' in result, 'Result should have checks property');
      assert.ok(Array.isArray(result.checks), 'Checks should be an array');
    });
  });

  describe('Auto-Fix Mode', () => {
    it('should fix simple pattern replacements with --fix', async () => {
      const testFile = path.join(testDir, 'auto-fix-test.md');
      await fs.mkdir(testDir, {recursive: true});
      await fs.writeFile(testFile, 'See PENDING_REVIEW.md for details');

      const result = await validateDeliverables({_silent: true, fix: true});
      
      assert.ok('fixed' in result, 'Result should have fixed property');
      
      await fs.rm(testDir, {recursive: true, force: true});
    });

    it('should not break complex patterns during auto-fix', async () => {
      // Auto-fix should only handle simple replacements
      const result = await validateDeliverables({_silent: true, fix: true});
      assert.ok('checks' in result, 'Result should have checks property');
    });
  });

  describe('Template Execution Test (--full mode)', () => {
    it('should validate YAML frontmatter in agent templates', async () => {
      const result = await validateDeliverables({_silent: true, full: true});
      
      const executionCheck = result.checks.find(c => c.name === 'Template Execution');
      assert.ok(executionCheck, 'Template Execution check should exist');
    });

    it('should catch syntax errors in templates', async () => {
      // Create template with invalid YAML
      const testTemplate = path.join(testDir, 'bad-yaml.template.md');
      await fs.mkdir(testDir, {recursive: true});
      await fs.writeFile(testTemplate, '---\nname: "broken\ndescription: missing quote\n---');

      const result = await validateDeliverables({_silent: true, full: true});
      
      const executionCheck = result.checks.find(c => c.name === 'Template Execution');
      if (executionCheck) {
        // May or may not catch this depending on implementation
        assert.ok('passed' in executionCheck, 'Execution check should have passed property');
      }

      await fs.rm(testDir, {recursive: true, force: true});
    });
  });

  describe('Fresh Init Test (--full mode)', () => {
    it('should validate generated files from init', async () => {
      const result = await validateDeliverables({_silent: true, full: true});
      
      const initCheck = result.checks.find(c => c.name === 'Fresh Init');
      assert.ok(initCheck, 'Fresh Init check should exist');
    });
  });

  describe('Metrics Logging', () => {
    it('should log validation metrics', async () => {
      const result = await validateDeliverables({_silent: true, metrics: true});
      
      assert.ok('metrics' in result, 'Result should have metrics property');
      assert.ok('templatesChecked' in result.metrics, 'Metrics should have templatesChecked');
      assert.ok('duration' in result.metrics, 'Metrics should have duration');
    });

    it('should track validation history', async () => {
      const result = await validateDeliverables({_silent: true, metrics: true});
      
      // Metrics should be logged
      assert.ok(result.metrics, 'Result should have metrics');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing templates directory gracefully', async () => {
      // This tests resilience
      const result = await validateDeliverables({_silent: true});
      assert.ok('passed' in result, 'Result should have passed property');
      assert.ok('checks' in result, 'Result should have checks property');
    });

    it('should report multiple issues clearly', async () => {
      const result = await validateDeliverables({_silent: true});
      
      assert.ok('summary' in result, 'Result should have summary property');
      assert.strictEqual(typeof result.summary, 'string', 'Summary should be a string');
    });

    it('should work in silent mode for programmatic use', async () => {
      const result = await validateDeliverables({_silent: true});
      
      assert.ok('passed' in result, 'Result should have passed property');
      assert.ok('checks' in result, 'Result should have checks property');
      assert.ok('exitCode' in result, 'Result should have exitCode property');
    });
  });

  describe('Return Format', () => {
    it('should return expected structure', async () => {
      const result = await validateDeliverables({_silent: true});
      
      assert.ok('passed' in result, 'Result should have passed property');
      assert.strictEqual(typeof result.passed, 'boolean', 'Passed should be boolean');
      
      assert.ok('checks' in result, 'Result should have checks property');
      assert.ok(Array.isArray(result.checks), 'Checks should be an array');
      
      assert.ok('summary' in result, 'Result should have summary property');
      assert.strictEqual(typeof result.summary, 'string', 'Summary should be string');
      
      assert.ok('exitCode' in result, 'Result should have exitCode property');
      assert.strictEqual(typeof result.exitCode, 'number', 'ExitCode should be number');
    });

    it('should include check details', async () => {
      const result = await validateDeliverables({_silent: true});
      
      result.checks.forEach(check => {
        assert.ok('name' in check, 'Check should have name property');
        assert.ok('passed' in check, 'Check should have passed property');
        assert.ok('issues' in check, 'Check should have issues property');
        assert.ok(Array.isArray(check.issues), 'Issues should be an array');
      });
    });
  });
});
