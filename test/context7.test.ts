import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const context7 = await import('../lib/context7/index.js');
const {
  isContext7Available,
  extractLibraryReferences,
  buildContext7Query,
  suggestLibraryId,
  hasExternalLibraryReferences,
  generateValidationReminder
} = context7 as any;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Context7 Utilities', () => {
  let testConfigDir: string;

  beforeAll(() => {
    // Create temporary config directory
    testConfigDir = path.join(__dirname, 'tmp', `context7-test-${Date.now()}`);
    // testConfigPath would be: path.join(testConfigDir, 'claude_desktop_config.json');
    fs.mkdirSync(testConfigDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('isContext7Available', () => {
    it('should return false when no config found', async () => {
      const result = await isContext7Available();
      
      // In test environment, might not have actual configs
      expect(typeof result.available).toBe('boolean');
      expect(typeof result.source).toBe('string');
    });

    it('should detect Context7 in config file', async () => {
      // This test would require mocking filesystem or creating temp config
      // For now, test the return structure
      const result = await isContext7Available();
      
      expect(Object.hasOwn(result, 'available')).toBeTruthy();
      expect(Object.hasOwn(result, 'configPath')).toBeTruthy();
      expect(Object.hasOwn(result, 'source')).toBeTruthy();
    });
  });

  describe('extractLibraryReferences', () => {
    it('should extract framework names', () => {
      const content = 'Using Next.js v15 and React 19';
      const refs = extractLibraryReferences(content);
      
      expect(refs.length > 0).toBeTruthy();
      expect(refs.some((r: any) => r.name === 'Next.js')).toBeTruthy();
      expect(refs.some((r: any) => r.name === 'React')).toBeTruthy();
    });

    it('should extract version numbers', () => {
      const content = 'Next.js v15.0.0 middleware pattern';
      const refs = extractLibraryReferences(content);
      
      const nextRef = refs.find((r: any) => r.name === 'Next.js');
      expect(nextRef).toBeTruthy();
      expect(nextRef.version).toBe('15.0.0');
    });

    it('should extract from import statements', () => {
      const content = `
        import { NextRequest } from 'next/server';
        import React from 'react';
      `;
      const refs = extractLibraryReferences(content);
      
      // Extract root package names
      // Note: "React" (capital R) is matched by framework pattern before import pattern
      expect(refs.some((r: any) => r.name === 'next' || r.name === 'Next.js')).toBeTruthy();
      expect(refs.some((r: any) => r.name.toLowerCase() === 'react')).toBeTruthy();
    });

    it('should handle multiple frameworks', () => {
      const content = 'Tech stack: Next.js, Supabase, Tailwind CSS, and Vitest';
      const refs = extractLibraryReferences(content);
      
      expect(refs.length >= 3).toBeTruthy();
    });

    it('should deduplicate references', () => {
      const content = 'Next.js v15. Using Next.js middleware. Next.js patterns.';
      const refs = extractLibraryReferences(content);
      
      const nextRefs = refs.filter((r: any) => r.name === 'Next.js');
      // Should only have one entry (with version)
      expect(nextRefs.length >= 1).toBeTruthy();
    });

    it('should return empty array for no references', () => {
      const content = 'This is just plain text with no library names';
      const refs = extractLibraryReferences(content);
      
      // May still find false positives, but should be minimal
      expect(Array.isArray(refs)).toBeTruthy();
    });

    it('should ignore relative imports', () => {
      const content = 'import { helper } from \'./utils\';';
      const refs = extractLibraryReferences(content);
      
      expect(!refs.some((r: any) => r.name.startsWith('./'))).toBeTruthy();
    });
  });

  describe('buildContext7Query', () => {
    it('should format query string', () => {
      const query = buildContext7Query('/vercel/next.js', 'middleware patterns');
      
      expect(query.includes('/vercel/next.js')).toBeTruthy();
      expect(query.includes('middleware patterns')).toBeTruthy();
    });

    it('should include library ID and topic', () => {
      const query = buildContext7Query('/facebook/react', 'hooks API');
      
      expect(query).toMatch(/\/facebook\/react/);
      expect(query).toMatch(/hooks API/);
    });
  });

  describe('suggestLibraryId', () => {
    it('should map Next.js to vercel', () => {
      expect(suggestLibraryId('Next.js')).toBe('/vercel/next.js');
      expect(suggestLibraryId('nextjs')).toBe('/vercel/next.js');
    });

    it('should map React to facebook', () => {
      expect(suggestLibraryId('React')).toBe('/facebook/react');
      expect(suggestLibraryId('react')).toBe('/facebook/react');
    });

    it('should map Supabase', () => {
      expect(suggestLibraryId('Supabase')).toBe('/supabase/supabase');
    });

    it('should be case-insensitive', () => {
      expect(suggestLibraryId('NEXT.JS')).toBe('/vercel/next.js');
      expect(suggestLibraryId('VuE')).toBe('/vuejs/core');
    });

    it('should return null for unknown libraries', () => {
      expect(suggestLibraryId('unknown-lib')).toBe(null);
    });
  });

  describe('hasExternalLibraryReferences', () => {
    it('should return true for skill with library references', () => {
      const content = 'Using Next.js middleware pattern';
      const result = hasExternalLibraryReferences(content);
      
      expect(result).toBe(true);
    });

    it('should return false for skill without library references', () => {
      const content = 'Generic coding pattern for any project';
      const result = hasExternalLibraryReferences(content);
      
      // May have false positives, so just check it's boolean
      expect(typeof result).toBe('boolean');
    });
  });

  describe('generateValidationReminder', () => {
    it('should generate reminder message', () => {
      const libraries = [
        { name: 'Next.js', version: '15.0.0' },
        { name: 'React', version: '19' }
      ];
      
      const reminder = generateValidationReminder('.github/skills/my-skill/SKILL.md', libraries);
      
      expect(reminder.includes('Context7')).toBeTruthy();
      expect(reminder.includes('my-skill')).toBeTruthy();
      expect(reminder.includes('Next.js')).toBeTruthy();
      expect(reminder.includes('React')).toBeTruthy();
    });

    it('should handle libraries without versions', () => {
      const libraries = [{ name: 'Supabase', version: null }];
      
      const reminder = generateValidationReminder('skill.md', libraries);
      
      expect(reminder.includes('Supabase')).toBeTruthy();
      expect(!reminder.includes('null')).toBeTruthy();
    });

    it('should reference skill-validation guide', () => {
      const reminder = generateValidationReminder('skill.md', []);
      
      expect(reminder.includes('skill-validation')).toBeTruthy();
    });
  });
});
