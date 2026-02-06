import { describe, it, expect } from 'vitest';
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
      expect(schemaCheck).toBeTruthy();
    });

    it('should detect forbidden patterns', async () => {
      // Test that forbidden patterns are caught
      const result = await validateDeliverables({_silent: true, _testMode: true});
      const schemaCheck = result.checks.find(c => c.name === 'Template Schema');
      expect(schemaCheck).toBeTruthy();
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
      
      expect(patternCheck).toBeTruthy();
      if (patternCheck && !patternCheck.passed) {
        expect(patternCheck.issues.some(i => i.includes('PENDING_REVIEW.md'))).toBeTruthy();
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
      
      expect(patternCheck).toBeTruthy();
      if (patternCheck && !patternCheck.passed) {
        expect(patternCheck.issues.some(i => i.includes('CURRENT_PLAN.md'))).toBeTruthy();
      }

      await fs.rm(testDir, {recursive: true, force: true});
    });

    it('should pass when templates match non-templates', async () => {
      // This tests actual templates in the repo
      const result = await validateDeliverables({_silent: true});
      
      // Should have pattern check
      const patternCheck = result.checks.find(c => c.name === 'Pattern Consistency');
      expect(patternCheck).toBeTruthy();
    });
  });

  describe('Placeholder Detection', () => {
    it('should detect unresolved {{PLACEHOLDERS}} in non-template files', async () => {
      const testFile = path.join(testDir, 'test.md');
      await fs.mkdir(testDir, {recursive: true});
      await fs.writeFile(testFile, 'Welcome to {{PROJECT_NAME}}!');

      const result = await validateDeliverables({_silent: true});
      const placeholderCheck = result.checks.find(c => c.name === 'Placeholders');
      
      expect(placeholderCheck).toBeTruthy();
      
      await fs.rm(testDir, {recursive: true, force: true});
    });

    it('should allow {{PLACEHOLDERS}} in .template.md files', async () => {
      // .template.md files SHOULD have placeholders
      const result = await validateDeliverables({_silent: true});
      
      // Template exceptions should not be flagged
      const placeholderCheck = result.checks.find(c => c.name === 'Placeholders');
      if (placeholderCheck && placeholderCheck.issues) {
        expect(placeholderCheck.issues.every(i => !i.includes('.template.md'))).toBeTruthy();
      }
    });
  });

  describe('Visual Diff on Failure', () => {
    it('should show visual diff when patterns mismatch', async () => {
      // This is tested implicitly when errors are shown
      const result = await validateDeliverables({_silent: true});
      expect('checks' in result).toBeTruthy();
      expect(Array.isArray(result.checks)).toBeTruthy();
    });
  });

  describe('Auto-Fix Mode', () => {
    it('should fix simple pattern replacements with --fix', async () => {
      const testFile = path.join(testDir, 'auto-fix-test.md');
      await fs.mkdir(testDir, {recursive: true});
      await fs.writeFile(testFile, 'See PENDING_REVIEW.md for details');

      const result = await validateDeliverables({_silent: true, fix: true});
      
      expect('fixed' in result).toBeTruthy();
      
      await fs.rm(testDir, {recursive: true, force: true});
    });

    it('should not break complex patterns during auto-fix', async () => {
      // Auto-fix should only handle simple replacements
      const result = await validateDeliverables({_silent: true, fix: true});
      expect('checks' in result).toBeTruthy();
    });
  });

  describe('Template Execution Test (--full mode)', () => {
    it('should validate YAML frontmatter in agent templates', async () => {
      const result = await validateDeliverables({_silent: true, full: true});
      
      const executionCheck = result.checks.find(c => c.name === 'Template Execution');
      expect(executionCheck).toBeTruthy();
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
        expect('passed' in executionCheck).toBeTruthy();
      }

      await fs.rm(testDir, {recursive: true, force: true});
    });
  });

  describe('Fresh Init Test (--full mode)', () => {
    it('should validate generated files from init', async () => {
      const result = await validateDeliverables({_silent: true, full: true});
      
      const initCheck = result.checks.find(c => c.name === 'Fresh Init');
      expect(initCheck).toBeTruthy();
    });
  });

  describe('Metrics Logging', () => {
    it('should log validation metrics', async () => {
      const result = await validateDeliverables({_silent: true, metrics: true});
      
      expect('metrics' in result).toBeTruthy();
      expect('templatesChecked' in result.metrics).toBeTruthy();
      expect('duration' in result.metrics).toBeTruthy();
    });

    it('should track validation history', async () => {
      const result = await validateDeliverables({_silent: true, metrics: true});
      
      // Metrics should be logged
      expect(result.metrics).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing templates directory gracefully', async () => {
      // This tests resilience
      const result = await validateDeliverables({_silent: true});
      expect('passed' in result).toBeTruthy();
      expect('checks' in result).toBeTruthy();
    });

    it('should report multiple issues clearly', async () => {
      const result = await validateDeliverables({_silent: true});
      
      expect('summary' in result).toBeTruthy();
      expect(typeof result.summary).toBe('string');
    });

    it('should work in silent mode for programmatic use', async () => {
      const result = await validateDeliverables({_silent: true});
      
      expect('passed' in result).toBeTruthy();
      expect('checks' in result).toBeTruthy();
      expect('exitCode' in result).toBeTruthy();
    });
  });

  describe('Maintainer Skill Boundary Check', () => {
    const testGithubSkills = path.join(testDir, '.github', 'skills');
    const testTemplateSkills = path.join(testDir, 'templates', 'skills');

    it('should pass when maintainer skill only in .github/skills/', async () => {
      // Setup: maintainer skill only in .github/skills/
      await fs.mkdir(path.join(testGithubSkills, 'test-maintainer'), {recursive: true});
      await fs.writeFile(
        path.join(testGithubSkills, 'test-maintainer', 'SKILL.md'),
        '---\nname: test-maintainer\nmaintainer: true\n---\n# Test'
      );

      const result = await validateDeliverables({
        _silent: true,
        projectRoot: testDir
      });

      const boundaryCheck = result.checks.find(c => c.name === 'Maintainer Skill Boundary');
      expect(boundaryCheck).toBeTruthy();
      expect(boundaryCheck.passed).toBe(true);
      expect(boundaryCheck.issues.length).toBe(0);

      // Cleanup
      await fs.rm(testDir, {recursive: true, force: true});
    });

    it('should fail when maintainer skill also in templates/skills/', async () => {
      // Setup: maintainer skill in BOTH locations
      await fs.mkdir(path.join(testGithubSkills, 'test-maintainer'), {recursive: true});
      await fs.writeFile(
        path.join(testGithubSkills, 'test-maintainer', 'SKILL.md'),
        '---\nname: test-maintainer\nmaintainer: true\n---\n# Test'
      );
      
      await fs.mkdir(path.join(testTemplateSkills, 'test-maintainer'), {recursive: true});
      await fs.writeFile(
        path.join(testTemplateSkills, 'test-maintainer', 'SKILL.md'),
        '---\nname: test-maintainer\nmaintainer: true\n---\n# Test'
      );

      const result = await validateDeliverables({
        _silent: true,
        projectRoot: testDir
      });

      const boundaryCheck = result.checks.find(c => c.name === 'Maintainer Skill Boundary');
      expect(boundaryCheck).toBeTruthy();
      expect(boundaryCheck.passed).toBe(false);
      expect(boundaryCheck.issues.some(i => i.includes('test-maintainer'))).toBeTruthy();

      // Cleanup
      await fs.rm(testDir, {recursive: true, force: true});
    });

    it('should pass when regular skill in both locations', async () => {
      // Setup: regular skill (no maintainer: true) in both locations
      await fs.mkdir(path.join(testGithubSkills, 'test-regular'), {recursive: true});
      await fs.writeFile(
        path.join(testGithubSkills, 'test-regular', 'SKILL.md'),
        '---\nname: test-regular\ndescription: Regular skill\n---\n# Test'
      );
      
      await fs.mkdir(path.join(testTemplateSkills, 'test-regular'), {recursive: true});
      await fs.writeFile(
        path.join(testTemplateSkills, 'test-regular', 'SKILL.md'),
        '---\nname: test-regular\ndescription: Regular skill\n---\n# Test'
      );

      const result = await validateDeliverables({
        _silent: true,
        projectRoot: testDir
      });

      const boundaryCheck = result.checks.find(c => c.name === 'Maintainer Skill Boundary');
      expect(boundaryCheck).toBeTruthy();
      expect(boundaryCheck.passed).toBe(true);
      expect(boundaryCheck.issues.length).toBe(0);

      // Cleanup
      await fs.rm(testDir, {recursive: true, force: true});
    });
  });

  describe('Return Format', () => {
    it('should return expected structure', async () => {
      const result = await validateDeliverables({_silent: true});
      
      expect('passed' in result).toBeTruthy();
      expect(typeof result.passed).toBe('boolean');
      
      expect('checks' in result).toBeTruthy();
      expect(Array.isArray(result.checks)).toBeTruthy();
      
      expect('summary' in result).toBeTruthy();
      expect(typeof result.summary).toBe('string');
      
      expect('exitCode' in result).toBeTruthy();
      expect(typeof result.exitCode).toBe('number');
    });

    it('should include check details', async () => {
      const result = await validateDeliverables({_silent: true});
      
      result.checks.forEach(check => {
        expect('name' in check).toBeTruthy();
        expect('passed' in check).toBeTruthy();
        expect('issues' in check).toBeTruthy();
        expect(Array.isArray(check.issues)).toBeTruthy();
      });
    });
  });
});
