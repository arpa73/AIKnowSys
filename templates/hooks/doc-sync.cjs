/**
 * Documentation Sync Hook
 * 
 * Tracks code-to-documentation relationships and alerts when docs become stale.
 * Runs at sessionStart to check documentation freshness.
 * 
 * @param {Object} data - Session data from VSCode
 */

const fs = require('fs');
const path = require('path');

const STALENESS_THRESHOLD_DAYS = 30; // Warn if doc not updated in 30 days

// Map of code files to their related documentation
const CODE_TO_DOC = {
  'lib/commands/init.js': ['README.md', 'SETUP_GUIDE.md'],
  'lib/commands/scan.js': ['docs/customization-guide.md'],
  'lib/commands/migrate.js': ['docs/migration-guide.md'],
  'lib/commands/compress-essentials.js': ['docs/essentials-compression-guide.md'],
  'lib/commands/install-agents.js': ['README.md', '.github/agents/README.md'],
  'lib/commands/install-skills.js': ['README.md', '.github/skills/README.md'],
  'templates/CODEBASE_ESSENTIALS.template.md': ['SETUP_GUIDE.md'],
  'lib/logger.js': ['.aiknowsys/learned/logger-pattern.md']
};

module.exports = async function docSync(data) {
  try {
    const workspaceRoot = process.cwd();
    const staleWarnings = [];

    // 1. Check for stale documentation
    for (const [codeFile, docFiles] of Object.entries(CODE_TO_DOC)) {
      const codeFilePath = path.join(workspaceRoot, codeFile);
      
      // Skip if code file doesn't exist (might be optional)
      if (!fileExists(codeFilePath)) {
        continue;
      }

      const codeFileAge = getFileAgeDays(codeFilePath);
      
      for (const docFile of docFiles) {
        const docFilePath = path.join(workspaceRoot, docFile);
        
        // Skip if doc file doesn't exist (might be optional)
        if (!fileExists(docFilePath)) {
          continue;
        }

        const docFileAge = getFileAgeDays(docFilePath);
        
        // Check if doc is stale
        if (docFileAge > STALENESS_THRESHOLD_DAYS) {
          staleWarnings.push({
            doc: docFile,
            age: docFileAge,
            relatedCode: codeFile
          });
        }
        
        // Check if code is newer than doc by significant margin
        const ageDiff = docFileAge - codeFileAge;
        if (ageDiff > 7 && codeFileAge < 14) { // Code changed recently, doc didn't
          staleWarnings.push({
            doc: docFile,
            age: docFileAge,
            relatedCode: codeFile,
            reason: 'Code changed recently but doc not updated'
          });
        }
      }
    }

    // 2. Display warnings (limit to 5 to avoid spam)
    if (staleWarnings.length > 0) {
      console.error('[Hook] 📚 Documentation Sync Alert');
      
      const uniqueWarnings = removeDuplicates(staleWarnings);
      const displayWarnings = uniqueWarnings.slice(0, 5);
      
      for (const warning of displayWarnings) {
        if (warning.reason) {
          console.error(`[Hook] ⚠️  ${warning.doc} - ${warning.reason}`);
        } else {
          console.error(`[Hook] ⚠️  ${warning.doc} not updated in ${warning.age} days`);
        }
      }
      
      if (uniqueWarnings.length > 5) {
        console.error(`[Hook] ... and ${uniqueWarnings.length - 5} more`);
      }
      
      console.error('[Hook] Consider updating documentation to match recent code changes.');
    }

  } catch (error) {
    // Fail silently - don't interrupt session workflow
  }
};

/**
 * Check if file exists
 * @param {string} filePath - File path
 * @returns {boolean} True if exists
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file age in days
 * @param {string} filePath - File path
 * @returns {number} Age in days
 */
function getFileAgeDays(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const ageMs = Date.now() - stats.mtime.getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Remove duplicate warnings (same doc file)
 * @param {Array} warnings - Warning objects
 * @returns {Array} Unique warnings
 */
function removeDuplicates(warnings) {
  const seen = new Set();
  return warnings.filter(w => {
    if (seen.has(w.doc)) {
      return false;
    }
    seen.add(w.doc);
    return true;
  });
}
