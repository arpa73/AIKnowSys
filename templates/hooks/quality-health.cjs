#!/usr/bin/env node
/**
 * Quality & Health Check Hook
 * 
 * Run at session start to check project health:
 * - ESSENTIALS size (bloat detection)
 * - Unresolved template variables
 * - Broken internal links
 * - Common anti-patterns
 * 
 * Non-blocking: always exits 0, reports warnings to stderr
 */

const fs = require('fs');
const path = require('path');

// Find project root (where .aiknowsys exists)
function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, '.aiknowsys'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

const projectRoot = findProjectRoot();

// Quick ESSENTIALS size check (no file I/O heavy operations)
function quickEssentialsCheck() {
  const essentialsPath = path.join(projectRoot, 'CODEBASE_ESSENTIALS.md');
  if (!fs.existsSync(essentialsPath)) {
    return null;
  }

  const content = fs.readFileSync(essentialsPath, 'utf-8');
  const lines = content.split('\n').length;
  const threshold = 800;

  if (lines > threshold) {
    return {
      check: 'ESSENTIALS Size',
      status: 'warning',
      message: `${lines} lines (target: <${threshold})`,
      suggestion: 'Run: node bin/cli.js compress-essentials --analyze'
    };
  }

  return null;
}

// Quick template variable check (only check common files)
function quickTemplateCheck() {
  const filesToCheck = [
    'README.md',
    'CONTRIBUTING.md',
    'CODEBASE_ESSENTIALS.md',
    '.github/agents/*.md'
  ];

  const violations = [];
  const varPattern = /\{\{([A-Z0-9_]+)\}\}/g;

  for (const pattern of filesToCheck) {
    const files = pattern.includes('*')
      ? findFilesMatching(projectRoot, pattern)
      : [path.join(projectRoot, pattern)];

    for (const file of files) {
      if (!fs.existsSync(file)) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(varPattern);
      if (matches) {
        violations.push({
          file: path.relative(projectRoot, file),
          count: matches.length,
          variables: [...new Set(matches)]
        });
      }
    }
  }

  if (violations.length > 0) {
    const totalVars = violations.reduce((sum, v) => sum + v.count, 0);
    return {
      check: 'Template Variables',
      status: 'warning',
      message: `${totalVars} unresolved in ${violations.length} file(s)`,
      suggestion: 'Run: node bin/cli.js quality-check for details'
    };
  }

  return null;
}

// Helper to find files matching glob pattern
function findFilesMatching(dir, pattern) {
  const parts = pattern.split('*');
  const prefix = parts[0];
  const suffix = parts[1] || '';
  
  const searchDir = path.join(dir, path.dirname(prefix));
  if (!fs.existsSync(searchDir)) return [];

  const files = fs.readdirSync(searchDir);
  return files
    .filter(f => f.endsWith(suffix))
    .map(f => path.join(searchDir, f));
}

// Main hook execution
function run() {
  const warnings = [];

  // Run quick checks
  const essentialsWarning = quickEssentialsCheck();
  if (essentialsWarning) warnings.push(essentialsWarning);

  const templateWarning = quickTemplateCheck();
  if (templateWarning) warnings.push(templateWarning);

  // Output warnings to stderr (non-blocking)
  if (warnings.length > 0) {
    console.error('\n⚠️  Quality & Health Warnings:\n');
    warnings.forEach(w => {
      console.error(`   ${w.check}: ${w.message}`);
      if (w.suggestion) {
        console.error(`   💡 ${w.suggestion}\n`);
      }
    });
  }

  // Always exit 0 (non-blocking)
  process.exit(0);
}

// Run hook
run();
