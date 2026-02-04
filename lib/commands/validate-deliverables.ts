import * as fs from 'node:fs';
import * as path from 'node:path';
import { createLogger } from '../logger.js';

interface ValidateOptions {
  fix: boolean;
  _silent?: boolean;
}

interface ValidationIssue {
  file: string;
  line?: number;
  type: string;
  message: string;
}

interface FixableIssue {
  file: string;
  line: number;
  old: string;
  new: string;
  pattern: string;
}

interface CheckResult {
  passed: boolean;
  issues: ValidationIssue[];
  fixableIssues?: FixableIssue[];
}

interface ValidationResult {
  success: boolean;
  totalIssues: number;
  fixedIssues: number;
  checks: {
    schema: CheckResult;
    patterns: CheckResult;
    maintainer: CheckResult;
    legacy: CheckResult;
    placeholders: CheckResult;
    templateExecution: CheckResult;
    freshInit: CheckResult;
  };
}

interface TemplatePlaceholder {
  name: string;
  pattern: RegExp;
  description: string;
}

interface LegacyPattern {
  pattern: RegExp;
  message: string;
  replacement?: string;
  autoFix?: boolean;
}

interface AutoFixPattern {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Template validation schema
const TEMPLATE_SCHEMA: Record<string, TemplatePlaceholder[]> = {
  'CODEBASE_ESSENTIALS.md': [
    {
      name: 'PROJECT_NAME',
      pattern: /\{\{PROJECT_NAME\}\}/g,
      description: 'Project name placeholder'
    }
  ],
  'AGENTS.md': [],
  'CODEBASE_CHANGELOG.md': []
};

// Legacy patterns to detect and warn about
const LEGACY_PATTERNS: LegacyPattern[] = [
  {
    pattern: /\.aiknowsys\/CURRENT_PLAN\.md/g,
    message: 'CURRENT_PLAN.md is deprecated - use .aiknowsys/plans/active-<username>.md instead',
    replacement: '.aiknowsys/plans/active-<username>.md',
    autoFix: false
  },
  {
    pattern: /\.aiknowsys\/PENDING_REVIEW\.md/g,
    message: 'PENDING_REVIEW.md is deprecated - use .aiknowsys/reviews/PENDING_<username>.md instead',
    replacement: '.aiknowsys/reviews/PENDING_<username>.md',
    autoFix: false
  },
  {
    pattern: /\.aiknowsys\/session\.md/g,
    message: 'session.md is deprecated - use .aiknowsys/sessions/YYYY-MM-DD-session.md instead',
    replacement: '.aiknowsys/sessions/YYYY-MM-DD-session.md',
    autoFix: false
  },
  {
    pattern: /@CURRENT_PLAN\.md/g,
    message: '@CURRENT_PLAN.md reference is deprecated - use .aiknowsys/plans/active-<username>.md instead',
    replacement: '.aiknowsys/plans/active-<username>.md',
    autoFix: true
  },
  {
    pattern: /@\.aiknowsys\/CURRENT_PLAN\.md/g,
    message: '@.aiknowsys/CURRENT_PLAN.md reference is deprecated',
    replacement: '.aiknowsys/plans/active-<username>.md',
    autoFix: true
  }
];

// Auto-fix patterns (safe to automatically correct)
const AUTO_FIX_PATTERNS: AutoFixPattern[] = [
  {
    pattern: /@CURRENT_PLAN\.md/g,
    replacement: '.aiknowsys/plans/active-<username>.md',
    description: 'Updated CURRENT_PLAN reference to new plan pointer format'
  },
  {
    pattern: /@\.aiknowsys\/CURRENT_PLAN\.md/g,
    replacement: '.aiknowsys/plans/active-<username>.md',
    description: 'Updated CURRENT_PLAN reference to new plan pointer format'
  }
];

export async function validateDeliverables(options: ValidateOptions): Promise<ValidationResult> {
  const fix = options.fix || false;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.blank();
  log.header('Validating Deliverables', '✅');
  log.blank();
  
  const result: ValidationResult = {
    success: true,
    totalIssues: 0,
    fixedIssues: 0,
    checks: {
      schema: { passed: true, issues: [] },
      patterns: { passed: true, issues: [] },
      maintainer: { passed: true, issues: [] },
      legacy: { passed: true, issues: [], fixableIssues: [] },
      placeholders: { passed: true, issues: [] },
      templateExecution: { passed: true, issues: [] },
      freshInit: { passed: true, issues: [] }
    }
  };
  
  try {
    const templateDir = path.join(process.cwd(), 'templates');
    
    if (!fs.existsSync(templateDir)) {
      log.error('templates/ directory not found');
      result.success = false;
      return result;
    }
    
    // Check 1: Validate maintainer skill boundaries
    log.cyan('🔍 Checking maintainer skill boundaries...');
    result.checks.maintainer = await checkMaintainerSkillBoundary(templateDir);
    result.totalIssues += result.checks.maintainer.issues.length;
    
    // Check 2: Validate template schema (required placeholders)
    log.cyan('🔍 Validating template schema...');
    result.checks.schema = await validateTemplateSchema(templateDir);
    result.totalIssues += result.checks.schema.issues.length;
    
    // Check 3: Validate pattern consistency
    log.cyan('🔍 Checking pattern consistency...');
    result.checks.patterns = await validatePatternConsistency(templateDir);
    result.totalIssues += result.checks.patterns.issues.length;
    
    // Check 4: Detect legacy patterns
    log.cyan('🔍 Detecting legacy patterns...');
    result.checks.legacy = await detectLegacyPatterns(templateDir, log, fix);
    result.totalIssues += result.checks.legacy.issues.length;
    if (fix && result.checks.legacy.fixableIssues) {
      result.fixedIssues += result.checks.legacy.fixableIssues.length;
    }
    
    // Check 5: Detect unresolved placeholders
    log.cyan('🔍 Checking for unresolved placeholders...');
    result.checks.placeholders = await detectUnresolvedPlaceholders(templateDir);
    result.totalIssues += result.checks.placeholders.issues.length;
    
    // Check 6: Validate template execution stub
    log.cyan('🔍 Validating template execution stub...');
    result.checks.templateExecution = await validateTemplateExecutionStub();
    result.totalIssues += result.checks.templateExecution.issues.length;
    
    // Check 7: Validate fresh init stub
    log.cyan('🔍 Validating fresh init stub...');
    result.checks.freshInit = await validateFreshInitStub();
    result.totalIssues += result.checks.freshInit.issues.length;
    
    // Summary
    log.blank();
    if (result.totalIssues === 0) {
      log.success('✅ All deliverables validated successfully!');
    } else {
      if (fix && result.fixedIssues > 0) {
        log.yellow(`⚠️  Found ${result.totalIssues} issues, fixed ${result.fixedIssues} automatically`);
        if (result.totalIssues > result.fixedIssues) {
          log.error(`❌ ${result.totalIssues - result.fixedIssues} issues require manual fixes`);
          result.success = false;
        }
      } else {
        log.error(`❌ Found ${result.totalIssues} issues`);
        result.success = false;
      }
    }
    
    log.blank();
    
    // Display metrics
    log.section('Validation Metrics', '📊');
    log.blank();
    log.dim(`   Maintainer Boundaries: ${result.checks.maintainer.issues.length} issues`);
    log.dim(`   Template Schema:       ${result.checks.schema.issues.length} issues`);
    log.dim(`   Pattern Consistency:   ${result.checks.patterns.issues.length} issues`);
    log.dim(`   Legacy Patterns:       ${result.checks.legacy.issues.length} issues`);
    log.dim(`   Unresolved Placeholders: ${result.checks.placeholders.issues.length} issues`);
    log.dim(`   Template Execution:    ${result.checks.templateExecution.issues.length} issues`);
    log.dim(`   Fresh Init:            ${result.checks.freshInit.issues.length} issues`);
    log.blank();
    
    return result;
    
  } catch (error) {
    log.error((error as Error).message);
    result.success = false;
    return result;
  }
}

async function checkMaintainerSkillBoundary(templateDir: string): Promise<CheckResult> {
  const result: CheckResult = { passed: true, issues: [] };
  
  const skillsDir = path.join(process.cwd(), '.github', 'skills');
  const templateSkillsDir = path.join(templateDir, 'skills');
  
  if (!fs.existsSync(skillsDir)) {
    return result;
  }
  
  // Read all skills from .github/skills
  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  
  for (const skillName of skillDirs) {
    const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
    
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, 'utf-8');
      
      // Parse frontmatter for maintainer flag
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const isMaintainer = /maintainer:\s*true/i.test(frontmatter);
        
        if (isMaintainer) {
          // Check if this skill exists in templates/skills/
          const templateSkillPath = path.join(templateSkillsDir, skillName);
          
          if (fs.existsSync(templateSkillPath)) {
            result.issues.push({
              file: `templates/skills/${skillName}`,
              type: 'MAINTAINER_BOUNDARY',
              message: `Maintainer skill "${skillName}" should not be synced to templates/`
            });
            result.passed = false;
          }
        }
      }
    }
  }
  
  return result;
}

async function validateTemplateSchema(templateDir: string): Promise<CheckResult> {
  const result: CheckResult = { passed: true, issues: [] };
  
  for (const [file, placeholders] of Object.entries(TEMPLATE_SCHEMA)) {
    const filePath = path.join(templateDir, file);
    
    if (!fs.existsSync(filePath)) {
      result.issues.push({
        file,
        type: 'MISSING_TEMPLATE',
        message: `Required template file not found: ${file}`
      });
      result.passed = false;
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for required placeholders
    for (const placeholder of placeholders) {
      if (!placeholder.pattern.test(content)) {
        result.issues.push({
          file,
          type: 'MISSING_PLACEHOLDER',
          message: `Missing required placeholder: ${placeholder.name}`
        });
        result.passed = false;
      }
    }
  }
  
  return result;
}

async function validatePatternConsistency(templateDir: string): Promise<CheckResult> {
  const result: CheckResult = { passed: true, issues: [] };
  
  // Compare templates with non-template equivalents
  const filesToCheck = [
    { template: 'AGENTS.md', original: 'AGENTS.md' },
    { template: 'CODEBASE_CHANGELOG.md', original: 'CODEBASE_CHANGELOG.md' }
  ];
  
  for (const { template, original } of filesToCheck) {
    const templatePath = path.join(templateDir, template);
    const originalPath = path.join(process.cwd(), original);
    
    if (!fs.existsSync(templatePath)) {
      result.issues.push({
        file: template,
        type: 'MISSING_TEMPLATE',
        message: `Template file not found: ${template}`
      });
      result.passed = false;
      continue;
    }
    
    if (!fs.existsSync(originalPath)) {
      continue; // Skip if original doesn't exist
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const originalContent = fs.readFileSync(originalPath, 'utf-8');
    
    // For AGENTS.md and CHANGELOG, templates should match originals closely
    // (allowing for placeholders)
    const templateNormalized = templateContent
      .replace(/\{\{[^}]+\}\}/g, 'PLACEHOLDER')
      .replace(/\s+/g, ' ')
      .trim();
    
    const originalNormalized = originalContent
      .replace(/\s+/g, ' ')
      .trim();
    
    // Check structural similarity (within 10% length difference)
    const lengthDiff = Math.abs(templateNormalized.length - originalNormalized.length);
    const maxDiff = originalNormalized.length * 0.1;
    
    if (lengthDiff > maxDiff) {
      result.issues.push({
        file: template,
        type: 'PATTERN_MISMATCH',
        message: `Template differs significantly from original ${original} (${Math.round(lengthDiff / originalNormalized.length * 100)}% difference)`
      });
      result.passed = false;
    }
  }
  
  return result;
}

async function detectLegacyPatterns(templateDir: string, log: ReturnType<typeof createLogger>, fix: boolean): Promise<CheckResult> {
  const result: CheckResult = { passed: true, issues: [], fixableIssues: [] };
  
  // Scan all markdown files in templates/
  const markdownFiles = await scanMarkdownFiles(templateDir);
  
  for (const file of markdownFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    for (const legacyPattern of LEGACY_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(legacyPattern.pattern.source, 'g');
      
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const relativePath = path.relative(process.cwd(), file);
        
        result.issues.push({
          file: relativePath,
          line: lineNumber,
          type: 'LEGACY_PATTERN',
          message: legacyPattern.message
        });
        result.passed = false;
        
        // Track fixable issues
        if (legacyPattern.autoFix && legacyPattern.replacement) {
          if (!result.fixableIssues) result.fixableIssues = [];
          result.fixableIssues.push({
            file: relativePath,
            line: lineNumber,
            old: match[0],
            new: legacyPattern.replacement,
            pattern: legacyPattern.message
          });
        }
      }
    }
  }
  
  // Auto-fix if requested
  if (fix && result.fixableIssues && result.fixableIssues.length > 0) {
    await autoFixPatterns(result.fixableIssues, log);
  }
  
  return result;
}

async function detectUnresolvedPlaceholders(templateDir: string): Promise<CheckResult> {
  const result: CheckResult = { passed: true, issues: [] };
  
  // Scan all markdown files in templates/
  const markdownFiles = await scanMarkdownFiles(templateDir);
  
  // Common placeholder patterns that should NOT appear in templates
  const forbiddenPlaceholders = [
    /\[Your Project Name\]/gi,
    /\[Project Name\]/gi,
    /\[TODO\]/gi,
    /\[FIXME\]/gi,
    /\[INSERT.*?\]/gi
  ];
  
  for (const file of markdownFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(templateDir, file);
    
    for (const pattern of forbiddenPlaceholders) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.source, 'g');
      
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        result.issues.push({
          file: relativePath,
          line: lineNumber,
          type: 'UNRESOLVED_PLACEHOLDER',
          message: `Unresolved placeholder found: ${match[0]}`
        });
        result.passed = false;
      }
    }
  }
  
  return result;
}

async function validateTemplateExecutionStub(): Promise<CheckResult> {
  const result: CheckResult = { passed: true, issues: [] };
  
  const stubPath = path.join(process.cwd(), 'lib', 'template-execution-stub.js');
  
  if (!fs.existsSync(stubPath)) {
    result.issues.push({
      file: 'lib/template-execution-stub.js',
      type: 'MISSING_FILE',
      message: 'Template execution stub not found'
    });
    result.passed = false;
    return result;
  }
  
  const content = fs.readFileSync(stubPath, 'utf-8');
  
  // Check for required functions
  const requiredFunctions = [
    'processTemplate',
    'processMarkdown',
    'processYaml'
  ];
  
  for (const fn of requiredFunctions) {
    if (!content.includes(`function ${fn}`) && !content.includes(`const ${fn}`)) {
      result.issues.push({
        file: 'lib/template-execution-stub.js',
        type: 'MISSING_FUNCTION',
        message: `Missing required function: ${fn}`
      });
      result.passed = false;
    }
  }
  
  return result;
}

async function validateFreshInitStub(): Promise<CheckResult> {
  const result: CheckResult = { passed: true, issues: [] };
  
  const stubPath = path.join(process.cwd(), 'lib', 'fresh-init-stub.js');
  
  if (!fs.existsSync(stubPath)) {
    result.issues.push({
      file: 'lib/fresh-init-stub.js',
      type: 'MISSING_FILE',
      message: 'Fresh init stub not found'
    });
    result.passed = false;
    return result;
  }
  
  const content = fs.readFileSync(stubPath, 'utf-8');
  
  // Check for required structure
  const requiredElements = [
    'export async function freshInit',
    'createDirectoryStructure',
    'copyTemplateFiles'
  ];
  
  for (const element of requiredElements) {
    if (!content.includes(element)) {
      result.issues.push({
        file: 'lib/fresh-init-stub.js',
        type: 'MISSING_ELEMENT',
        message: `Missing required element: ${element}`
      });
      result.passed = false;
    }
  }
  
  return result;
}

async function scanMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(currentDir: string): Promise<void> {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function autoFixPatterns(fixableIssues: FixableIssue[], log: ReturnType<typeof createLogger>): Promise<void> {
  const fileChanges = new Map<string, string>();
  
  // Group fixes by file
  for (const issue of fixableIssues) {
    const filePath = path.join(process.cwd(), issue.file);
    
    if (!fileChanges.has(filePath)) {
      fileChanges.set(filePath, fs.readFileSync(filePath, 'utf-8'));
    }
    
    const content = fileChanges.get(filePath);
    if (!content) continue;
    
    // Apply fix
    let updatedContent = content;
    for (const autoFix of AUTO_FIX_PATTERNS) {
      updatedContent = updatedContent.replace(autoFix.pattern, autoFix.replacement);
    }
    
    fileChanges.set(filePath, updatedContent);
  }
  
  // Write fixed files
  for (const [filePath, content] of fileChanges.entries()) {
    fs.writeFileSync(filePath, content);
    log.success(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
  }
}
