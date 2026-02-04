import { createLogger } from '../logger.js';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import ora, { type Ora } from 'ora';

export interface DepsHealthOptions {
  dir?: string;
  _silent?: boolean;
}

interface AuditSummary {
  low: number;
  moderate: number;
  high: number;
  critical: number;
}

interface DepsHealthResult {
  totalDependencies: number;
  securityAdvisories: number;
  auditSummary: AuditSummary;
  outdated: number;
  outdatedList: string[];
  success: boolean;
}

/**
 * Check dependency health: security advisories and outdated packages
 * @param options - Command options
 * @returns Health report with advisories and outdated packages
 */
export async function depsHealth(options: DepsHealthOptions = {}): Promise<DepsHealthResult> {
  const targetDir = path.resolve(options.dir || '.');
  const silent = options._silent || false;
  const log = createLogger(silent);

  // Change to target directory
  const originalDir = process.cwd();
  
  try {
    process.chdir(targetDir);

    log.header('Dependency Health Check', '🔒');

    // 1. Check if package.json exists
    const packageJsonPath = path.join(targetDir, 'package.json');
    try {
      await fs.access(packageJsonPath);
    } catch {
      throw new Error('No package.json found in target directory');
    }

    // 2. Read package.json
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const totalDependencies = Object.keys(dependencies).length + Object.keys(devDependencies).length;

    log.cyan(`📦 Total dependencies: ${totalDependencies}`);

    // 3. Run npm audit (security advisories)
    const auditSpinner: Ora | null = silent ? null : ora('Checking security advisories...').start();
    let securityAdvisories = 0;
    let auditSummary: AuditSummary = { low: 0, moderate: 0, high: 0, critical: 0 };

    try {
      const auditOutput = execSync('npm audit --json 2>&1', { encoding: 'utf8' });
      const auditData = JSON.parse(auditOutput);
      
      if (auditData.metadata && auditData.metadata.vulnerabilities) {
        const vulns = auditData.metadata.vulnerabilities;
        auditSummary = {
          low: vulns.low || 0,
          moderate: vulns.moderate || 0,
          high: vulns.high || 0,
          critical: vulns.critical || 0
        };
        securityAdvisories = Object.values(auditSummary).reduce((sum, count) => sum + count, 0);
      }
      if (auditSpinner) auditSpinner.succeed('Security check complete');
    } catch (error) {
      // npm audit exits with error code if vulnerabilities found
      // Try to parse output anyway
      try {
        const errorWithStdout = error as { stdout?: string };
        const auditData = JSON.parse(errorWithStdout.stdout || '{}');
        if (auditData.metadata && auditData.metadata.vulnerabilities) {
          const vulns = auditData.metadata.vulnerabilities;
          auditSummary = {
            low: vulns.low || 0,
            moderate: vulns.moderate || 0,
            high: vulns.high || 0,
            critical: vulns.critical || 0
          };
          securityAdvisories = Object.values(auditSummary).reduce((sum, count) => sum + count, 0);
        }
      } catch {
        // Could not parse audit output
      }
      if (auditSpinner) auditSpinner.info('Security check complete (with findings)');
    }

    // 4. Run npm outdated (check for updates)
    const outdatedSpinner: Ora | null = silent ? null : ora('Checking for outdated packages...').start();
    let outdatedPackages = 0;
    let outdatedList: string[] = [];

    try {
      const outdatedOutput = execSync('npm outdated --json 2>&1', { encoding: 'utf8' });
      const outdatedData = JSON.parse(outdatedOutput);
      outdatedList = Object.keys(outdatedData);
      outdatedPackages = outdatedList.length;
      if (outdatedSpinner) outdatedSpinner.succeed('Freshness check complete');
    } catch (error) {
      // npm outdated exits with error code if outdated packages found
      try {
        const errorWithStdout = error as { stdout?: string };
        const outdatedData = JSON.parse(errorWithStdout.stdout || '{}');
        outdatedList = Object.keys(outdatedData);
        outdatedPackages = outdatedList.length;
      } catch {
        // Could not parse outdated output
      }
      if (outdatedSpinner) outdatedSpinner.info('Freshness check complete (with findings)');
    }

    // 5. Display results
    if (!silent) {
      log.info('');
      log.cyan('🔒 Security:');
      if (securityAdvisories === 0) {
        log.success('  ✅ No known security advisories');
      } else {
        if (auditSummary.critical > 0) {
          log.error(`  ❌ ${auditSummary.critical} critical vulnerabilities`);
        }
        if (auditSummary.high > 0) {
          log.error(`  ⚠️  ${auditSummary.high} high vulnerabilities`);
        }
        if (auditSummary.moderate > 0) {
          log.warn(`  ⚠️  ${auditSummary.moderate} moderate vulnerabilities`);
        }
        if (auditSummary.low > 0) {
          log.info(`  ℹ️  ${auditSummary.low} low vulnerabilities`);
        }
      }

      log.info('');
      log.cyan('📦 Freshness:');
      if (outdatedPackages === 0) {
        log.success('  ✅ All packages up to date');
      } else {
        log.warn(`  ⚠️  ${outdatedPackages} packages outdated`);
        if (outdatedList.length > 0 && outdatedList.length <= 5) {
          outdatedList.forEach(pkg => {
            log.info(`     - ${pkg}`);
          });
        }
      }

      // 6. Recommendations
      if (securityAdvisories > 0 || outdatedPackages > 0) {
        log.info('');
        log.cyan('💡 Recommendations:');
        if (securityAdvisories > 0) {
          log.info('  - Run: npm audit fix');
        }
        if (outdatedPackages > 0) {
          log.info('  - Run: npm outdated (see details)');
          log.info('  - Run: npm update (update within semver range)');
        }
      }
    }

    return {
      totalDependencies,
      securityAdvisories,
      auditSummary,
      outdated: outdatedPackages,
      outdatedList,
      success: true
    };

  } catch (error) {
    if (!silent) {
      log.error(`Failed: ${(error as Error).message}`);
    }
    throw error;
  } finally {
    // Always restore directory
    process.chdir(originalDir);
  }
}
