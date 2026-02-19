import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStorageInit = vi.fn();
const mockStorageClose = vi.fn();
const mockStorageGetUserState = vi.fn();

vi.mock('../../../../lib/utils/find-knowledge-db.js', () => ({
  findKnowledgeDb: vi.fn(() => '.aiknowsys/knowledge.db'),
}));

vi.mock('../../../../lib/context/sqlite-storage.js', () => {
  class MockSqliteStorage {
    async init(...args: unknown[]) {
      return mockStorageInit(...args);
    }

    async close(...args: unknown[]) {
      return mockStorageClose(...args);
    }

    async getUserState(...args: unknown[]) {
      return mockStorageGetUserState(...args);
    }
  }

  return { SqliteStorage: MockSqliteStorage };
});

describe('storage-helpers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockStorageInit.mockResolvedValue(undefined);
    mockStorageClose.mockResolvedValue(undefined);
    mockStorageGetUserState.mockResolvedValue({ activePlanId: null });
  });

  it('returns operation result on success', async () => {
    const { withStorage } = await import('../../../src/tools/utils/storage-helpers.js');

    const result = await withStorage(async (storage) => {
      const state = await storage.getUserState('mcp-agent');
      return state?.activePlanId ?? 'NONE';
    }, 'test operation');

    expect(result).toBe('NONE');
    expect(mockStorageInit).toHaveBeenCalledTimes(1);
    expect(mockStorageClose).toHaveBeenCalledTimes(1);
  });

  it('wraps operation errors with context and preserves cause', async () => {
    const { withStorage } = await import('../../../src/tools/utils/storage-helpers.js');

    await expect(
      withStorage(async () => {
        throw new Error('DB unavailable');
      }, 'pointer sync operation')
    ).rejects.toMatchObject({
      message: 'Failed during pointer sync operation: DB unavailable',
      cause: expect.any(Error),
    });

    expect(mockStorageClose).toHaveBeenCalledTimes(1);
  });

  it('closes storage even when init fails', async () => {
    mockStorageInit.mockRejectedValueOnce(new Error('Init failed'));
    const { withStorage } = await import('../../../src/tools/utils/storage-helpers.js');

    await expect(withStorage(async () => 'ok', 'init operation')).rejects.toThrow(
      'Failed during init operation: Init failed'
    );

    expect(mockStorageClose).toHaveBeenCalledTimes(1);
  });

  it('normalizes contextual storage errors for user-facing warnings', async () => {
    const { toUserFacingStorageErrorMessage } = await import('../../../src/tools/utils/storage-helpers.js');

    expect(
      toUserFacingStorageErrorMessage(new Error('Failed during createPlan pointer sync operation: DB unavailable'))
    ).toBe('DB unavailable');

    expect(toUserFacingStorageErrorMessage(new Error('Already plain message'))).toBe('Already plain message');
    expect(toUserFacingStorageErrorMessage('raw string error')).toBe('raw string error');
  });
});
