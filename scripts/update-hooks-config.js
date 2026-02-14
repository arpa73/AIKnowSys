#!/usr/bin/env node
/**
 * Updates hooks.json to use shell wrapper scripts instead of direct node commands
 * Converts: "bash": "node .github/hooks/script.js"
 * To:      "bash": ".github/hooks/script.sh"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hooksJsonPath = path.resolve(__dirname, '../.github/hooks/hooks.json');

let config;
try {
  config = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
} catch (_error) {
  console.error('❌ Error: Cannot read or parse hooks.json');
  console.error(`   Path: ${hooksJsonPath}`);
  console.error('\n💡 Ensure you are in the project root and hooks.json exists');
  console.error('   Expected format: Valid JSON with "hooks" key');
  process.exit(1);
}

let updated = 0;

// Process all hooks
Object.keys(config.hooks).forEach(lifecycle => {
  config.hooks[lifecycle].forEach(hook => {
    if (hook.type === 'command') {
      // Extract hook name from node command
      const match = hook.bash?.match(/node \.github\/hooks\/(.+)\.(js|cjs|mjs)$/);
      if (match) {
        const hookName = match[1];
        hook.bash = `.github/hooks/${hookName}.sh`;
        hook.powershell = `.github/hooks/${hookName}.ps1`;
        console.log(`✓ Updated: ${hookName}`);
        updated++;
      }
    }
  });
});

// Write updated configuration
fs.writeFileSync(hooksJsonPath, JSON.stringify(config, null, 2) + '\n');

console.log('\n✅ hooks.json updated');
console.log(`   • ${updated} hooks now use shell wrappers`);
console.log('   • bash: .sh files');
console.log('   • powershell: .ps1 files');
