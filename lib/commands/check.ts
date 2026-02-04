import * as fs from 'node:fs';
import * as path from 'node:path';
import { createLogger } from '../logger.js';
import { ErrorTemplates } from '../error-helpers.js';
// @ts-ignore - parse-essentials.js not yet migrated
import { parseEssentialsSections, COMPRESSION_THRESHOLDS } from '../parse-essentials.js';
// @ts-ignore - config.js not yet migrated
import { validateConfig } from '../config.js';

interface CheckOptions {
  dir: string;
  essentials?: string;
  _silent?: boolean;
}

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  error?: string;
  info?: string;
}

interface HealthCheckResult {
  checks: CheckResult[];
  passed: number;
  failed: number;
  warnings: string[];
}

interface BloatWarning {
  level: 'error' | 'warn';
  message: string;
}

/**
 * Check command - Validates knowledge system setup
 * Verifies that required files exist and are properly configured
 */
export async function check(options: CheckOptions): Promise<HealthCheckResult> {
  const targetDir = path.resolve(options.dir);
  const essentialsFile = options.essentials || 'CODEBASE_ESSENTIALS.md';
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  // Define commonly-used paths
  const essentialsPath = path.join(targetDir, essentialsFile);
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  
  log.blank();
  log.header('Knowledge System Health Check', '🔍');
  log.blank();
  
  const checks: CheckResult[] = [];
  let passed = 0;
  let failed = 0;
  
  // Check 1: Required files exist
  const requiredFiles = [
    { path: essentialsFile, name: 'Codebase Essentials' },
    { path: 'AGENTS.md', name: 'Agents Workflow' },
    { path: 'CODEBASE_CHANGELOG.md', name: 'Changelog' }
  ];
  
  log.white('📁 Checking required files...');
  const warnings: string[] = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(targetDir, file.path);
    if (fs.existsSync(filePath)) {
      // Check file size and content
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Edge case: Empty file
      if (fileSize === 0) {
        log.log(`  ✗ ${file.name} - Empty file`);
        checks.push({ name: file.name, status: 'fail', error: 'File is empty' });
        failed++;
        throw ErrorTemplates.emptyFile(file.path);
      }
      
      // Edge case: Huge file (>5MB warning, >50MB error)
      const fiveMB = 5 * 1024 * 1024;
      const fiftyMB = 50 * 1024 * 1024;
      
      if (fileSize > fiftyMB) {
        log.log(`  ✗ ${file.name} - File too large (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);
        checks.push({ name: file.name, status: 'fail', error: 'File size exceeds 50MB limit' });
        failed++;
        throw ErrorTemplates.fileTooLarge(file.path, fileSize / 1024 / 1024);
      } else if (fileSize > fiveMB) {
        warnings.push(`${file.name} is large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Consider splitting content into multiple files.`);
      }
      
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
  
  // Check 3: ESSENTIALS bloat detection
  log.white('📏 Checking ESSENTIALS size...');
  
  if (fs.existsSync(essentialsPath)) {
    const content = fs.readFileSync(essentialsPath, 'utf-8');
    const totalLines = content.split('\n').length;
    
    // Parse sections using shared utility
    const sections = parseEssentialsSections(content);
    
    // Check thresholds using configured values
    const bloatWarnings: BloatWarning[] = [];
    
    // Total file size check
    if (totalLines > COMPRESSION_THRESHOLDS.TOTAL_ERROR) {
      bloatWarnings.push({
        level: 'error',
        message: `File is critically large (${totalLines} lines, recommended: <${COMPRESSION_THRESHOLDS.TOTAL_WARN})`
      });
    } else if (totalLines > COMPRESSION_THRESHOLDS.TOTAL_WARN) {
      bloatWarnings.push({
        level: 'warn',
        message: `File size exceeds recommendation (${totalLines} lines, recommended: <${COMPRESSION_THRESHOLDS.TOTAL_WARN})`
      });
    }
    
    // Per-section check using configured threshold
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sections.forEach((section: any) => {
      if (section.lines > COMPRESSION_THRESHOLDS.SECTION_VERBOSE) {
        bloatWarnings.push({
          level: 'warn',
          message: `Section "${section.name}" is verbose (${section.lines} lines, recommended: <${COMPRESSION_THRESHOLDS.SECTION_VERBOSE} per section)`
        });
      }
    });
    
    // Display results
    if (bloatWarnings.length === 0) {
      log.log(`  ✓ File size OK (${totalLines} lines)`);
      checks.push({ name: 'ESSENTIALS size', status: 'pass' });
      passed++;
    } else {
      bloatWarnings.forEach(w => {
        if (w.level === 'error') {
          log.log(`  ✗ ${w.message}`);
          checks.push({ name: 'ESSENTIALS size', status: 'fail', error: w.message });
          failed++;
        } else {
          log.log(`  ⚠ ${w.message}`);
          checks.push({ name: 'ESSENTIALS bloat', status: 'warn', error: w.message });
        }
      });
      
      // Add to warnings array for recommendation section
      bloatWarnings.forEach(w => {
        if (w.level === 'warn') {
          warnings.push(w.message);
        }
      });
      
      // Show compression suggestion
      if (bloatWarnings.length > 0) {
        log.blank();
        log.cyan('💡 Tip: Compress verbose sections');
        log.white('   Extract detailed examples to docs/patterns/');
        log.white('   Keep ESSENTIALS focused and navigable');
        log.blank();
      }
    }
  }
  
  log.blank();
  
  // Check 4: Placeholder completion
  log.white('📝 Checking placeholder completion...');
  
  const placeholderRegex = /{{([A-Z_]+)}}/g;
  const allPlaceholders: Array<{ file: string; name: string }> = [];
  
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
    const byFile: { [file: string]: Set<string> } = {};
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
  
  // Check 5: Validation matrix exists
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
  
  // Check 6: Configuration status
  log.white('✅ Checking configuration...');
  
  const configPath = path.join(targetDir, '.aiknowsys.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      // Validate config structure
      const validation = validateConfig(config);
      if (validation.valid) {
        log.log(`  ✓ Config file valid (version ${config.version || '1.0'})`);
        
        // Show enabled features
        const enabledFeatures = Object.entries(config.features || {})
          .filter(([_, enabled]) => enabled)
          .map(([name]) => name);
        
        if (enabledFeatures.length > 0) {
          log.dim(`    Enabled: ${enabledFeatures.join(', ')}`);
        }
        
        // Show disabled features
        const disabledFeatures = Object.entries(config.features || {})
          .filter(([_, enabled]) => !enabled)
          .map(([name]) => name);
        
        if (disabledFeatures.length > 0) {
          log.dim(`    Disabled: ${disabledFeatures.join(', ')}`);
        }
        
        checks.push({ name: 'Configuration', status: 'pass' });
        passed++;
      } else {
        log.log(`  ⚠ Config file invalid: ${validation.errors.join(', ')}`);
        checks.push({ name: 'Configuration', status: 'warn', error: validation.errors.join(', ') });
      }
    } catch (err) {
      log.log(`  ⚠ Config file exists but cannot be parsed: ${(err as Error).message}`);
      checks.push({ name: 'Configuration', status: 'warn', error: `Parse error: ${(err as Error).message}` });
    }
  } else {
    log.log('  ℹ No config file (using defaults)');
    log.dim('    All features enabled by default');
    // Not a failure - config is optional
    checks.push({ name: 'Configuration', status: 'pass', info: 'Using defaults' });
    passed++;
  }
  
  log.blank();
  
  // Summary
  log.section('Summary', '📊');
  log.log(`  ✓ Passed: ${passed}`);
  if (failed > 0) {
    log.log(`  ✗ Failed: ${failed}`);
  }
  const warningCount = checks.filter(c => c.status === 'warn').length;
  if (warningCount > 0 || warnings.length > 0) {
    log.log(`  ⚠ Warnings: ${warningCount + warnings.length}`);
    warnings.forEach(w => log.warn(`  • ${w}`));
  }
  
  log.blank();
  
  // Recommendations
  if (failed > 0 || warnings.length > 0) {
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
    const failedList = checks.filter(c => c.status === 'fail').map(c => c.name);
    throw ErrorTemplates.validationFailed(failed, failedList);
  } else if (warningCount > 0 || warnings.length > 0) {
    log.warn('Health check passed with warnings');
    return { checks, passed, failed, warnings }; // Return for programmatic use
  } else {
    log.success('Health check passed');
    return { checks, passed, failed, warnings }; // Return for programmatic use
  }
}
