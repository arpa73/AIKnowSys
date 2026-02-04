import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Logger interface (matches createLogger return type)
 */
interface Logger {
  warn(message: string): void;
  info(message: string): void;
  blank(): void;
  log(message: string): void;
  success(message: string): void;
  dim(message: string): void;
  cyan(message: string): void;
}

/**
 * FileTracker - Track created files/directories for atomic rollback
 * 
 * Used to ensure clean state when init/migrate operations fail.
 * Files and directories are deleted in reverse order (LIFO) during rollback.
 * Only empty directories are deleted to prevent accidental data loss.
 * 
 * @example
 * const tracker = new FileTracker();
 * tracker.trackFile('/path/to/file.txt');
 * tracker.trackDir('/path/to/directory');
 * try {
 *   // ... create files/directories ...
 * } catch (error) {
 *   await tracker.rollback(log); // Deletes tracked items on error
 *   throw error;
 * }
 */
export class FileTracker {
  private createdFiles: string[] = [];
  private createdDirs: string[] = [];

  /**
   * Track a file that was created
   * @param filePath - Absolute path to the created file
   */
  trackFile(filePath: string): void {
    this.createdFiles.push(filePath);
  }

  /**
   * Track a directory that was created
   * @param dirPath - Absolute path to the created directory
   */
  trackDir(dirPath: string): void {
    this.createdDirs.push(dirPath);
  }

  /**
   * Rollback all tracked changes by deleting files and directories in reverse order
   * @param log - Logger instance with warn() and info() methods
   */
  async rollback(log: Logger): Promise<void> {
    if (this.createdFiles.length === 0 && this.createdDirs.length === 0) {
      return;
    }

    log.warn('Rolling back changes...');

    // Delete files in reverse order (last created first)
    for (let i = this.createdFiles.length - 1; i >= 0; i--) {
      const filePath = this.createdFiles[i];
      try {
        const exists = await fs.promises.access(filePath).then(() => true).catch(() => false);
        if (exists) {
          await fs.promises.unlink(filePath);
          log.info(`  Deleted file: ${path.basename(filePath)}`);
        }
      } catch (error) {
        // Best effort - log but don't throw
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.warn(`  Could not delete ${path.basename(filePath)}: ${errorMessage}`);
      }
    }

    // Delete directories in reverse order, but only if empty
    for (let i = this.createdDirs.length - 1; i >= 0; i--) {
      const dirPath = this.createdDirs[i];
      try {
        const exists = await fs.promises.access(dirPath).then(() => true).catch(() => false);
        if (exists) {
          const entries = await fs.promises.readdir(dirPath);
          if (entries.length === 0) {
            await fs.promises.rmdir(dirPath);
            log.info(`  Deleted directory: ${path.basename(dirPath)}`);
          } else {
            log.info(`  Kept directory (not empty): ${path.basename(dirPath)}`);
          }
        }
      } catch (error) {
        // Best effort - log but don't throw
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.warn(`  Could not delete directory ${path.basename(dirPath)}: ${errorMessage}`);
      }
    }
  }
}

/**
 * Get the package installation directory
 */
export function getPackageDir(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, '..');
}

/**
 * Check if directory has an existing project
 */
export async function hasExistingProject(dir: string): Promise<boolean> {
  const indicators = [
    'src',
    'backend',
    'frontend',
    'package.json',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle'
  ];
  
  for (const indicator of indicators) {
    const filePath = path.join(dir, indicator);
    const exists = await fs.promises.access(filePath).then(() => true).catch(() => false);
    if (exists) {
      return true;
    }
  }
  
  return false;
}

/**
 * Template replacements type
 */
export type Replacements = Record<string, string | boolean>;

/**
 * Copy a template file with optional variable replacement
 */
export async function copyTemplate(source: string, dest: string, replacements: Replacements = {}): Promise<void> {
  try {
    await fs.promises.access(source);
  } catch {
    throw new Error(`Template not found: ${source}`);
  }
  
  let content = await fs.promises.readFile(source, 'utf-8');
  
  // Handle conditional blocks FIRST (before simple replacements)
  // Pattern: {{#if VAR}}...{{else}}...{{/if}} or {{#if VAR}}...{{/if}}
  for (const [key, value] of Object.entries(replacements)) {
    if (key.startsWith('{{') && key.endsWith('}}')) {
      // Extract variable name from {{VAR}} format
      const varName = key.slice(2, -2);
      
      // Handle {{#if VAR}}...{{else}}...{{/if}} blocks
      const ifElseRegex = new RegExp(
        `\\{\\{#if ${escapeRegExp(varName)}\\}\\}([\\s\\S]*?)\\{\\{else\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`,
        'g'
      );
      
      if (value === 'true' || value === true) {
        // Keep the "if" block, remove the "else" block
        content = content.replace(ifElseRegex, '$1');
      } else {
        // Keep the "else" block, remove the "if" block
        content = content.replace(ifElseRegex, '$2');
      }
      
      // Handle {{#if VAR}}...{{/if}} blocks (no else)
      const ifOnlyRegex = new RegExp(
        `\\{\\{#if ${escapeRegExp(varName)}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`,
        'g'
      );
      
      if (value === 'true' || value === true) {
        // Keep the content
        content = content.replace(ifOnlyRegex, '$1');
      } else {
        // Remove the entire block
        content = content.replace(ifOnlyRegex, '');
      }
    }
  }
  
  // Then handle simple {{PLACEHOLDER}} replacements
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(escapeRegExp(key), 'g'), String(value));
  }
  
  // Ensure destination directory exists
  const destDir = path.dirname(dest);
  await fs.promises.mkdir(destDir, { recursive: true });
  
  await fs.promises.writeFile(dest, content);
}

/**
 * Recursively copy a directory
 */
export async function copyDirectory(source: string, dest: string): Promise<void> {
  try {
    await fs.promises.access(source);
  } catch {
    throw new Error(`Source directory not found: ${source}`);
  }
  
  await fs.promises.mkdir(dest, { recursive: true });
  
  const entries = await fs.promises.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destPath);
    } else {
      await fs.promises.copyFile(sourcePath, destPath);
    }
  }
}

/**
 * Display AI assistant completion prompt
 * @param log - Logger instance for output
 * @param promptLines - Lines of the prompt message
 * @returns Whether clipboard copy succeeded
 */
export async function displayAIPrompt(log: Logger, promptLines: string[]): Promise<boolean> {
  const promptText = promptLines.join('\n');
  
  // Try to copy to clipboard
  let copiedToClipboard = false;
  try {
    const clipboardy = await import('clipboardy');
    await clipboardy.default.write(promptText);
    copiedToClipboard = true;
  } catch {
    // Clipboard not available - that's ok
  }
  
  log.blank();
  log.log('\x1b[33m\x1b[1m🤖 AI Assistant Prompt:\x1b[0m');
  if (copiedToClipboard) {
    log.success('   ✅ Copied to clipboard! Just paste into your AI assistant.');
  } else {
    log.dim('   Copy this prompt to your AI assistant to complete setup:');
  }
  log.blank();
  
  for (const line of promptLines) {
    log.cyan(`   ${line}`);
  }
  
  log.blank();
  
  // Return clipboard status so caller can show final message
  return copiedToClipboard;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
