/**
 * CI Check Command - Validate CI/CD readiness locally
 * Run pre-push validation to catch issues before CI pipeline
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { createLogger } from '../logger.js';

/**
 * Run a check and time its execution
 * @param {Object} check - Check definition { name, cmd, optional }
 * @param {Object} log - Logger instance
 * @returns {Object} { passed, duration, error }
 */
async function runCheck(check, log) {
  const startTime = Date.now();
  
  try {
    execSync(check.cmd, { 
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    
    const duration = Date.now() - startTime;
    log.success(`${check.name}: passed (${duration}ms)`);
    
    return { passed: true, duration, error: null };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (check.optional) {
      log.warn(`${check.name}: failed (optional) (${duration}ms)`);
      return { passed: true, duration, error: error.message, skipped: true };
    } else {
      log.error(`${check.name}: failed (${duration}ms)`);
      return { passed: false, duration, error: error.message };
    }
  }
}

/**
 * CI Check command - Validate project is ready for CI/CD
 * @async
 * @param {Object} options - Command options { dir, _silent }
 * @returns {Promise<Object>} Result with checks array
 */
export async function ciCheck(options) {
  const targetDir = path.resolve(options.dir || '.');
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  // Change to target directory for running commands
  const originalDir = process.cwd();
  process.chdir(targetDir);
  
  try {
    log.header('CI/CD Readiness Check', '🚀');
    
    // Define checks to run
    const checks = [
      {
        name: 'Tests',
        cmd: 'npm test',
        optional: false,
      },
      {
        name: 'Lint',
        cmd: 'npm run lint',
        optional: true, // Optional if no lint script
      },
      {
        name: 'Type Check',
        cmd: 'npm run type-check',
        optional: true, // Optional if no TypeScript
      },
      {
        name: 'Build',
        cmd: 'npm run build',
        optional: true, // Optional if no build step
      },
      {
        name: 'Quality',
        cmd: 'node bin/cli.js check',
        optional: true, // Optional check command
      },
    ];
    
    log.cyan('\n📋 Running CI checks...\n');
    
    const results = [];
    let totalDuration = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    
    // Run checks sequentially
    for (const check of checks) {
      const result = await runCheck(check, log);
      results.push({ check: check.name, ...result });
      
      totalDuration += result.duration;
      
      if (result.skipped) {
        skipped++;
      } else if (result.passed) {
        passed++;
      } else {
        failed++;
      }
      
      // Stop on first failure of required check
      if (!result.passed && !check.optional) {
        break;
      }
    }
    
    // Summary
    log.cyan('\n📊 Summary:\n');
    log.white(`  Passed: ${passed}`);
    if (skipped > 0) {
      log.white(`  Skipped: ${skipped} (optional)`);
    }
    if (failed > 0) {
      log.white(`  Failed: ${failed}`);
    }
    log.white(`  Total time: ${(totalDuration / 1000).toFixed(1)}s`);
    log.white(`  Estimated CI time: ${(totalDuration / 1000 * 1.5).toFixed(1)}s`);
    
    log.cyan('\n');
    
    if (failed > 0) {
      log.error('❌ CI checks failed - fix issues before pushing');
      return { success: false, checks: results, totalDuration };
    } else {
      log.success('✅ CI checks passed - ready to push');
      return { success: true, checks: results, totalDuration };
    }
    
  } catch (error) {
    log.error(`Failed to run CI checks: ${error.message}`);
    throw error;
  } finally {
    // Restore original directory
    process.chdir(originalDir);
  }
}
