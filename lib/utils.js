import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the package installation directory
 */
export function getPackageDir() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, '..');
}

/**
 * Check if directory has an existing project
 */
export async function hasExistingProject(dir) {
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
 * Copy a template file with optional variable replacement
 */
export async function copyTemplate(source, dest, replacements = {}) {
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
    content = content.replace(new RegExp(escapeRegExp(key), 'g'), value);
  }
  
  // Ensure destination directory exists
  const destDir = path.dirname(dest);
  await fs.promises.mkdir(destDir, { recursive: true });
  
  await fs.promises.writeFile(dest, content);
}

/**
 * Recursively copy a directory
 */
export async function copyDirectory(source, dest) {
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
 * @param {Object} log - Logger instance for output
 * @param {Array<string>} promptLines - Lines of the prompt message
 */
export function displayAIPrompt(log, promptLines) {
  log.blank();
  log.log('\x1b[33m\x1b[1m🤖 AI Assistant Prompt:\x1b[0m');
  log.dim('   Copy this prompt to your AI assistant to complete setup:');
  log.blank();
  
  for (const line of promptLines) {
    log.cyan(`   ${line}`);
  }
  
  log.blank();
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
