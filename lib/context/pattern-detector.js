/**
 * Pattern Detector - Find recurring patterns in session history
 * Analyzes session files to detect error patterns worth documenting
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Load recent session files
 * @param {string} targetDir - Project root directory
 * @param {number} daysBack - How many days back to look
 * @returns {Promise<Array>} Array of session objects with content and date
 */
export async function loadRecentSessions(targetDir, daysBack = 30) {
  const sessionsDir = path.join(targetDir, '.aiknowsys', 'sessions');
  
  try {
    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files.filter(f => f.endsWith('.md'));
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const sessions = [];
    
    for (const file of sessionFiles) {
      const filePath = path.join(sessionsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract date from filename (YYYY-MM-DD-session.md pattern)
      const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const fileDate = new Date(dateMatch[1]);
        
        if (fileDate >= cutoffDate) {
          sessions.push({
            filename: file,
            content,
            date: fileDate.toISOString().split('T')[0],
          });
        }
      } else {
        // No date in filename, include it anyway
        sessions.push({
          filename: file,
          content,
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
    
    return sessions;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // No sessions directory yet
    }
    throw error;
  }
}

/**
 * Extract error patterns from session history
 * @param {Array} sessions - Array of session objects
 * @param {Object} options - Optional configuration
 * @param {RegExp} options.pattern - Pattern to match learning sections (default: /\*\*Key Learning\*?\*?:?\s*(.+)/gi)
 * @returns {Array} Array of detected patterns with frequency
 */
export function extractErrorPatterns(sessions, options = {}) {
  const { pattern = /\*\*Key Learning\*?\*?:?\s*(.+)/gi } = options;
  const patternMap = new Map();
  
  for (const session of sessions) {
    // Look for "Key Learning" sections (note: ** only at start, not end)
    const learningMatches = session.content.matchAll(pattern);
    
    for (const match of learningMatches) {
      const learning = match[1].trim();
      
      if (!learning) continue;
      
      // Extract significant keywords (4+ chars, excluding common words)
      const commonWords = ['this', 'that', 'with', 'from', 'were', 'been', 'have', 'will', 'when', 'should', 'would', 'could'];
      const words = learning.toLowerCase()
        .split(/\W+/)
        .filter(w => w.length >= 4 && !commonWords.includes(w));
      
      if (words.length === 0) continue;
      
      // Use most significant words as keywords (helps group similar errors)
      const keywords = [...new Set(words.slice(0, 5))]; // Top 5 unique words
      
      // Try to find existing similar pattern using Jaccard similarity
      let existingKey = null;
      let bestSimilarity = 0;
      
      for (const [key, pattern] of patternMap) {
        // Calculate Jaccard similarity: |intersection| / |union|
        const intersection = keywords.filter(k => pattern.keywords.includes(k));
        const union = new Set([...keywords, ...pattern.keywords]);
        const similarity = union.size > 0 ? intersection.length / union.size : 0;
        
        // Use 40% threshold, track best match
        if (similarity >= 0.4 && similarity > bestSimilarity) {
          existingKey = key;
          bestSimilarity = similarity;
        }
      }
      
      if (existingKey) {
        // Add to existing pattern
        const pattern = patternMap.get(existingKey);
        pattern.frequency++;
        pattern.lastSeen = session.date > pattern.lastSeen ? session.date : pattern.lastSeen;
        pattern.examples.push(learning);
        
        // Merge unique keywords
        for (const kw of keywords) {
          if (!pattern.keywords.includes(kw)) {
            pattern.keywords.push(kw);
          }
        }
      } else {
        // Create new pattern
        const patternKey = keywords.slice(0, 3).join(' ');
        patternMap.set(patternKey, {
          error: learning,
          keywords,
          frequency: 1,
          lastSeen: session.date,
          firstSeen: session.date,
          examples: [learning],
        });
      }
    }
  }
  
  return Array.from(patternMap.values());
}

/**
 * Detect patterns that occur frequently enough to document
 * @param {string} targetDir - Project root directory
 * @param {Object} options - Optional configuration
 * @param {number} options.threshold - Minimum frequency to be considered (default: 3)
 * @param {RegExp} options.pattern - Pattern to match learning sections
 * @returns {Promise<Array>} Patterns worth documenting
 */
export async function detectPatterns(targetDir, options = {}) {
  const { threshold = 3, pattern } = options;
  const sessions = await loadRecentSessions(targetDir, 30);
  const allPatterns = extractErrorPatterns(sessions, { pattern });
  
  // Filter to high-frequency patterns
  const documentWorthyPatterns = allPatterns
    .filter(p => p.frequency >= threshold)
    .map(p => ({
      ...p,
      shouldDocument: true,
      commonResolution: p.examples[0], // Use first example as resolution
    }));
  
  return documentWorthyPatterns;
}
