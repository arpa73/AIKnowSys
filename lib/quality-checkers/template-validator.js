import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_EXCLUDE_PATTERNS } from './common.js';

/**
 * Find unresolved {{VARIABLES}} in generated files
 * @param {string} targetDir - Directory to check
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} Check result
 */
export async function validateTemplates(targetDir, config = {}) {
  const excludePatterns = config.excludePatterns || DEFAULT_EXCLUDE_PATTERNS;
  
  const mdFiles = await findMarkdownFiles(targetDir, excludePatterns);
  const violations = [];
  
  for (const filePath of mdFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Find all {{VARIABLE}} patterns using indexOf
      let pos = 0;
      while ((pos = line.indexOf('{{', pos)) !== -1) {
        const endPos = line.indexOf('}}', pos + 2);
        if (endPos !== -1) {
          const variable = line.substring(pos + 2, endPos);
          // Check if it's all uppercase with underscores and numbers
          if (/^[A-Z0-9_]+$/.test(variable)) {
            violations.push({
              file: path.relative(targetDir, filePath),
              line: index + 1,
              variable: variable,
              context: line.trim()
            });
          }
          pos = endPos + 2;
        } else {
          break;
        }
      }
    });
  }
  
  if (violations.length > 0) {
    return {
      passed: false,
      severity: 'error',
      message: `Found ${violations.length} unresolved template variable(s)`,
      fix: 'Review generated files and replace {{VARIABLES}} with actual values',
      violations
    };
  }
  
  return {
    passed: true,
    message: 'No unresolved template variables found'
  };
}

/**
 * Find all markdown files in directory, excluding certain patterns
 */
async function findMarkdownFiles(dir, excludePatterns) {
  const files = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(dir, fullPath);
      
      // Check exclusions
      const isExcluded = excludePatterns.some(pattern => 
        relativePath.includes(pattern) || entry.name === pattern
      );
      
      if (isExcluded) {
        continue;
      }
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}
