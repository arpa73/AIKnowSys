/**
 * Core validation logic for deliverables (templates, schemas, patterns)
 * Phase 2 Batch 3: EXTRACTION
 * 
 * Pure business logic - no logger dependency, returns structured results.
 * CLI wrapper in lib/commands/validate-deliverables.ts handles formatting.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { 
  TemplateSchemaMap, 
  LegacyPattern, 
  AutoFixPattern,
  DeliverableValidationOptions,
  DeliverableValidationResult,
  ValidationCheck
} from '../types/index.js';

// Template schema definitions
const TEMPLATE_SCHEMA: TemplateSchemaMap = {
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
const LEGACY_PATTERNS: LegacyPattern[] = [
  { pattern: /PENDING_REVIEW\.md/, name: 'PENDING_REVIEW.md (legacy single-dev)' },
  { pattern: /Edit CURRENT_PLAN\.md/, name: 'Edit CURRENT_PLAN.md (should use active-<username>.md)' },
  { pattern: /Delete CURRENT_PLAN\.md/, name: 'Delete CURRENT_PLAN.md (should use active-<username>.md)' },
  { pattern: /Single-dev mode/, name: 'Single-dev mode (removed in v0.9.0)' },
  { pattern: /Check if \.aiknowsys\/plans\/ exists/, name: 'Conditional plans check (plans/ always exists)' }
];

// Auto-fixable patterns
const AUTO_FIX_PATTERNS: AutoFixPattern[] = [
  { find: /PENDING_REVIEW\.md/g, replace: 'reviews/PENDING_<username>.md' },
  { find: /Edit CURRENT_PLAN\.md/g, replace: 'Edit plans/active-<username>.md' },
  { find: /Delete CURRENT_PLAN\.md/g, replace: 'Delete plans/active-<username>.md' }
];

/**
 * Core validation logic for deliverables
 * Pure function - no side effects, no logger dependency
 */
export async function validateDeliverablesCore(
  options: DeliverableValidationOptions = {}
): Promise<DeliverableValidationResult> {
  const projectRoot = options.projectRoot || process.cwd();
  const startTime = Date.now();

  const checks = [];
  const fixes = [];
  let templatesChecked = 0;
  let patternsValidated = 0;

  try {
    // Check 1: Template Schema Validation
    const schemaResult = await validateTemplateSchema(projectRoot, options);
    checks.push(schemaResult);
    templatesChecked += schemaResult.templatesChecked || 0;
    patternsValidated += schemaResult.patternsValidated || 0;

    // Check 2: Pattern Consistency
    const patternResult = await validatePatternConsistency(projectRoot, options);
    checks.push(patternResult);
    patternsValidated += patternResult.patternsValidated || 0;

    // Check 3: Maintainer Skill Boundary
    const maintainerResult = await checkMaintainerSkillBoundary(projectRoot);
    checks.push(maintainerResult);

    // Check 4: Legacy Patterns
    const legacyResult = await detectLegacyPatterns(projectRoot, options);
    checks.push(legacyResult);
    if (options.fix && legacyResult.fixable.length > 0) {
      const fixResult = await autoFixPatterns(projectRoot, legacyResult.fixable);
      fixes.push(...fixResult);
    }

    // Check 5: Placeholder Detection
    const placeholderResult = await detectUnresolvedPlaceholders(projectRoot);
    checks.push(placeholderResult);

    // Check 6: Template Execution Test (--full only)
    if (options.full) {
      const executionResult = await testTemplateExecution(projectRoot);
      checks.push(executionResult);
    }

    // Check 7: Fresh Init Test (--full only)
    if (options.full) {
      const initResult = await testFreshInit(projectRoot);
      checks.push(initResult);
    }

    // Calculate summary
    const passedChecks = checks.filter(c => c.passed).length;
    const totalChecks = checks.length;
    const allPassed = checks.every(c => c.passed);

    const duration = Date.now() - startTime;
    const result: DeliverableValidationResult = {
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

    // Add fix suggestion if there are failures
    if (!allPassed) {
      result.fix = 'Run npx aiknowsys validate-deliverables --fix to auto-fix simple patterns';
    }

    // Log metrics if requested
    if (options.metrics) {
      await logMetrics(projectRoot, result, options);
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      passed: false,
      checks: [],
      summary: 'Validation failed with error',
      exitCode: 1,
      error: errorMessage
    };
  }
}

/**
 * Check that maintainer skills (maintainer: true) are not in templates.
 */
async function checkMaintainerSkillBoundary(
  projectRoot: string
): Promise<ValidationCheck> {
  const issues: string[] = [];
  const githubSkillsDir = path.join(projectRoot, '.github', 'skills');
  const templateSkillsDir = path.join(projectRoot, 'templates', 'skills');
  
  try {
    const entries = await fs.readdir(githubSkillsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue; // Skip non-directories
      
      const skill = entry.name;
      const skillPath = path.join(githubSkillsDir, skill, 'SKILL.md');
      
      try {
        const content = await fs.readFile(skillPath, 'utf-8');
        
        // Check for maintainer: true in frontmatter
        const isMaintainer = /^maintainer:\s*true/m.test(content);
        
        if (isMaintainer) {
          // Maintainer skill should NOT be in templates
          const templatePath = path.join(templateSkillsDir, skill);
          try {
            await fs.access(templatePath);
            issues.push(`Maintainer skill "${skill}" should not be in templates/skills/ (has maintainer: true)`);
          } catch {
            // Good - maintainer skill not in templates
          }
        }
      } catch (error: any) {
        // Skip if SKILL.md doesn't exist
        if (error.code !== 'ENOENT') {
          issues.push(`Error reading ${skill}/SKILL.md: ${error.message}`);
        }
      }
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      issues.push(`Error reading .github/skills directory: ${error.message}`);
    }
  }
  
  return {
    name: 'Maintainer Skill Boundary',
    passed: issues.length === 0,
    issues
  };
}

/**
 * Validate template schemas (required placeholders, forbidden patterns).
 */
async function validateTemplateSchema(
  projectRoot: string,
  _options: DeliverableValidationOptions
): Promise<ValidationCheck & { templatesChecked: number; patternsValidated: number }> {
  const issues: string[] = [];
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
    } catch (error: any) {
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
 */
async function validatePatternConsistency(
  projectRoot: string,
  _options: DeliverableValidationOptions
): Promise<ValidationCheck & { patternsValidated: number }> {
  const issues: string[] = [];
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
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            issues.push(`${nonTemplatePath}: Error reading file - ${error.message}`);
          }
        }
      }
    } catch (error: any) {
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
 */
async function getAllMarkdownFiles(
  dir: string,
  baseDir: string = dir,
  files: string[] = []
): Promise<string[]> {
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
  } catch (_error) {
    return files; // Return what we have if directory doesn't exist
  }
}

/**
 * Detect legacy patterns in templates.
 */
async function detectLegacyPatterns(
  projectRoot: string,
  _options: DeliverableValidationOptions
): Promise<ValidationCheck & { fixable: Array<{ file: string; line: number; content: string }> }> {
  const issues: string[] = [];
  const fixable: Array<{ file: string; line: number; content: string }> = [];

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
          
          // Check if auto-fixable (avoid .test() with /g flag - use .match() instead)
          if (AUTO_FIX_PATTERNS.some(fix => line.match(fix.find))) {
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
 */
async function detectUnresolvedPlaceholders(
  projectRoot: string
): Promise<ValidationCheck> {
  const issues: string[] = [];

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
 */
async function testTemplateExecution(
  _projectRoot: string
): Promise<ValidationCheck> {
  const issues: string[] = [];
  
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
 */
async function testFreshInit(
  _projectRoot: string
): Promise<ValidationCheck> {
  const issues: string[] = [];
  
  // Stub: Returns success until Phase 2 implementation
  
  return {
    name: 'Fresh Init',
    passed: true,
    issues
  };
}

/**
 * Auto-fix simple pattern issues.
 */
async function autoFixPatterns(
  projectRoot: string,
  fixableIssues: Array<{ file: string; line: number; content: string }>
): Promise<string[]> {
  const fixes: string[] = [];

  for (const issue of fixableIssues) {
    try {
      let content = await fs.readFile(issue.file, 'utf-8');
      let fixed = false;

      for (const { find, replace } of AUTO_FIX_PATTERNS) {
        // Don't use .test() before .replace() - regex with /g flag has state issues
        const newContent = content.replace(find, replace);
        if (newContent !== content) {
          content = newContent;
          fixed = true;
        }
      }

      if (fixed) {
        await fs.writeFile(issue.file, content, 'utf-8');
        fixes.push(`Fixed patterns in ${path.relative(projectRoot, issue.file)}`);
      }
    } catch (error: any) {
      // Silently skip files we can't fix
      // CLI wrapper will log this warning
      fixes.push(`Could not auto-fix ${path.relative(projectRoot, issue.file)}: ${error.message}`);
    }
  }

  return fixes;
}

/**
 * Log validation metrics to history file.
 */
async function logMetrics(
  projectRoot: string,
  result: DeliverableValidationResult,
  options: DeliverableValidationOptions
): Promise<void> {
  const historyFile = path.join(projectRoot, '.aiknowsys', 'validation-history.json');
  const today = new Date().toISOString().split('T')[0];
  const context = options.full ? 'qualityCheck' : options._preCommit ? 'preCommit' : 'standalone';

  try {
    let history: Record<string, Record<string, { runs: number; failures: number; avgDuration: number }>> = {};
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
      (stats.avgDuration * (stats.runs - 1) + (result.metrics?.duration || 0)) / stats.runs
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(historyFile), { recursive: true });
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error: any) {
    // Don't fail validation if metrics logging fails
    // CLI wrapper can log this warning
  }
}
