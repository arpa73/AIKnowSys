import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Pattern violation
 */
export interface PatternViolation {
  file: string;
  line: number;
  rule: string;
  message: string;
  context: string;
  fix: string;
  [key: string]: unknown;
}

/**
 * Pattern scan result
 */
export interface PatternScanResult {
  passed: boolean;
  severity?: 'warning';
  message: string;
  violations: PatternViolation[];
}

/**
 * Scan for common pattern violations
 * @param targetDir - Directory to check
 * @param _config - Configuration
 * @returns Check result
 */
export async function scanPatterns(
  targetDir: string,
  _config: Record<string, unknown> = {}
): Promise<PatternScanResult> {
  const violations: PatternViolation[] = [];
  
  // Find JavaScript files
  const jsFiles = await findJSFiles(targetDir);
  
  // Check if project is ES module
  let isESMProject = false;
  try {
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(packageContent);
    isESMProject = pkg.type === 'module';
  } catch {
    // package.json not found or invalid
  }
  
  for (const filePath of jsFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(targetDir, filePath);
    const lines = content.split('\n');
    const isCJS = filePath.endsWith('.cjs');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
        return;
      }
      
      // Check 1: Hardcoded absolute paths (skip regex literals)
      const hasHardcodedPath = /\/Users\/|\/home\/[a-z]+\/|C:\\/.test(line);
      // Better regex literal detection: must start with = or ( or : followed by /
      const isRegexLiteral = /[=(:]\s*\/.*\/[gimuy]*/.test(line);
      
      if (hasHardcodedPath && !isRegexLiteral) {
        violations.push({
          file: relativePath,
          line: index + 1,
          rule: 'no-hardcoded-paths',
          message: 'Hardcoded absolute path detected',
          context: line.trim(),
          fix: 'Use path.resolve(), process.cwd(), or relative paths'
        });
      }
      
      // Check 2: require() in ES module project (exclude .cjs files and test files)
      const hasRequire = /require\(/.test(line);
      const isTestFile = relativePath.startsWith('test/') || 
                         relativePath.includes('/test/') || 
                         relativePath.endsWith('.test.js');
      const isInString = /['"`].*require\(.*['"`]/.test(line);
      
      // Allow require() in test files (common for mocking/fixtures) and strings
      if (isESMProject && !isCJS && hasRequire && !isTestFile && !isInString) {
        violations.push({
          file: relativePath,
          line: index + 1,
          rule: 'no-require-in-esm',
          message: 'Use import instead of require() in ES module project',
          context: line.trim(),
          fix: 'Convert to: import ... from ...'
        });
      }
    });
  }
  
  if (violations.length > 0) {
    return {
      passed: false,
      severity: 'warning',
      message: `Found ${violations.length} pattern violation(s)`,
      violations
    };
  }
  
  return {
    passed: true,
    message: 'No pattern violations found',
    violations: []
  };
}

/**
 * Find all JavaScript files in directory
 */
async function findJSFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const excludePatterns = ['node_modules', '.git', 'dist', 'build', 'coverage', 'templates', '.aiknowsys/archive'];
  
  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (excludePatterns.includes(entry.name)) {
        continue;
      }
      
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.cjs')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}
