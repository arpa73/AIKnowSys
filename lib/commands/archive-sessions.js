import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../logger.js';

/**
 * Archive old session files to dated folders
 * @param {Object} options - Command options
 * @param {string} options.dir - Target directory (default: process.cwd())
 * @param {number} options.threshold - Days old to archive (default: 30)
 * @param {boolean} options.dryRun - Preview mode (default: false)
 * @param {boolean} options._silent - Suppress output for testing
 * @returns {Promise<{archived: number, kept: number, dryRun?: number}>} Archive results
 */
export async function archiveSessions(options = {}) {
  const targetDir = path.resolve(options.dir || process.cwd());
  const threshold = options.threshold || 30;
  const dryRun = options.dryRun || false;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.header('Archive Sessions', '📦');
  
  const sessionsDir = path.join(targetDir, '.aiknowsys', 'sessions');
  const archiveDir = path.join(targetDir, '.aiknowsys', 'archive', 'sessions');
  
  // Check if sessions directory exists
  try {
    await fs.access(sessionsDir);
  } catch (_err) {
    log.info('No sessions directory found');
    return { archived: 0, kept: 0 };
  }
  
  // Find all session files
  const files = await fs.readdir(sessionsDir);
  const sessionFiles = files.filter(f => 
    /^\d{4}-\d{2}-\d{2}-session\.md$/.test(f)
  );
  
  if (sessionFiles.length === 0) {
    log.info('No session files found');
    return { archived: 0, kept: 0 };
  }
  
  // Calculate threshold date
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - threshold);
  
  const toArchive = [];
  const toKeep = [];
  
  for (const file of sessionFiles) {
    const filePath = path.join(sessionsDir, file);
    const stats = await fs.stat(filePath);
    
    if (stats.mtime < thresholdDate) {
      toArchive.push({ file, mtime: stats.mtime });
    } else {
      toKeep.push(file);
    }
  }
  
  if (toArchive.length === 0) {
    log.success(`No sessions older than ${threshold} days`);
    return { archived: 0, kept: toKeep.length };
  }
  
  // Display summary
  log.info(`Found ${toArchive.length} sessions to archive (>${threshold} days old)`);
  log.info(`Keeping ${toKeep.length} recent sessions`);
  
  if (dryRun) {
    log.cyan('\n📋 Dry run - would archive:');
    for (const { file, mtime } of toArchive) {
      const age = Math.floor((Date.now() - mtime.getTime()) / (1000 * 60 * 60 * 24));
      log.dim(`  ${file} (${age} days old)`);
    }
    return { archived: 0, kept: toKeep.length, dryRun: toArchive.length };
  }
  
  // Archive files
  let archived = 0;
  for (const { file, mtime } of toArchive) {
    const year = mtime.getFullYear();
    const month = String(mtime.getMonth() + 1).padStart(2, '0');
    
    const archiveYearMonth = path.join(archiveDir, String(year), month);
    await fs.mkdir(archiveYearMonth, { recursive: true });
    
    const srcPath = path.join(sessionsDir, file);
    const dstPath = path.join(archiveYearMonth, file);
    
    await fs.rename(srcPath, dstPath);
    archived++;
    
    log.dim(`  ✓ ${file} → archive/${year}/${month}/`);
  }
  
  log.success(`\n✅ Archived ${archived} sessions`);
  log.cyan('📁 Archive location: .aiknowsys/archive/sessions/');
  
  return { archived, kept: toKeep.length };
}
