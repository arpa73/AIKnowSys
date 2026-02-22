import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';

type SqliteStorageWithTrackAMethods = SqliteStorage & {
  upsertProject(project: {
    id: string;
    name: string;
    path?: string;
    tech_stack?: unknown;
    created_at: string;
    updated_at: string;
  }): Promise<void>;
  upsertProjectConfig(entry: {
    project_id: string;
    key: string;
    value: string;
    updated_at: string;
  }): Promise<void>;
  getProjectConfig(projectId: string, key: string): Promise<string | null>;
  db: {
    prepare(sql: string): {
      get(...params: unknown[]): unknown;
    };
  } | null;
};

describe('SqliteStorage Track A: project + config storage', () => {
  let testDir: string;
  let storage: SqliteStorage;
  let storageInternal: SqliteStorageWithTrackAMethods;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), `test-tmp-sqlite-project-config-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    storage = new SqliteStorage();
    storageInternal = storage as unknown as SqliteStorageWithTrackAMethods;
    await storage.init(testDir);
  });

  afterEach(async () => {
    await storage.close();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('upsertProject inserts a new project row', async () => {
    const now = new Date().toISOString();
    await storageInternal.upsertProject({
      id: 'project-a',
      name: 'Project A',
      path: '/tmp/project-a',
      tech_stack: { runtime: 'Node.js 20+', language: 'TypeScript' },
      created_at: now,
      updated_at: now
    });

    const row = storageInternal.db
      ?.prepare('SELECT id, name, path, tech_stack FROM projects WHERE id = ?')
      .get('project-a') as
      | { id: string; name: string; path: string | null; tech_stack: string | null }
      | undefined;

    expect(row).toBeDefined();
    expect(row?.id).toBe('project-a');
    expect(row?.name).toBe('Project A');
    expect(row?.path).toBe('/tmp/project-a');
    expect(row?.tech_stack ? JSON.parse(row.tech_stack) : null).toEqual({
      runtime: 'Node.js 20+',
      language: 'TypeScript'
    });
  });

  it('upsertProject updates existing row and preserves tech_stack when omitted', async () => {
    const createdAt = '2026-02-20T10:00:00.000Z';
    const updatedAt = '2026-02-20T11:00:00.000Z';

    await storageInternal.upsertProject({
      id: 'project-b',
      name: 'Project B',
      path: '/tmp/project-b',
      tech_stack: { runtime: 'Python 3.x' },
      created_at: createdAt,
      updated_at: createdAt
    });

    await storageInternal.upsertProject({
      id: 'project-b',
      name: 'Project B Updated',
      path: '/tmp/project-b-updated',
      created_at: createdAt,
      updated_at: updatedAt
    });

    const row = storageInternal.db
      ?.prepare('SELECT name, path, tech_stack, updated_at FROM projects WHERE id = ?')
      .get('project-b') as
      | { name: string; path: string | null; tech_stack: string | null; updated_at: string }
      | undefined;

    expect(row).toBeDefined();
    expect(row?.name).toBe('Project B Updated');
    expect(row?.path).toBe('/tmp/project-b-updated');
    expect(row?.updated_at).toBe(updatedAt);
    expect(row?.tech_stack ? JSON.parse(row.tech_stack) : null).toEqual({
      runtime: 'Python 3.x'
    });
  });

  it('upsertProjectConfig inserts and updates key/value entries', async () => {
    const now = new Date().toISOString();
    await storageInternal.upsertProject({
      id: 'project-c',
      name: 'Project C',
      created_at: now,
      updated_at: now
    });

    await storageInternal.upsertProjectConfig({
      project_id: 'project-c',
      key: 'validation_matrix',
      value: '{"commands":["npm test"]}',
      updated_at: now
    });

    const firstValue = await storageInternal.getProjectConfig('project-c', 'validation_matrix');
    expect(firstValue).toBe('{"commands":["npm test"]}');

    await storageInternal.upsertProjectConfig({
      project_id: 'project-c',
      key: 'validation_matrix',
      value: '{"commands":["pytest"]}',
      updated_at: '2026-02-20T12:00:00.000Z'
    });

    const updatedValue = await storageInternal.getProjectConfig('project-c', 'validation_matrix');
    expect(updatedValue).toBe('{"commands":["pytest"]}');
  });

  it('getProjectConfig returns null for missing key', async () => {
    const value = await storageInternal.getProjectConfig('missing-project', 'critical_invariants');
    expect(value).toBeNull();
  });
});
