import { promises as fs } from 'fs';
import path from 'path';
import { SqliteStorage } from '../context/sqlite-storage.js';

export interface SyncSkillsOptions {
  dir?: string;
  dbPath?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface SyncSkillsResult {
  found: number;
  synced: number;
  skipped: number;
  dbPath: string;
  skillsDir: string;
}

async function findSkillFiles(skillsDir: string): Promise<Array<{ name: string; filePath: string }>> {
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const files: Array<{ name: string; filePath: string }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const filePath = path.join(skillsDir, entry.name, 'SKILL.md');
    try {
      await fs.access(filePath);
      files.push({ name: entry.name, filePath });
    } catch {
      // Ignore directories without SKILL.md
    }
  }

  return files;
}

export async function syncSkills(options: SyncSkillsOptions = {}): Promise<SyncSkillsResult> {
  const targetDir = path.resolve(options.dir || '.');
  const dbPath = path.resolve(options.dbPath || process.env.AIKNOWSYS_DB_PATH || path.join(targetDir, '.aiknowsys', 'knowledge.db'));
  const skillsDir = path.join(targetDir, '.github', 'skills');
  const dryRun = options.dryRun ?? false;
  const verbose = options.verbose ?? false;

  let found = 0;
  let synced = 0;
  let skipped = 0;

  try {
    await fs.access(skillsDir);
  } catch {
    if (verbose) {
      console.log(`No skills directory found at ${skillsDir}`);
    }
    return { found: 0, synced: 0, skipped: 0, dbPath, skillsDir };
  }

  const skillFiles = await findSkillFiles(skillsDir);
  found = skillFiles.length;

  if (dryRun) {
    return {
      found,
      synced: 0,
      skipped: 0,
      dbPath,
      skillsDir,
    };
  }

  const storage = new SqliteStorage();
  await storage.init(dbPath);

  try {
    for (const skill of skillFiles) {
      const content = await fs.readFile(skill.filePath, 'utf-8');
      const now = new Date().toISOString();

      await storage.upsertSkill({
        name: skill.name,
        content,
        updated_at: now,
      });
      synced += 1;
    }
  } finally {
    await storage.close();
  }

  if (found > synced) {
    skipped = found - synced;
  }

  return {
    found,
    synced,
    skipped,
    dbPath,
    skillsDir,
  };
}
