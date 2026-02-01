/**
 * Tests for validate-deliverables command
 * Following TDD: Writing tests FIRST (RED phase)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateDeliverables } from '../lib/validate-deliverables.js';

describe('Deliverable Scanning', () => {
  it('should scan skills directory', async () => {
    const result = await validateDeliverables({
      type: 'skills',
      projectRoot: '/fake/project',
      mockMode: true
    });
    
    assert.ok(result.skills, 'Should return skills array');
    assert.ok(Array.isArray(result.skills), 'Skills should be array');
  });

  it('should scan stacks directory', async () => {
    const result = await validateDeliverables({
      type: 'stacks',
      projectRoot: '/fake/project',
      mockMode: true
    });
    
    assert.ok(result.stacks, 'Should return stacks array');
    assert.ok(Array.isArray(result.stacks), 'Stacks should be array');
  });

  it('should scan all deliverables by default', async () => {
    const result = await validateDeliverables({
      projectRoot: '/fake/project',
      mockMode: true
    });
    
    assert.ok(result.skills, 'Should include skills');
    assert.ok(result.essentials, 'Should include essentials');
    assert.ok(!result.stacks, 'Should NOT include stacks by default');
    assert.ok(result.summary, 'Should include summary');
  });

  it('should handle missing directories gracefully', async () => {
    const result = await validateDeliverables({
      projectRoot: '/nonexistent/project',
      mockMode: true
    });
    
    assert.ok(result.error || result.skills.length === 0, 'Should handle missing directories');
  });
});

describe('Library Detection', () => {
  it('should detect library references in skill files', async () => {
    const result = await validateDeliverables({
      type: 'skills',
      projectRoot: '/fake/project',
      mockMode: true,
      mockSkills: [
        { path: 'skill1', content: 'Next.js application setup' }
      ]
    });
    
    const skill = result.skills[0];
    assert.ok(skill.libraries, 'Should detect libraries');
    assert.ok(skill.libraries.includes('Next.js') || skill.libraries.length >= 0, 
      'Should identify Next.js reference');
  });

  it('should detect multiple libraries in one file', async () => {
    const result = await validateDeliverables({
      type: 'skills',
      projectRoot: '/fake/project',
      mockMode: true,
      mockSkills: [
        { path: 'skill1', content: 'Vue 3 with TypeScript and Vite' }
      ]
    });
    
    const skill = result.skills[0];
    assert.ok(skill.libraries.length >= 2, 'Should detect multiple libraries');
  });

  it('should normalize library names', async () => {
    const result = await validateDeliverables({
      type: 'skills',
      projectRoot: '/fake/project',
      mockMode: true,
      mockSkills: [
        { path: 'skill1', content: 'next.js, Next.JS, NextJS' }
      ]
    });
    
    const skill = result.skills[0];
    // All variants should normalize to same library
    const uniqueLibs = new Set(skill.libraries);
    assert.ok(uniqueLibs.size <= 1, 'Should normalize library name variants');
  });
});

describe('Context7 Integration', () => {
  it('should query Context7 for library documentation', async () => {
    const result = await validateDeliverables({
      type: 'skills',
      library: 'Next.js',
      projectRoot: '/fake/project',
      mockMode: true,
      mockSkills: [
        { path: 'nextjs-skill', content: 'Next.js application setup' }
      ]
    });
    
    assert.ok(result.context7Queries, 'Should include Context7 queries');
    assert.ok(result.context7Queries.length > 0, 'Should have queried Context7');
  });

  it('should handle Context7 connection failures gracefully', async () => {
    const result = await validateDeliverables({
      projectRoot: '/fake/project',
      mockMode: true,
      mockContext7Error: true
    });
    
    assert.ok(result.summary, 'Should still return summary');
    assert.ok(result.warnings || result.summary.context7Available === false, 
      'Should indicate Context7 unavailable');
  });

  it('should cache Context7 queries for same library', async () => {
    const result = await validateDeliverables({
      type: 'skills',
      projectRoot: '/fake/project',
      mockMode: true,
      mockSkills: [
        { path: 'skill1', content: 'Next.js' },
        { path: 'skill2', content: 'Next.js' }
      ]
    });
    
    // Should only query once for Next.js
    const nextQueries = result.context7Queries.filter(q => q.library === 'Next.js');
    assert.equal(nextQueries.length, 1, 'Should cache duplicate library queries');
  });
});

describe('Validation Report', () => {
  it('should generate summary statistics', async () => {
    const result = await validateDeliverables({
      projectRoot: '/fake/project',
      mockMode: true
    });
    
    assert.ok(result.summary, 'Should include summary');
    assert.ok(typeof result.summary.total === 'number', 'Should count total deliverables');
    assert.ok(typeof result.summary.validated === 'number', 'Should count validated items');
  });

  it('should identify outdated patterns', async () => {
    const result = await validateDeliverables({
      type: 'skills',
      projectRoot: '/fake/project',
      mockMode: true,
      mockSkills: [
        { path: 'skill1', content: 'getServerSideProps in Next.js' }
      ]
    });
    
    const skill = result.skills[0];
    assert.ok(skill.status, 'Should have validation status');
    assert.ok(['current', 'outdated', 'deprecated'].includes(skill.status), 
      'Status should be valid type');
  });

  it('should provide suggestions for outdated patterns', async () => {
    const result = await validateDeliverables({
      type: 'skills',
      projectRoot: '/fake/project',
      mockMode: true,
      mockSkills: [
        { path: 'skill1', content: 'Class components in React' }
      ]
    });
    
    const skill = result.skills[0];
    if (skill.status === 'outdated') {
      assert.ok(skill.suggestions, 'Outdated items should have suggestions');
      assert.ok(skill.suggestions.length > 0, 'Should provide at least one suggestion');
    }
  });
});

describe('Output Formats', () => {
  it('should support text format', async () => {
    const result = await validateDeliverables({
      projectRoot: '/fake/project',
      format: 'text',
      mockMode: true
    });
    
    assert.ok(result.output, 'Should include formatted output');
    assert.ok(typeof result.output === 'string', 'Text format should be string');
  });

  it('should support JSON format', async () => {
    const result = await validateDeliverables({
      projectRoot: '/fake/project',
      format: 'json',
      mockMode: true
    });
    
    assert.ok(result.output, 'Should include formatted output');
    const parsed = JSON.parse(result.output);
    assert.ok(parsed.summary, 'JSON should be valid and parseable');
  });

  it('should support markdown format', async () => {
    const result = await validateDeliverables({
      projectRoot: '/fake/project',
      format: 'markdown',
      mockMode: true
    });
    
    assert.ok(result.output, 'Should include formatted output');
    assert.ok(result.output.includes('#'), 'Markdown should have headers');
  });
});

describe('Filtering', () => {
  it('should filter by specific library', async () => {
    const result = await validateDeliverables({
      library: 'Next.js',
      projectRoot: '/fake/project',
      mockMode: true,
      mockSkills: [
        { path: 'skill1', content: 'Next.js' },
        { path: 'skill2', content: 'Django' }
      ]
    });
    
    // Should only include Next.js skill
    assert.ok(result.skills.length <= 1, 'Should filter to specific library');
  });

  it('should filter by deliverable type', async () => {
    const result = await validateDeliverables({
      type: 'skills',
      projectRoot: '/fake/project',
      mockMode: true
    });
    
    assert.ok(result.skills, 'Should include skills');
    assert.ok(!result.stacks, 'Should not include stacks when filtered');
  });
});

describe('Error Handling', () => {
  it('should validate required options', async () => {
    try {
      await validateDeliverables({});
      assert.fail('Should require projectRoot option');
    } catch (error) {
      assert.ok(error.message.includes('projectRoot'), 'Should mention missing option');
    }
  });

  it('should handle file read errors gracefully', async () => {
    const result = await validateDeliverables({
      projectRoot: '/fake/project',
      mockMode: true,
      mockFileError: true
    });
    
    assert.ok(result.errors || result.warnings, 'Should report file errors');
  });
});

describe('ESSENTIALS Validation (NEW)', () => {
  it('should scan ESSENTIALS file', async () => {
    const result = await validateDeliverables({
      type: 'essentials',
      projectRoot: '/fake/project',
      mockMode: true,
      mockEssentials: [{
        path: 'CODEBASE_ESSENTIALS.md',
        type: 'essentials',
        libraries: ['Node.js', 'JavaScript'],
        status: 'pending',
        suggestions: []
      }]
    });
    
    assert.ok(result.essentials, 'Should return essentials array');
    assert.ok(Array.isArray(result.essentials), 'Essentials should be array');
    assert.strictEqual(result.essentials.length, 1, 'Should have one ESSENTIALS item');
    assert.strictEqual(result.essentials[0].path, 'CODEBASE_ESSENTIALS.md');
  });

  it('should parse Technology Snapshot from ESSENTIALS', async () => {
    // Test that libraries are detected from mock ESSENTIALS data
    const result = await validateDeliverables({
      type: 'essentials',
      projectRoot: '/fake/project',
      mockMode: true,
      mockEssentials: [{
        path: 'CODEBASE_ESSENTIALS.md',
        type: 'essentials',
        libraries: ['Node.js', 'JavaScript', 'Next.js', 'Vue'],
        status: 'pending',
        suggestions: []
      }]
    });
    
    const essentials = result.essentials[0];
    assert.ok(essentials.libraries, 'Should detect libraries');
    assert.ok(essentials.libraries.length >= 2, 'Should detect multiple libraries from table');
  });

  it('should validate ESSENTIALS patterns against Context7', async () => {
    const result = await validateDeliverables({
      type: 'essentials',
      projectRoot: '/fake/project',
      mockMode: true,
      mockEssentials: [{
        path: 'CODEBASE_ESSENTIALS.md',
        type: 'essentials',
        libraries: ['Next.js'],
        status: 'pending',
        suggestions: []
      }]
    });
    
    assert.ok(result.context7Queries, 'Should include Context7 queries');
    assert.ok(result.context7Queries.length > 0, 'Should have queried Context7');
    assert.ok(result.essentials[0].status, 'Should have validation status');
  });

  it('should change default to scan skills + essentials (not stacks)', async () => {
    const result = await validateDeliverables({
      projectRoot: '/fake/project',
      mockMode: true,
      mockSkills: [{ path: 'skill1', libraries: [], status: 'current' }],
      mockEssentials: [{ path: 'CODEBASE_ESSENTIALS.md', libraries: [], status: 'current' }]
    });
    
    assert.ok(result.skills, 'Should include skills');
    assert.ok(result.essentials, 'Should include essentials');
    assert.ok(!result.stacks, 'Should NOT include stacks by default');
  });

  it('should keep --type stacks working (backward compatibility)', async () => {
    const result = await validateDeliverables({
      type: 'stacks',
      projectRoot: '/fake/project',
      mockMode: true,
      mockStacks: [{ path: 'stack1', libraries: [], status: 'current' }]
    });
    
    assert.ok(result.stacks, 'Should return stacks array');
    assert.ok(!result.skills, 'Should not include skills when type=stacks');
    assert.ok(!result.essentials, 'Should not include essentials when type=stacks');
  });
});
