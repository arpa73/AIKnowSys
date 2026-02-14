import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '../logger.js';
import { archiveSessions } from './archive-sessions.js';
import { archivePlans } from './archive-plans.js';

/**
 * Result from cleanup operation
 */
export interface CleanResult {
  sessionsArchived: number;
  plansArchived: number;
  tempFilesRemoved: number;
  dryRun?: {
    sessions: number;
    plans: number;
    tempFiles: number;
  };
}

/**
 * Options for clean command
 */
export interface CleanOptions {
  dir?: string;
  threshold?: number;
  dryRun?: boolean;
}

/**
 * All-in-one cleanup: archive old sessions, archive completed plans, remove temp files
 */
export async function clean(
  options: CleanOptions = {}
): Promise<CleanResult> {
  const dir = options.dir || process.cwd();
  const threshold = options.threshold || 90;
  const dryRun = options.dryRun || false;
  const log = createLogger(false); // Never silent for clean command

  const targetDir = path.join(dir, '.aiknowsys');

  log.header('🧹 AIKnowSys Cleanup', '✨');
  if (dryRun) {
    log.cyan('🔍 DRY RUN - no changes will be made\n');
  }

  // Archive old sessions
  log.cyan('📅 Archiving old sessions...');
  const sessionsResult = await archiveSessions({
    dir,
    threshold,
    dryRun,
    _silent: true
  });

  const count = dryRun ? sessionsResult.dryRun || 0 : sessionsResult.archived;
  if (count > 0) {
    log.success(`✓ ${dryRun ? 'Would archive' : 'Archived'} ${count} sessions`);
  } else {
    log.dim('  No old sessions to archive');
  }

  // Archive completed plans
  log.cyan('\n📋 Archiving completed plans...');
  const plansResult = await archivePlans({
    dir,
    threshold,
    dryRun,
    _silent: true
  });

  const planCount = dryRun ? plansResult.dryRun || 0 : plansResult.archived;
  if (planCount > 0) {
    log.success(`✓ ${dryRun ? 'Would archive' : 'Archived'} ${planCount} plans`);
  } else {
    log.dim('  No completed plans to archive');
  }

  // Remove temp files
  log.cyan('\n🗑️  Removing temporary files...');
  const tempPatterns: RegExp[] = [
    /^test-.*\.(js|json|txt|md)$/,
    /^debug-.*\.(js|json|txt|log)$/,
    /^temp-.*$/,
    /.*\.tmp$/
  ];

  let tempFilesRemoved = 0;

  try {
    const files = await fs.readdir(targetDir);

    for (const file of files) {
      const isTemp = tempPatterns.some(pattern => pattern.test(file));

      if (isTemp) {
        if (dryRun) {
          log.dim(`  Would remove: ${file}`);
          tempFilesRemoved++;
        } else {
          const filePath = path.join(targetDir, file);
          const stats = await fs.stat(filePath);

          if (stats.isFile()) {
            await fs.unlink(filePath);
            log.dim(`  ✓ Removed ${file}`);
            tempFilesRemoved++;
          }
        }
      }
    }

    if (tempFilesRemoved > 0) {
      log.success(`✓ ${dryRun ? 'Would remove' : 'Removed'} ${tempFilesRemoved} temp files`);
    } else {
      log.dim('  No temp files to remove');
    }
  } catch {
    log.dim('  Could not scan for temp files');
  }

  // Summary
  log.header('\n📊 Cleanup Summary', '✨');
  log.info(`Sessions: ${dryRun ? sessionsResult.dryRun || 0 : sessionsResult.archived} archived, ${sessionsResult.kept} kept`);
  log.info(`Plans: ${dryRun ? plansResult.dryRun || 0 : plansResult.archived} archived, ${plansResult.kept} kept`);
  log.info(`Temp files: ${tempFilesRemoved} ${dryRun ? 'would be ' : ''}removed`);

  if (dryRun) {
    log.cyan('\n💡 Run without --dry-run to apply changes');
  }

  return {
    sessionsArchived: dryRun ? 0 : sessionsResult.archived,
    plansArchived: dryRun ? 0 : plansResult.archived,
    tempFilesRemoved: dryRun ? 0 : tempFilesRemoved,
    dryRun: dryRun ? {
      sessions: sessionsResult.dryRun || 0,
      plans: plansResult.dryRun || 0,
      tempFiles: tempFilesRemoved
    } : undefined
  };
}
