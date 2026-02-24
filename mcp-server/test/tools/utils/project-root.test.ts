import { afterEach, describe, expect, it, vi } from 'vitest';
import path from 'path';

describe('getProjectRoot', () => {
  afterEach(() => {
    delete process.env.AIKNOWSYS_PROJECT_ROOT;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('prefers AIKNOWSYS_PROJECT_ROOT when provided', async () => {
    process.env.AIKNOWSYS_PROJECT_ROOT = '/tmp/env-project-root';

    const { getProjectRoot } = await import('../../../src/tools/utils/project-root.js');
    expect(getProjectRoot()).toBe('/tmp/env-project-root');
  });

  it('falls back to inferred repository root when env var is not set', async () => {
    const { getProjectRoot } = await import('../../../src/tools/utils/project-root.js');
    expect(path.basename(getProjectRoot())).toBe('knowledge-system-template');
  });

  it('caches resolved project root for repeated calls', async () => {
    process.env.AIKNOWSYS_PROJECT_ROOT = '/tmp/first-root';
    const { getProjectRoot } = await import('../../../src/tools/utils/project-root.js');

    const first = getProjectRoot();
    process.env.AIKNOWSYS_PROJECT_ROOT = '/tmp/second-root';
    const second = getProjectRoot();

    expect(first).toBe('/tmp/first-root');
    expect(second).toBe('/tmp/first-root');
  });
});
