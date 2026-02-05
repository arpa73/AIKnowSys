/**
 * Pattern Tracker - Track pattern occurrences over time
 * Maintains pattern-history.json database
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Pattern entry in history
 */
export interface PatternEntry {
  id: string;
  error: string;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  documented: boolean;
  resolutions: string[];
}

/**
 * Pattern history data structure
 */
export interface PatternHistory {
  patterns: PatternEntry[];
}

/**
 * Input pattern for tracking
 */
export interface PatternInput {
  error: string;
  resolution?: string;
}

/**
 * Get pattern history file path
 * @param targetDir - Project root directory
 * @returns Path to pattern-history.json
 */
function getHistoryPath(targetDir: string): string {
  return path.join(targetDir, '.aiknowsys', 'pattern-history.json');
}

/**
 * Load pattern history from file
 * @param targetDir - Project root directory
 * @returns Pattern history data
 */
async function loadHistory(targetDir: string): Promise<PatternHistory> {
  const historyPath = getHistoryPath(targetDir);
  
  try {
    const content = await fs.readFile(historyPath, 'utf-8');
    return JSON.parse(content);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { patterns: [] };
    }
    throw error;
  }
}

/**
 * Save pattern history to file
 * @param targetDir - Project root directory
 * @param data - Pattern history data
 */
async function saveHistory(targetDir: string, data: PatternHistory): Promise<void> {
  const historyPath = getHistoryPath(targetDir);
  await fs.mkdir(path.dirname(historyPath), { recursive: true });
  await fs.writeFile(historyPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Initialize pattern tracking (create file if not exists)
 * @param targetDir - Project root directory
 */
export async function initPatternTracking(targetDir: string): Promise<void> {
  const history = await loadHistory(targetDir);
  await saveHistory(targetDir, history);
}

/**
 * Track a pattern occurrence
 * @param targetDir - Project root directory
 * @param pattern - Pattern to track { error, resolution }
 */
export async function trackPattern(targetDir: string, pattern: PatternInput): Promise<void> {
  const history = await loadHistory(targetDir);
  
  // Find existing pattern
  const existing = history.patterns.find(p => p.error === pattern.error);
  
  if (existing) {
    // Increment frequency
    existing.frequency++;
    existing.lastSeen = new Date().toISOString().split('T')[0];
    
    // Add resolution if new
    if (pattern.resolution && !existing.resolutions.includes(pattern.resolution)) {
      existing.resolutions.push(pattern.resolution);
    }
  } else {
    // Create new pattern entry
    const now = new Date().toISOString().split('T')[0];
    history.patterns.push({
      id: pattern.error.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      error: pattern.error,
      frequency: 1,
      firstSeen: now,
      lastSeen: now,
      documented: false,
      resolutions: pattern.resolution ? [pattern.resolution] : [],
    });
  }
  
  await saveHistory(targetDir, history);
}

/**
 * Mark a pattern as documented
 * @param targetDir - Project root directory
 * @param error - Error pattern to mark
 */
export async function markPatternDocumented(targetDir: string, error: string): Promise<void> {
  const history = await loadHistory(targetDir);
  
  const pattern = history.patterns.find(p => p.error === error);
  if (pattern) {
    pattern.documented = true;
    await saveHistory(targetDir, history);
  }
}

/**
 * Get all tracked patterns
 * @param targetDir - Project root directory
 * @returns Array of patterns
 */
export async function getPatterns(targetDir: string): Promise<PatternEntry[]> {
  const history = await loadHistory(targetDir);
  return history.patterns;
}
