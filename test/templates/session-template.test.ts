/**
 * Tests for session template generator
 * Phase B Mini - Context Query Completion
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateSessionTemplate } from '../../lib/templates/session-template.js';

describe('Session Template Generator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates valid session template with minimal metadata', () => {
    const template = generateSessionTemplate({});

    // Should have YAML frontmatter
    expect(template).toMatch(/^---\n/);
    expect(template).toContain('date:');
    expect(template).toContain('topics:');
    expect(template).toContain('author:');
    expect(template).toContain('files:');
    expect(template).toContain('status:');
    expect(template).toMatch(/\n---\n/);

    // Should have markdown structure
    expect(template).toContain('# Session:');
    expect(template).toContain('## Goal');
    expect(template).toContain('## Changes');
    expect(template).toContain('## Notes for Next Session');
  });

  it('includes provided topics in frontmatter', () => {
    const template = generateSessionTemplate({
      topics: ['TDD', 'validation', 'TypeScript']
    });

    expect(template).toContain('topics: ["TDD", "validation", "TypeScript"]');
  });

  it('includes plan reference when provided', () => {
    const template = generateSessionTemplate({
      plan: 'PLAN_context_query'
    });

    expect(template).toContain('plan: "PLAN_context_query"');
  });

  it('omits plan field when not provided', () => {
    const template = generateSessionTemplate({});

    expect(template).not.toContain('plan:');
  });

  it('uses provided title in session heading', () => {
    const template = generateSessionTemplate({
      title: 'Bug Fix Session'
    });

    expect(template).toContain('# Session: Bug Fix Session');
  });

  it('uses today\'s date by default', () => {
    const today = new Date().toISOString().split('T')[0];
    const template = generateSessionTemplate({});

    expect(template).toContain(`date: "${today}"`);
  });

  it('uses provided date', () => {
    const template = generateSessionTemplate({
      date: '2026-01-15'
    });

    expect(template).toContain('date: "2026-01-15"');
    expect(template).toContain('Jan 15, 2026');
  });

  it('defaults status to in-progress', () => {
    const template = generateSessionTemplate({});

    expect(template).toContain('status: "in-progress"');
  });

  it('uses provided status', () => {
    const template = generateSessionTemplate({
      status: 'complete'
    });

    expect(template).toContain('status: "complete"');
  });

  it('includes author from git config', () => {
    const template = generateSessionTemplate({});

    expect(template).toContain('author:');
    // Should have some author value (detected from git or fallback)
    expect(template).toMatch(/author: .+/);
  });

  it('includes empty files array by default', () => {
    const template = generateSessionTemplate({});

    expect(template).toContain('files: []');
  });

  it('includes provided files', () => {
    const template = generateSessionTemplate({
      files: ['lib/init.js', 'test/init.test.js']
    });

    expect(template).toContain('files: ["lib/init.js", "test/init.test.js"]');
  });

  it('formats date correctly in heading', () => {
    const template = generateSessionTemplate({
      date: '2026-02-07'
    });

    expect(template).toMatch(/# Session: .+ \(Feb 7, 2026\)/);
  });

  it('preserves topics order', () => {
    const template = generateSessionTemplate({
      topics: ['first', 'second', 'third']
    });

    const topicsLine = template.match(/topics: \[(.+)\]/)?.[1];
    expect(topicsLine).toBe('"first", "second", "third"');
  });
});
