import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockWithStorage } = vi.hoisted(() => ({
  mockWithStorage: vi.fn(),
}));

vi.mock('../../src/tools/utils/storage-helpers.js', () => ({
  withStorage: mockWithStorage,
}));

vi.mock('../../../lib/commands/rebuild-index.js', () => ({
  rebuildIndex: vi.fn(),
}));

import { getCriticalInvariants, getValidationMatrix } from '../../src/tools/context.js';

describe('context tools DB-first config resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns validation matrix from project_config when present', async () => {
    const dbValue = JSON.stringify({
      categories: [{ name: 'Required', commands: [{ command: 'pytest' }] }],
      criticalRule: 'run checks',
      technologySnapshot: { runtime: 'Python 3.x' },
    });

    const getProjectConfig = vi.fn().mockResolvedValue(dbValue);
    mockWithStorage.mockImplementation(async (op: (storage: unknown) => Promise<unknown>) =>
      op({ getProjectConfig, queryInvariants: vi.fn().mockResolvedValue([]) })
    );

    const result = await getValidationMatrix('proj-alpha');
    const data = JSON.parse(result.content[0].text);

    expect(getProjectConfig).toHaveBeenCalledWith('proj-alpha', 'validation_matrix');
    expect(data.technologySnapshot.runtime).toBe('Python 3.x');
    expect(data.categories[0].commands[0].command).toBe('pytest');
  });

  it('falls back to default validation matrix when project_config value is missing', async () => {
    const getProjectConfig = vi.fn().mockResolvedValue(null);
    mockWithStorage.mockImplementation(async (op: (storage: unknown) => Promise<unknown>) =>
      op({ getProjectConfig, queryInvariants: vi.fn().mockResolvedValue([]) })
    );

    const result = await getValidationMatrix('proj-beta');
    const data = JSON.parse(result.content[0].text);

    expect(getProjectConfig).toHaveBeenCalledWith('proj-beta', 'validation_matrix');
    expect(JSON.stringify(data)).toContain('npm test');
  });

  it('returns critical invariants from project_config when present', async () => {
    const dbValue = JSON.stringify([
      {
        id: 'custom-1',
        number: 1,
        name: 'Custom Rule',
        rule: 'Do custom thing',
        details: [],
      },
    ]);

    const getProjectConfig = vi.fn().mockResolvedValue(dbValue);
    const queryInvariants = vi.fn().mockResolvedValue([
      { id: 'seed-1', number: 1, name: 'Seed Rule', rule: 'seed', details: [] },
    ]);
    mockWithStorage.mockImplementation(async (op: (storage: unknown) => Promise<unknown>) =>
      op({ getProjectConfig, queryInvariants })
    );

    const result = await getCriticalInvariants('proj-gamma');
    const data = JSON.parse(result.content[0].text);

    expect(getProjectConfig).toHaveBeenCalledWith('proj-gamma', 'critical_invariants');
    expect(data.count).toBe(1);
    expect(data.invariants[0].name).toBe('Custom Rule');
    expect(queryInvariants).not.toHaveBeenCalled();
  });

  it('falls back to seeded invariants table when project_config is missing', async () => {
    const seeded = [
      { id: 'seed-1', number: 1, name: 'ES Modules', rule: 'Use import/export', details: [] },
      { id: 'seed-2', number: 2, name: 'Absolute Paths', rule: 'Use path.resolve', details: [] },
    ];

    const getProjectConfig = vi.fn().mockResolvedValue(null);
    const queryInvariants = vi.fn().mockResolvedValue(seeded);
    mockWithStorage.mockImplementation(async (op: (storage: unknown) => Promise<unknown>) =>
      op({ getProjectConfig, queryInvariants })
    );

    const result = await getCriticalInvariants('proj-delta');
    const data = JSON.parse(result.content[0].text);

    expect(getProjectConfig).toHaveBeenCalledWith('proj-delta', 'critical_invariants');
    expect(queryInvariants).toHaveBeenCalledTimes(1);
    expect(data.count).toBe(2);
    expect(data.invariants[0].name).toBe('ES Modules');
  });
});
