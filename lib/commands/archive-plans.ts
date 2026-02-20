import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '../logger.js';

/**
 * Result from archiving plans
 */
export interface ArchiveResult {
  archived: number;
  kept: number;
  dryRun?: number;
  updated?: number;
}

/**
 * Options for archiving plans
 */
export interface ArchivePlansOptions {
  dir?: string;
  threshold?: number;
  dryRun?: boolean;
  statusFilter?: string;
  _silent?: boolean;
}

interface PlanWithMetadata {
  id: string;
  title: string;
  file: string;
  status: string;
  mtime: Date;
}

const DEFAULT_ARCHIVE_THRESHOLD_DAYS = 90;

/**
 * Archive plans by status and age to archive folder
 */
export async function archivePlans(
  options: ArchivePlansOptions = {}
): Promise<ArchiveResult> {
  const dir = options.dir || process.cwd();
  const threshold = options.threshold ?? DEFAULT_ARCHIVE_THRESHOLD_DAYS;
  const dryRun = options.dryRun || false;
  const statusFilter = normalizeStatusFilter(options.statusFilter || 'COMPLETE');
  const silent = options._silent || false;
  const log = createLogger(silent);

  const aiknowsysDir = path.join(dir, '.aiknowsys');
  const archiveDir = path.join(aiknowsysDir, 'archive', 'plans');
  if (!silent) {
    log.info(`🗂️  Archiving ${statusFilter} plans...`);
  }

  const allPlans = await readPlansFromMarkdown(aiknowsysDir);
  const filteredPlans = allPlans.filter((plan) => plan.status === statusFilter);

  if (filteredPlans.length === 0) {
    log.info(`No ${statusFilter} plans found`);
    return { archived: 0, kept: 0 };
  }

  // Find plans matching status filter to archive
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - threshold);

  const toArchive: PlanWithMetadata[] = [];
  let kept = 0;

  for (const plan of filteredPlans) {
    const planPath = path.join(aiknowsysDir, plan.file);

    try {
      const stats = await fs.stat(planPath);

      // Check last modified time
      // Special case: threshold=0 should archive immediately regardless of mtime
      // (because thresholdDate would be "now", and newly created files have mtime >= now)
      if (threshold === 0 || stats.mtime < thresholdDate) {
        toArchive.push({
          id: plan.id,
          title: plan.title,
          file: plan.file,
          status: plan.status,
          mtime: stats.mtime
        });
      } else {
        kept++;
      }
    } catch {
      // Plan file doesn't exist, skip
      log.warn(`Plan file not found: ${plan.file}`);
      kept++;
    }
  }

  if (toArchive.length === 0) {
    log.success(`No ${statusFilter} plans older than ${threshold} days`);
    return { archived: 0, kept };
  }

  // Display summary
  log.info(`Found ${toArchive.length} completed plans to archive`);

  if (dryRun) {
    log.cyan('\n📋 Dry run - would archive:');
    for (const plan of toArchive) {
      const age = Math.floor((Date.now() - plan.mtime.getTime()) / (1000 * 60 * 60 * 24));
      log.dim(`  ${plan.id} (${age} days old)`);
    }
    return { archived: 0, kept, dryRun: toArchive.length };
  }

  // Create archive directory
  await fs.mkdir(archiveDir, { recursive: true });

  // Archive files
  let archived = 0;

  for (const plan of toArchive) {
    const fileName = path.basename(plan.file);
    const srcPath = path.join(aiknowsysDir, plan.file);
    const dstPath = path.join(archiveDir, fileName);

    await fs.rename(srcPath, dstPath);
    archived++;

    log.dim(`  ✓ ${plan.id} → archive/plans/`);
  }

  log.success(`\n✅ Archived ${archived} plans`);
  log.cyan('📁 Archive location: .aiknowsys/archive/plans/');
  log.dim(`Run: npx aiknowsys query-plans --status ACTIVE`);

  return { archived, kept };
}

function normalizeStatusFilter(statusFilter: string): 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED' {
  const normalized = statusFilter
    .toUpperCase()
    .replace(/✅|🎯|🔄|📋|❌/g, '')
    .trim();

  if (normalized.includes('ACTIVE')) return 'ACTIVE';
  if (normalized.includes('PAUSED')) return 'PAUSED';
  if (normalized.includes('PLANNED')) return 'PLANNED';
  if (normalized.includes('CANCELLED')) return 'CANCELLED';
  return 'COMPLETE';
}

async function readPlansFromMarkdown(aiknowsysDir: string): Promise<Array<{ id: string; title: string; status: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED'; file: string }>> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(aiknowsysDir);
  } catch {
    return [];
  }

  const planFiles = entries.filter((name) => /^PLAN_[a-z0-9_]+\.md$/i.test(name));
  const plans: Array<{ id: string; title: string; status: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED'; file: string }> = [];

  for (const fileName of planFiles) {
    const fullPath = path.join(aiknowsysDir, fileName);
    const content = await fs.readFile(fullPath, 'utf-8');
    const frontmatterMatch = content.match(/^\s*---\s*\n([\s\S]*?)\n\s*---/);
    if (!frontmatterMatch) continue;

    const frontmatter = frontmatterMatch[1];
    const idMatch = frontmatter.match(/^\s*id:\s*"?([A-Za-z0-9_]+)"?\s*$/m);
    const titleMatch = frontmatter.match(/^\s*title:\s*"?(.+?)"?\s*$/m);
    const statusMatch = frontmatter.match(/^\s*status:\s*"?(PLANNED|ACTIVE|PAUSED|COMPLETE|CANCELLED)"?\s*$/m);

    if (!idMatch || !statusMatch) continue;

    plans.push({
      id: idMatch[1],
      title: titleMatch ? titleMatch[1] : idMatch[1],
      status: statusMatch[1] as 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED',
      file: fileName
    });
  }

  return plans;
}
