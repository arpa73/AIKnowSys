import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../logger.js';
import { checkEssentialsBloat } from '../quality-checkers/essentials-bloat.js';
import { validateTemplates } from '../quality-checkers/template-validator.js';
import { validateLinks } from '../quality-checkers/link-validator.js';
import { scanPatterns } from '../quality-checkers/pattern-scanner.js';

/**
 * Comprehensive quality check command
 * @param {Object} options - Command options
 * @param {string} options.dir - Target directory (default: process.cwd())
 * @param {boolean} options.dryRun - Preview mode (default: false)
 * @param {boolean} options._silent - Suppress output for testing
 * @returns {Promise<{passed: boolean, checks: Object, totalIssues: number}>} Check results
 */
export async function qualityCheck(options = {}) {
  const targetDir = path.resolve(options.dir || process.cwd());
  const dryRun = options.dryRun || false;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.header('Quality Check', '🔍');
  
  // Load config if available
  const config = await loadConfig(targetDir);
  const qualityConfig = config?.qualityChecks || {};
  
  // Run all checks
  const checks = {
    essentials: await checkEssentialsBloat(targetDir, qualityConfig),
    templates: await validateTemplates(targetDir, qualityConfig),
    links: await validateLinks(targetDir, qualityConfig),
    patterns: await scanPatterns(targetDir, qualityConfig)
  };
  
  // Calculate overall status
  const allPassed = Object.values(checks).every(check => check.passed);
  const totalIssues = Object.values(checks).reduce((count, check) => {
    if (!check.passed) {
      return count + (check.violations?.length || 1);
    }
    return count;
  }, 0);
  
  // Display results
  if (!silent) {
    displayResults(log, checks, dryRun);
  }
  
  // Summary
  if (!silent) {
    log.cyan('\n📊 Summary:');
    if (allPassed) {
      log.success('✓ All quality checks passed!');
    } else {
      log.error(`✗ Found ${totalIssues} issue(s) across ${Object.values(checks).filter(c => !c.passed).length} check(s)`);
      
      // Show fix suggestions
      log.cyan('\n💡 Recommended actions:');
      Object.entries(checks).forEach(([name, check]) => {
        if (!check.passed && check.fix) {
          log.dim(`  • ${name}: ${check.fix}`);
        }
      });
    }
  }
  
  return {
    passed: allPassed,
    checks,
    totalIssues
  };
}

/**
 * Display results for all checks
 */
function displayResults(log, checks, dryRun) {
  // ESSENTIALS bloat check
  log.cyan('\n📄 ESSENTIALS Size:');
  if (checks.essentials.passed) {
    log.success(`✓ ${checks.essentials.message}`);
  } else {
    log.error(`✗ ${checks.essentials.message}`);
    if (checks.essentials.details) {
      log.dim(`  Excess: ${checks.essentials.details.excess} lines`);
    }
  }
  
  // Template variables check
  log.cyan('\n🔧 Template Variables:');
  if (checks.templates.passed) {
    log.success(`✓ ${checks.templates.message}`);
  } else {
    log.error(`✗ ${checks.templates.message}`);
    if (checks.templates.violations) {
      checks.templates.violations.slice(0, 5).forEach(v => {
        log.dim(`  • ${v.file}:${v.line} - {{${v.variable}}}`);
      });
      if (checks.templates.violations.length > 5) {
        log.dim(`  ... and ${checks.templates.violations.length - 5} more`);
      }
    }
  }
  
  // Link validation
  log.cyan('\n🔗 Link Integrity:');
  if (checks.links.passed) {
    log.success(`✓ ${checks.links.message}`);
  } else {
    log.error(`✗ ${checks.links.message}`);
    if (checks.links.violations) {
      checks.links.violations.slice(0, 5).forEach(v => {
        log.dim(`  • ${v.file}:${v.line} - ${v.link} (${v.reason})`);
      });
      if (checks.links.violations.length > 5) {
        log.dim(`  ... and ${checks.links.violations.length - 5} more`);
      }
    }
  }
  
  // Pattern violations
  log.cyan('\n⚠️  Pattern Violations:');
  if (checks.patterns.passed) {
    log.success(`✓ ${checks.patterns.message}`);
  } else {
    log.error(`✗ ${checks.patterns.message}`);
    if (checks.patterns.violations) {
      checks.patterns.violations.slice(0, 5).forEach(v => {
        log.dim(`  • ${v.file}:${v.line} - ${v.rule}: ${v.message}`);
      });
      if (checks.patterns.violations.length > 5) {
        log.dim(`  ... and ${checks.patterns.violations.length - 5} more`);
      }
    }
  }
}

/**
 * Load config from .github/hooks/config.json if available
 */
async function loadConfig(targetDir) {
  const configPath = path.join(targetDir, '.github', 'hooks', 'config.json');
  
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
