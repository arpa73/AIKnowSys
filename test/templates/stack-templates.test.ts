import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import path from 'path';

const stacksDir = path.resolve('templates/stacks');
const stacks = readdirSync(stacksDir)
  .filter(name => {
    try {
      const itemPath = path.join(stacksDir, name);
      const stat = statSync(itemPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  });

describe('Stack Templates Validation', () => {
  test('should have at least 6 stack templates', () => {
    // Verify we have the expected number of stacks
    expect(stacks.length).toBeGreaterThanOrEqual(6);
  });

  stacks.forEach(stack => {
    describe(`${stack} stack template`, () => {
      const templatePath = path.join(stacksDir, stack, 'CODEBASE_ESSENTIALS.md');
      
      if (!existsSync(templatePath)) {
        test.skip(`no ESSENTIALS file in ${stack}`, () => {});
        return;
      }
      
      const template = readFileSync(templatePath, 'utf-8');
      const lines = template.split('\n');

      test('should be under 400 lines (MCP-first format)', () => {
        // MCP-first format should be significantly smaller than monolithic
        expect(lines.length).toBeLessThan(400);
        expect(lines.length).toBeGreaterThanOrEqual(150); // Minimum useful size (MCP-first is very compact)
      });

      test('should have MCP-first structure markers', () => {
        // Verify migration to MCP-first format
        expect(template).toMatch(/MCP-First Architecture/);
        expect(template).toMatch(/## 5\. Available Skills/);
        expect(template).toMatch(/MCP server/i);
      });

      test('should have 8 critical invariants', () => {
        // Stack templates keep all 8 invariants (base template has 5)
        const invariants = template.match(/^### \d+\./gm);
        expect(invariants).toHaveLength(8);
        
        // Verify the 8 invariants are present
        expect(template).toMatch(/### 1\. ES Modules Only/);
        expect(template).toMatch(/### 2\. Absolute Paths Required/);
        expect(template).toMatch(/### 3\. Graceful Failures/);
        expect(template).toMatch(/### 4\. Template Preservation/);
        expect(template).toMatch(/### 5\. Template Structure Integrity/);
        expect(template).toMatch(/### 6\. Backwards Compatibility/);
        expect(template).toMatch(/### 7\. Test-Driven Development/);
        expect(template).toMatch(/### 8\. Deliverables Consistency/);
      });

      test('should reference .github/skills/ for workflows', () => {
        // Verify workflows are referenced, not embedded
        expect(template).toMatch(/\.github\/skills\//);
        expect(template).toMatch(/tdd-workflow/);
      });

      test('should have backup file from migration', () => {
        // Verify migration created backup
        const backupPath = templatePath + '.pre-v0.10.backup';
        expect(existsSync(backupPath)).toBe(true);
      });

      test('should have Technology Snapshot section', () => {
        // Section 1 should be preserved
        expect(template).toMatch(/## 1\. Technology Snapshot/);
      });

      test('should have Validation Matrix section', () => {
        // Section 2 should be preserved
        expect(template).toMatch(/## 2\. Validation Matrix/);
      });

      test('should have Project Structure section', () => {
        // Section 3 should be preserved
        expect(template).toMatch(/## 3\. Project Structure/);
      });

      test('should mention migration from v0.9.x', () => {
        // Verify migration marker is present
        expect(template).toMatch(/Migrated from v0\.9/i);
      });

      test('should have v0.10.0 version marker', () => {
        // Verify version is updated
        expect(template).toMatch(/v0\.10\.0/);
      });
    });
  });

  describe('Stack-specific content preservation', () => {
    test('express-api should preserve Express patterns', () => {
      const templatePath = path.join(stacksDir, 'express-api', 'CODEBASE_ESSENTIALS.md');
      if (!existsSync(templatePath)) {
        test.skip('express-api not found', () => {});
        return;
      }
      
      const template = readFileSync(templatePath, 'utf-8');
      // Check for Express-specific content (if any was preserved)
      expect(template).toMatch(/TypeScript|Node\.js/);
    });

    test('fastapi should preserve Python/FastAPI patterns', () => {
      const templatePath = path.join(stacksDir, 'fastapi', 'CODEBASE_ESSENTIALS.md');
      if (!existsSync(templatePath)) {
        test.skip('fastapi not found', () => {});
        return;
      }
      
      const template = readFileSync(templatePath, 'utf-8');
      // Check for Python-specific content
      expect(template).toMatch(/Python|FastAPI/i);
    });

    test('nextjs-api should preserve Next.js/Prisma patterns', () => {
      const templatePath = path.join(stacksDir, 'nextjs-api', 'CODEBASE_ESSENTIALS.md');
      if (!existsSync(templatePath)) {
        test.skip('nextjs-api not found', () => {});
        return;
      }
      
      const template = readFileSync(templatePath, 'utf-8');
      // Check for Next.js/Prisma content
      expect(template).toMatch(/Next\.js|Prisma/);
    });
  });

  describe('Migration quality checks', () => {
    test('all stacks should have backups', () => {
      const stacksWithBackups = stacks.filter(stack => {
        const templatePath = path.join(stacksDir, stack, 'CODEBASE_ESSENTIALS.md');
        const backupPath = templatePath + '.pre-v0.10.backup';
        return existsSync(backupPath);
      });
      
      // At least the major stacks should have backups
      expect(stacksWithBackups.length).toBeGreaterThanOrEqual(6);
    });

    test('no stack template should exceed 400 lines', () => {
      stacks.forEach(stack => {
        const templatePath = path.join(stacksDir, stack, 'CODEBASE_ESSENTIALS.md');
        if (!existsSync(templatePath)) return;
        
        const template = readFileSync(templatePath, 'utf-8');
        const lines = template.split('\n');
        
        expect(lines.length).toBeLessThan(400);
      });
    });

    test('all stacks should have MCP-first format', () => {
      stacks.forEach(stack => {
        const templatePath = path.join(stacksDir, stack, 'CODEBASE_ESSENTIALS.md');
        if (!existsSync(templatePath)) return;
        
        const template = readFileSync(templatePath, 'utf-8');
        
        // All should mention MCP-first architecture
        expect(template).toMatch(/MCP-First Architecture|MCP server/i);
      });
    });
  });

  describe('Consistency across stacks', () => {
    test('all stacks should have same section structure (1-8)', () => {
      stacks.forEach(stack => {
        const templatePath = path.join(stacksDir, stack, 'CODEBASE_ESSENTIALS.md');
        if (!existsSync(templatePath)) return;
        
        const template = readFileSync(templatePath, 'utf-8');
        
        // All stacks should have sections 1-5 at minimum
        expect(template).toMatch(/## 1\./);
        expect(template).toMatch(/## 2\./);
        expect(template).toMatch(/## 3\./);
        expect(template).toMatch(/## 4\. Critical Invariants/);
        expect(template).toMatch(/## 5\. Available Skills/);
      });
    });

    test('all stacks should reference same universal skills', () => {
      const universalSkills = [
        'tdd-workflow',
        'refactoring-workflow',
        'validation-troubleshooting'
      ];

      stacks.forEach(stack => {
        const templatePath = path.join(stacksDir, stack, 'CODEBASE_ESSENTIALS.md');
        if (!existsSync(templatePath)) return;
        
        const template = readFileSync(templatePath, 'utf-8');
        
        // Should reference at least some universal skills
        const skillsFound = universalSkills.filter(skill => 
          template.includes(skill)
        );
        
        expect(skillsFound.length).toBeGreaterThan(0);
      });
    });
  });
});
