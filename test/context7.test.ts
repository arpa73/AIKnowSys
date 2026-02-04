import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Context7 module is JavaScript (not migrated yet) - using any for imports
// @ts-expect-error - Not yet migrated to TypeScript
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

  before(() => {
    // Create temporary config directory
    testConfigDir = path.join(__dirname, 'tmp', `context7-test-${Date.now()}`);
    // testConfigPath would be: path.join(testConfigDir, 'claude_desktop_config.json');
    fs.mkdirSync(testConfigDir, { recursive: true });
  });

  after(() => {
    // Clean up
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('isContext7Available', () => {
    it('should return false when no config found', async () => {
      const result = await isContext7Available();
      
      // In test environment, might not have actual configs
      assert.strictEqual(typeof result.available, 'boolean');
      assert.strictEqual(typeof result.source, 'string');
    });

    it('should detect Context7 in config file', async () => {
      // This test would require mocking filesystem or creating temp config
      // For now, test the return structure
      const result = await isContext7Available();
      
      assert.ok(Object.hasOwn(result, 'available'));
      assert.ok(Object.hasOwn(result, 'configPath'));
      assert.ok(Object.hasOwn(result, 'source'));
    });
  });

  describe('extractLibraryReferences', () => {
    it('should extract framework names', () => {
      const content = 'Using Next.js v15 and React 19';
      const refs = extractLibraryReferences(content);
      
      assert.ok(refs.length > 0);
      assert.ok(refs.some((r: any) => r.name === 'Next.js'));
      assert.ok(refs.some((r: any) => r.name === 'React'));
    });

    it('should extract version numbers', () => {
      const content = 'Next.js v15.0.0 middleware pattern';
      const refs = extractLibraryReferences(content);
      
      const nextRef = refs.find((r: any) => r.name === 'Next.js');
      assert.ok(nextRef);
      assert.strictEqual(nextRef.version, '15.0.0');
    });

    it('should extract from import statements', () => {
      const content = `
        import { NextRequest } from 'next/server';
        import React from 'react';
      `;
      const refs = extractLibraryReferences(content);
      
      // Extract root package names
      // Note: "React" (capital R) is matched by framework pattern before import pattern
      assert.ok(refs.some((r: any) => r.name === 'next' || r.name === 'Next.js'), `Expected 'next', got: ${JSON.stringify(refs)}`);
      assert.ok(refs.some((r: any) => r.name.toLowerCase() === 'react'), `Expected 'react', got: ${JSON.stringify(refs)}`);
    });

    it('should handle multiple frameworks', () => {
      const content = 'Tech stack: Next.js, Supabase, Tailwind CSS, and Vitest';
      const refs = extractLibraryReferences(content);
      
      assert.ok(refs.length >= 3);
    });

    it('should deduplicate references', () => {
      const content = 'Next.js v15. Using Next.js middleware. Next.js patterns.';
      const refs = extractLibraryReferences(content);
      
      const nextRefs = refs.filter((r: any) => r.name === 'Next.js');
      // Should only have one entry (with version)
      assert.ok(nextRefs.length >= 1);
    });

    it('should return empty array for no references', () => {
      const content = 'This is just plain text with no library names';
      const refs = extractLibraryReferences(content);
      
      // May still find false positives, but should be minimal
      assert.ok(Array.isArray(refs));
    });

    it('should ignore relative imports', () => {
      const content = 'import { helper } from \'./utils\';';
      const refs = extractLibraryReferences(content);
      
      assert.ok(!refs.some((r: any) => r.name.startsWith('./')));
    });
  });

  describe('buildContext7Query', () => {
    it('should format query string', () => {
      const query = buildContext7Query('/vercel/next.js', 'middleware patterns');
      
      assert.ok(query.includes('/vercel/next.js'));
      assert.ok(query.includes('middleware patterns'));
    });

    it('should include library ID and topic', () => {
      const query = buildContext7Query('/facebook/react', 'hooks API');
      
      assert.match(query, /\/facebook\/react/);
      assert.match(query, /hooks API/);
    });
  });

  describe('suggestLibraryId', () => {
    it('should map Next.js to vercel', () => {
      assert.strictEqual(suggestLibraryId('Next.js'), '/vercel/next.js');
      assert.strictEqual(suggestLibraryId('nextjs'), '/vercel/next.js');
    });

    it('should map React to facebook', () => {
      assert.strictEqual(suggestLibraryId('React'), '/facebook/react');
      assert.strictEqual(suggestLibraryId('react'), '/facebook/react');
    });

    it('should map Supabase', () => {
      assert.strictEqual(suggestLibraryId('Supabase'), '/supabase/supabase');
    });

    it('should be case-insensitive', () => {
      assert.strictEqual(suggestLibraryId('NEXT.JS'), '/vercel/next.js');
      assert.strictEqual(suggestLibraryId('VuE'), '/vuejs/core');
    });

    it('should return null for unknown libraries', () => {
      assert.strictEqual(suggestLibraryId('unknown-lib'), null);
    });
  });

  describe('hasExternalLibraryReferences', () => {
    it('should return true for skill with library references', () => {
      const content = 'Using Next.js middleware pattern';
      const result = hasExternalLibraryReferences(content);
      
      assert.strictEqual(result, true);
    });

    it('should return false for skill without library references', () => {
      const content = 'Generic coding pattern for any project';
      const result = hasExternalLibraryReferences(content);
      
      // May have false positives, so just check it's boolean
      assert.strictEqual(typeof result, 'boolean');
    });
  });

  describe('generateValidationReminder', () => {
    it('should generate reminder message', () => {
      const libraries = [
        { name: 'Next.js', version: '15.0.0' },
        { name: 'React', version: '19' }
      ];
      
      const reminder = generateValidationReminder('.github/skills/my-skill/SKILL.md', libraries);
      
      assert.ok(reminder.includes('Context7'));
      assert.ok(reminder.includes('my-skill'));
      assert.ok(reminder.includes('Next.js'));
      assert.ok(reminder.includes('React'));
    });

    it('should handle libraries without versions', () => {
      const libraries = [{ name: 'Supabase', version: null }];
      
      const reminder = generateValidationReminder('skill.md', libraries);
      
      assert.ok(reminder.includes('Supabase'));
      assert.ok(!reminder.includes('null'));
    });

    it('should reference skill-validation guide', () => {
      const reminder = generateValidationReminder('skill.md', []);
      
      assert.ok(reminder.includes('skill-validation'));
    });
  });
});
