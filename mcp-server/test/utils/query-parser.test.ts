/**
 * Tests for query-parser.ts
 * Tests natural language, relative, and structured query parameter parsing
 */
import { describe, it, expect } from 'vitest';
import { parseQueryParams } from '../../src/utils/query-parser.js';

describe('parseQueryParams', () => {
  const now = new Date('2026-02-14T12:00:00Z'); // Saturday, Feb 14, 2026

  describe('natural language time expressions', () => {
    it('should parse "when: last week"', () => {
      const result = parseQueryParams({ when: 'last week' }, now);
      expect(result.dateAfter).toBe('2026-02-07'); // 7 days ago
    });

    it('should parse "when: yesterday"', () => {
      const result = parseQueryParams({ when: 'yesterday' }, now);
      expect(result.dateAfter).toBe('2026-02-13'); // Feb 13
    });

    it('should parse "when: 3 days ago"', () => {
      const result = parseQueryParams({ when: '3 days ago' }, now);
      expect(result.dateAfter).toBe('2026-02-11'); // Feb 11
    });

    it('should parse "when: this month"', () => {
      const result = parseQueryParams({ when: 'this month' }, now);
      expect(result.dateAfter).toBe('2026-02-01'); // Feb 1
    });
  });

  describe('natural language topics', () => {
    it('should parse "about: MCP testing"', () => {
      const result = parseQueryParams({ about: 'MCP testing' }, now);
      expect(result.topic).toBe('MCP testing');
    });

    it('should combine "when" and "about"', () => {
      const result = parseQueryParams(
        { when: 'last week', about: 'sqlite' },
        now
      );
      expect(result.dateAfter).toBe('2026-02-07'); // 7 days ago
      expect(result.topic).toBe('sqlite');
    });
  });

  describe('relative dates', () => {
    it('should parse "last: 7, unit: days"', () => {
      const result = parseQueryParams({ last: 7, unit: 'days' }, now);
      expect(result.dateAfter).toBe('2026-02-07');
    });

    it('should parse "last: 2, unit: weeks"', () => {
      const result = parseQueryParams({ last: 2, unit: 'weeks' }, now);
      expect(result.dateAfter).toBe('2026-01-31');
    });

    it('should parse "last: 1, unit: months"', () => {
      const result = parseQueryParams({ last: 1, unit: 'months' }, now);
      expect(result.dateAfter).toBe('2026-01-14'); // 1 month ago (same day, previous month)
    });

    it('should combine relative dates with topic', () => {
      const result = parseQueryParams(
        { last: 7, unit: 'days', topic: 'mcp-tools' },
        now
      );
      expect(result.dateAfter).toBe('2026-02-07');
      expect(result.topic).toBe('mcp-tools');
    });
  });

  describe('structured parameters (backward compatibility)', () => {
    it('should pass through dateAfter', () => {
      const result = parseQueryParams({ dateAfter: '2026-02-01' }, now);
      expect(result.dateAfter).toBe('2026-02-01');
    });

    it('should pass through dateBefore', () => {
      const result = parseQueryParams({ dateBefore: '2026-02-28' }, now);
      expect(result.dateBefore).toBe('2026-02-28');
    });

    it('should pass through topic', () => {
      const result = parseQueryParams({ topic: 'api-design' }, now);
      expect(result.topic).toBe('api-design');
    });

    it('should pass through status', () => {
      const result = parseQueryParams({ status: 'ACTIVE' }, now);
      expect(result.status).toBe('ACTIVE');
    });

    it('should pass through author', () => {
      const result = parseQueryParams({ author: 'arno-paffen' }, now);
      expect(result.author).toBe('arno-paffen');
    });

    it('should pass through priority', () => {
      const result = parseQueryParams({ priority: 'high' }, now);
      expect(result.priority).toBe('high');
    });

    it('should pass through category', () => {
      const result = parseQueryParams({ category: 'error_resolution' }, now);
      expect(result.category).toBe('error_resolution');
    });

    it('should pass through keywords', () => {
      const result = parseQueryParams({ keywords: ['sqlite', 'query'] }, now);
      expect(result.keywords).toEqual(['sqlite', 'query']);
    });
  });

  describe('priority order', () => {
    it('should prioritize "when" over "last/unit"', () => {
      const result = parseQueryParams(
        { when: 'yesterday', last: 7, unit: 'days' },
        now
      );
      // "when" wins
      expect(result.dateAfter).toBe('2026-02-13'); // yesterday, not 7 days ago
    });

    it('should prioritize "when" over "dateAfter"', () => {
      const result = parseQueryParams(
        { when: 'last week', dateAfter: '2026-01-01' },
        now
      );
      // "when" wins
      expect(result.dateAfter).toBe('2026-02-07'); // last week (7 days ago), not Jan 1
    });

    it('should prioritize "last/unit" over "dateAfter"', () => {
      const result = parseQueryParams(
        { last: 3, unit: 'days', dateAfter: '2026-01-01' },
        now
      );
      // "last/unit" wins
      expect(result.dateAfter).toBe('2026-02-11'); // 3 days ago, not Jan 1
    });

    it('should prioritize "about" over "topic"', () => {
      const result = parseQueryParams(
        { about: 'NL topic', topic: 'structured topic' },
        now
      );
      // "about" wins
      expect(result.topic).toBe('NL topic');
    });
  });

  describe('default values', () => {
    it('should use default dbPath if not provided', () => {
      const result = parseQueryParams({}, now);
      expect(result.dbPath).toBe('.aiknowsys/knowledge.db');
    });

    it('should use provided dbPath', () => {
      const result = parseQueryParams({ dbPath: '/custom/path.db' }, now);
      expect(result.dbPath).toBe('/custom/path.db');
    });

    it('should default includeContent to false', () => {
      const result = parseQueryParams({}, now);
      expect(result.includeContent).toBe(false);
    });

    it('should respect includeContent: true', () => {
      const result = parseQueryParams({ includeContent: true }, now);
      expect(result.includeContent).toBe(true);
    });
  });

  describe('mixed parameters', () => {
    it('should handle NL time + structured filters', () => {
      const result = parseQueryParams(
        {
          when: 'last week',
          status: 'ACTIVE',
          author: 'arno-paffen',
          includeContent: false,
        },
        now
      );
      expect(result.dateAfter).toBe('2026-02-07'); // 7 days ago
      expect(result.status).toBe('ACTIVE');
      expect(result.author).toBe('arno-paffen');
      expect(result.includeContent).toBe(false);
    });

    it('should handle relative time + structured filters', () => {
      const result = parseQueryParams(
        {
          last: 7,
          unit: 'days',
          topic: 'mcp',
          priority: 'high',
        },
        now
      );
      expect(result.dateAfter).toBe('2026-02-07');
      expect(result.topic).toBe('mcp');
      expect(result.priority).toBe('high');
    });

    it('should handle all types of parameters together', () => {
      const result = parseQueryParams(
        {
          when: 'yesterday',
          about: 'testing',
          status: 'COMPLETE',
          keywords: ['tdd', 'vitest'],
          includeContent: true,
        },
        now
      );
      expect(result.dateAfter).toBe('2026-02-13');
      expect(result.topic).toBe('testing');
      expect(result.status).toBe('COMPLETE');
      expect(result.keywords).toEqual(['tdd', 'vitest']);
      expect(result.includeContent).toBe(true);
    });
  });

  describe('empty/minimal input', () => {
    it('should handle empty object', () => {
      const result = parseQueryParams({}, now);
      expect(result.dbPath).toBe('.aiknowsys/knowledge.db');
      expect(result.includeContent).toBe(false);
      expect(result.dateAfter).toBeUndefined();
      expect(result.dateBefore).toBeUndefined();
      expect(result.topic).toBeUndefined();
    });

    it('should handle only includeContent', () => {
      const result = parseQueryParams({ includeContent: true }, now);
      expect(result.includeContent).toBe(true);
      expect(result.dateAfter).toBeUndefined();
    });
  });
});
