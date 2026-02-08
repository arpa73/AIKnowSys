#!/usr/bin/env node
/**
 * Updates hooks.json to use shell wrapper scripts instead of direct node commands
 * Converts: "bash": "node .github/hooks/script.js"
 * To:      "bash": ".github/hooks/script.sh"
 */

import fs from 'fs';
import path from 'path';

const hooksJsonPath = '.github/hooks/hooks.json';
const config = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));

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
