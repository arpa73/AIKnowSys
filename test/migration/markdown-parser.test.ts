import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../../lib/migration/markdown-parser.js';
import type { SessionFrontmatter, PlanFrontmatter, LearnedFrontmatter } from '../../lib/migration/types.js';

describe('MarkdownParser', () => {
  const parser = new MarkdownParser();

  describe('parse', () => {
    it('should extract YAML frontmatter and content', () => {
      const markdown = `---
title: Test Session
date: 2026-02-12
status: active
---

# Test Content

This is the body.`;

      const result = parser.parse(markdown);

      expect(result.frontmatter).toEqual({
        title: 'Test Session',
        date: '2026-02-12',
        status: 'active'
      });
      expect(result.content).toBe('# Test Content\n\nThis is the body.');
    });

    it('should handle frontmatter with topics array', () => {
      const markdown = `---
date: 2026-02-12
topic: Feature Implementation
topics:
  - typescript
  - testing
  - migration
---

Content here`;

      const result = parser.parse(markdown);

      expect(result.frontmatter.topics).toEqual(['typescript', 'testing', 'migration']);
    });

    it('should handle markdown without frontmatter', () => {
      const markdown = '# Just Content\n\nNo frontmatter here.';

      const result = parser.parse(markdown);

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe('# Just Content\n\nNo frontmatter here.');
    });

    it('should handle empty frontmatter markers', () => {
      const markdown = `---
---

# Content after empty frontmatter`;

      const result = parser.parse(markdown);

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe('# Content after empty frontmatter');
    });

    it('should preserve line breaks in content', () => {
      const markdown = `---
title: Test
---

Line 1

Line 2

Line 3`;

      const result = parser.parse(markdown);

      expect(result.content).toBe('Line 1\n\nLine 2\n\nLine 3');
    });

    it('should handle complex nested YAML structures', () => {
      const markdown = `---
metadata:
  author: alice
  tags:
    - important
    - urgent
files:
  - path: src/main.ts
    modified: true
  - path: test/main.test.ts
    modified: false
---

Content`;

      const result = parser.parse(markdown);

      expect(result.frontmatter.metadata).toEqual({
        author: 'alice',
        tags: ['important', 'urgent']
      });
      expect((result.frontmatter.files as any[])).toHaveLength(2);
      expect((result.frontmatter.files as any[])[0].path).toBe('src/main.ts');
    });

    it('should trim whitespace from content', () => {
      const markdown = `---
title: Test
---


Content with leading blank lines
`;

      const result = parser.parse(markdown);

      expect(result.content).toBe('Content with leading blank lines');
    });

    it('should handle frontmatter with strings containing colons', () => {
      const markdown = `---
title: "Phase 1: Implementation"
url: "https://example.com"
---

Content`;

      const result = parser.parse(markdown);

      expect(result.frontmatter.title).toBe('Phase 1: Implementation');
      expect(result.frontmatter.url).toBe('https://example.com');
    });

    it('should handle multiline strings in frontmatter', () => {
      const markdown = `---
description: |
  This is a long description
  that spans multiple lines
  with proper formatting.
---

Content`;

      const result = parser.parse(markdown);

      expect(result.frontmatter.description).toContain('This is a long description');
      expect(result.frontmatter.description).toContain('that spans multiple lines');
    });

    it('should handle boolean and number values', () => {
      const markdown = `---
published: true
draft: false
version: 2
rating: 4.5
---

Content`;

      const result = parser.parse(markdown);

      expect(result.frontmatter.published).toBe(true);
      expect(result.frontmatter.draft).toBe(false);
      expect(result.frontmatter.version).toBe(2);
      expect(result.frontmatter.rating).toBe(4.5);
    });

    it('should handle null values', () => {
      const markdown = `---
placeholder: null
---

Content`;

      const result = parser.parse(markdown);

      expect(result.frontmatter.placeholder).toBe(null);
    });

    it('should return both parse errors and best-effort results', () => {
      const markdown = `---
invalid yaml: [unclosed bracket
still invalid
---

Content`;

      const result = parser.parse(markdown);

      // Should attempt to parse and note the error
      expect(result.errors).toBeDefined();
      expect(result.errors).toBeTruthy();
      if (result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
      // But still return content
      expect(result.content).toBe('Content');
    });

    it('should handle Windows line endings (CRLF)', () => {
      const markdown = '---\r\ntitle: Test\r\ndate: 2026-02-12\r\n---\r\n\r\nContent';

      const result = parser.parse(markdown);

      expect(result.frontmatter.title).toBe('Test');
      expect(result.content).toBe('Content');
    });

    it('should handle files with only frontmatter (no content)', () => {
      const markdown = `---
title: Metadata Only
status: complete
---`;

      const result = parser.parse(markdown);

      expect(result.frontmatter.title).toBe('Metadata Only');
      expect(result.content).toBe('');
    });

    it('should handle markdown with multiple --- delimiters in content', () => {
      const markdown = `---
title: Test
---

Content before

---

Content after horizontal rule`;

      const result = parser.parse(markdown);

      expect(result.frontmatter.title).toBe('Test');
      expect(result.content).toContain('---');
      expect(result.content).toContain('Content before');
      expect(result.content).toContain('Content after horizontal rule');
    });
  });

  describe('stringify', () => {
    it('should convert frontmatter and content back to markdown', () => {
      const frontmatter = {
        title: 'Test Session',
        date: '2026-02-12',
        status: 'active'
      };
      const content = '# Test Content\n\nBody text.';

      const result = parser.stringify(frontmatter, content);

      expect(result).toContain('---');
      expect(result).toContain('title: Test Session');
      expect(result).toContain('date: 2026-02-12');
      expect(result).toContain('status: active');
      expect(result).toContain('# Test Content');
    });

    it('should handle arrays in frontmatter', () => {
      const frontmatter = {
        topics: ['typescript', 'testing']
      };
      const content = 'Content';

      const result = parser.stringify(frontmatter, content);

      expect(result).toContain('topics:');
      expect(result).toContain('- typescript');
      expect(result).toContain('- testing');
    });

    it('should handle empty frontmatter', () => {
      const result = parser.stringify({}, 'Just content');

      expect(result).toBe('Just content');
    });

    it('should preserve content as-is when no frontmatter', () => {
      const content = '# Heading\n\nParagraph\n\n```code```';
      const result = parser.stringify({}, content);

      expect(result).toBe(content);
    });
  });

  describe('round-trip parsing', () => {
    it('should preserve data through parse and stringify', () => {
      const original = `---
title: "Complex: Test"
date: 2026-02-12
topics:
  - one
  - two
nested:
  key: value
  array: [1, 2, 3]
---

# Content

With **markdown** formatting.`;

      const parsed = parser.parse(original);
      const stringified = parser.stringify(parsed.frontmatter, parsed.content);
      const reparsed = parser.parse(stringified);

      expect(reparsed.frontmatter).toEqual(parsed.frontmatter);
      expect(reparsed.content.trim()).toBe(parsed.content.trim());
    });
  });

  describe('typed frontmatter parsing', () => {
    it('should parse session frontmatter with type safety', () => {
      const markdown = `---
date: 2026-02-12
status: active
plan: PLAN_test
topics:
  - migration
  - testing
files:
  - lib/migration/file-scanner.ts
---

# Session content`;

      const result = parser.parse<SessionFrontmatter>(markdown);

      // TypeScript should recognize these properties
      expect(result.frontmatter.date).toBe('2026-02-12');
      expect(result.frontmatter.status).toBe('active');
      expect(result.frontmatter.plan).toBe('PLAN_test');
      expect(result.frontmatter.topics).toEqual(['migration', 'testing']);
      expect(result.frontmatter.files).toHaveLength(1);
    });

    it('should parse plan frontmatter with type safety', () => {
      const markdown = `---
title: Test Plan
author: arno-paffen
status: ACTIVE
topics:
  - feature
  - implementation
priority: high
type: feature
---

# Plan content`;

      const result = parser.parse<PlanFrontmatter>(markdown);

      // TypeScript should recognize these properties
      expect(result.frontmatter.title).toBe('Test Plan');
      expect(result.frontmatter.author).toBe('arno-paffen');
      expect(result.frontmatter.status).toBe('ACTIVE');
      expect(result.frontmatter.priority).toBe('high');
      expect(result.frontmatter.type).toBe('feature');
    });

    it('should parse learned pattern frontmatter with type safety', () => {
      const markdown = `---
category: error-resolution
keywords:
  - migration
  - yaml
  - parsing
author: arno-paffen
created: 2026-02-12
---

# Pattern content`;

      const result = parser.parse<LearnedFrontmatter>(markdown);

      // TypeScript should recognize these properties
      expect(result.frontmatter.category).toBe('error-resolution');
      expect(result.frontmatter.keywords).toEqual(['migration', 'yaml', 'parsing']);
      expect(result.frontmatter.author).toBe('arno-paffen');
      expect(result.frontmatter.created).toBe('2026-02-12');
    });

    it('should handle additional fields in typed frontmatter', () => {
      const markdown = `---
date: 2026-02-12
status: active
customField: customValue
extraData:
  nested: value
---

Content`;

      const result = parser.parse<SessionFrontmatter>(markdown);

      // Should preserve additional fields
      expect(result.frontmatter.customField).toBe('customValue');
      expect(result.frontmatter.extraData).toEqual({ nested: 'value' });
    });
  });
});
