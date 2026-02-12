/**
 * File scanner for .aiknowsys directory
 * Discovers sessions, plans, and learned patterns
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface FileInfo {
  /** Original filename */
  filename: string;
  
  /** Absolute path to file */
  absolutePath: string;
  
  /** Path relative to .aiknowsys root */
  relativePath: string;
  
  /** File type category */
  type: 'session' | 'plan' | 'learned';
  
  /** File size in bytes */
  size: number;
}

export interface ScanResult {
  /** Session files found */
  sessions: FileInfo[];
  
  /** Plan files found (PLAN_*.md and active-*.md) */
  plans: FileInfo[];
  
  /** Learned pattern files */
  learned: FileInfo[];
  
  /** Total files discovered */
  total: number;
  
  /** Error messages encountered during scan */
  errors: string[];
}

/**
 * Scans .aiknowsys directory for markdown files
 */
export class FileScanner {
  /**
   * Scan a directory for .aiknowsys content
   * @param targetDir - Directory to scan (should contain .aiknowsys/ subdirectory)
   * @returns Categorized file information
   */
  async scanDirectory(targetDir: string): Promise<ScanResult> {
    const result: ScanResult = {
      sessions: [],
      plans: [],
      learned: [],
      total: 0,
      errors: []
    };
    
    const aiknowsysDir = path.join(path.resolve(targetDir), '.aiknowsys');
    
    // Check if .aiknowsys directory exists
    try {
      await fs.access(aiknowsysDir);
    } catch (error) {
      // .aiknowsys doesn't exist - return empty result
      return result;
    }
    
    // Scan sessions/
    const sessionsDir = path.join(aiknowsysDir, 'sessions');
    try {
      await fs.access(sessionsDir);
      const sessionFiles = await this.scanMarkdownFiles(sessionsDir, aiknowsysDir);
      result.sessions = sessionFiles.map(f => ({ ...f, type: 'session' as const }));
    } catch (error) {
      // sessions/ doesn't exist - continue
    }
    
    // Scan for PLAN_*.md files in root
    try {
      const files = await fs.readdir(aiknowsysDir);
      for (const file of files) {
        if (file.startsWith('PLAN_') && file.endsWith('.md')) {
          const absolutePath = path.join(aiknowsysDir, file);
          const stats = await fs.stat(absolutePath);
          
          result.plans.push({
            filename: file,
            absolutePath,
            relativePath: file,
            type: 'plan',
            size: stats.size
          });
        }
      }
    } catch (error) {
      result.errors.push(`Error scanning plans: ${(error as Error).message}`);
    }
    
    // Scan plans/ directory for active-*.md pointers
    const plansDir = path.join(aiknowsysDir, 'plans');
    try {
      await fs.access(plansDir);
      const files = await fs.readdir(plansDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const absolutePath = path.join(plansDir, file);
          try {
            const stats = await fs.stat(absolutePath);
            result.plans.push({
              filename: file,
              absolutePath,
              relativePath: path.join('plans', file),
              type: 'plan',
              size: stats.size
            });
          } catch (error) {
            result.errors.push(`Error reading ${file}: ${(error as Error).message}`);
          }
        }
      }
    } catch (error) {
      // plans/ doesn't exist - continue
    }
    
    // Scan learned/ recursively
    const learnedDir = path.join(aiknowsysDir, 'learned');
    try {
      await fs.access(learnedDir);
      const learnedFiles = await this.scanMarkdownFilesRecursive(learnedDir, aiknowsysDir);
      result.learned = learnedFiles.map(f => ({ ...f, type: 'learned' as const }));
    } catch (error) {
      // learned/ doesn't exist - continue
    }
    
    result.total = result.sessions.length + result.plans.length + result.learned.length;
    
    return result;
  }
  
  /**
   * Scan a directory for markdown files (non-recursive)
   * @param dir - Directory to scan
   * @param aiknowsysRoot - Root .aiknowsys directory for relative paths
   * @returns File information
   */
  private async scanMarkdownFiles(dir: string, aiknowsysRoot: string): Promise<Omit<FileInfo, 'type'>[]> {
    const results: Omit<FileInfo, 'type'>[] = [];
    
    try {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const absolutePath = path.join(dir, file);
        
        try {
          const stats = await fs.stat(absolutePath);
          
          if (stats.isFile()) {
            results.push({
              filename: file,
              absolutePath,
              relativePath: path.relative(aiknowsysRoot, absolutePath),
              size: stats.size
            });
          }
        } catch (error) {
          // File read error - skip and continue
          continue;
        }
      }
    } catch (error) {
      // Directory read error - return what we have
    }
    
    return results;
  }
  
  /**
   * Scan a directory recursively for markdown files
   * @param dir - Directory to scan
   * @param aiknowsysRoot - Root .aiknowsys directory for relative paths
   * @returns File information
   */
  private async scanMarkdownFilesRecursive(dir: string, aiknowsysRoot: string): Promise<Omit<FileInfo, 'type'>[]> {
    const results: Omit<FileInfo, 'type'>[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recurse into subdirectories
          const subResults = await this.scanMarkdownFilesRecursive(fullPath, aiknowsysRoot);
          results.push(...subResults);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const stats = await fs.stat(fullPath);
            
            results.push({
              filename: entry.name,
              absolutePath: fullPath,
              relativePath: path.relative(aiknowsysRoot, fullPath),
              size: stats.size
            });
          } catch (error) {
            // File stat error - skip
            continue;
          }
        }
      }
    } catch (error) {
      // Directory read error - return what we have
    }
    
    return results;
  }
}
