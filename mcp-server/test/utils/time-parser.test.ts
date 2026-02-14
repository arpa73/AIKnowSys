/**
 * Tests for natural language time expression parser
 * 
 * TDD: RED phase - Tests written first
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseTimeExpression, formatDate } from '../../src/utils/time-parser.js';

describe('parseTimeExpression', () => {
  let now: Date;
  
  beforeEach(() => {
    // Fix current time for consistent testing
    now = new Date('2026-02-14T12:00:00Z');
  });
  
  describe('relative time expressions', () => {
    it('should parse "yesterday"', () => {
      const result = parseTimeExpression('yesterday', now);
      expect(result.dateAfter).toBe('2026-02-13');
      expect(result.dateBefore).toBeUndefined();
    });
    
    it('should parse "today"', () => {
      const result = parseTimeExpression('today', now);
      expect(result.dateAfter).toBe('2026-02-14');
      expect(result.dateBefore).toBe('2026-02-14');
    });
    
    it('should parse "last week"', () => {
      const result = parseTimeExpression('last week', now);
      expect(result.dateAfter).toBe('2026-02-07'); // 7 days ago
    });
    
    it('should parse "last month"', () => {
      const result = parseTimeExpression('last month', now);
      expect(result.dateAfter).toBe('2026-01-15'); // 30 days ago
    });
    
    it('should parse "this week"', () => {
      const result = parseTimeExpression('this week', now);
      // Should return start of current week (Monday)
      // Feb 14, 2026 is Saturday, so Monday is Feb 9
      expect(result.dateAfter).toBe('2026-02-09'); // Monday of this week
    });
    
    it('should parse "this month"', () => {
      const result = parseTimeExpression('this month', now);
      expect(result.dateAfter).toBe('2026-02-01'); // Start of February
    });
  });
  
  describe('N units ago expressions', () => {
    it('should parse "3 days ago"', () => {
      const result = parseTimeExpression('3 days ago', now);
      expect(result.dateAfter).toBe('2026-02-11');
    });
    
    it('should parse "1 day ago"', () => {
      const result = parseTimeExpression('1 day ago', now);
      expect(result.dateAfter).toBe('2026-02-13');
    });
    
    it('should parse "2 weeks ago"', () => {
      const result = parseTimeExpression('2 weeks ago', now);
      expect(result.dateAfter).toBe('2026-01-31'); // 14 days ago
    });
    
    it('should parse "1 week ago"', () => {
      const result = parseTimeExpression('1 week ago', now);
      expect(result.dateAfter).toBe('2026-02-07');
    });
    
    it('should parse "2 months ago"', () => {
      const result = parseTimeExpression('2 months ago', now);
      expect(result.dateAfter).toBe('2025-12-16'); // 60 days ago
    });
    
    it('should parse "1 month ago"', () => {
      const result = parseTimeExpression('1 month ago', now);
      expect(result.dateAfter).toBe('2026-01-15'); // 30 days ago
    });
  });
  
  describe('case insensitivity', () => {
    it('should parse "Last Week" (capital L)', () => {
      const result = parseTimeExpression('Last Week', now);
      expect(result.dateAfter).toBe('2026-02-07');
    });
    
    it('should parse "YESTERDAY" (all caps)', () => {
      const result = parseTimeExpression('YESTERDAY', now);
      expect(result.dateAfter).toBe('2026-02-13');
    });
    
    it('should parse "3 DAYS AGO" (mixed case)', () => {
      const result = parseTimeExpression('3 DAYS AGO', now);
      expect(result.dateAfter).toBe('2026-02-11');
    });
  });
  
  describe('queries with extra words', () => {
    it('should extract "last week" from "show me sessions from last week"', () => {
      const result = parseTimeExpression('show me sessions from last week', now);
      expect(result.dateAfter).toBe('2026-02-07');
    });
    
    it('should extract "3 days ago" from "find plans from 3 days ago"', () => {
      const result = parseTimeExpression('find plans from 3 days ago', now);
      expect(result.dateAfter).toBe('2026-02-11');
    });
    
    it('should extract "yesterday" from "what did we do yesterday"', () => {
      const result = parseTimeExpression('what did we do yesterday', now);
      expect(result.dateAfter).toBe('2026-02-13');
    });
  });
  
  describe('no match scenarios', () => {
    it('should return empty object for unrecognized time expression', () => {
      const result = parseTimeExpression('some random text', now);
      expect(result).toEqual({});
    });
    
    it('should return empty object for empty string', () => {
      const result = parseTimeExpression('', now);
      expect(result).toEqual({});
    });
    
    it('should return empty object for just numbers', () => {
      const result = parseTimeExpression('42', now);
      expect(result).toEqual({});
    });
  });
  
  describe('edge cases', () => {
    it('should handle "1 days ago" (singular/plural mismatch)', () => {
      const result = parseTimeExpression('1 days ago', now);
      expect(result.dateAfter).toBe('2026-02-13');
    });
    
    it('should handle "2 day ago" (plural/singular mismatch)', () => {
      const result = parseTimeExpression('2 day ago', now);
      expect(result.dateAfter).toBe('2026-02-12');
    });
    
    it('should handle very large numbers', () => {
      const result = parseTimeExpression('365 days ago', now);
      expect(result.dateAfter).toBe('2025-02-14'); // ~1 year ago
    });
  });
});

describe('formatDate', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2026-02-14T12:00:00Z');
    expect(formatDate(date)).toBe('2026-02-14');
  });
  
  it('should handle single-digit months', () => {
    const date = new Date('2026-01-05T12:00:00Z');
    expect(formatDate(date)).toBe('2026-01-05');
  });
  
  it('should handle single-digit days', () => {
    const date = new Date('2026-12-01T12:00:00Z');
    expect(formatDate(date)).toBe('2026-12-01');
  });
  
  it('should handle year boundaries', () => {
    const date = new Date('2025-12-31T23:59:59Z');
    expect(formatDate(date)).toBe('2025-12-31');
  });
});
