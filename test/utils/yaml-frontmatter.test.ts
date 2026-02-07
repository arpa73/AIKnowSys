/**
 * Tests for YAML frontmatter utilities
 * Phase B Mini - Context Query Completion
 */

import { describe, it, expect } from 'vitest';
import { parseFrontmatter, updateFrontmatter } from '../../lib/utils/yaml-frontmatter.js';

describe('YAML Frontmatter Utilities', () => {
  describe('parseFrontmatter', () => {
    it('parses simple frontmatter correctly', () => {
      const content = `---
date: "2026-02-07"
topics: [TDD, validation]
author: arno-paffen
status: in-progress
---

# Content here
Some markdown content`;

      const { frontmatter, content: body } = parseFrontmatter(content);

      expect(frontmatter.date).toBe('2026-02-07');
      expect(frontmatter.topics).toEqual(['TDD', 'validation']);
      expect(frontmatter.author).toBe('arno-paffen');
      expect(frontmatter.status).toBe('in-progress');
      expect(body).toContain('# Content here');
    });

    it('parses arrays with multiple items', () => {
      const content = `---
topics: [one, two, three, four]
files: [lib/init.js, test/init.test.js]
---

Content`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.topics).toEqual(['one', 'two', 'three', 'four']);
      expect(frontmatter.files).toEqual(['lib/init.js', 'test/init.test.js']);
    });

    it('parses empty arrays', () => {
      const content = `---
topics: []
files: []
---

Content`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.topics).toEqual([]);
      expect(frontmatter.files).toEqual([]);
    });

    it('parses quoted strings', () => {
      const content = `---
title: "My Title: With Colon"
date: "2026-02-07"
---

Content`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.title).toBe('My Title: With Colon');
      expect(frontmatter.date).toBe('2026-02-07');
    });

    it('parses unquoted strings', () => {
      const content = `---
status: in-progress
author: john-doe
---

Content`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.status).toBe('in-progress');
      expect(frontmatter.author).toBe('john-doe');
    });

    it('parses booleans', () => {
      const content = `---
enabled: true
disabled: false
---

Content`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.enabled).toBe(true);
      expect(frontmatter.disabled).toBe(false);
    });

    it('parses numbers', () => {
      const content = `---
count: 42
version: 1
---

Content`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.count).toBe(42);
      expect(frontmatter.version).toBe(1);
    });

    it('preserves markdown content exactly', () => {
      const content = `---
title: Test
---

# Heading

## Subheading

Content with **bold** and *italic*.

- List item 1
- List item 2`;

      const { content: body } = parseFrontmatter(content);

      expect(body).toBe(`
# Heading

## Subheading

Content with **bold** and *italic*.

- List item 1
- List item 2`);
    });

    it('throws error when no frontmatter present', () => {
      const content = `# Just markdown

No frontmatter here`;

      expect(() => parseFrontmatter(content)).toThrow('No YAML frontmatter found');
    });

   it('ignores comments in YAML', () => {
      const content = `---
# This is a comment
date: "2026-02-07"
# Another comment
topics: [TDD]
---

Content`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.date).toBe('2026-02-07');
      expect(frontmatter.topics).toEqual(['TDD']);
      expect(frontmatter['# This is a comment']).toBeUndefined();
    });
  });

  describe('updateFrontmatter', () => {
    it('updates existing field', () => {
      const content = `---
date: "2026-02-07"
status: in-progress
---

# Content`;

      const updated = updateFrontmatter(content, { status: 'complete' });

      expect(updated).toContain('status: complete');
      expect(updated).not.toContain('status: in-progress');
    });

    it('adds new field', () => {
      const content = `---
date: "2026-02-07"
---

# Content`;

      const updated = updateFrontmatter(content, { plan: 'PLAN_xyz' });

      expect(updated).toContain('plan: PLAN_xyz');
    });

    it('updates array by replacement', () => {
      const content = `---
topics: [old]
---

# Content`;

      const updated = updateFrontmatter(content, { topics: ['new', 'items'] });

      expect(updated).toContain('topics: [new, items]');
      expect(updated).not.toContain('topics: [old]');
    });

    it('preserves unchanged fields', () => {
      const content = `---
date: "2026-02-07"
author: arno-paffen
status: in-progress
---

# Content`;

      const updated = updateFrontmatter(content, { status: 'complete' });

      expect(updated).toContain('date: "2026-02-07"');
      expect(updated).toContain('author: arno-paffen');
      expect(updated).toContain('status: complete');
    });

    it('preserves markdown content exactly', () => {
      const content = `---
title: Test
---

# Original Content

With **formatting**`;

      const updated = updateFrontmatter(content, { title: 'Updated' });

      expect(updated).toContain('# Original Content');
      expect(updated).toContain('With **formatting**');
    });

    it('handles multiple updates at once', () => {
      const content = `---
date: "2026-02-07"
status: in-progress
topics: []
---

# Content`;

      const updated = updateFrontmatter(content, {
        status: 'complete',
        topics: ['TDD', 'validation'],
        newField: 'value'
      });

      expect(updated).toContain('status: complete');
      expect(updated).toContain('topics: [TDD, validation]');
      expect(updated).toContain('newField: value');
    });
  });
});
