import { detectTechStack } from '../utils/stack-detector.js';
import { getConfigSeeds } from '../utils/config-seeds.js';
import type { StorageAdapter } from '../context/storage-adapter.js';
import path from 'path';

export interface SeedProjectConfigOptions {
  targetDir: string;
  projectId?: string;
  storage: StorageAdapter;
}

export async function seedProjectConfig(options: SeedProjectConfigOptions): Promise<void> {
  const { targetDir, storage } = options;
  const resolvedDir = path.resolve(targetDir);
  const projectId = options.projectId || path.basename(resolvedDir);

  const stack = await detectTechStack(resolvedDir);
  const now = new Date().toISOString();

  await storage.upsertProject({
    id: projectId,
    name: projectId,
    path: resolvedDir,
    tech_stack: JSON.stringify(stack),
    created_at: now,
    updated_at: now
  });

  const seeds = getConfigSeeds(stack);

  for (const [key, value] of Object.entries(seeds)) {
    const existing = await storage.getProjectConfig(projectId, key);
    if (!existing) {
      await storage.upsertProjectConfig({
        project_id: projectId,
        key,
        value,
        updated_at: now
      });
    }
  }
}
