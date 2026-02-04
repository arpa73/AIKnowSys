import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../logger.js';

const DEFAULT_ARCHIVE_THRESHOLD_DAYS = 7;

/**
 * Archive completed plans to archive folder
 * @param {Object} options - Command options
 * @param {string} options.dir - Target directory (default: process.cwd())
 * @param {number} options.threshold - Days since completion to archive (default: 7)
 * @param {string} options.status - Status to archive (default: 'COMPLETE')
 * @param {boolean} options.dryRun - Preview mode (default: false)
 * @param {boolean} options._silent - Suppress output for testing
 * @returns {Promise<{archived: number, kept: number, dryRun?: number, updated?: number}>} Archive results
 */
export async function archivePlans(options = {}) {
  const targetDir = path.resolve(options.dir || process.cwd());
  const threshold = options.threshold ?? DEFAULT_ARCHIVE_THRESHOLD_DAYS;
  const statusFilter = options.status ?? 'COMPLETE'; // Consistent use of ?? for all default params
  const dryRun = options.dryRun || false;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.header('Archive Plans', '📦');
  
  const aiknowsysDir = path.join(targetDir, '.aiknowsys');
  const plansDir = path.join(aiknowsysDir, 'plans');
  const archiveDir = path.join(aiknowsysDir, 'archive', 'plans');
  
  // Check for multi-dev structure (v0.9.0+)
  if (!await fs.access(plansDir).then(() => true).catch(() => false)) {
    log.error('No plans/ directory found');
    log.info('Run: npx aiknowsys migrate-to-multidev');
    return { archived: 0, kept: 0 };
  }
  
  // Read all plan pointer files (active-*.md)
  const planPointerFiles = await fs.readdir(plansDir);
  const activePointers = planPointerFiles.filter(f => f.startsWith('active-') && f.endsWith('.md'));
  
  if (activePointers.length === 0) {
    log.info('No active plan pointers found in plans/');
    return { archived: 0, kept: 0 };
  }
  
  // Parse each pointer file for completed plans
  const plans = [];
  
  for (const pointerFile of activePointers) {
    const pointerPath = path.join(plansDir, pointerFile);
    const content = await fs.readFile(pointerPath, 'utf-8');
    
    // Extract plan entries from pointer's plan table
    const planTableRegex = /\| \[([^\]]+)\]\(([^)]+)\) \| (✅ COMPLETE|🎯 ACTIVE|🔄 PAUSED|📋 PLANNED|❌ CANCELLED)/g;
    let match;
    
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
  
  const toArchive = [];
  const toKeep = [];
  
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
    } catch (_err) {
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
  const pointerUpdates = {}; // Track updates per pointer file
  
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
