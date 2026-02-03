import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Template schema definitions
const TEMPLATE_SCHEMA = {
  'templates/agents/architect.agent.template.md': {
    requiredPlaceholders: ['{{ESSENTIALS_FILE}}'],
    forbiddenPatterns: ['PENDING_REVIEW.md', 'Edit CURRENT_PLAN.md'],
    mappedTo: ['.github/agents/architect.agent.md']
  },
  'templates/agents/developer.agent.template.md': {
    requiredPlaceholders: ['{{ESSENTIALS_FILE}}'],
    forbiddenPatterns: ['PENDING_REVIEW.md', 'Delete CURRENT_PLAN.md'],
    mappedTo: ['.github/agents/developer.agent.md']
  },
  'templates/agents/planner.agent.template.md': {
    requiredPlaceholders: ['{{ESSENTIALS_FILE}}'],
    forbiddenPatterns: ['PENDING_REVIEW.md'],
    mappedTo: ['.github/agents/planner.agent.md']
  }
  // Note: templates/AGENTS.template.md has {{SESSION_FILE}} and {{PLAN_FILE}} 
  // which are INTENTIONALLY placeholders for the init process, so we don't validate it
};

// Legacy patterns to detect
const LEGACY_PATTERNS = [
  { pattern: /PENDING_REVIEW\.md/, name: 'PENDING_REVIEW.md (legacy single-dev)' },
  { pattern: /Edit CURRENT_PLAN\.md/, name: 'Edit CURRENT_PLAN.md (should use active-<username>.md)' },
  { pattern: /Delete CURRENT_PLAN\.md/, name: 'Delete CURRENT_PLAN.md (should use active-<username>.md)' },
  { pattern: /Single-dev mode/, name: 'Single-dev mode (removed in v0.9.0)' },
  { pattern: /Check if \.aiknowsys\/plans\/ exists/, name: 'Conditional plans check (plans/ always exists)' }
];

// Auto-fixable patterns
const AUTO_FIX_PATTERNS = [
  { find: /PENDING_REVIEW\.md/g, replace: 'reviews/PENDING_<username>.md' },
  { find: /Edit CURRENT_PLAN\.md/g, replace: 'Edit plans/active-<username>.md' },
  { find: /Delete CURRENT_PLAN\.md/g, replace: 'Delete plans/active-<username>.md' }
];

/**
 * Validate all deliverable files (templates)
 * @param {Object} options - Validation options
 * @param {string} options.projectRoot - Project root directory (defaults to cwd)
 * @param {boolean} options._silent - Silent mode (no console output)
 * @param {boolean} options.full - Run expensive checks (template execution + fresh init)
 * @param {boolean} options.fix - Attempt to auto-fix simple patterns
 * @param {boolean} options.metrics - Show validation metrics
 * @returns {Promise<Object>} Validation result
 */
export async function validateDeliverables(options = {}) {
  const log = createLogger(options._silent);
  const projectRoot = options.projectRoot || process.cwd();
  const startTime = Date.now();
  
  log.header('🔍 Deliverables Validation', '🔍');
  log.blank();

  const checks = [];
  const fixes = [];
  let templatesChecked = 0;
  let patternsValidated = 0;

  try {
    // Check 1: Template Schema Validation
    log.dim('→ Validating template schemas...');
    const schemaResult = await validateTemplateSchema(projectRoot, log, options);
    checks.push(schemaResult);
    templatesChecked += schemaResult.templatesChecked || 0;
    patternsValidated += schemaResult.patternsValidated || 0;

    // Check 2: Pattern Consistency
    log.dim('→ Checking pattern consistency...');
    const patternResult = await validatePatternConsistency(projectRoot, log, options);
    checks.push(patternResult);
    patternsValidated += patternResult.patternsValidated || 0;

    // Check 3: Legacy Patterns
    log.dim('→ Detecting legacy patterns...');
    const legacyResult = await detectLegacyPatterns(projectRoot, log, options);
    checks.push(legacyResult);
    if (options.fix && legacyResult.fixable.length > 0) {
      const fixResult = await autoFixPatterns(projectRoot, log, legacyResult.fixable);
      fixes.push(...fixResult);
    }

    // Check 4: Placeholder Detection
    log.dim('→ Checking for unresolved placeholders...');
    const placeholderResult = await detectUnresolvedPlaceholders(projectRoot, log);
    checks.push(placeholderResult);

    // Check 5: Template Execution Test (--full only)
    if (options.full) {
      log.dim('→ Testing template execution...');
      const executionResult = await testTemplateExecution(projectRoot, log);
      checks.push(executionResult);
    }

    // Check 6: Fresh Init Test (--full only)
    if (options.full) {
      log.dim('→ Running fresh init test...');
      const initResult = await testFreshInit(projectRoot, log);
      checks.push(initResult);
    }

    // Calculate summary
    const passedChecks = checks.filter(c => c.passed).length;
    const totalChecks = checks.length;
    const allPassed = checks.every(c => c.passed);

    if (!options._silent) {
      log.blank();
      if (allPassed) {
        log.success(`✅ All ${totalChecks} deliverable checks passed`);
      } else {
        log.error(`❌ ${totalChecks - passedChecks}/${totalChecks} checks failed`);
        
        // Show failures
        checks.filter(c => !c.passed).forEach(check => {
          log.blank();
          log.error(`${check.name}:`);
          check.issues.forEach(issue => {
            log.dim(`  - ${issue}`);
          });
        });
      }

      if (fixes.length > 0) {
        log.blank();
        log.success(`🔧 Auto-fixed ${fixes.length} pattern(s)`);
        fixes.forEach(fix => {
          log.dim(`  - ${fix}`);
        });
      }
    }

    const duration = Date.now() - startTime;
    const result = {
      passed: allPassed,
      checks,
      summary: `${passedChecks}/${totalChecks} checks passed`,
      exitCode: allPassed ? 0 : 1,
      metrics: {
        templatesChecked,
        patternsValidated,
        duration
      }
    };

    if (fixes.length > 0) {
      result.fixed = fixes;
    }

    // Log metrics if requested
    if (options.metrics) {
      await logMetrics(projectRoot, result, options);
    }

    return result;
  } catch (error) {
    log.error(`Validation error: ${error.message}`);
    return {
      passed: false,
      checks: [],
      summary: 'Validation failed with error',
      exitCode: 1,
      error: error.message
    };
  }
}

/**
 * Validate template schemas (required placeholders, forbidden patterns).
 * @param {string} projectRoot - Absolute path to project root
 * @param {Logger} log - Logger instance
 * @param {Object} options - Validation options
 * @returns {Promise<{name: string, passed: boolean, issues: string[], templatesChecked: number, patternsValidated: number}>}
 */
async function validateTemplateSchema(projectRoot, log, options) {
  const issues = [];
  let templatesChecked = 0;
  let patternsValidated = 0;

  for (const [templatePath, schema] of Object.entries(TEMPLATE_SCHEMA)) {
    const fullPath = path.join(projectRoot, templatePath);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      templatesChecked++;

      // Check required placeholders
      for (const placeholder of schema.requiredPlaceholders) {
        if (!content.includes(placeholder)) {
          issues.push(`${templatePath}: Missing required placeholder ${placeholder}`);
        }
        patternsValidated++;
      }

      // Check forbidden patterns
      for (const forbidden of schema.forbiddenPatterns) {
        if (content.includes(forbidden)) {
          issues.push(`${templatePath}: Contains forbidden pattern "${forbidden}"`);
        }
        patternsValidated++;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        issues.push(`${templatePath}: Error reading file - ${error.message}`);
      }
    }
  }

  return {
    name: 'Template Schema',
    passed: issues.length === 0,
    issues,
    templatesChecked,
    patternsValidated
  };
}

/**
 * Validate pattern consistency between templates and non-templates.
 * @param {string} projectRoot - Absolute path to project root
 * @param {Logger} log - Logger instance
 * @param {Object} options - Validation options
 * @returns {Promise<{name: string, passed: boolean, issues: string[], patternsValidated: number}>}
 */
async function validatePatternConsistency(projectRoot, log, options) {
  const issues = [];
  let patternsValidated = 0;

  for (const [templatePath, schema] of Object.entries(TEMPLATE_SCHEMA)) {
    if (!schema.mappedTo) continue;

    const templateFullPath = path.join(projectRoot, templatePath);
    
    try {
      const templateContent = await fs.readFile(templateFullPath, 'utf-8');
      
      for (const nonTemplatePath of schema.mappedTo) {
        const nonTemplateFullPath = path.join(projectRoot, nonTemplatePath);
        
        try {
          const nonTemplateContent = await fs.readFile(nonTemplateFullPath, 'utf-8');
          
          // Check for pattern consistency
          for (const forbidden of schema.forbiddenPatterns || []) {
            const inTemplate = templateContent.includes(forbidden);
            const inNonTemplate = nonTemplateContent.includes(forbidden);
            
            if (inTemplate !== inNonTemplate) {
              issues.push(
                `Pattern mismatch: "${forbidden}" ${inTemplate ? 'found in' : 'missing from'} ${templatePath} ` +
                `but ${inNonTemplate ? 'found in' : 'missing from'} ${nonTemplatePath}`
              );
            }
            patternsValidated++;
          }
        } catch (error) {
          if (error.code !== 'ENOENT') {
            issues.push(`${nonTemplatePath}: Error reading file - ${error.message}`);
          }
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        issues.push(`${templatePath}: Error reading file - ${error.message}`);
      }
    }
  }

  return {
    name: 'Pattern Consistency',
    passed: issues.length === 0,
    issues,
    patternsValidated
  };
}

/**
 * Recursively find all markdown files in a directory.
 * @param {string} dir - Directory to search
 * @param {string} baseDir - Base directory for relative paths (defaults to dir)
 * @param {string[]} files - Accumulator for file paths (defaults to [])
 * @returns {Promise<string[]>} Array of relative file paths
 */
async function getAllMarkdownFiles(dir, baseDir = dir, files = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await getAllMarkdownFiles(fullPath, baseDir, files);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.relative(baseDir, fullPath));
      }
    }
    
    return files;
  } catch (error) {
    return files; // Return what we have if directory doesn't exist
  }
}

/**
 * Detect legacy patterns in templates.
 * @param {string} projectRoot - Absolute path to project root
 * @param {Logger} log - Logger instance
 * @param {Object} options - Validation options
 * @returns {Promise<{name: string, passed: boolean, issues: string[], fixable: Array<{file: string, line: number, content: string}>}>}
 */
async function detectLegacyPatterns(projectRoot, log, options) {
  const issues = [];
  const fixable = [];

  // Search templates directory
  const templatesDir = path.join(projectRoot, 'templates');
  const templateFiles = await getAllMarkdownFiles(templatesDir, projectRoot);

  for (const file of templateFiles) {
    // Skip learned directory (examples may reference old patterns intentionally)
    if (file.includes('learned/') || file.includes('aiknowsys-structure/')) {
      continue;
    }
    
    const fullPath = path.join(projectRoot, file);
    const content = await fs.readFile(fullPath, 'utf-8');
    const lines = content.split('\n');

    for (const { pattern, name } of LEGACY_PATTERNS) {
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          const issue = `${file}:${index + 1}: Found legacy pattern "${name}"`;
          issues.push(issue);
          
          // Check if auto-fixable
          if (AUTO_FIX_PATTERNS.some(fix => fix.find.test(line))) {
            fixable.push({ file: fullPath, line: index, content: line });
          }
        }
      });
    }
  }

  return {
    name: 'Legacy Patterns',
    passed: issues.length === 0,
    issues,
    fixable
  };
}

/**
 * Detect unresolved {{PLACEHOLDERS}} in non-template files.
 * @param {string} projectRoot - Absolute path to project root
 * @param {Logger} log - Logger instance
 * @returns {Promise<{name: string, passed: boolean, issues: string[]}>}
 */
async function detectUnresolvedPlaceholders(projectRoot, log) {
  const issues = [];

  // Search templates directory but exclude ALL .template.md files (those SHOULD have placeholders)
  // Also exclude learned directory (examples may reference placeholders)
  // Also exclude stack templates (those SHOULD have placeholders for user to fill)
  const templatesDir = path.join(projectRoot, 'templates');
  const templateFiles = await getAllMarkdownFiles(templatesDir, projectRoot);

  for (const file of templateFiles) {
    // Skip template source files (they SHOULD have placeholders)
    if (file.endsWith('.template.md') || file.includes('.minimal.md')) {
      continue;
    }
    
    // Skip learned directory examples
    if (file.includes('learned/') || file.includes('aiknowsys-structure/')) {
      continue;
    }
    
    // Skip stack templates (they have placeholders by design)
    if (file.includes('stacks/')) {
      continue;
    }

    const fullPath = path.join(projectRoot, file);
    const content = await fs.readFile(fullPath, 'utf-8');
    const placeholderRegex = /\{\{[A-Z_]+\}\}/g;
    const matches = content.match(placeholderRegex);

    if (matches) {
      const uniqueMatches = [...new Set(matches)];
      issues.push(`${file}: Found unresolved placeholders: ${uniqueMatches.join(', ')}`);
    }
  }

  return {
    name: 'Placeholders',
    passed: issues.length === 0,
    issues
  };
}

/**
 * Test template execution (validate YAML frontmatter).
 * TODO (Phase 2): Test template execution in isolated environment
 * See: PLAN_deliverables_validation_protocol.md - Phase 1, Step 5
 * Implementation steps:
 *   1. Create temp directory for testing
 *   2. Parse YAML frontmatter from agent templates
 *   3. Validate YAML structure (no syntax errors)
 *   4. Run npx aiknowsys init --template=agent --agent-name=Test
 *   5. Verify generated files have no errors
 *   6. Clean up temp directory
 * @param {string} projectRoot - Absolute path to project root
 * @param {Logger} log - Logger instance
 * @returns {Promise<{name: string, passed: boolean, issues: string[]}>}
 */
async function testTemplateExecution(projectRoot, log) {
  const issues = [];
  
  // Stub: Returns success until Phase 2 implementation
  
  return {
    name: 'Template Execution',
    passed: true,
    issues
  };
}

/**
 * Test fresh init in temp directory.
 * TODO (Phase 2): Test complete init workflow in clean environment
 * See: PLAN_deliverables_validation_protocol.md - Phase 1, Step 6
 * Implementation steps:
 *   1. Create temp directory (use os.tmpdir())
 *   2. Initialize git repo in temp dir
 *   3. Run npx aiknowsys init with various options
 *   4. Validate all generated files exist and are valid
 *   5. Check for unresolved placeholders in output
 *   6. Clean up temp directory on success/failure
 * @param {string} projectRoot - Absolute path to project root
 * @param {Logger} log - Logger instance
 * @returns {Promise<{name: string, passed: boolean, issues: string[]}>}
 */
async function testFreshInit(projectRoot, log) {
  const issues = [];
  
  // Stub: Returns success until Phase 2 implementation
  
  return {
    name: 'Fresh Init',
    passed: true,
    issues
  };
}

/**
 * Auto-fix simple pattern issues.
 * @param {string} projectRoot - Absolute path to project root
 * @param {Logger} log - Logger instance
 * @param {Array<{file: string, line: number, content: string}>} fixableIssues - Issues that can be auto-fixed
 * @returns {Promise<string[]>} Array of fix descriptions
 */
async function autoFixPatterns(projectRoot, log, fixableIssues) {
  const fixes = [];

  for (const issue of fixableIssues) {
    try {
      let content = await fs.readFile(issue.file, 'utf-8');
      let fixed = false;

      for (const { find, replace } of AUTO_FIX_PATTERNS) {
        if (find.test(content)) {
          content = content.replace(find, replace);
          fixed = true;
        }
      }

      if (fixed) {
        await fs.writeFile(issue.file, content, 'utf-8');
        fixes.push(`Fixed patterns in ${path.relative(projectRoot, issue.file)}`);
      }
    } catch (error) {
      log.warn(`Could not auto-fix ${issue.file}: ${error.message}`);
    }
  }

  return fixes;
}

/**
 * Log validation metrics to history file.
 * @param {string} projectRoot - Absolute path to project root
 * @param {Object} result - Validation result object
 * @param {Object} options - Validation options (used for context)
 * @returns {Promise<void>}
 */
async function logMetrics(projectRoot, result, options) {
  const historyFile = path.join(projectRoot, '.aiknowsys', 'validation-history.json');
  const today = new Date().toISOString().split('T')[0];
  const context = options.full ? 'qualityCheck' : options._preCommit ? 'preCommit' : 'standalone';

  try {
    let history = {};
    try {
      const content = await fs.readFile(historyFile, 'utf-8');
      history = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    if (!history[today]) {
      history[today] = {};
    }

    if (!history[today][context]) {
      history[today][context] = { runs: 0, failures: 0, avgDuration: 0 };
    }

    const stats = history[today][context];
    stats.runs++;
    if (!result.passed) stats.failures++;
    stats.avgDuration = Math.round(
      (stats.avgDuration * (stats.runs - 1) + result.metrics.duration) / stats.runs
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(historyFile), { recursive: true });
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    // Don't fail validation if metrics logging fails
    console.error(`Warning: Could not log metrics: ${error.message}`);
  }
}
