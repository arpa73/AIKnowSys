#!/usr/bin/env node
/**
 * Install git hooks for AIKnowSys context auto-rebuild
 * Run manually: node scripts/install-context-hooks.js
 * Or automatically via npm postinstall
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function installHooks() {
  const hooks = ['post-commit', 'post-merge'];
  let installed = 0;
  let skipped = 0;

  console.log('📦 Installing git hooks for context auto-rebuild...\n');

  // Check if .git directory exists
  const gitDir = path.join(process.cwd(), '.git');
  try {
    await fs.access(path.join(gitDir, 'hooks'));
  } catch (err) {
    console.log('⚠️  No .git/hooks directory found (not a git repository?)');
    console.log('   Hooks will not be installed, but lazy rebuild will still work.\n');
    return;
  }

  for (const hook of hooks) {
    const source = path.join(__dirname, '..', '.github', 'hooks', hook);
    const dest = path.join(gitDir, 'hooks', hook);

    try {
      // Check if hook already exists
      try {
        await fs.access(dest);
        console.log(`⏭️  Skipped ${hook} (already exists)`);
        skipped++;
        continue;
      } catch {
        // Hook doesn't exist, proceed with installation
      }

      // Copy hook file
      await fs.copyFile(source, dest);

      // Make executable (chmod +x)
      await fs.chmod(dest, 0o755);

      console.log(`✅ Installed ${hook} hook`);
      installed++;
    } catch (err) {
      console.error(`❌ Failed to install ${hook}:`, err.message);
    }
  }

  console.log(`\n📊 Summary: ${installed} installed, ${skipped} skipped`);
  
  if (installed > 0) {
    console.log('\n🚀 Git hooks active! Index will auto-rebuild after commits/merges.');
  }
  
  if (skipped > 0) {
    console.log('   To reinstall existing hooks, delete them from .git/hooks/ first.');
  }
}

installHooks().catch(err => {
  console.error('Error installing hooks:', err);
  process.exit(0); // Don't fail npm install if hooks fail
});
