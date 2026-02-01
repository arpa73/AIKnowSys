#!/usr/bin/env node
/**
 * Install Git Hooks - Cross-Platform Version
 * 
 * Copies Git hooks from .git-hooks/ to .git/hooks/
 * This ensures TDD enforcement and other quality checks are active
 * 
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Determine project root
// When copied to user project: scripts/install-git-hooks.cjs → parent is project root
// When in templates: templates/scripts/install-git-hooks.cjs → need to go up 2 levels
const scriptDir = __dirname;
let projectRoot = path.resolve(scriptDir, '..');

// Smart path resolution for dual-context usage:
// - When run in user project: scriptDir/../ is project root
// - When run in aiknowsys repo (testing): scriptDir/../ is templates/, need templates/../ for repo root
if (path.basename(projectRoot) === 'templates') {
  projectRoot = path.resolve(projectRoot, '..');
}

const hooksSource = path.join(projectRoot, '.git-hooks');
const hooksTarget = path.join(projectRoot, '.git', 'hooks');

/**
 * Create readline interface for user prompts
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask yes/no question (cross-platform)
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} - True if yes, false if no
 */
function askYesNo(question) {
  const rl = createInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Make file executable (Unix-like systems only)
 * On Windows, Git hooks work without explicit chmod
 * @param {string} filePath - Path to file
 */
function makeExecutable(filePath) {
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(filePath, 0o755);
    } catch (err) {
      console.warn(`⚠️  Warning: Could not make ${path.basename(filePath)} executable: ${err.message}`);
    }
  }
}

/**
 * Main installation logic
 */
async function installHooks() {
  console.log('🔧 Installing Git hooks...');
  console.log('');

  // Check if .git directory exists
  const gitDir = path.join(projectRoot, '.git');
  if (!fs.existsSync(gitDir)) {
    console.error('❌ Error: .git directory not found');
    console.error('   This script must be run from a Git repository');
    process.exit(1);
  }

  // Check if hooks source directory exists
  if (!fs.existsSync(hooksSource)) {
    console.error('❌ Error: .git-hooks directory not found');
    console.error(`   Expected: ${hooksSource}`);
    process.exit(1);
  }

  // Create hooks directory if it doesn't exist
  if (!fs.existsSync(hooksTarget)) {
    fs.mkdirSync(hooksTarget, { recursive: true });
  }

  // Get all files in hooks source directory
  const sourceFiles = fs.readdirSync(hooksSource);
  let installed = 0;

  for (const fileName of sourceFiles) {
    // Skip README.md and other documentation files
    if (fileName === 'README.md' || fileName.endsWith('.md')) {
      continue;
    }

    const sourcePath = path.join(hooksSource, fileName);
    const targetPath = path.join(hooksTarget, fileName);

    // Skip directories
    if (fs.statSync(sourcePath).isDirectory()) {
      continue;
    }

    // Check if hook already exists
    if (fs.existsSync(targetPath)) {
      console.log(`⚠️  ${fileName} already exists`);
      const overwrite = await askYesNo('   Overwrite? (y/N) ');
      console.log('');
      
      if (!overwrite) {
        console.log(`   Skipped ${fileName}`);
        continue;
      }
    }

    // Copy hook file
    try {
      fs.copyFileSync(sourcePath, targetPath);
      makeExecutable(targetPath);
      console.log(`✅ Installed: ${fileName}`);
      installed++;
    } catch (err) {
      console.error(`❌ Failed to install ${fileName}: ${err.message}`);
      console.error(`   Source: ${sourcePath}`);
      console.error(`   Target: ${targetPath}`);
    }
  }

  console.log('');
  if (installed === 0) {
    console.log('ℹ️  No new hooks installed');
  } else {
    console.log(`✅ Installed ${installed} hook(s) successfully!`);
    console.log('');
    console.log('Active hooks:');
    
    // List installed hooks (exclude .sample files)
    const hookFiles = fs.readdirSync(hooksTarget)
      .filter(file => !file.endsWith('.sample'))
      .sort();
    
    hookFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
  }

  console.log('');
  console.log('📚 See .git-hooks/README.md for hook documentation');
  console.log('');
}

// Run installation
installHooks().catch((err) => {
  console.error('❌ Installation failed:', err.message);
  process.exit(1);
});
