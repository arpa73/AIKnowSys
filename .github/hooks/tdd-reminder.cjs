#!/usr/bin/env node
/**
 * TDD Reminder Hook (PreToolUse event)
 * 
 * Runs before tool execution to remind about test-first development.
 * Checks for test files when implementing new features.
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
      
      // Only check Edit/Write operations
      if (data.tool !== 'Edit' && data.tool !== 'Write') {
        process.exit(0);
        return;
      }
      
      const filePath = data.tool_input?.file_path;
      if (!filePath) {
        process.exit(0);
        return;
      }
      
      // Only check implementation files
      if (!isImplementationFile(filePath)) {
        process.exit(0);
        return;
      }
      
      // Find expected test file
      const testPath = getExpectedTestPath(filePath);
      
      // Check if test exists and is recent
      if (!isTestRecentlyEdited(testPath)) {
        console.error('[Hook] 🧪 TDD Reminder: Implementing ' + filePath);
        console.error('[Hook] Did you write the test FIRST? (RED phase)');
        console.error('[Hook] Expected test: ' + testPath);
        console.error('[Hook] See: .github/skills/tdd-workflow/SKILL.md');
      }
      
      process.exit(0); // Always non-blocking
    } catch (err) {
      // Fail silently - don't block workflow
      process.exit(0);
    }
  });
}

/**
 * Check if file is an implementation file (not a test)
 * @param {string} filePath - File path to check
 * @returns {boolean} True if implementation file
 */
function isImplementationFile(filePath) {
  // Match lib/, bin/, templates/ but exclude test/ directory
  return /^(lib|bin|templates)\/.*\.js$/.test(filePath) && 
         !/test\//.test(filePath);
}

/**
 * Get expected test file path for implementation file
 * @param {string} filePath - Implementation file path
 * @returns {string} Expected test file path
 */
function getExpectedTestPath(filePath) {
  // lib/commands/audit.js → test/audit.test.js
  // lib/utils.js → test/utils.test.js
  const basename = path.basename(filePath, '.js');
  return path.join('test', basename + '.test.js');
}

/**
 * Check if test file exists and was recently modified
 * @param {string} testPath - Test file path
 * @returns {boolean} True if test is recent
 */
function isTestRecentlyEdited(testPath) {
  try {
    if (!fs.existsSync(testPath)) {
      return false;
    }
    
    const stats = fs.statSync(testPath);
    const ageMinutes = (Date.now() - stats.mtime.getTime()) / 1000 / 60;
    
    // Consider recent if edited in last 10 minutes
    return ageMinutes < 10;
  } catch (err) {
    return false;
  }
}

// Run hook
main();
