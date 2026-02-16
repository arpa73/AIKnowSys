import { describe, it, expect } from 'vitest';
import { parseTopics } from '../../../lib/core/sqlite-query.js';

describe('parseTopics', () => {
  it('handles array input', () => {
    expect(parseTopics(['testing', 'mcp'])).toEqual(['testing', 'mcp']);
  });

  it('handles JSON array string', () => {
    expect(parseTopics('["testing", "mcp"]')).toEqual(['testing', 'mcp']);
  });

  it('handles CSV string fallback', () => {
    expect(parseTopics('testing,mcp')).toEqual(['testing', 'mcp']);
  });

  it('handles null and undefined gracefully', () => {
    expect(parseTopics(null)).toEqual([]);
    expect(parseTopics(undefined)).toEqual([]);
  });

  it('handles invalid types gracefully', () => {
    expect(parseTopics(42)).toEqual([]);
    expect(parseTopics({})).toEqual([]);
  });

  it('trims whitespace', () => {
    expect(parseTopics('  testing  , mcp  ')).toEqual(['testing', 'mcp']);
  });

  it('filters empty values', () => {
    expect(parseTopics('')).toEqual([]);
    expect(parseTopics('testing,,mcp')).toEqual(['testing', 'mcp']);
  });
});
