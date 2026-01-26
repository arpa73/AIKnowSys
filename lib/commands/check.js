import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Check command - Validates knowledge system setup
 * Verifies that required files exist and are properly configured
 */
export async function check(options) {
  const targetDir = path.resolve(options.dir);
  
  console.log('');
  console.log(chalk.cyan.bold('🔍 Knowledge System Health Check'));
  console.log('');
  
  const checks = [];
  let passed = 0;
  let failed = 0;
  
  // Check 1: Required files exist
  const requiredFiles = [
    { path: 'CODEBASE_ESSENTIALS.md', name: 'Codebase Essentials' },
    { path: 'AGENTS.md', name: 'Agents Workflow' },
    { path: 'CODEBASE_CHANGELOG.md', name: 'Changelog' }
  ];
  
  console.log(chalk.white('📁 Checking required files...'));
  for (const file of requiredFiles) {
    const filePath = path.join(targetDir, file.path);
    if (fs.existsSync(filePath)) {
      console.log(chalk.green(`  ✓ ${file.name}`));
      checks.push({ name: file.name, status: 'pass' });
      passed++;
    } else {
      console.log(chalk.red(`  ✗ ${file.name} - Missing`));
      checks.push({ name: file.name, status: 'fail', error: 'File not found' });
      failed++;
    }
  }
  
  console.log('');
  
  // Check 2: Agents and skills installed
  console.log(chalk.white('🤖 Checking agents and skills...'));
  
  const agentsDir = path.join(targetDir, '.github', 'agents');
  const skillsDir = path.join(targetDir, '.github', 'skills');
  
  if (fs.existsSync(agentsDir)) {
    const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.agent.md'));
    if (agentFiles.length > 0) {
      console.log(chalk.green(`  ✓ Custom agents (${agentFiles.length} found)`));
      checks.push({ name: 'Custom agents', status: 'pass' });
      passed++;
    } else {
      console.log(chalk.yellow(`  ⚠ Custom agents directory exists but no agents found`));
      checks.push({ name: 'Custom agents', status: 'warn', error: 'No agents found' });
    }
  } else {
    console.log(chalk.yellow(`  ⚠ Custom agents not installed`));
    checks.push({ name: 'Custom agents', status: 'warn', error: 'Not installed' });
  }
  
  if (fs.existsSync(skillsDir)) {
    const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory());
    if (skillDirs.length > 0) {
      console.log(chalk.green(`  ✓ Skills (${skillDirs.length} found)`));
      checks.push({ name: 'Skills', status: 'pass' });
      passed++;
    } else {
      console.log(chalk.yellow(`  ⚠ Skills directory exists but no skills found`));
      checks.push({ name: 'Skills', status: 'warn', error: 'No skills found' });
    }
  } else {
    console.log(chalk.yellow(`  ⚠ Skills not installed`));
    checks.push({ name: 'Skills', status: 'warn', error: 'Not installed' });
  }
  
  console.log('');
  
  // Check 3: Placeholder completion
  console.log(chalk.white('📝 Checking placeholder completion...'));
  
  const essentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  const placeholderRegex = /{{([A-Z_]+)}}/g;
  let allPlaceholders = [];
  
  // Check CODEBASE_ESSENTIALS.md
  if (fs.existsSync(essentialsPath)) {
    const content = fs.readFileSync(essentialsPath, 'utf-8');
    const placeholders = [...content.matchAll(placeholderRegex)];
    allPlaceholders.push(...placeholders.map(m => ({ file: 'CODEBASE_ESSENTIALS.md', name: m[1] })));
  }
  
  // Check AGENTS.md for critical placeholders
  if (fs.existsSync(agentsPath)) {
    const content = fs.readFileSync(agentsPath, 'utf-8');
    const placeholders = [...content.matchAll(placeholderRegex)];
    allPlaceholders.push(...placeholders.map(m => ({ file: 'AGENTS.md', name: m[1] })));
  }
  
  if (allPlaceholders.length === 0) {
    console.log(chalk.green(`  ✓ No placeholders remaining`));
    checks.push({ name: 'Placeholder completion', status: 'pass' });
    passed++;
  } else {
    const uniquePlaceholders = [...new Set(allPlaceholders.map(p => p.name))];
    console.log(chalk.yellow(`  ⚠ ${uniquePlaceholders.length} placeholders remaining:`));
    
    // Group by file and show
    const byFile = {};
    allPlaceholders.forEach(p => {
      if (!byFile[p.file]) byFile[p.file] = new Set();
      byFile[p.file].add(p.name);
    });
    
    Object.entries(byFile).forEach(([file, placeholders]) => {
      console.log(chalk.gray(`    ${file}:`));
      [...placeholders].slice(0, 3).forEach(p => {
        console.log(chalk.gray(`      - {{${p}}}`));
      });
      if (placeholders.size > 3) {
        console.log(chalk.gray(`      ... and ${placeholders.size - 3} more`));
      }
    });
    
    checks.push({ 
      name: 'Placeholder completion', 
      status: 'warn', 
      error: `${uniquePlaceholders.length} placeholders need filling` 
    });
  }
  
  console.log('');
  
  // Check 4: Validation matrix exists
  console.log(chalk.white('✅ Checking validation matrix...'));
  
  if (fs.existsSync(essentialsPath)) {
    const content = fs.readFileSync(essentialsPath, 'utf-8');
    const hasValidationMatrix = content.includes('## 2. Validation Matrix') || 
                                 content.includes('## Validation Matrix');
    
    if (hasValidationMatrix) {
      // Check if it has actual commands (not just TBD)
      const matrixSection = content.split(/## \d*\.?\s*Validation Matrix/i)[1]?.split(/##/)[0] || '';
      const hasRealCommands = matrixSection.includes('npm') || 
                              matrixSection.includes('test') ||
                              matrixSection.includes('lint') ||
                              matrixSection.includes('build');
      
      if (hasRealCommands) {
        console.log(chalk.green(`  ✓ Validation matrix configured`));
        checks.push({ name: 'Validation matrix', status: 'pass' });
        passed++;
      } else {
        console.log(chalk.yellow(`  ⚠ Validation matrix exists but no commands configured`));
        checks.push({ name: 'Validation matrix', status: 'warn', error: 'No commands configured' });
      }
    } else {
      console.log(chalk.red(`  ✗ Validation matrix not found`));
      checks.push({ name: 'Validation matrix', status: 'fail', error: 'Section missing' });
      failed++;
    }
  }
  
  console.log('');
  
  // Summary
  console.log(chalk.cyan.bold('📊 Summary:'));
  console.log(chalk.green(`  ✓ Passed: ${passed}`));
  if (failed > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failed}`));
  }
  const warnings = checks.filter(c => c.status === 'warn').length;
  if (warnings > 0) {
    console.log(chalk.yellow(`  ⚠ Warnings: ${warnings}`));
  }
  
  console.log('');
  
  // Recommendations
  if (failed > 0 || warnings > 0) {
    console.log(chalk.cyan('💡 Recommendations:'));
    
    if (!fs.existsSync(path.join(targetDir, 'CODEBASE_ESSENTIALS.md'))) {
      console.log(chalk.white('  • Run: npx aiknowsys init'));
    }
    
    if (!fs.existsSync(agentsDir) || !fs.existsSync(skillsDir)) {
      console.log(chalk.white('  • Run: npx aiknowsys install-agents'));
      console.log(chalk.white('  • Run: npx aiknowsys install-skills'));
    }
    
    const hasPlaceholders = checks.find(c => c.name === 'Placeholder completion' && c.status === 'warn');
    if (hasPlaceholders) {
      console.log(chalk.white('  • Complete TODO sections in CODEBASE_ESSENTIALS.md'));
      console.log(chalk.white('  • Use AI assistant to fill remaining placeholders'));
    }
    
    console.log('');
  }
  
  // Exit with appropriate code
  if (failed > 0) {
    console.log(chalk.red('❌ Health check failed'));
    throw new Error(`Health check failed: ${failed} check(s) failed`);
  } else if (warnings > 0) {
    console.log(chalk.yellow('⚠️  Health check passed with warnings'));
  } else {
    console.log(chalk.green('✅ Health check passed'));
  }
}
