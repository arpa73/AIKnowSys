#!/usr/bin/env node
/**
 * Validation Reminder Hook (Stop event)
 * 
 * Runs after AI finishes responding to remind about validation requirements.
 * Detects code changes without corresponding validation commands.
 * 
 * Non-blocking: Always exits with code 0
 * Timeout: Must complete within 2 seconds
 */

const fs = require('fs');
const path = require('path');

/**
 * Main hook execution
 */
async function main() {
  let input = '';
  
  // Read JSON input from stdin
  process.stdin.on('data', chunk => input += chunk.toString());
  
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input || '{}');
      
      // Load configuration
      const config = loadConfig();
      
      // Check if code files were edited
      const codeChanged = detectCodeChanges(data, config);
      
      // Check if validation was run
      const validationRun = detectValidation(data, config);
      
      // Warn if code changed but no validation
      if (codeChanged && !validationRun) {
        const commands = config.validationCommands || ['npm test'];
        console.error('[Hook] ⚠️  Validation check:');
        console.error('[Hook] Code changes detected but no validation commands found');
        console.error(`[Hook] Required: ${commands.join(' OR ')}`);
        console.error('[Hook] See: CODEBASE_ESSENTIALS.md Section 2');
      }
      
      process.exit(0); // Always non-blocking
    } catch (err) {
      // Fail silently - don't block workflow
      process.exit(0);
    }
  });
}

/**
 * Load hook configuration
 */
function loadConfig() {
  const configPath = path.join('.github', 'hooks', 'config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return mergeWithDefaults(config);
    } catch (err) {
      // Fall back to defaults
    }
  }
  
  return getDefaultConfig();
}

/**
 * Get default configuration
 */
function getDefaultConfig() {
  return {
    filePatterns: {
      implementation: ['lib/**/*.js', 'bin/**/*.js', 'templates/**/*.js'],
      tests: ['test/**/*.js'],
      exclude: ['**/node_modules/**', '**/.git/**']
    },
    validationCommands: ['npm test', 'npm run test', 'node --test']
  };
}

/**
 * Merge user config with defaults
 */
function mergeWithDefaults(userConfig) {
  const defaults = getDefaultConfig();
  
  return {
    ...defaults,
    ...userConfig,
    filePatterns: {
      ...defaults.filePatterns,
      ...(userConfig.filePatterns || {})
    },
    validationCommands: userConfig.validationCommands || defaults.validationCommands
  };
}

/**
 * Detect if code files were edited in conversation
 * @param {object} data - Hook input data
 * @param {object} config - Hook configuration
 * @returns {boolean} True if implementation files were edited
 */
function detectCodeChanges(data, config) {
  if (!data.conversation || !Array.isArray(data.conversation)) {
    return false;
  }
  
  const implPatterns = config.filePatterns?.implementation || ['lib/**/*.js'];
  const testPatterns = config.filePatterns?.tests || ['test/**/*.js'];
  
  for (const item of data.conversation) {
    if ((item.tool === 'Edit' || item.tool === 'Write') && item.tool_input?.file_path) {
      const filePath = item.tool_input.file_path;
      
      // Check if it's an implementation file (not a test)
      const isImpl = implPatterns.some(pattern => matchesGlob(filePath, pattern));
      const isTest = testPatterns.some(pattern => matchesGlob(filePath, pattern));
      
      if (isImpl && !isTest) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Simple glob matching
 * Supports: *, **, and literal paths
 */
function matchesGlob(filePath, pattern) {
  // Key: /** / must become a regex that matches zero OR more path segments
  // Handle /** and **/ as units that INCLUDE the slash to avoid double-slash regex
  let rePattern = pattern
    .replace(/\/\*\*\//g, '<!GLOBSTAR_MIDDLE!>')  // Match /**/ (between segments)
    .replace(/\/\*\*$/g, '<!GLOBSTAR_END!>')      // Match /** at end
    .replace(/^\*\*\//g, '<!GLOBSTAR_START!>')    // Match **/ at start
    .replace(/\*\*/g, '<!GLOBSTAR_ONLY!>')        // Match ** without slashes (rare)
    .replace(/\*/g, '<!STAR!>')                   // Mark remaining *
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')        // Escape regex chars
    .replace(/<!GLOBSTAR_MIDDLE!>/g, '/(?:.*/)?') // /**/ → /(?:.*/)? (optional middle)
    .replace(/<!GLOBSTAR_END!>/g, '(?:/.*)?')     // /** → (?:/.*)? (optional trailing)
    .replace(/<!GLOBSTAR_START!>/g, '(?:.*/)? ')  // **/ → (?:.*/)? (optional leading)
    .replace(/<!GLOBSTAR_ONLY!>/g, '.*')          // ** → .* (rare case)
    .replace(/<!STAR!>/g, '[^/]*');               // * → [^/]*
  
  const regex = new RegExp(`^${rePattern}$`);
  return regex.test(filePath);
}

/**
 * Detect if validation commands were run in conversation
 * @param {object} data - Hook input data
 * @param {object} config - Hook configuration
 * @returns {boolean} True if validation was executed
 */
function detectValidation(data, config) {
  if (!data.conversation || !Array.isArray(data.conversation)) {
    return false;
  }
  
  const validationCommands = config.validationCommands || ['npm test'];
  
  for (const item of data.conversation) {
    if (item.tool === 'Bash' && item.tool_input?.command) {
      const command = item.tool_input.command;
      for (const validCmd of validationCommands) {
        if (command.includes(validCmd)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Run hook
main();
