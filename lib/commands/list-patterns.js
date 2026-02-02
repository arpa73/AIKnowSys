/**
 * List Patterns Command - Display personal and team learned patterns
 * Shows categorized lists for pattern discovery and sharing reminders
 */

import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../logger.js';
import { getGitUsername } from '../utils/git-username.js';

/**
 * Extract trigger words from pattern content
 * @param {string} content - Pattern file content
 * @returns {string[]} Array of trigger words
 */
function extractTriggerWords(content) {
  const triggerMatch = content.match(/\*\*Trigger Words:\*\*\s*(.+)/i);
  if (!triggerMatch) return [];
  
  return triggerMatch[1]
    .split(',')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0);
}

/**
 * Read patterns from a directory
 * @param {string} dirPath - Directory to scan
 * @returns {Promise<Array>} Array of pattern objects { name, keywords }
 */
async function readPatternsFromDir(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const patterns = [];
    for (const file of mdFiles) {
      const filePath = path.join(dirPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const keywords = extractTriggerWords(content);
      
      patterns.push({
        name: file,
        keywords
      });
    }
    
    return patterns;
  } catch (_error) {
    // Directory doesn't exist or other error
    return [];
  }
}

/**
 * List all learned patterns (personal and team)
 * @param {Object} options - Command options
 * @param {string} [options.dir] - Target directory (default: current)
 * @param {boolean} [options._silent] - Silent mode for testing
 * @param {string} [options._username] - Override username (for testing)
 * @returns {Promise<Object>} Result object with personal and learned patterns
 */
export async function listPatterns(options = {}) {
  const targetDir = path.resolve(options.dir || '.');
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  // Get username (allow override for testing)
  const username = options._username !== undefined ? options._username : getGitUsername();
  
  if (!username) {
    log.error('❌ No git username found. Cannot locate personal patterns.');
    log.cyan('💡 Configure git: git config user.name "Your Name"');
    return { 
      success: false, 
      message: 'No git username found',
      personal: [],
      learned: []
    };
  }
  
  // Setup paths
  const personalDir = path.join(targetDir, '.aiknowsys', 'personal', username);
  const learnedDir = path.join(targetDir, '.aiknowsys', 'learned');
  
  // Read patterns from both directories
  const personalPatterns = await readPatternsFromDir(personalDir);
  const learnedPatterns = await readPatternsFromDir(learnedDir);
  
  // Display results
  log.cyan('📚 Learned Patterns');
  log.white('');
  
  if (personalPatterns.length === 0 && learnedPatterns.length === 0) {
    log.cyan('No patterns found yet.');
    log.white('');
    log.cyan('💡 AI agents create patterns automatically as they learn from your codebase.');
    log.cyan('   Use "npx aiknowsys learn" to analyze and extract patterns.');
    
    return {
      success: true,
      message: 'No patterns found',
      personal: [],
      learned: []
    };
  }
  
  // Display personal patterns
  if (personalPatterns.length > 0) {
    log.cyan(`Personal (${personalPatterns.length} pattern${personalPatterns.length === 1 ? '' : 's'} - not shared):`);
    for (const pattern of personalPatterns) {
      const keywordDisplay = pattern.keywords.length > 0 
        ? ` [${pattern.keywords.slice(0, 3).join(', ')}${pattern.keywords.length > 3 ? '...' : ''}]`
        : '';
      log.white(`  • ${pattern.name}${keywordDisplay}`);
    }
    log.white('');
  } else {
    log.cyan('Personal (0 patterns)');
    log.white('');
  }
  
  // Display team patterns
  if (learnedPatterns.length > 0) {
    log.green(`Team (${learnedPatterns.length} pattern${learnedPatterns.length === 1 ? '' : 's'} - shared):`);
    for (const pattern of learnedPatterns) {
      const keywordDisplay = pattern.keywords.length > 0 
        ? ` [${pattern.keywords.slice(0, 3).join(', ')}${pattern.keywords.length > 3 ? '...' : ''}]`
        : '';
      log.white(`  • ${pattern.name}${keywordDisplay}`);
    }
    log.white('');
  } else {
    log.green('Team (0 patterns)');
    log.white('');
  }
  
  // Sharing reminder
  if (personalPatterns.length > 0) {
    log.cyan('💡 Share valuable patterns with your team:');
    log.cyan('   npx aiknowsys share-pattern <name>');
    log.white('');
  }
  
  return {
    success: true,
    personal: personalPatterns,
    learned: learnedPatterns
  };
}
