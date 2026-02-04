import * as fs from 'fs';
import * as path from 'path';
import ora, { Ora } from 'ora';
import { createLogger } from '../logger.js';
import { ErrorTemplates } from '../error-helpers.js';

/**
 * Audit issue
 */
interface AuditIssue {
  type: 'warning' | 'info';
  category: string;
  message: string;
  fix: string;
}

/**
 * Audit result
 */
export interface AuditResult {
  issues: AuditIssue[];
  warnings: number;
  info: number;
  clean: boolean;
}

/**
 * Options for audit command
 */
export interface AuditOptions {
  dir?: string;
  essentials?: string;
  _silent?: boolean;
}

/**
 * Audit command - Finds common issues and pattern violations
 * Scans knowledge system files for problems
 */
export async function audit(options: AuditOptions = {}): Promise<AuditResult> {
  const targetDir = path.resolve(options.dir || process.cwd());
  const essentialsFile = options.essentials || 'CODEBASE_ESSENTIALS.md';
  const silent = options._silent || false;
  const log = createLogger(silent);

  log.blank();
  log.header('Knowledge System Audit', '🔎');
  log.blank();

  const issues: AuditIssue[] = [];
  let warnings = 0;
  let info = 0;

  const essentialsPath = path.join(targetDir, essentialsFile);
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  const changelogPath = path.join(targetDir, 'CODEBASE_CHANGELOG.md');

  // Check if knowledge system exists
  if (!fs.existsSync(essentialsPath) && !fs.existsSync(agentsPath)) {
    throw ErrorTemplates.noKnowledgeSystem();
  }

  // Edge case: Check file sizes before reading
  const filesToCheck = [
    { path: essentialsPath, name: 'CODEBASE_ESSENTIALS.md' },
    { path: agentsPath, name: 'AGENTS.md' },
    { path: changelogPath, name: 'CODEBASE_CHANGELOG.md' }
  ];

  for (const file of filesToCheck) {
    if (fs.existsSync(file.path)) {
      const stats = fs.statSync(file.path);
      const fileSize = stats.size;
      const fiftyMB = 50 * 1024 * 1024;

      // Edge case: File is empty
      if (fileSize === 0) {
        throw ErrorTemplates.emptyFile(file.name);
      }

      // Edge case: File too large
      if (fileSize > fiftyMB) {
        throw ErrorTemplates.fileTooLarge(file.name, fileSize / 1024 / 1024);
      }
    }
  }

  // Create spinner for progress (only if not silent)
  const spinner: Ora | null = silent ? null : ora('Starting audit...').start();

  // Audit 1: Check for duplicated validation matrix
  if (spinner) {
    spinner.text = 'Check 1/5: Checking for duplication issues...';
  } else {
    log.white('🔍 Checking for duplication issues...');
  }

  if (fs.existsSync(essentialsPath) && fs.existsSync(agentsPath)) {
    try {
      const essentialsContent = fs.readFileSync(essentialsPath, 'utf-8');
      const agentsContent = fs.readFileSync(agentsPath, 'utf-8');

      // Look for validation matrix table in both files
      const matrixTablePattern = /\|\s*Command\s*\|.*\|[\s\S]*?\|.*test.*\|/i;
      const hasEssentialsMatrix = matrixTablePattern.test(essentialsContent);
      const hasAgentsMatrix = matrixTablePattern.test(agentsContent);

      if (hasEssentialsMatrix && hasAgentsMatrix) {
        log.warn('Validation matrix duplicated in both files');
        issues.push({
          type: 'warning',
          category: 'DRY Violation',
          message: 'Validation matrix appears in both ESSENTIALS and AGENTS',
          fix: 'Run: npx aiknowsys sync'
        });
        warnings++;
      } else if (hasEssentialsMatrix) {
        log.log('  ✓ Validation matrix in ESSENTIALS only (correct)');
      }
    } catch (error) {
      // Handle malformed or corrupted files gracefully
      info++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      issues.push({
        type: 'info',
        category: 'File Processing',
        message: `Could not fully parse files: ${errorMessage}`,
        fix: 'Check file encoding and markdown structure'
      });
    }
  }

  log.blank();

  // Audit 2: Check for generic placeholder values
  if (spinner) {
    spinner.text = 'Check 2/5: Checking placeholder quality...';
  } else {
    log.white('📝 Checking for placeholder quality...');
  }

  if (fs.existsSync(essentialsPath)) {
    const content = fs.readFileSync(essentialsPath, 'utf-8');

    // Strip code blocks and inline code to avoid false positives from example code
    const contentWithoutCodeBlocks = content
      .replace(/```[\s\S]*?```/g, '')  // Fenced code blocks
      .replace(/`[^`]+`/g, '');         // Inline code

    // Check for lazy placeholder replacements (only outside code blocks)
    const lazyPatterns: Array<{ pattern: RegExp; name: string; severity: 'info' | 'warning' }> = [
      { pattern: /TBD/gi, name: 'TBD markers', severity: 'info' },
      { pattern: /TODO:/gi, name: 'TODO comments', severity: 'info' },
      { pattern: /\[\s*FILL.*?\]/gi, name: 'FILL instructions', severity: 'warning' }
      // Removed "generic|placeholder|example" - too many false positives in documentation
    ];

    for (const check of lazyPatterns) {
      const matches = contentWithoutCodeBlocks.match(check.pattern);
      if (matches && matches.length > 3) { // Allow a few TBDs
        if (check.severity === 'warning') {
          log.log(`  ⚠️  ${matches.length} instances of ${check.name}`);
          issues.push({
            type: 'warning',
            category: 'Incomplete Setup',
            message: `${matches.length} ${check.name} found`,
            fix: 'Complete TODO sections with actual project details'
          });
          warnings++;
        } else {
          log.log(`  ℹ️  ${matches.length} instances of ${check.name}`);
          issues.push({
            type: 'info',
            category: 'Incomplete Setup',
            message: `${matches.length} ${check.name} found`,
            fix: 'Complete TODO sections with actual project details'
          });
          info++;
        }
      }
    }

    // Check for remaining {{PLACEHOLDERS}} - only outside code blocks
    // Placeholders inside code blocks (like examples) are intentional documentation
    const placeholderMatches = [...contentWithoutCodeBlocks.matchAll(/{{([A-Z_]+)}}/g)];
    if (placeholderMatches.length > 0) {
      const unique = [...new Set(placeholderMatches.map(m => m[1]))];
      log.log(`  ⚠️  ${unique.length} unfilled placeholders`);
      issues.push({
        type: 'warning',
        category: 'Incomplete Setup',
        message: `${unique.length} placeholders need filling: ${unique.slice(0, 3).join(', ')}${unique.length > 3 ? '...' : ''}`,
        fix: 'Use AI assistant or manual editing to fill placeholders'
      });
      warnings++;
    } else {
      log.log('  ✓ All placeholders filled');
    }
  }

  log.blank();

  // Audit 3: Check validation matrix quality
  if (spinner) {
    spinner.text = 'Check 3/5: Checking validation matrix quality...';
  } else {
    log.white('✅ Checking validation matrix quality...');
  }

  if (fs.existsSync(essentialsPath)) {
    const content = fs.readFileSync(essentialsPath, 'utf-8');
    const matrixSection = content.split(/## \d*\.?\s*Validation Matrix/i)[1]?.split(/##/)[0] || '';

    if (matrixSection.length === 0) {
      // Validation Matrix section is missing
      log.log('  ⚠️  Validation Matrix section missing');
      issues.push({
        type: 'warning',
        category: 'Missing Section',
        message: 'Validation Matrix section missing from ESSENTIALS',
        fix: 'Add Validation Matrix section with test commands'
      });
      warnings++;
    } else if (matrixSection.length > 0) {
      // Check for specific commands
      const hasTestCmd = /test|pytest|jest|vitest/i.test(matrixSection);
      const hasLintCmd = /lint|eslint|flake8|ruff/i.test(matrixSection);
      // hasTypeCmd check could be added for TypeScript projects

      if (!hasTestCmd) {
        log.log('  ⚠️  No test command in validation matrix');
        issues.push({
          type: 'warning',
          category: 'Missing Validation',
          message: 'No test command configured',
          fix: 'Add test command to validation matrix'
        });
        warnings++;
      } else {
        log.log('  ✓ Test command configured');
      }

      if (!hasLintCmd) {
        log.log('  ℹ️  No linter configured (optional)');
        info++;
      } else {
        log.log('  ✓ Linter configured');
      }
    }
  }

  log.blank();

  // Audit 4: Check changelog usage
  if (spinner) {
    spinner.text = 'Check 4/5: Checking changelog...';
  } else {
    log.white('📚 Checking changelog...');
  }

  if (fs.existsSync(changelogPath)) {
    const content = fs.readFileSync(changelogPath, 'utf-8');
    const sessionCount = (content.match(/## Session:/g) || []).length;

    if (sessionCount === 0) {
      log.log('  ℹ️  No sessions recorded yet (new project)');
      info++;
    } else if (sessionCount === 1) {
      log.log('  ℹ️  1 session recorded');
      info++;
    } else {
      log.log(`  ✓ ${sessionCount} sessions recorded`);
    }
  }

  log.blank();

  // Audit 5: Check .aiknowsys/ gitignore configuration
  if (spinner) {
    spinner.text = 'Check 5/5: Checking .aiknowsys/ gitignore...';
  } else {
    log.white('🔒 Checking .aiknowsys/ gitignore...');
  }

  const gitignorePath = path.join(targetDir, '.gitignore');
  const aiknowsysDir = path.join(targetDir, '.aiknowsys');

  if (fs.existsSync(aiknowsysDir)) {
    if (!fs.existsSync(gitignorePath)) {
      log.log('  ⚠️  No .gitignore file found');
      issues.push({
        type: 'warning',
        category: 'Missing Configuration',
        message: 'No .gitignore file - session files will be committed',
        fix: 'Create .gitignore with .aiknowsys/sessions/*.md'
      });
      warnings++;
    } else {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

      // Check for session files gitignore
      const hasSessionsIgnore = /\.aiknowsys\/sessions\/\*\.md/i.test(gitignoreContent);
      const hasReviewsIgnore = /\.aiknowsys\/reviews\//i.test(gitignoreContent);

      if (!hasSessionsIgnore) {
        log.log('  ⚠️  Session files not gitignored');
        issues.push({
          type: 'warning',
          category: 'Gitignore Configuration',
          message: 'Session files should be gitignored (temporary working memory)',
          fix: 'Add to .gitignore: .aiknowsys/sessions/*.md'
        });
        warnings++;
      } else {
        log.log('  ✓ Session files gitignored');
      }

      if (!hasReviewsIgnore) {
        log.log('  ⚠️  reviews/ directory not gitignored');
        issues.push({
          type: 'warning',
          category: 'Gitignore Configuration',
          message: 'reviews/ directory should be gitignored (contains temporary review files)',
          fix: 'Add to .gitignore: .aiknowsys/reviews/'
        });
        warnings++;
      } else {
        log.log('  ✓ reviews/ directory gitignored');
      }
    }
  } else {
    log.log('  ℹ️  .aiknowsys/ directory not present');
    info++;
  }

  log.blank();

  // Audit 6: Check file sizes (detect bloat)
  log.white('📏 Checking file sizes...');

  if (fs.existsSync(essentialsPath)) {
    const content = fs.readFileSync(essentialsPath, 'utf-8');
    const lineCount = content.split('\n').length;

    // 350 lines is reasonable for a well-documented project
    // Only warn for truly large files
    if (lineCount > 350) {
      log.log(`  ⚠️  CODEBASE_ESSENTIALS.md is large (${lineCount} lines)`);
      issues.push({
        type: 'warning',
        category: 'File Size',
        message: `ESSENTIALS.md is ${lineCount} lines (consider splitting)`,
        fix: 'Consider using minimal template or archiving old patterns'
      });
      warnings++;
    } else {
      log.log(`  ✓ CODEBASE_ESSENTIALS.md size OK (${lineCount} lines)`);
    }
  }

  log.blank();

  // Stop spinner before summary
  if (spinner) spinner.succeed('Audit complete');

  // Summary
  log.section('Audit Summary', '📊');

  if (issues.length === 0 && info === 0) {
    log.log('  ✓ No issues found');
  } else {
    if (warnings > 0) {
      log.log(`  ⚠️  Warnings: ${warnings}`);
    }
    if (info > 0) {
      log.log(`  ℹ️  Info: ${info}`);
    }
  }

  log.blank();

  // Detailed issues
  if (issues.length > 0) {
    log.section('Issues Found', '🔧');
    log.blank();

    issues.forEach((issue, idx) => {
      const icon = issue.type === 'warning' ? '⚠️ ' : 'ℹ️ ';
      log.white(`${idx + 1}. ${icon}${issue.category}`);
      log.dim(`   ${issue.message}`);
      log.cyan(`   Fix: ${issue.fix}`);
      log.blank();
    });
  }

  // Recommendations
  if (warnings > 0) {
    log.cyan('💡 Next Steps:');
    log.white('  1. Run: npx aiknowsys sync (fix duplication)');
    log.white('  2. Complete placeholder sections');
    log.white('  3. Run: npx aiknowsys check (verify fixes)');
    log.blank();
  } else {
    log.success('Knowledge system is in good shape!');
    log.blank();
  }

  // Return audit results for programmatic use
  return {
    issues,
    warnings,
    info,
    clean: warnings === 0 && issues.length === 0
  };
}
