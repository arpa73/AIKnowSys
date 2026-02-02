/**
 * Learn Command - Manage pattern learning
 * CLI commands for pattern extraction and learned skill creation
 */

import path from 'node:path';
import { createLogger } from '../logger.js';
import { getGitUsername } from '../utils/git-username.js';
import { detectPatterns } from '../context/pattern-detector.js';
import { createLearnedSkill } from '../context/skill-creator.js';
import { markPatternDocumented } from '../context/pattern-tracker.js';

/**
 * List detected patterns
 * @param {Object} options - Command options { dir, _silent }
 * @returns {Promise<Object>} Result with patterns array
 */
export async function listPatterns(options) {
  const targetDir = path.resolve(options.dir || '.');
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  try {
    log.header('Detected Patterns', '🔍');
    
    const patterns = await detectPatterns(targetDir, { threshold: 3 });
    
    if (patterns.length === 0) {
      log.warn('No patterns detected (need 3+ occurrences)');
      return { success: true, patterns: [] };
    }
    
    log.cyan(`\nFound ${patterns.length} patterns:\n`);
    
    for (const pattern of patterns) {
      log.white(`• ${pattern.error}`);
      log.white(`  Frequency: ${pattern.frequency} times`);
      log.white(`  Last seen: ${pattern.lastSeen}`);
    }
    
    return { success: true, patterns };
  } catch (error) {
    log.error(`Failed to list patterns: ${error.message}`);
    throw error;
  }
}

/**
 * Extract specific pattern to learned skill
 * @param {Object} options - Command options { dir, pattern, shared, _silent }
 * @returns {Promise<Object>} Result with skillPath
 */
export async function extractPattern(options) {
  const targetDir = path.resolve(options.dir || '.');
  const searchTerm = options.pattern;
  const shared = options.shared || false; // Default to personal (false)
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  try {
    log.header('Extract Pattern', '📚');
    
    // Get username for personal directory (unless --shared flag used)
    const username = shared ? null : getGitUsername();
    
    // Inform user where pattern will be saved
    if (!shared && !username) {
      log.warn('No git username found. Saving to learned/ directory (shared).');
    } else if (!shared) {
      log.cyan('💡 Saving to personal patterns (private). Use --shared to make it team-visible.');
    }
    
    // Find matching pattern
    const allPatterns = await detectPatterns(targetDir, { threshold: 1 }); // Lower threshold for manual extraction
    const pattern = allPatterns.find(p => 
      p.error.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    if (!pattern) {
      log.warn(`No pattern found matching "${searchTerm}"`);
      return { success: false, message: 'Pattern not found' };
    }
    
    // Create learned skill with directory options
    const result = await createLearnedSkill(pattern, targetDir, {
      shared: shared || !username, // Force shared if no username
      username
    });
    
    // Check if file already existed or was created
    const relPath = path.relative(targetDir, result.path);
    
    // Mark as documented in tracker
    await markPatternDocumented(targetDir, pattern.error);
    
    if (result.existed) {
      log.warn(`Skill already exists: ${relPath}`);
      return { success: true, skillPath: result.path, existed: true };
    } else {
      log.success(`Created learned skill: ${relPath}`);
      return { success: true, skillPath: result.path, created: true };
    }
  } catch (error) {
    log.error(`Failed to extract pattern: ${error.message}`);
    throw error;
  }
}

/**
 * Auto-create skills for all high-frequency patterns
 * @param {Object} options - Command options { dir, threshold, shared, _silent }
 * @returns {Promise<Object>} Result with created array
 */
export async function autoCreateSkills(options) {
  const targetDir = path.resolve(options.dir || '.');
  const threshold = options.threshold || 3;
  const shared = options.shared || false; // Default to personal
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  try {
    log.header('Auto-Create Skills', '🤖');
    
    // Get username for personal directory (unless --shared flag used)
    const username = shared ? null : getGitUsername();
    
    // Inform user where patterns will be saved
    if (!shared && !username) {
      log.warn('No git username found. Saving to learned/ directory (shared).');
    } else if (!shared) {
      log.cyan('💡 Saving to personal patterns (private). Use --shared to make them team-visible.');
    }
    
    const patterns = await detectPatterns(targetDir, { threshold });
    
    if (patterns.length === 0) {
      log.warn(`No patterns found with frequency >= ${threshold}`);
      return { success: true, created: [] };
    }
    
    const created = [];
    const skipped = [];
    
    for (const pattern of patterns) {
      const result = await createLearnedSkill(pattern, targetDir, {
        shared: shared || !username,
        username
      });
      await markPatternDocumented(targetDir, pattern.error);
      
      const relPath = path.relative(targetDir, result.path);
      
      if (result.existed) {
        log.white(`⊖ ${relPath} (already exists)`);
        skipped.push(result.path);
      } else {
        log.success(`Created: ${relPath}`);
        created.push(result.path);
      }
    }
    
    log.cyan(`\n✅ Created ${created.length} learned skills, skipped ${skipped.length} existing`);
    
    return { success: true, created, skipped };
  } catch (error) {
    log.error(`Failed to auto-create skills: ${error.message}`);
    throw error;
  }
}
