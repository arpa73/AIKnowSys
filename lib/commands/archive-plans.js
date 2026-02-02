import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../logger.js';

/**
 * Archive completed plans to archive folder
 * @param {Object} options - Command options
 * @param {string} options.dir - Target directory (default: process.cwd())
 * @param {number} options.threshold - Days since completion to archive (default: 7)
 * @param {boolean} options.dryRun - Preview mode (default: false)
 * @param {boolean} options._silent - Suppress output for testing
 * @returns {Promise<{archived: number, kept: number, dryRun?: number, updated?: number}>} Archive results
 */
export async function archivePlans(options = {}) {
  const targetDir = path.resolve(options.dir || process.cwd());
  const threshold = options.threshold || 7;
  const dryRun = options.dryRun || false;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.header('Archive Plans', '📦');
  
  const aiknowsysDir = path.join(targetDir, '.aiknowsys');
  const currentPlanPath = path.join(aiknowsysDir, 'CURRENT_PLAN.md');
  const archiveDir = path.join(aiknowsysDir, 'archive', 'plans');
  
  // Read CURRENT_PLAN.md to find completed plans
  let currentPlanContent;
  try {
    currentPlanContent = await fs.readFile(currentPlanPath, 'utf-8');
  } catch (_err) {
    log.error('CURRENT_PLAN.md not found');
    return { archived: 0, kept: 0 };
  }
  
  // Parse plan table
  const planTableRegex = /\| \[([^\]]+)\]\(([^)]+)\) \| (✅ COMPLETE|🎯 ACTIVE|🔄 PAUSED|📋 PLANNED|❌ CANCELLED)/g;
  const plans = [];
  let match;
  
  while ((match = planTableRegex.exec(currentPlanContent)) !== null) {
    plans.push({
      name: match[1],
      file: match[2],
      status: match[3]
    });
  }
  
  if (plans.length === 0) {
    log.info('No plans found in CURRENT_PLAN.md');
    return { archived: 0, kept: 0 };
  }
  
  // Find completed plans to archive
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - threshold);
  
  const toArchive = [];
  const toKeep = [];
  
  for (const plan of plans) {
    if (!plan.status.includes('COMPLETE')) {
      toKeep.push(plan);
      continue;
    }
    
    const planPath = path.join(aiknowsysDir, plan.file);
    
    try {
      const stats = await fs.stat(planPath);
      
      // Check last modified time
      if (stats.mtime < thresholdDate) {
        toArchive.push({ ...plan, mtime: stats.mtime, path: planPath });
      } else {
        toKeep.push(plan);
      }
    } catch (_err) {
      // Plan file doesn't exist, skip
      log.warn(`Plan file not found: ${plan.file}`);
    }
  }
  
  if (toArchive.length === 0) {
    log.success(`No completed plans older than ${threshold} days`);
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
  const updates = [];
  
  for (const plan of toArchive) {
    const fileName = path.basename(plan.file);
    const dstPath = path.join(archiveDir, fileName);
    
    await fs.rename(plan.path, dstPath);
    archived++;
    
    log.dim(`  ✓ ${plan.name} → archive/plans/`);
    
    // Track update for CURRENT_PLAN.md
    updates.push({
      oldPath: plan.file,
      newPath: `archive/plans/${fileName}`
    });
  }
  
  // Update CURRENT_PLAN.md with archive links
  let updatedContent = currentPlanContent;
  for (const update of updates) {
    updatedContent = updatedContent.replace(
      new RegExp(`\\(${update.oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
      `(${update.newPath})`
    );
  }
  
  await fs.writeFile(currentPlanPath, updatedContent, 'utf-8');
  
  log.success(`\n✅ Archived ${archived} plans`);
  log.cyan('📁 Archive location: .aiknowsys/archive/plans/');
  log.info('✓ Updated CURRENT_PLAN.md with archive links');
  
  return { archived, kept: toKeep.length };
}
