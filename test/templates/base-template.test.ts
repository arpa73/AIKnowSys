import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('Base Template Validation', () => {
  const templatePath = path.resolve('templates/CODEBASE_ESSENTIALS.template.md');
  const template = readFileSync(templatePath, 'utf-8');
  const lines = template.split('\n');

  test('should contain minimal aiknowsys references', () => {
    // Template should reference AIKnowSys system (users need to know it requires MCP)
    expect(template).toMatch(/AIKnowSys requires MCP/);
    
    // But should NOT have hardcoded aiknowsys-specific content
    expect(template.toLowerCase()).not.toMatch(/bin\/cli\.js/);
    expect(template.toLowerCase()).not.toMatch(/npx aiknowsys/);
    expect(template).not.toMatch(/737.*tests/); // Hardcoded test count
  });

  test('should use placeholders for all variable content', () => {
    // Verify all required placeholders are present
    expect(template).toMatch(/\{\{PROJECT_NAME\}\}/);
    expect(template).toMatch(/\{\{CURRENT_DATE\}\}/);
    expect(template).toMatch(/\{\{PROJECT_PURPOSE\}\}/);
    expect(template).toMatch(/\{\{PRIMARY_STACK\}\}/);
    expect(template).toMatch(/\{\{RUNTIME\}\}/);
    expect(template).toMatch(/\{\{LANGUAGE\}\}/);
    expect(template).toMatch(/\{\{FRAMEWORK\}\}/);
    expect(template).toMatch(/\{\{TEST_COMMAND\}\}/);
  });

  test('should be under 250 lines', () => {
    // Target: 150-250 lines for base template
    expect(lines.length).toBeLessThan(250);
    expect(lines.length).toBeGreaterThan(150); // Minimum useful size
  });

  test('should have exactly 5 critical invariants', () => {
    // Base template should have 5 universal invariants (not 8 AIKnowSys-specific)
    const invariants = template.match(/^### \d+\./gm);
    expect(invariants).toHaveLength(5);
    
    // Verify the 5 universal invariants are present
    expect(template).toMatch(/### 1\. Test-Driven Development/);
    expect(template).toMatch(/### 2\. Graceful Failures/);
    expect(template).toMatch(/### 3\. Documentation as Code/);
    expect(template).toMatch(/### 4\. Code Quality Standards/);
    expect(template).toMatch(/### 5\. Backwards Compatibility/);
  });

  test('should have sections 1-7 only (not 1-10)', () => {
    // Verify correct section structure
    expect(template).toMatch(/^## 1\. Technology Snapshot$/m);
    expect(template).toMatch(/^## 2\. Validation Matrix$/m);
    expect(template).toMatch(/^## 3\. Project Structure$/m);
    expect(template).toMatch(/^## 4\. Critical Invariants/m);
    expect(template).toMatch(/^## 5\. Available Skills/m);
    expect(template).toMatch(/^## 6\. Quick Reference$/m);
    expect(template).toMatch(/^## 7\. When to Document Where$/m);
    
    // Should NOT have sections 8-10 (AIKnowSys-specific)
    expect(template).not.toMatch(/^## 8\./m);
    expect(template).not.toMatch(/^## 9\./m);
    expect(template).not.toMatch(/^## 10\./m);
  });

  test('should NOT contain AIKnowSys-specific patterns', () => {
    // Check for specific AIKnowSys technologies/patterns
    expect(template).not.toMatch(/Vitest/);
    expect(template).not.toMatch(/Commander\.js/);
    expect(template).not.toMatch(/Inquirer\.js/);
    expect(template).not.toMatch(/node bin\/cli\.js/);
    expect(template).not.toMatch(/npm registry/);
  });

  test('should have Knowledge System document roles section', () => {
    // Verify the generic knowledge system explanation is present
    expect(template).toMatch(/Knowledge System: Document Roles/);
    expect(template).toMatch(/CODEBASE_ESSENTIALS\.md.*What the codebase IS/);
    expect(template).toMatch(/AGENTS\.md.*How AI should WORK/);
    expect(template).toMatch(/CODEBASE_CHANGELOG\.md.*What HAPPENED/);
  });

  test('should explain MCP-first architecture', () => {
    // Verify MCP-first architecture is explained
    expect(template).toMatch(/MCP-First Architecture/);
    expect(template).toMatch(/70-80% token reduction/);
    expect(template).toMatch(/Critical invariants.*ALWAYS loaded/);
    expect(template).toMatch(/Skills discovered dynamically/);
    expect(template).toMatch(/MCP server to function/);
  });

  test('should reference universal skills only', () => {
    // Check for framework-agnostic skills (listed by name only)
    expect(template).toMatch(/tdd-workflow/);
    expect(template).toMatch(/refactoring-workflow/);
    expect(template).toMatch(/validation-troubleshooting/);
    expect(template).toMatch(/dependency-management/);
    expect(template).toMatch(/feature-implementation/);
    expect(template).toMatch(/3rd-party-framework-docs/);
    
    // Should explain MCP-powered discovery
    expect(template).toMatch(/mcp_aiknowsys_get_skill_by_name/);
    
    // Should have placeholder for project-specific skills
    expect(template).toMatch(/\{\{PROJECT_SKILLS\}\}/);
  });

  test('should have generic quick reference section', () => {
    // Verify quick reference uses placeholders, not hardcoded commands
    const quickRefSection = template.match(/## 6\. Quick Reference([\s\S]*?)## 7\./)?.[1] || '';
    
    expect(quickRefSection).toMatch(/\{\{TEST_COMMAND\}\}/);
    expect(quickRefSection).toMatch(/\{\{LINT_COMMAND\}\}/);
    expect(quickRefSection).toMatch(/\{\{BUILD_COMMAND\}\}/);
    expect(quickRefSection).toMatch(/\{\{FORMAT_COMMAND\}\}/);
    
    // Should NOT have hardcoded commands
    expect(quickRefSection).not.toMatch(/npm test/);
    expect(quickRefSection).not.toMatch(/npm run lint/);
  });

  test('should have generic "When to Document Where" section', () => {
    // Verify documentation guidance is generic
    const docSection = template.match(/## 7\. When to Document Where([\s\S]*?)$/)?.[1] || '';
    
    expect(docSection).toMatch(/Add to CODEBASE_ESSENTIALS\.md when/);
    expect(docSection).toMatch(/Add to \.github\/skills\/ when/);
    expect(docSection).toMatch(/Add to project changelog when/);
    
    // Should NOT reference AIKnowSys-specific structure
    expect(docSection).not.toMatch(/\.aiknowsys\//);
  });

  test('should end with target metrics and MCP setup reference', () => {
    // Verify footer contains target and MCP setup reference
    expect(template).toMatch(/Target:.*ESSENTIALS <300 lines/);
    expect(template).toMatch(/MCP-first/);
    expect(template).toMatch(/Configure MCP server/);
  });
});
