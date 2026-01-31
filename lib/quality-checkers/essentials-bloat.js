import { promises as fs } from 'fs';
import path from 'path';

/**
 * Check if CODEBASE_ESSENTIALS.md exceeds recommended size
 * @param {string} targetDir - Directory to check
 * @param {Object} config - Configuration with threshold
 * @returns {Promise<Object>} Check result
 */
export async function checkEssentialsBloat(targetDir, config = {}) {
  const threshold = config.essentialsMaxLines || 800;
  const essentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
  
  try {
    const content = await fs.readFile(essentialsPath, 'utf-8');
    const lines = content.split('\n').length;
    
    if (lines > threshold) {
      return {
        passed: false,
        severity: 'warning',
        message: `ESSENTIALS.md is ${lines} lines (target: <${threshold})`,
        fix: 'Run: node bin/cli.js compress-essentials --analyze',
        location: essentialsPath,
        details: {
          current: lines,
          threshold,
          excess: lines - threshold
        }
      };
    }
    
    return {
      passed: true,
      message: `ESSENTIALS.md is ${lines} lines (under ${threshold} target)`,
      details: { current: lines, threshold }
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        passed: true,
        message: 'ESSENTIALS.md not found (skipping check)'
      };
    }
    throw err;
  }
}
