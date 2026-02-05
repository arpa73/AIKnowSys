import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Configuration for ESSENTIALS bloat check
 */
export interface EssentialsBloatConfig {
  essentialsMaxLines?: number;
}

/**
 * Bloat check result details
 */
export interface BloatDetails {
  current: number;
  threshold: number;
  excess?: number;
  [key: string]: unknown;
}

/**
 * Bloat check result
 */
export interface BloatCheckResult {
  passed: boolean;
  severity?: 'warning';
  message: string;
  fix?: string;
  location?: string;
  details?: BloatDetails;
}

/**
 * Check if CODEBASE_ESSENTIALS.md exceeds recommended size
 * @param targetDir - Directory to check
 * @param config - Configuration with threshold
 * @returns Check result
 */
export async function checkEssentialsBloat(
  targetDir: string,
  config: EssentialsBloatConfig = {}
): Promise<BloatCheckResult> {
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
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return {
        passed: true,
        message: 'ESSENTIALS.md not found (skipping check)'
      };
    }
    throw err;
  }
}
