import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { seedProjectConfig } from '../../lib/core/seed-project-config.js';
import * as stackDetector from '../../lib/utils/stack-detector.js';
import type { StorageAdapter } from '../../lib/context/storage-adapter.js';

describe('seedProjectConfig', () => {
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = {
      upsertProject: vi.fn(),
      getProjectConfig: vi.fn(),
      upsertProjectConfig: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should seed project config and return configs inserted', async () => {
    // mock detectTechStack
    vi.spyOn(stackDetector, 'detectTechStack').mockResolvedValue({
      runtime: 'Node.js 20+',
      language: 'TypeScript',
      testFramework: 'Vitest',
      packageManager: 'npm',
      frameworks: []
    });

    mockStorage.getProjectConfig.mockResolvedValue(null);

    await seedProjectConfig({
      targetDir: '/foo/bar',
      projectId: 'bar',
      storage: mockStorage as unknown as StorageAdapter
    });

    expect(mockStorage.upsertProject).toHaveBeenCalledWith(expect.objectContaining({
      id: 'bar',
      name: 'bar',
      path: '/foo/bar',
      tech_stack: expect.any(String)
    }));

    expect(mockStorage.getProjectConfig).toHaveBeenCalledWith('bar', 'validation_matrix');
    expect(mockStorage.getProjectConfig).toHaveBeenCalledWith('bar', 'critical_invariants');
    expect(mockStorage.upsertProjectConfig).toHaveBeenCalledTimes(2);
  });

  it('should skip if config already exists', async () => {
    vi.spyOn(stackDetector, 'detectTechStack').mockResolvedValue({
      runtime: 'Node.js 20+',
      language: 'TypeScript',
      testFramework: 'Vitest',
      packageManager: 'npm',
      frameworks: []
    });

    mockStorage.getProjectConfig.mockResolvedValue('existing_value');

    await seedProjectConfig({
      targetDir: '/foo/bar',
      projectId: 'bar',
      storage: mockStorage as unknown as StorageAdapter
    });

    expect(mockStorage.upsertProjectConfig).not.toHaveBeenCalled();
  });
});
