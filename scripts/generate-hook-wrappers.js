#!/usr/bin/env node
/**
 * Generates shell wrappers for all VSCode Copilot hooks
 * Creates .sh (bash) and .ps1 (PowerShell) for each .js/.cjs/.mjs hook
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = path.join(__dirname, '../.github/hooks');

// Read templates
const bashTemplate = fs.readFileSync(path.join(HOOKS_DIR, '_template.sh'), 'utf8');
const ps1Template = fs.readFileSync(path.join(HOOKS_DIR, '_template.ps1'), 'utf8');

// Find all Node.js hooks (exclude templates, git hooks, and generated wrappers)
const hooks = fs.readdirSync(HOOKS_DIR)
  .filter(f => /\.(js|cjs|mjs)$/.test(f))
  .filter(f => !f.startsWith('_')) // Exclude _template.* files
  .map(f => path.basename(f, path.extname(f)));

console.log(`Found ${hooks.length} hooks to wrap:`);
hooks.forEach(h => console.log(`  - ${h}`));

// Generate wrappers
let created = 0;
hooks.forEach(hookName => {
  // Create .sh wrapper
  const shPath = path.join(HOOKS_DIR, `${hookName}.sh`);
  fs.writeFileSync(shPath, bashTemplate, { mode: 0o755 });
  fs.chmodSync(shPath, 0o755); // Ensure executable
  created++;
  
  // Create .ps1 wrapper
  const ps1Path = path.join(HOOKS_DIR, `${hookName}.ps1`);
  fs.writeFileSync(ps1Path, ps1Template);
  created++;
});

console.log(`\n✅ Generated ${created} wrapper files (${hooks.length} × 2 platforms)`);
console.log('Next: Update hooks.json to use .sh/.ps1 instead of node commands');
