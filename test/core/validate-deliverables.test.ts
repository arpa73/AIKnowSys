/**
 * Tests for core deliverable validation logic
 * Phase 2 Batch 3: EXTRACTION (RED phase)
 * 
 * Tests pure business logic without logger dependency.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { validateDeliverablesCore } from '../../lib/core/validate-deliverables.js';

describe('validateDeliverablesCore', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create test directory
    testDir = path.join(process.cwd(), `test-validate-deliverables-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should pass when all validation checks succeed', async () => {
    // Setup: Create valid template structure
    const templatesDir = path.join(testDir, 'templates/agents');
    await fs.mkdir(templatesDir, { recursive: true });
    
    // Create valid agent template with required placeholder
    await fs.writeFile(
      path.join(templatesDir, 'architect.agent.template.md'),
      '# Architect Agent\n\n{{ESSENTIALS_FILE}}\n\nSome content here.'
    );
    
    // Create corresponding non-template file
    const githubAgentsDir = path.join(testDir, '.github/agents');
    await fs.mkdir(githubAgentsDir, { recursive: true });
    await fs.writeFile(
      path.join(githubAgentsDir, 'architect.agent.md'),
      '# Architect Agent\n\nCODEBASE_ESSENTIALS.md\n\nSome content here.'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.passed).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.summary).toContain('checks passed');
  });

  it('should fail when required placeholder is missing', async () => {
    // Setup: Create template missing required placeholder
    const templatesDir = path.join(testDir, 'templates/agents');
    await fs.mkdir(templatesDir, { recursive: true});
    
    // Missing {{ESSENTIALS_FILE}} placeholder
    await fs.writeFile(
      path.join(templatesDir, 'architect.agent.template.md'),
      '# Architect Agent\n\nSome content without placeholder.'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.passed).toBe(false);
    expect(result.exitCode).toBe(1);
    
    // Find the Template Schema check
    const schemaCheck = result.checks.find(c => c.name === 'Template Schema');
    expect(schemaCheck).toBeDefined();
    expect(schemaCheck?.passed).toBe(false);
    expect(schemaCheck?.issues.length).toBeGreaterThan(0);
    expect(schemaCheck?.issues[0]).toContain('{{ESSENTIALS_FILE}}');
  });

  it('should detect forbidden patterns in templates', async () => {
    // Setup: Create template with forbidden pattern
    const templatesDir = path.join(testDir, 'templates/agents');
    await fs.mkdir(templatesDir, { recursive: true });
    
    await fs.writeFile(
      path.join(templatesDir, 'architect.agent.template.md'),
      '# Architect Agent\n\n{{ESSENTIALS_FILE}}\n\nPENDING_REVIEW.md\n'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.passed).toBe(false);
    
    const schemaCheck = result.checks.find(c => c.name === 'Template Schema');
    expect(schemaCheck?.passed).toBe(false);
    expect(schemaCheck?.issues.some(issue => issue.includes('PENDING_REVIEW.md'))).toBe(true);
  });

  it('should detect unresolved placeholders in non-template files', async () => {
    // Setup: Create non-template file with unresolved placeholder
    const templatesDir = path.join(testDir, 'templates');
    await fs.mkdir(templatesDir, { recursive: true });
    
    // This file should NOT have placeholders (not a .template.md file)
    await fs.writeFile(
      path.join(templatesDir, 'README.md'),
      '# Template README\n\n{{UNRESOLVED_PLACEHOLDER}}\n'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.passed).toBe(false);
    
    const placeholderCheck = result.checks.find(c => c.name === 'Placeholders');
    expect(placeholderCheck?.passed).toBe(false);
    expect(placeholderCheck?.issues.some(issue => 
      issue.includes('{{UNRESOLVED_PLACEHOLDER}}')
    )).toBe(true);
  });

  it('should allow placeholders in .template.md files', async () => {
    // Setup: Create template file (should allow placeholders)
    const templatesDir = path.join(testDir, 'templates');
    await fs.mkdir(templatesDir, { recursive: true });
    
    await fs.writeFile(
      path.join(templatesDir, 'example.template.md'),
      '# Example Template\n\n{{ALLOWED_PLACEHOLDER}}\n'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    // Placeholder check should pass (template files can have placeholders)
    const placeholderCheck = result.checks.find(c => c.name === 'Placeholders');
    expect(placeholderCheck?.passed).toBe(true);
  });

  it('should detect legacy patterns in templates', async () => {
    // Setup: Create template with legacy pattern
    const templatesDir = path.join(testDir, 'templates/docs');
    await fs.mkdir(templatesDir, { recursive: true });
    
    await fs.writeFile(
      path.join(templatesDir, 'workflow.md'),
      '# Workflow\n\nEdit CURRENT_PLAN.md to update your plan.\n'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.passed).toBe(false);
    
    const legacyCheck = result.checks.find(c => c.name === 'Legacy Patterns');
    expect(legacyCheck?.passed).toBe(false);
    expect(legacyCheck?.issues.some(issue => 
      issue.includes('Edit CURRENT_PLAN.md')
    )).toBe(true);
  });

  it('should auto-fix legacy patterns when fix=true', async () => {
    // Setup: Create template with fixable legacy pattern
    const templatesDir = path.join(testDir, 'templates/docs');
    await fs.mkdir(templatesDir, { recursive: true });
    
    const filePath = path.join(templatesDir, 'workflow.md');
    await fs.writeFile(
      filePath,
      '# Workflow\n\nEdit CURRENT_PLAN.md to update your plan.\n'
    );

    const result = await validateDeliverablesCore({ 
      projectRoot: testDir,
      fix: true 
    });

    expect(result.fixed).toBeDefined();
    expect(result.fixed && result.fixed.length).toBeGreaterThan(0);
    
    // Verify file was actually fixed
    const fixedContent = await fs.readFile(filePath, 'utf-8');
    expect(fixedContent).toContain('Edit plans/active-<username>.md');
    expect(fixedContent).not.toContain('Edit CURRENT_PLAN.md');
  });

  it('should return metrics when completed', async () => {
    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.metrics).toBeDefined();
    expect(result.metrics?.templatesChecked).toBeGreaterThanOrEqual(0);
    expect(result.metrics?.patternsValidated).toBeGreaterThanOrEqual(0);
    expect(result.metrics?.duration).toBeGreaterThan(0);
  });

  it('should include summary in results', async () => {
    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.summary).toBeDefined();
    expect(result.summary).toMatch(/\d+\/\d+ checks passed/);
  });

  it('should suggest fix command when validation fails', async () => {
    // Setup: Create invalid template
    const templatesDir = path.join(testDir, 'templates/agents');
    await fs.mkdir(templatesDir, { recursive: true });
    
    await fs.writeFile(
      path.join(templatesDir, 'architect.agent.template.md'),
      '# Missing placeholder'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.passed).toBe(false);
    expect(result.fix).toBeDefined();
    expect(result.fix).toContain('validate-deliverables --fix');
  });

  it('should skip learned directory when checking for placeholders', async () => {
    // Setup: Create learned directory with placeholder (should be skipped)
    const learnedDir = path.join(testDir, 'templates/learned');
    await fs.mkdir(learnedDir, { recursive: true });
    
    await fs.writeFile(
      path.join(learnedDir, 'example.md'),
      '# Example Pattern\n\n{{EXAMPLE_PLACEHOLDER}}\n'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    // Placeholder check should pass (learned directory skipped)
    const placeholderCheck = result.checks.find(c => c.name === 'Placeholders');
    expect(placeholderCheck?.passed).toBe(true);
  });

  it('should check pattern consistency between template and non-template', async () => {
    // Setup: Create template with forbidden pattern
    const templatesDir = path.join(testDir, 'templates/agents');
    await fs.mkdir(templatesDir, { recursive: true });
    
    await fs.writeFile(
      path.join(templatesDir, 'architect.agent.template.md'),
      '# Architect\n\n{{ESSENTIALS_FILE}}\n\nPENDING_REVIEW.md'
    );
    
    // Create non-template WITHOUT the pattern (inconsistency)
    const githubAgentsDir = path.join(testDir, '.github/agents');
    await fs.mkdir(githubAgentsDir, { recursive: true });
    
    await fs.writeFile(
      path.join(githubAgentsDir, 'architect.agent.md'),
      '# Architect\n\nCODEBASE_ESSENTIALS.md\n\nNo forbidden pattern here'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.passed).toBe(false);
    
    // Should detect pattern inconsistency
    const consistencyCheck = result.checks.find(c => c.name === 'Pattern Consistency');
    expect(consistencyCheck?.passed).toBe(false);
  });

  it('should handle missing directories gracefully', async () => {
    // Don't create any template directories
    const result = await validateDeliverablesCore({ projectRoot: testDir });

    // Should not throw error, just report checks
    expect(result).toBeDefined();
    expect(result.checks.length).toBeGreaterThan(0);
  });

  it('should check maintainer skill boundary', async () => {
    // Setup: Create skill with maintainer: true
    const skillsDir = path.join(testDir, '.github/skills/test-skill');
    await fs.mkdir(skillsDir, { recursive: true });
    
    await fs.writeFile(
      path.join(skillsDir, 'SKILL.md'),
      '# Test Skill\n\nmaintainer: true\n\nSome content'
    );
    
    // Also create in templates (WRONG - should fail)
    const templateSkillsDir = path.join(testDir, 'templates/skills/test-skill');
    await fs.mkdir(templateSkillsDir, { recursive: true });
    await fs.writeFile(
      path.join(templateSkillsDir, 'SKILL.md'),
      '# Test Skill\n\nmaintainer: true\n\nSome content'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    expect(result.passed).toBe(false);
    
    const maintainerCheck = result.checks.find(c => c.name === 'Maintainer Skill Boundary');
    expect(maintainerCheck?.passed).toBe(false);
    expect(maintainerCheck?.issues.some(issue => 
      issue.includes('test-skill')
    )).toBe(true);
  });

  it('should allow maintainer skills outside templates', async () => {
    // Setup: Create skill with maintainer: true ONLY in .github (correct)
    const skillsDir = path.join(testDir, '.github/skills/maintainer-only');
    await fs.mkdir(skillsDir, { recursive: true });
    
    await fs.writeFile(
      path.join(skillsDir, 'SKILL.md'),
      '# Maintainer Skill\n\nmaintainer: true\n\nSome content'
    );

    const result = await validateDeliverablesCore({ projectRoot: testDir });

    // Maintainer check should pass (skill not in templates)
    const maintainerCheck = result.checks.find(c => c.name === 'Maintainer Skill Boundary');
    expect(maintainerCheck?.passed).toBe(true);
  });
});
