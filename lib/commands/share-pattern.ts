/**
 * Share Pattern Command - Move patterns from personal to learned directory
 * Enables reviewed sharing of personal patterns with the team
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createLogger } from '../logger.js';
// @ts-ignore - git-username.js not yet migrated to TypeScript
import { getGitUsername } from '../utils/git-username.js';

export interface SharePatternOptions {
  dir?: string;
  _silent?: boolean;
}

interface DuplicateInfo {
  duplicate: boolean;
  similar: boolean;
  file: string | null;
  overlap: number;
}

/**
 * Extract trigger words from pattern content
 * @param content - Pattern file content
 * @returns Array of trigger words
 */
function extractTriggerWords(content: string): string[] {
  const triggerMatch = content.match(/\*\*Trigger Words:\*\*\s*(.+)/i);
  if (!triggerMatch) return [];
  
  return triggerMatch[1]
    .split(',')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0);
}

/**
 * Calculate keyword overlap between two arrays
 * @param keywords1 - First set of keywords
 * @param keywords2 - Second set of keywords
 * @returns Overlap percentage (0-1)
 */
function calculateOverlap(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  const overlap = keywords1.filter(k => keywords2.includes(k));
  return overlap.length / Math.max(keywords1.length, keywords2.length);
}

/**
 * Find duplicate or similar patterns in learned directory
 * @param patternName - Pattern filename (without extension)
 * @param patternContent - Content of pattern to share
 * @param learnedDir - Path to learned directory
 * @returns Duplicate info { duplicate: boolean, similar: boolean, file: string, overlap: number }
 */
async function findDuplicates(patternName: string, patternContent: string, learnedDir: string): Promise<DuplicateInfo> {
  try {
    const files = await fs.readdir(learnedDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const newKeywords = extractTriggerWords(patternContent);
    const newBaseName = patternName.replace(/\.md$/, '').toLowerCase();
    
    for (const file of mdFiles) {
      const baseName = file.replace(/\.md$/, '').toLowerCase();
      
      // Exact filename match
      if (baseName === newBaseName) {
        return { duplicate: true, file, similar: false, overlap: 1.0 };
      }
      
      // Similar by keyword overlap (>50%)
      const existingContent = await fs.readFile(path.join(learnedDir, file), 'utf-8');
      const existingKeywords = extractTriggerWords(existingContent);
      
      const overlap = calculateOverlap(newKeywords, existingKeywords);
      if (overlap > 0.5) {
        return { duplicate: false, similar: true, file, overlap };
      }
    }
    
    return { duplicate: false, similar: false, file: null, overlap: 0 };
  } catch {
    // Directory doesn't exist or other error
    return { duplicate: false, similar: false, file: null, overlap: 0 };
  }
}

/**
 * Share a pattern from personal to learned directory
 * @param patternName - Name of pattern file (with or without .md)
 * @param options - Command options { dir, _silent }
 * @returns Result with success status
 */
export async function sharePattern(patternName: string, options: SharePatternOptions = {}): Promise<{ success: boolean; message?: string; sourcePath?: string; destPath?: string; similar?: boolean; similarFile?: string | null; file?: string }> {
  const targetDir = path.resolve(options.dir || '.');
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  try {
    log.header('Share Pattern', '🤝');
    
    // Get username
    const username = getGitUsername();
    if (!username) {
      log.error('No git username found. Cannot locate personal patterns.');
      log.cyan('💡 Tip: Patterns saved with --shared flag are already team-visible.');
      return { success: false, message: 'No git username' };
    }
    
    // Normalize pattern name
    const fileName = patternName.endsWith('.md') ? patternName : `${patternName}.md`;
    
    // Setup paths
    const personalDir = path.join(targetDir, '.aiknowsys', 'personal', username);
    const learnedDir = path.join(targetDir, '.aiknowsys', 'learned');
    const sourcePath = path.join(personalDir, fileName);
    const destPath = path.join(learnedDir, fileName);
    
    // Check if source exists
    try {
      await fs.access(sourcePath);
    } catch {
      log.error(`Pattern not found: ${fileName}`);
      log.cyan('💡 Available patterns: Run \'npx aiknowsys list-patterns\' to see your patterns');
      return { success: false, message: 'Pattern not found' };
    }
    
    // Read pattern content
    const patternContent = await fs.readFile(sourcePath, 'utf-8');
    
    // Check for duplicates
    const duplicateInfo = await findDuplicates(fileName, patternContent, learnedDir);
    
    if (duplicateInfo.duplicate) {
      const duplicateFile = duplicateInfo.file || 'unknown';
      log.warn(`⚠️  Duplicate pattern exists: ${duplicateFile}`);
      log.cyan('The same pattern name already exists in learned/');
      log.cyan('💡 Options:');
      log.cyan('   1. Rename your pattern and try again');
      log.cyan('   2. Manually merge the patterns');
      log.cyan('   3. Delete the existing pattern first');
      return { success: false, message: 'Duplicate pattern', file: duplicateFile };
    }
    
    if (duplicateInfo.similar) {
      log.warn(`⚠️  Similar pattern found: ${duplicateInfo.file} (${Math.round(duplicateInfo.overlap * 100)}% overlap)`);
      log.cyan('A similar pattern already exists in learned/');
      log.cyan('💡 Consider reviewing both patterns before sharing');
      // Continue with sharing despite similarity (user can decide)
    }
    
    // Ensure learned directory exists
    await fs.mkdir(learnedDir, { recursive: true });
    
    // Move pattern (atomic operation)
    await fs.rename(sourcePath, destPath);
    
    log.success(`✅ Pattern shared: ${fileName}`);
    log.cyan(`   From: .aiknowsys/personal/${username}/${fileName}`);
    log.cyan(`   To:   .aiknowsys/learned/${fileName}`);
    log.white('');
    log.cyan('💡 Next steps:');
    log.cyan('   1. git add .aiknowsys/learned/');
    log.cyan('   2. git commit -m "Add learned pattern: ' + fileName.replace('.md', '') + '"');
    log.cyan('   3. git push (teammates will see the pattern after pulling)');
    
    return { 
      success: true, 
      sourcePath, 
      destPath,
      similar: duplicateInfo.similar,
      similarFile: duplicateInfo.file
    };
  } catch (error) {
    log.error(`Failed to share pattern: ${(error as Error).message}`);
    throw error;
  }
}
