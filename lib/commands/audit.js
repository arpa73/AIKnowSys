import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * Audit command - Finds common issues and pattern violations
 * Scans knowledge system files for problems
 */
export async function audit(options) {
  const targetDir = path.resolve(options.dir);
  
  console.log('');
  console.log(chalk.cyan.bold('🔎 Knowledge System Audit'));
  console.log('');
  
  const issues = [];
  let warnings = 0;
  let info = 0;
  
  const essentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  const changelogPath = path.join(targetDir, 'CODEBASE_CHANGELOG.md');
  
  // Audit 1: Check for duplicated validation matrix
  console.log(chalk.white('🔍 Checking for duplication issues...'));
  
  if (fs.existsSync(essentialsPath) && fs.existsSync(agentsPath)) {
    const essentialsContent = fs.readFileSync(essentialsPath, 'utf-8');
    const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
    
    // Look for validation matrix table in both files
    const matrixTablePattern = /\|\s*Command\s*\|.*\|[\s\S]*?\|.*test.*\|/i;
    const hasEssentialsMatrix = matrixTablePattern.test(essentialsContent);
    const hasAgentsMatrix = matrixTablePattern.test(agentsContent);
    
    if (hasEssentialsMatrix && hasAgentsMatrix) {
      console.log(chalk.yellow('  ⚠️  Validation matrix duplicated in both files'));
      issues.push({
        type: 'warning',
        category: 'DRY Violation',
        message: 'Validation matrix appears in both ESSENTIALS and AGENTS',
        fix: 'Run: npx aiknowsys sync'
      });
      warnings++;
    } else if (hasEssentialsMatrix) {
      console.log(chalk.green('  ✓ Validation matrix in ESSENTIALS only (correct)'));
    }
  }
  
  console.log('');
  
  // Audit 2: Check for generic placeholder values
  console.log(chalk.white('📝 Checking for placeholder quality...'));
  
  if (fs.existsSync(essentialsPath)) {
    const content = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Check for lazy placeholder replacements
    const lazyPatterns = [
      { pattern: /TBD/gi, name: 'TBD markers', severity: 'info' },
      { pattern: /TODO:/gi, name: 'TODO comments', severity: 'info' },
      { pattern: /\[\s*FILL.*?\]/gi, name: 'FILL instructions', severity: 'warning' },
      { pattern: /generic|placeholder|example/gi, name: 'Generic placeholder text', severity: 'warning' }
    ];
    
    for (const check of lazyPatterns) {
      const matches = content.match(check.pattern);
      if (matches && matches.length > 3) { // Allow a few TBDs
        if (check.severity === 'warning') {
          console.log(chalk.yellow(`  ⚠️  ${matches.length} instances of ${check.name}`));
          issues.push({
            type: 'warning',
            category: 'Incomplete Setup',
            message: `${matches.length} ${check.name} found`,
            fix: 'Complete TODO sections with actual project details'
          });
          warnings++;
        } else {
          console.log(chalk.cyan(`  ℹ️  ${matches.length} instances of ${check.name}`));
          info++;
        }
      }
    }
    
    // Check for remaining {{PLACEHOLDERS}}
    const placeholderMatches = [...content.matchAll(/{{([A-Z_]+)}}/g)];
    if (placeholderMatches.length > 0) {
      const unique = [...new Set(placeholderMatches.map(m => m[1]))];
      console.log(chalk.yellow(`  ⚠️  ${unique.length} unfilled placeholders`));
      issues.push({
        type: 'warning',
        category: 'Incomplete Setup',
        message: `${unique.length} placeholders need filling: ${unique.slice(0, 3).join(', ')}${unique.length > 3 ? '...' : ''}`,
        fix: 'Use AI assistant or manual editing to fill placeholders'
      });
      warnings++;
    } else {
      console.log(chalk.green('  ✓ All placeholders filled'));
    }
  }
  
  console.log('');
  
  // Audit 3: Check validation matrix quality
  console.log(chalk.white('✅ Checking validation matrix quality...'));
  
  if (fs.existsSync(essentialsPath)) {
    const content = fs.readFileSync(essentialsPath, 'utf-8');
    const matrixSection = content.split(/## \d*\.?\s*Validation Matrix/i)[1]?.split(/##/)[0] || '';
    
    if (matrixSection.length > 0) {
      // Check for specific commands
      const hasTestCmd = /test|pytest|jest|vitest/i.test(matrixSection);
      const hasLintCmd = /lint|eslint|flake8|ruff/i.test(matrixSection);
      const hasTypeCmd = /type-check|mypy|tsc/i.test(matrixSection);
      
      if (!hasTestCmd) {
        console.log(chalk.yellow('  ⚠️  No test command in validation matrix'));
        issues.push({
          type: 'warning',
          category: 'Missing Validation',
          message: 'No test command configured',
          fix: 'Add test command to validation matrix'
        });
        warnings++;
      } else {
        console.log(chalk.green('  ✓ Test command configured'));
      }
      
      if (!hasLintCmd) {
        console.log(chalk.cyan('  ℹ️  No linter configured (optional)'));
        info++;
      } else {
        console.log(chalk.green('  ✓ Linter configured'));
      }
    }
  }
  
  console.log('');
  
  // Audit 4: Check changelog usage
  console.log(chalk.white('📚 Checking changelog...'));
  
  if (fs.existsSync(changelogPath)) {
    const content = fs.readFileSync(changelogPath, 'utf-8');
    const sessionCount = (content.match(/## Session:/g) || []).length;
    
    if (sessionCount === 0) {
      console.log(chalk.cyan('  ℹ️  No sessions recorded yet (new project)'));
      info++;
    } else if (sessionCount === 1) {
      console.log(chalk.cyan('  ℹ️  1 session recorded'));
      info++;
    } else {
      console.log(chalk.green(`  ✓ ${sessionCount} sessions recorded`));
    }
  }
  
  console.log('');
  
  // Audit 5: Check file sizes (detect bloat)
  console.log(chalk.white('📏 Checking file sizes...'));
  
  if (fs.existsSync(essentialsPath)) {
    const stats = fs.statSync(essentialsPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    
    if (stats.size > 100000) { // > 100KB
      console.log(chalk.yellow(`  ⚠️  CODEBASE_ESSENTIALS.md is large (${sizeKB}KB)`));
      issues.push({
        type: 'warning',
        category: 'File Size',
        message: `ESSENTIALS.md is ${sizeKB}KB (consider splitting)`,
        fix: 'Consider using minimal template or archiving old patterns'
      });
      warnings++;
    } else {
      console.log(chalk.green(`  ✓ CODEBASE_ESSENTIALS.md size OK (${sizeKB}KB)`));
    }
  }
  
  console.log('');
  
  // Summary
  console.log(chalk.cyan.bold('📊 Audit Summary:'));
  
  if (issues.length === 0 && info === 0) {
    console.log(chalk.green('  ✓ No issues found'));
  } else {
    if (warnings > 0) {
      console.log(chalk.yellow(`  ⚠️  Warnings: ${warnings}`));
    }
    if (info > 0) {
      console.log(chalk.cyan(`  ℹ️  Info: ${info}`));
    }
  }
  
  console.log('');
  
  // Detailed issues
  if (issues.length > 0) {
    console.log(chalk.cyan.bold('🔧 Issues Found:'));
    console.log('');
    
    issues.forEach((issue, idx) => {
      const icon = issue.type === 'warning' ? '⚠️ ' : 'ℹ️ ';
      console.log(chalk.white(`${idx + 1}. ${icon}${chalk.bold(issue.category)}`));
      console.log(chalk.gray(`   ${issue.message}`));
      console.log(chalk.cyan(`   Fix: ${issue.fix}`));
      console.log('');
    });
  }
  
  // Recommendations
  if (warnings > 0) {
    console.log(chalk.cyan('💡 Next Steps:'));
    console.log(chalk.white('  1. Run: npx aiknowsys sync (fix duplication)'));
    console.log(chalk.white('  2. Complete placeholder sections'));
    console.log(chalk.white('  3. Run: npx aiknowsys check (verify fixes)'));
    console.log('');
  } else {
    console.log(chalk.green('✅ Knowledge system is in good shape!'));
    console.log('');
  }
}
