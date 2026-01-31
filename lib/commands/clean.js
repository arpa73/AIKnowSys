import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../logger.js';
import { archiveSessions } from './archive-sessions.js';
import { archivePlans } from './archive-plans.js';

/**
 * All-in-one cleanup: archive sessions, plans, and remove temp files
 * @param {Object} options - Command options
 * @param {string} options.dir - Target directory (default: process.cwd())
 * @param {boolean} options.dryRun - Preview mode (default: false)
 * @param {boolean} options._silent - Suppress output for testing
 * @returns {Promise<{sessions: Object, plans: Object, tempFiles: number, dryRun?: number}>} Cleanup results
 */
export async function clean(options = {}) {
  const targetDir = path.resolve(options.dir || process.cwd());
  const dryRun = options.dryRun || false;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.header('Clean Workspace', '🧹');
  
  // Archive sessions (30 days)
  log.cyan('\n📦 Archiving old sessions...');
  const sessionsResult = await archiveSessions({
    dir: targetDir,
    threshold: 30,
    dryRun,
    _silent: true
  });
  
  if (sessionsResult.archived > 0 || sessionsResult.dryRun > 0) {
    const count = dryRun ? sessionsResult.dryRun : sessionsResult.archived;
    log.success(`✓ ${dryRun ? 'Would archive' : 'Archived'} ${count} sessions`);
  } else {
    log.dim('  No old sessions to archive');
  }
  
  // Archive plans (7 days)
  log.cyan('\n📦 Archiving completed plans...');
  const plansResult = await archivePlans({
    dir: targetDir,
    threshold: 7,
    dryRun,
    _silent: true
  });
  
  if (plansResult.archived > 0 || plansResult.dryRun > 0) {
    const count = dryRun ? plansResult.dryRun : plansResult.archived;
    log.success(`✓ ${dryRun ? 'Would archive' : 'Archived'} ${count} plans`);
  } else {
    log.dim('  No completed plans to archive');
  }
  
  // Remove temp files
  log.cyan('\n🗑️  Removing temporary files...');
  const tempPatterns = [
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
  } catch (err) {
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
