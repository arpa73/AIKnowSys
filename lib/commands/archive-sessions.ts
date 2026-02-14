import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '../logger.js';

/**
 * Archive result statistics
 */
export interface ArchiveResult {
  archived: number;
  kept: number;
  dryRun?: number;
}

/**
 * Options for archiving old session files
 */
export interface ArchiveSessionsOptions {
  dir?: string;
  threshold?: number;
  dryRun?: boolean;
  _silent?: boolean;
}

/**
 * Session file with modification time
 */
interface SessionFile {
  file: string;
  mtime: Date;
}

/**
 * Archive old session files to dated folders
 * @param options - Command options
 * @returns Archive results
 */
export async function archiveSessions(options: ArchiveSessionsOptions = {}): Promise<ArchiveResult> {
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
  } catch {
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
  
  const toArchive: SessionFile[] = [];
  const toKeep: string[] = [];
  
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
