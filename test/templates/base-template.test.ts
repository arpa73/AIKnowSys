import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('Base Template Validation', () => {
  const templatePath = path.resolve('dist/templates/CODEBASE_ESSENTIALS.minimal.template.md');
  const template = readFileSync(templatePath, 'utf-8');
  const lines = template.split('\n');

  test('should load minimal essentials template', () => {
    expect(templatePath).toContain('CODEBASE_ESSENTIALS.minimal.template.md');
    expect(template.length).toBeGreaterThan(0);
  });

  test('should use placeholders for all variable content', () => {
    expect(template).toMatch(/\{\{PROJECT_NAME\}\}/);
    expect(template).toMatch(/\{\{DATE\}\}/);
    expect(template).toMatch(/\{\{LANGUAGE\}\}/);
    expect(template).toMatch(/\{\{FRAMEWORK\}\}/);
    expect(template).toMatch(/\{\{VALIDATION_ROWS\}\}/);
    expect(template).toMatch(/\{\{TEST_CMD\}\}/);
    expect(template).toMatch(/\{\{SOURCE_DIR\}\}/);
    expect(template).toMatch(/\{\{INVARIANT_1\}\}/);
  });

  test('should include expected core sections', () => {
    expect(template).toMatch(/^## 🚨 CRITICAL RULE: Never Rush - Always Follow Process$/m);
    expect(template).toMatch(/^## 📚 Knowledge System: Document Roles$/m);
    expect(template).toMatch(/^## Technology Stack$/m);
    expect(template).toMatch(/^## Validation Matrix$/m);
    expect(template).toMatch(/^## Project Structure$/m);
    expect(template).toMatch(/^## Core Patterns$/m);
    expect(template).toMatch(/^## Critical Invariants$/m);
    expect(template).toMatch(/^## Common Gotchas$/m);
  });

  test('should describe knowledge system file roles', () => {
    expect(template).toMatch(/CODEBASE_ESSENTIALS\.md \(This File\)/);
    expect(template).toMatch(/AGENTS\.md/);
    expect(template).toMatch(/CODEBASE_CHANGELOG\.md/);
    expect(template).toMatch(/ESSENTIALS\s*=\s*"what is",\s*AGENTS\s*=\s*"how to work",\s*CHANGELOG\s*=\s*"what happened"/);
  });

  test('should include validation matrix guidance', () => {
    expect(template).toMatch(/Run these commands before claiming work is complete/);
    expect(template).toMatch(/\| Changed \| Command \| Required \|/);
    expect(template).toMatch(/npx aiknowsys check/);
    expect(template).toMatch(/compress-essentials --analyze/);
    expect(template).toMatch(/Never claim work is complete without running validation/);
  });

  test('should remain template-friendly with many placeholders', () => {
    const placeholderMatches = template.match(/\{\{[A-Z0-9_]+\}\}/g) || [];
    expect(placeholderMatches.length).toBeGreaterThan(40);
  });

  test('should have expected size for minimal template', () => {
    expect(lines.length).toBeGreaterThan(300);
    expect(lines.length).toBeLessThan(600);
  });
});
