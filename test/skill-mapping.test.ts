import { describe, it, beforeEach, afterEach, expect } from 'vitest';
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
      
      expect(metadata.name).toBe('code-refactoring');
      expect(metadata.description).toBe('Safe code refactoring guide. Use when refactoring components, removing duplication.');
    });
    
    it('should handle skills without YAML frontmatter', () => {
      const skillContent: string = `# TDD Workflow Skill

**Purpose:** Practice Test-Driven Development

**When to use:** When implementing new features`;
      
      const metadata: SkillMetadata = parseSkillMetadata(skillContent);
      
      expect(metadata.name).toBe(null);
      expect(metadata.description.includes('Test-Driven Development')).toBeTruthy();
    });
    
    it('should extract description from Purpose section if no YAML', () => {
      const skillContent: string = `# My Custom Skill

**Purpose:** This skill helps with database optimization

**When to use:** When dealing with slow queries`;
      
      const metadata: SkillMetadata = parseSkillMetadata(skillContent);
      
      expect(metadata.description.includes('database optimization')).toBeTruthy();
    });
  });
  
  describe('extractTriggerWords', () => {
    it('should extract trigger words from description', () => {
      const description: string = 'Use when refactoring components, removing duplication, or simplifying complex functions.';
      
      const triggers: string[] = extractTriggerWords(description);
      
      // Should extract base verb and action phrases
      expect(triggers.includes('refactor') || triggers.includes('refactoring')).toBeTruthy();
      expect(triggers.some(t => t.includes('duplication'))).toBeTruthy();
      expect(triggers.some(t => t.includes('simplify') || t.includes('simplifying'))).toBeTruthy();
    });
    
    it('should extract trigger words from "When to use" section', () => {
      const skillContent: string = '**When to use:** When implementing new features, fixing bugs, or writing tests first.';
      
      const triggers: string[] = extractTriggerWords(skillContent);
      
      // Should extract object phrases and actions
      expect(triggers.some(t => t.includes('features') || t.includes('implementing'))).toBeTruthy();
      expect(triggers.some(t => t.includes('bug') || t.includes('fixing'))).toBeTruthy();
      expect(triggers.some(t => t.includes('test') || t.includes('writing'))).toBeTruthy();
    });
    
    it('should handle quoted trigger words', () => {
      const description: string = 'User mentions: "refactor", "clean up", "simplify"';
      
      const triggers: string[] = extractTriggerWords(description);
      
      expect(triggers.includes('"refactor"')).toBeTruthy();
      expect(triggers.includes('"clean up"')).toBeTruthy();
      expect(triggers.includes('"simplify"')).toBeTruthy();
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
      
      expect(skills.length).toBe(2);
      expect(skills.some(s => s.name === 'test-skill-1')).toBeTruthy();
      expect(skills.some(s => s.name === 'test-skill-2')).toBeTruthy();
    });
    
    it('should ignore directories without SKILL.md', async () => {
      fs.mkdirSync(path.join(fixturesDir, 'not-a-skill'), { recursive: true });
      
      const skills: Skill[] = await scanSkillsDirectory(fixturesDir);
      
      expect(skills.length).toBe(2);
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
      
      expect(table.includes('| "refactor", "clean up" | code-refactoring |')).toBeTruthy();
      expect(table.includes('| "update deps", "upgrade packages" | dependency-updates |')).toBeTruthy();
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
      expect(table.includes('...')).toBeTruthy();
    });
  });
});
