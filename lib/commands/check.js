import fs from 'fs';
import path from 'path';
import { createLogger } from '../logger.js';

/**
 * Check command - Validates knowledge system setup
 * Verifies that required files exist and are properly configured
 */
export async function check(options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.blank();
  log.header('Knowledge System Health Check', '🔍');
  log.blank();
  
  const checks = [];
  let passed = 0;
  let failed = 0;
  
  // Check 1: Required files exist
  const requiredFiles = [
    { path: 'CODEBASE_ESSENTIALS.md', name: 'Codebase Essentials' },
    { path: 'AGENTS.md', name: 'Agents Workflow' },
    { path: 'CODEBASE_CHANGELOG.md', name: 'Changelog' }
  ];
  
  log.white('📁 Checking required files...');
  for (const file of requiredFiles) {
    const filePath = path.join(targetDir, file.path);
    if (fs.existsSync(filePath)) {
      log.log(`  ✓ ${file.name}`);
      checks.push({ name: file.name, status: 'pass' });
      passed++;
    } else {
      log.log(`  ✗ ${file.name} - Missing`);
      checks.push({ name: file.name, status: 'fail', error: 'File not found' });
      failed++;
    }
  }
  
  log.blank();
  
  // Check 2: Agents and skills installed
  log.white('🤖 Checking agents and skills...');
  
  const agentsDir = path.join(targetDir, '.github', 'agents');
  const skillsDir = path.join(targetDir, '.github', 'skills');
  
  if (fs.existsSync(agentsDir)) {
    const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.agent.md'));
    if (agentFiles.length > 0) {
      log.log(`  ✓ Custom agents (${agentFiles.length} found)`);
      checks.push({ name: 'Custom agents', status: 'pass' });
      passed++;
    } else {
      log.log('  ⚠ Custom agents directory exists but no agents found');
      checks.push({ name: 'Custom agents', status: 'warn', error: 'No agents found' });
    }
  } else {
    log.log('  ⚠ Custom agents not installed');
    checks.push({ name: 'Custom agents', status: 'warn', error: 'Not installed' });
  }
  
  if (fs.existsSync(skillsDir)) {
    const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory());
    if (skillDirs.length > 0) {
      log.log(`  ✓ Skills (${skillDirs.length} found)`);
      checks.push({ name: 'Skills', status: 'pass' });
      passed++;
    } else {
      log.log('  ⚠ Skills directory exists but no skills found');
      checks.push({ name: 'Skills', status: 'warn', error: 'No skills found' });
    }
  } else {
    log.log('  ⚠ Skills not installed');
    checks.push({ name: 'Skills', status: 'warn', error: 'Not installed' });
  }
  
  log.blank();
  
  // Check 3: Placeholder completion
  log.white('📝 Checking placeholder completion...');
  
  const essentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  const placeholderRegex = /{{([A-Z_]+)}}/g;
  const allPlaceholders = [];
  
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
    log.log('  ✓ No placeholders remaining');
    checks.push({ name: 'Placeholder completion', status: 'pass' });
    passed++;
  } else {
    const uniquePlaceholders = [...new Set(allPlaceholders.map(p => p.name))];
    log.log(`  ⚠ ${uniquePlaceholders.length} placeholders remaining:`);
    
    // Group by file and show
    const byFile = {};
    allPlaceholders.forEach(p => {
      if (!byFile[p.file]) byFile[p.file] = new Set();
      byFile[p.file].add(p.name);
    });
    
    Object.entries(byFile).forEach(([file, placeholders]) => {
      log.dim(`    ${file}:`);
      [...placeholders].slice(0, 3).forEach(p => {
        log.dim(`      - {{${p}}}`);
      });
      if (placeholders.size > 3) {
        log.dim(`      ... and ${placeholders.size - 3} more`);
      }
    });
    
    checks.push({ 
      name: 'Placeholder completion', 
      status: 'warn', 
      error: `${uniquePlaceholders.length} placeholders need filling` 
    });
  }
  
  log.blank();
  
  // Check 4: Validation matrix exists
  log.white('✅ Checking validation matrix...');
  
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
        log.log('  ✓ Validation matrix configured');
        checks.push({ name: 'Validation matrix', status: 'pass' });
        passed++;
      } else {
        log.log('  ⚠ Validation matrix exists but no commands configured');
        checks.push({ name: 'Validation matrix', status: 'warn', error: 'No commands configured' });
      }
    } else {
      log.log('  ✗ Validation matrix not found');
      checks.push({ name: 'Validation matrix', status: 'fail', error: 'Section missing' });
      failed++;
    }
  }
  
  log.blank();
  
  // Summary
  log.section('Summary', '📊');
  log.log(`  ✓ Passed: ${passed}`);
  if (failed > 0) {
    log.log(`  ✗ Failed: ${failed}`);
  }
  const warnings = checks.filter(c => c.status === 'warn').length;
  if (warnings > 0) {
    log.log(`  ⚠ Warnings: ${warnings}`);
  }
  
  log.blank();
  
  // Recommendations
  if (failed > 0 || warnings > 0) {
    log.cyan('💡 Recommendations:');
    
    if (!fs.existsSync(path.join(targetDir, 'CODEBASE_ESSENTIALS.md'))) {
      log.white('  • Run: npx aiknowsys init');
    }
    
    if (!fs.existsSync(agentsDir) || !fs.existsSync(skillsDir)) {
      log.white('  • Run: npx aiknowsys install-agents');
      log.white('  • Run: npx aiknowsys install-skills');
    }
    
    const hasPlaceholders = checks.find(c => c.name === 'Placeholder completion' && c.status === 'warn');
    if (hasPlaceholders) {
      log.white('  • Complete TODO sections in CODEBASE_ESSENTIALS.md');
      log.white('  • Use AI assistant to fill remaining placeholders');
    }
    
    log.blank();
  }
  
  // Exit with appropriate code
  if (failed > 0) {
    log.error('Health check failed');
    throw new Error(`Health check failed: ${failed} check(s) failed`);
  } else if (warnings > 0) {
    log.warn('Health check passed with warnings');
  } else {
    log.success('Health check passed');
  }
}
