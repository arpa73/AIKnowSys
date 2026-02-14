import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findSkillForTask } from '../../src/tools/skills.js';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
vi.mock('fs/promises');

describe('findSkillForTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find skill by keyword match', async () => {
    const mockSkillContent = `# TDD Workflow\n\nWrite tests first...`;
    vi.mocked(fs.readFile).mockResolvedValue(mockSkillContent);

    const result = await findSkillForTask({ task: 'I need to write tests before implementing' });
    const data = JSON.parse(result.content[0].text);

    expect(data.found).toBe(true);
    expect(data.skillName).toBe('tdd-workflow');
    expect(data.matchScore).toBeGreaterThan(0);
    expect(data.skillContent).toBe(mockSkillContent);
  });

  it('should match refactoring keywords', async () => {
    const mockSkillContent = `# Refactoring Workflow\n\nRefactor safely...`;
    vi.mocked(fs.readFile).mockResolvedValue(mockSkillContent);

    const result = await findSkillForTask({ task: 'refactor this messy code' });
    const data = JSON.parse(result.content[0].text);

    expect(data.found).toBe(true);
    expect(data.skillName).toBe('refactoring-workflow');
  });

  it('should match dependency management keywords', async () => {
    const mockSkillContent = `# Dependency Management\n\nUpdate packages safely...`;
    vi.mocked(fs.readFile).mockResolvedValue(mockSkillContent);

    const result = await findSkillForTask({ task: 'update dependencies' });
    const data = JSON.parse(result.content[0].text);

    expect(data.found).toBe(true);
    expect(data.skillName).toBe('dependency-management');
  });

  it('should be case-insensitive', async () => {
    const mockSkillContent = `# TDD Workflow`;
    vi.mocked(fs.readFile).mockResolvedValue(mockSkillContent);

    const result = await findSkillForTask({ task: 'WRITE TESTS FIRST' });
    const data = JSON.parse(result.content[0].text);

    expect(data.found).toBe(true);
    expect(data.skillName).toBe('tdd-workflow');
  });

  it('should return highest scoring match when multiple keywords match', async () => {
    const mockSkillContent = `# TDD Workflow`;
    vi.mocked(fs.readFile).mockResolvedValue(mockSkillContent);

    // "write tests first" matches multiple keywords in tdd-workflow
    const result = await findSkillForTask({ task: 'write tests first' });
    const data = JSON.parse(result.content[0].text);

    expect(data.found).toBe(true);
    expect(data.matchScore).toBeGreaterThan(1); // Multiple keyword matches
  });

  it('should return not found when no keywords match', async () => {
    const result = await findSkillForTask({ task: 'make coffee' });
    const data = JSON.parse(result.content[0].text);

    expect(data.found).toBe(false);
    expect(data.message).toContain('No matching skill');
    expect(data.availableSkills).toBeDefined();
    expect(Array.isArray(data.availableSkills)).toBe(true);
  });

  it('should list available skills when no match found', async () => {
    const result = await findSkillForTask({ task: 'random task' });
    const data = JSON.parse(result.content[0].text);

    expect(data.found).toBe(false);
    expect(data.availableSkills.length).toBeGreaterThan(0);
    
    const tddSkill = data.availableSkills.find(
      (s: any) => s.name === 'tdd-workflow'
    );
    expect(tddSkill).toBeDefined();
    expect(tddSkill.description).toBeDefined();
  });

  it('should handle file read errors gracefully', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

    const result = await findSkillForTask({ task: 'write tests' });
    const data = JSON.parse(result.content[0].text);

    expect(data.error).toBe(true);
    expect(data.message).toContain('File not found');
  });

  it('should include task in response', async () => {
    const mockSkillContent = `# TDD Workflow`;
    vi.mocked(fs.readFile).mockResolvedValue(mockSkillContent);

    const task = 'write tests before implementing';
    const result = await findSkillForTask({ task });
    const data = JSON.parse(result.content[0].text);

    expect(data.task).toBe(task);
  });

  it('should return MCP-compliant response format', async () => {
    const result = await findSkillForTask({ task: 'random task' });

    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
  });

  it('should match context-query keywords', async () => {
    const mockSkillContent = `# Context Query`;
    vi.mocked(fs.readFile).mockResolvedValue(mockSkillContent);

    const result = await findSkillForTask({ task: 'query plans' });
    const data = JSON.parse(result.content[0].text);

    expect(data.found).toBe(true);
    expect(data.skillName).toBe('context-query');
  });

  it('should match context-mutation keywords', async () => {
    const mockSkillContent = `# Context Mutation`;
    vi.mocked(fs.readFile).mockResolvedValue(mockSkillContent);

    const result = await findSkillForTask({ task: 'create session' });
    const data = JSON.parse(result.content[0].text);

    expect(data.found).toBe(true);
    expect(data.skillName).toBe('context-mutation');
  });

  it('should return conversational error for missing task parameter', async () => {
    const result = await findSkillForTask({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid parameter 'task'");
    expect(result.content[0].text).toContain('non-empty string');
  });

  it('should return conversational error for empty task string', async () => {
    const result = await findSkillForTask({ task: '' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid parameter 'task'");
    expect(result.content[0].text).toContain('non-empty string');
  });

  it('should return conversational error for non-string task', async () => {
    const result = await findSkillForTask({ task: 123 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid parameter 'task'");
  });
});
