import { promises as fs } from 'fs';
import * as path from 'path';
import { createLogger } from '../logger.js';
// @ts-ignore - JavaScript module, will be migrated later
import { checkEssentialsBloat } from '../quality-checkers/essentials-bloat.js';
// @ts-ignore - JavaScript module, will be migrated later
import { validateTemplates } from '../quality-checkers/template-validator.js';
// @ts-ignore - JavaScript module, will be migrated later
import { validateLinks } from '../quality-checkers/link-validator.js';
// @ts-ignore - JavaScript module, will be migrated later
import { scanPatterns } from '../quality-checkers/pattern-scanner.js';
// @ts-ignore - JavaScript module, will be migrated later
import { validateDeliverables } from './validate-deliverables.js';

/**
 * Violation object (generic structure)
 */
interface Violation {
  file?: string;
  line?: number;
  variable?: string;
  link?: string;
  reason?: string;
  rule?: string;
  message?: string;
  [key: string]: unknown;
}

/**
 * Check result with issues
 */
interface CheckWithIssues {
  passed: boolean;
  issues?: string[];
  [key: string]: unknown;
}

/**
 * Individual check result
 */
interface CheckResult {
  passed: boolean;
  message?: string;
  summary?: string;
  details?: Record<string, unknown>;
  violations?: Violation[];
  fix?: string;
  checks?: CheckWithIssues[];
  metrics?: Record<string, unknown>;
}

/**
 * All checks results
 */
interface QualityChecks {
  essentials: CheckResult;
  templates: CheckResult;
  links: CheckResult;
  patterns: CheckResult;
  deliverables: CheckResult;
}

/**
 * Quality check result
 */
export interface QualityCheckResult {
  passed: boolean;
  checks: QualityChecks;
  totalIssues: number;
}

/**
 * Options for quality-check command
 */
export interface QualityCheckOptions {
  dir?: string;
  dryRun?: boolean;
  _silent?: boolean;
}

/**
 * Configuration interface
 */
interface Config {
  qualityChecks?: Record<string, unknown>;
}

/**
 * Comprehensive quality check command
 */
export async function qualityCheck(options: QualityCheckOptions = {}): Promise<QualityCheckResult> {
  const targetDir = path.resolve(options.dir || process.cwd());
  const silent = options._silent || false;
  const log = createLogger(silent);

  log.header('Quality Check', '🔍');

  // Load config if available
  const config = await loadConfig(targetDir);
  const qualityConfig = config?.qualityChecks || {};

  // Run all checks
  const checks: QualityChecks = {
    essentials: await checkEssentialsBloat(targetDir, qualityConfig),
    templates: await validateTemplates(targetDir, qualityConfig),
    links: await validateLinks(targetDir, qualityConfig),
    patterns: await scanPatterns(targetDir, qualityConfig),
    deliverables: await validateDeliverables({
      projectRoot: targetDir,
      _silent: true,
      full: true  // quality-check always runs comprehensive validation
    })
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
    displayResults(log, checks);
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
function displayResults(log: ReturnType<typeof createLogger>, checks: QualityChecks): void {
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
      checks.templates.violations.slice(0, 5).forEach((v) => {
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
      checks.links.violations.slice(0, 5).forEach((v) => {
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
      checks.patterns.violations.slice(0, 5).forEach((v) => {
        log.dim(`  • ${v.file}:${v.line} - ${v.rule}: ${v.message}`);
      });
      if (checks.patterns.violations.length > 5) {
        log.dim(`  ... and ${checks.patterns.violations.length - 5} more`);
      }
    }
  }

  // Deliverables validation
  log.cyan('\n📦 Deliverables Validation:');
  if (checks.deliverables.passed) {
    log.success(`✓ ${checks.deliverables.summary}`);
    if (checks.deliverables.metrics) {
      log.dim(`  Templates checked: ${checks.deliverables.metrics.templatesChecked}`);
      log.dim(`  Duration: ${checks.deliverables.metrics.duration}ms`);
    }
  } else {
    log.error(`✗ ${checks.deliverables.summary}`);
    const failedChecks = (checks.deliverables.checks || []).filter((c) => !c.passed);
    failedChecks.forEach((check) => {
      log.dim(`  ${check.name || 'Check'}:`);
      const issues = check.issues || [];
      issues.slice(0, 3).forEach((issue) => {
        log.dim(`    • ${issue}`);
      });
      if (issues.length > 3) {
        log.dim(`    ... and ${issues.length - 3} more`);
      }
    });
  }
}

/**
 * Load config from .github/hooks/config.json if available
 */
async function loadConfig(targetDir: string): Promise<Config | null> {
  const configPath = path.join(targetDir, '.github', 'hooks', 'config.json');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as Config;
  } catch {
    return null;
  }
}
