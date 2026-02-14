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

/**
 * Internal plan entry parsed from pointer file
 */
interface PlanEntry {
  name: string;
  file: string;
  status: string;
  pointer: string;
}

/**
 * Plan entry with filesystem metadata
 */
interface PlanWithMetadata extends PlanEntry {
  mtime: Date;
  path: string;
}

/**
 * Tracks updates needed for each pointer file
 */
interface PathUpdate {
  oldPath: string;
  newPath: string;
}

const DEFAULT_ARCHIVE_THRESHOLD_DAYS = 90;

/**
 * Archive completed plans from pointer files to archive folder
 */
export async function archivePlans(
  options: ArchivePlansOptions = {}
): Promise<ArchiveResult> {
  const dir = options.dir || process.cwd();
  const threshold = options.threshold ?? DEFAULT_ARCHIVE_THRESHOLD_DAYS;
  const dryRun = options.dryRun || false;
  const statusFilter = options.statusFilter || '✅ COMPLETE';
  const silent = options._silent || false;
  const log = createLogger(silent);

  const aiknowsysDir = path.join(dir, '.aiknowsys');
  const plansDir = path.join(aiknowsysDir, 'plans');
  const archiveDir = path.join(aiknowsysDir, 'archive', 'plans');

  if (!silent) {
    log.info('🗂️  Archiving completed plans...');
  }

  // Check if plans directory exists
  try {
    await fs.access(plansDir);
  } catch {
    log.warn('No plans directory found');
    return { archived: 0, kept: 0 };
  }

  // Read all plan pointer files (active-*.md)
  const entries = await fs.readdir(plansDir, { withFileTypes: true });
  const activePointers = entries
    .filter((entry) => entry.isFile() && entry.name.startsWith('active-'))
    .map((entry) => entry.name);

  if (activePointers.length === 0) {
    log.info('No plan pointers found');
    return { archived: 0, kept: 0 };
  }

  // Parse all plans from pointer files
  const plans: PlanEntry[] = [];

  for (const pointerFile of activePointers) {
    const pointerPath = path.join(plansDir, pointerFile);
    const content = await fs.readFile(pointerPath, 'utf-8');

    // Extract plan entries from pointer's plan table
    const planTableRegex = /\| \[([^\]]+)\]\(([^)]+)\) \| (✅ COMPLETE|🎯 ACTIVE|🔄 PAUSED|📋 PLANNED|❌ CANCELLED)/g;
    let match: RegExpExecArray | null;

    while ((match = planTableRegex.exec(content)) !== null) {
      plans.push({
        name: match[1],
        file: match[2].replace('../', ''), // Remove ../ prefix from relative paths
        status: match[3],
        pointer: pointerFile
      });
    }
  }

  if (plans.length === 0) {
    log.info('No plans found in plan pointers');
    return { archived: 0, kept: 0 };
  }

  // Find plans matching status filter to archive
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - threshold);

  const toArchive: PlanWithMetadata[] = [];
  const toKeep: PlanEntry[] = [];

  for (const plan of plans) {
    // Check if plan matches status filter
    if (!plan.status.includes(statusFilter)) {
      toKeep.push(plan);
      continue;
    }

    const planPath = path.join(aiknowsysDir, plan.file);

    try {
      const stats = await fs.stat(planPath);

      // Check last modified time
      // Special case: threshold=0 should archive immediately regardless of mtime
      // (because thresholdDate would be "now", and newly created files have mtime >= now)
      if (threshold === 0 || stats.mtime < thresholdDate) {
        toArchive.push({ ...plan, mtime: stats.mtime, path: planPath });
      } else {
        toKeep.push(plan);
      }
    } catch {
      // Plan file doesn't exist, skip
      log.warn(`Plan file not found: ${plan.file}`);
    }
  }

  if (toArchive.length === 0) {
    log.success(`No ${statusFilter} plans older than ${threshold} days`);
    return { archived: 0, kept: plans.length };
  }

  // Display summary
  log.info(`Found ${toArchive.length} completed plans to archive`);

  if (dryRun) {
    log.cyan('\n📋 Dry run - would archive:');
    for (const plan of toArchive) {
      const age = Math.floor((Date.now() - plan.mtime.getTime()) / (1000 * 60 * 60 * 24));
      log.dim(`  ${plan.name} (${age} days old)`);
    }
    return { archived: 0, kept: toKeep.length, dryRun: toArchive.length };
  }

  // Create archive directory
  await fs.mkdir(archiveDir, { recursive: true });

  // Archive files
  let archived = 0;
  const pointerUpdates: Record<string, PathUpdate[]> = {}; // Track updates per pointer file

  for (const plan of toArchive) {
    const fileName = path.basename(plan.file);
    const srcPath = path.join(aiknowsysDir, plan.file);
    const dstPath = path.join(archiveDir, fileName);

    await fs.rename(srcPath, dstPath);
    archived++;

    log.dim(`  ✓ ${plan.name} → archive/plans/`);

    // Track update for pointer file
    if (!pointerUpdates[plan.pointer]) {
      pointerUpdates[plan.pointer] = [];
    }
    pointerUpdates[plan.pointer].push({
      oldPath: plan.file,
      newPath: `archive/plans/${fileName}`
    });
  }

  // Update each pointer file with archive links
  for (const [pointerFile, updates] of Object.entries(pointerUpdates)) {
    const pointerPath = path.join(plansDir, pointerFile);
    let pointerContent = await fs.readFile(pointerPath, 'utf-8');

    for (const update of updates) {
      // Handle both ../PLAN_*.md and PLAN_*.md formats
      const oldPathPattern = update.oldPath.startsWith('../') ? update.oldPath : `../${update.oldPath}`;
      pointerContent = pointerContent.replace(
        new RegExp(`\\(${oldPathPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
        `(../${update.newPath})`
      );
    }

    await fs.writeFile(pointerPath, pointerContent, 'utf-8');
  }

  log.success(`\n✅ Archived ${archived} plans`);
  log.cyan('📁 Archive location: .aiknowsys/archive/plans/');
  log.info(`✓ Updated ${Object.keys(pointerUpdates).length} plan pointer(s) with archive links`);
  log.dim('Run: npx aiknowsys sync-plans (to update team index)');

  return { archived, kept: toKeep.length, updated: Object.keys(pointerUpdates).length };
}
