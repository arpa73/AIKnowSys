import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

const mockReadFile = vi.fn();
const mockGetProjectRoot = vi.fn();

vi.mock('fs/promises', () => ({
  default: {
    readFile: mockReadFile,
  },
}));

vi.mock('../../src/tools/utils/project-root.js', () => ({
  getProjectRoot: mockGetProjectRoot,
}));

describe('findSkillForTask path resolution', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.AIKNOWSYS_ENABLE_SKILL_FILE_IO = 'true';
    delete process.env.AIKNOWSYS_SQLITE_ONLY;
  });

  it('should resolve SKILL.md path from project root utility', async () => {
    mockGetProjectRoot.mockReturnValue('/tmp/project-root');
    mockReadFile.mockResolvedValue('# Skill');

    const { findSkillForTask } = await import('../../src/tools/skills.js');
    await findSkillForTask({ task: 'write tests first' });

    expect(mockGetProjectRoot).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith(
      path.resolve('/tmp/project-root', '.github/skills/tdd-workflow/SKILL.md'),
      'utf-8'
    );
  });
});
