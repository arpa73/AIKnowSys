import * as fs from 'node:fs/promises';
import { accessSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

/**
 * Broken link violation
 */
export interface BrokenLink {
  file: string;
  line: number;
  link: string;
  text: string;
  reason: string;
  [key: string]: unknown;
}

/**
 * Link validation result
 */
export interface LinkValidationResult {
  passed: boolean;
  severity?: 'warning';
  message: string;
  fix?: string;
  violations?: BrokenLink[];
}

/**
 * Validate internal links in markdown files
 * @param targetDir - Directory to check
 * @param _config - Configuration
 * @returns Check result
 */
export async function validateLinks(
  targetDir: string,
  _config: Record<string, unknown> = {}
): Promise<LinkValidationResult> {
  const mdFiles = await findMarkdownFiles(targetDir);
  const brokenLinks: BrokenLink[] = [];
  
  // Link pattern: [text](path) or [text](path#anchor)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  for (const filePath of mdFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileDir = path.dirname(filePath);
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const matches = [...line.matchAll(linkPattern)];
      
      matches.forEach(match => {
        const linkText = match[1];
        const linkTarget = match[2];
        
        // Skip external URLs
        if (/^https?:\/\//.test(linkTarget)) {
          return;
        }
        
        // Skip mail links
        if (linkTarget.startsWith('mailto:')) {
          return;
        }
        
        // Parse link (may have anchor)
        const [linkPath, anchor] = linkTarget.split('#');
        
        if (linkPath) {
          // Resolve relative path
          const resolvedPath = path.resolve(fileDir, linkPath);
          
          // Be lenient with template/example/plan directories (expected broken links)
          const relativeFilePath = path.relative(targetDir, filePath);
          const pathParts = relativeFilePath.split(path.sep);
          const isTemplateContext = pathParts.includes('templates') || 
                                    pathParts.includes('examples') ||
                                    relativeFilePath.startsWith('.aiknowsys' + path.sep + 'PLAN_');
          
          // Check if target exists
          if (!existsSync(resolvedPath)) {
            // Skip reporting broken links in templates (they reference user project files)
            if (isTemplateContext) {
              return;
            }
            
            brokenLinks.push({
              file: path.relative(targetDir, filePath),
              line: index + 1,
              link: linkTarget,
              text: linkText,
              reason: 'Target file not found'
            });
          } else if (anchor) {
            try {
              // Check if anchor exists in target file
              const targetContent = readFileSync(resolvedPath, 'utf-8');
              
              // Convert anchor to heading format (kebab-case to Title Case)
              const anchorTitle = anchor.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              const anchorLower = anchor.toLowerCase().replace(/-/g, ' ');
              
              const headingPatterns = [
                new RegExp(`^#+\\s+${anchorTitle}`, 'im'),
                new RegExp(`^#+\\s+${anchorLower}`, 'i'),
                new RegExp(`^#+\\s+.*${anchor}`, 'im'),
                new RegExp(`<a.*id=["']${anchor}["']`, 'i')
              ];
              
              const anchorExists = headingPatterns.some(pattern => 
                pattern.test(targetContent)
              );
              
              if (!anchorExists) {
                brokenLinks.push({
                  file: path.relative(targetDir, filePath),
                  line: index + 1,
                  link: linkTarget,
                  text: linkText,
                  reason: `Anchor #${anchor} not found in target`
                });
              }
            } catch (_err: unknown) {
              // Couldn't read target file
            }
          }
        }
      });
    });
  }
  
  if (brokenLinks.length > 0) {
    return {
      passed: false,
      severity: 'warning',
      message: `Found ${brokenLinks.length} broken link(s)`,
      fix: 'Update or remove broken links',
      violations: brokenLinks
    };
  }
  
  return {
    passed: true,
    message: 'All internal links valid'
  };
}

/**
 * Check if file exists synchronously
 */
function existsSync(filePath: string): boolean {
  try {
    accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find all markdown files in directory
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
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
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}
