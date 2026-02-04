import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  parseSkillMetadata, 
  extractTriggerWords, 
  generateSkillMapping,
  scanSkillsDirectory 
} from '../lib/skill-mapping.js';
import type { SkillMetadata, Skill } from '../lib/skill-mapping.js';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const fixturesDir: string = path.join(__dirname, 'fixtures', 'skills');

describe('Skill Mapping Auto-Generation', () => {
  
  describe('parseSkillMetadata', () => {
    it('should parse YAML frontmatter from skill file', () => {
      const skillContent: string = `---
name: code-refactoring
description: Safe code refactoring guide. Use when refactoring components, removing duplication.
---

# Code Refactoring Guide`;
      
      const metadata: SkillMetadata = parseSkillMetadata(skillContent);
      
      assert.strictEqual(metadata.name, 'code-refactoring');
      assert.strictEqual(metadata.description, 'Safe code refactoring guide. Use when refactoring components, removing duplication.');
    });
    
    it('should handle skills without YAML frontmatter', () => {
      const skillContent: string = `# TDD Workflow Skill

**Purpose:** Practice Test-Driven Development

**When to use:** When implementing new features`;
      
      const metadata: SkillMetadata = parseSkillMetadata(skillContent);
      
      assert.strictEqual(metadata.name, null);
      assert.ok(metadata.description.includes('Test-Driven Development'));
    });
    
    it('should extract description from Purpose section if no YAML', () => {
      const skillContent: string = `# My Custom Skill

**Purpose:** This skill helps with database optimization

**When to use:** When dealing with slow queries`;
      
      const metadata: SkillMetadata = parseSkillMetadata(skillContent);
      
      assert.ok(metadata.description.includes('database optimization'));
    });
  });
  
  describe('extractTriggerWords', () => {
    it('should extract trigger words from description', () => {
      const description: string = 'Use when refactoring components, removing duplication, or simplifying complex functions.';
      
      const triggers: string[] = extractTriggerWords(description);
      
      // Should extract base verb and action phrases
      assert.ok(triggers.includes('refactor') || triggers.includes('refactoring'));
      assert.ok(triggers.some(t => t.includes('duplication')));
      assert.ok(triggers.some(t => t.includes('simplify') || t.includes('simplifying')));
    });
    
    it('should extract trigger words from "When to use" section', () => {
      const skillContent: string = '**When to use:** When implementing new features, fixing bugs, or writing tests first.';
      
      const triggers: string[] = extractTriggerWords(skillContent);
      
      // Should extract object phrases and actions
      assert.ok(triggers.some(t => t.includes('features') || t.includes('implementing')));
      assert.ok(triggers.some(t => t.includes('bug') || t.includes('fixing')));
      assert.ok(triggers.some(t => t.includes('test') || t.includes('writing')));
    });
    
    it('should handle quoted trigger words', () => {
      const description: string = 'User mentions: "refactor", "clean up", "simplify"';
      
      const triggers: string[] = extractTriggerWords(description);
      
      assert.ok(triggers.includes('"refactor"'));
      assert.ok(triggers.includes('"clean up"'));
      assert.ok(triggers.includes('"simplify"'));
    });
  });
  
  describe('scanSkillsDirectory', () => {
    beforeEach(() => {
      // Create test fixtures
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      
      // Create skill 1
      fs.mkdirSync(path.join(fixturesDir, 'test-skill-1'), { recursive: true });
      fs.writeFileSync(
        path.join(fixturesDir, 'test-skill-1', 'SKILL.md'),
        `---
name: test-skill-1
description: Test skill for refactoring code
---

# Test Skill 1`
      );
      
      // Create skill 2
      fs.mkdirSync(path.join(fixturesDir, 'test-skill-2'), { recursive: true });
      fs.writeFileSync(
        path.join(fixturesDir, 'test-skill-2', 'SKILL.md'),
        `# Test Skill 2

**Purpose:** Update dependencies safely`
      );
    });
    
    afterEach(() => {
      // Clean up fixtures
      if (fs.existsSync(fixturesDir)) {
        fs.rmSync(fixturesDir, { recursive: true, force: true });
      }
    });
    
    it('should scan and return all skills in directory', async () => {
      const skills: Skill[] = await scanSkillsDirectory(fixturesDir);
      
      assert.strictEqual(skills.length, 2);
      assert.ok(skills.some(s => s.name === 'test-skill-1'));
      assert.ok(skills.some(s => s.name === 'test-skill-2'));
    });
    
    it('should ignore directories without SKILL.md', async () => {
      fs.mkdirSync(path.join(fixturesDir, 'not-a-skill'), { recursive: true });
      
      const skills: Skill[] = await scanSkillsDirectory(fixturesDir);
      
      assert.strictEqual(skills.length, 2);
    });
  });
  
  describe('generateSkillMapping', () => {
    it('should generate markdown table from skills', () => {
      const skills: Skill[] = [
        {
          name: 'code-refactoring',
          triggers: ['"refactor"', '"clean up"'],
          description: 'Safe code refactoring'
        },
        {
          name: 'dependency-updates',
          triggers: ['"update deps"', '"upgrade packages"'],
          description: 'Safe dependency updates'
        }
      ];
      
      const table: string = generateSkillMapping(skills);
      
      assert.ok(table.includes('| "refactor", "clean up" | code-refactoring |'));
      assert.ok(table.includes('| "update deps", "upgrade packages" | dependency-updates |'));
    });
    
    it('should handle skills with long descriptions', () => {
      const skills: Skill[] = [
        {
          name: 'long-skill',
          triggers: ['"trigger"'],
          description: 'This is a very long description that exceeds fifty characters and should be truncated'
        }
      ];
      
      const table: string = generateSkillMapping(skills);
      
      // Should truncate description to ~50 chars
      assert.ok(table.includes('...'));
    });
  });
});
