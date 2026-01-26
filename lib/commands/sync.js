import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Sync command - Syncs AGENTS.md validation reference with CODEBASE_ESSENTIALS.md
 * Ensures AGENTS.md correctly references the validation matrix from ESSENTIALS
 */
export async function sync(options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  
  if (!silent) {
    console.log('');
    console.log(chalk.cyan.bold('🔄 Sync Validation Matrix Reference'));
    console.log('');
  }
  
  const essentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  
  // Check files exist
  if (!fs.existsSync(essentialsPath)) {
    if (!silent) {
      console.log(chalk.red('❌ CODEBASE_ESSENTIALS.md not found'));
      console.log(chalk.gray('   Run: npx aiknowsys init'));
    }
    throw new Error('CODEBASE_ESSENTIALS.md not found');
  }
  
  if (!fs.existsSync(agentsPath)) {
    if (!silent) {
      console.log(chalk.red('❌ AGENTS.md not found'));
      console.log(chalk.gray('   Run: npx aiknowsys init'));
    }
    throw new Error('AGENTS.md not found');
  }
  
  const spinner = silent ? null : ora('Checking validation matrix...').start();
  
  // Read ESSENTIALS to verify validation matrix exists
  const essentialsContent = fs.readFileSync(essentialsPath, 'utf-8');
  const hasValidationMatrix = essentialsContent.includes('## 2. Validation Matrix') || 
                               essentialsContent.includes('## Validation Matrix');
  
  if (!hasValidationMatrix) {
    if (spinner) spinner.fail('Validation matrix not found in CODEBASE_ESSENTIALS.md');
    if (!silent) {
      console.log('');
      console.log(chalk.yellow('💡 Add a Validation Matrix section to CODEBASE_ESSENTIALS.md'));
    }
    throw new Error('Validation matrix not found in CODEBASE_ESSENTIALS.md');
  }
  
  if (spinner) spinner.text = 'Reading AGENTS.md...';
  
  // Read AGENTS.md
  let agentsContent = fs.readFileSync(agentsPath, 'utf-8');
  
  // Check if AGENTS already has the reference format
  const hasReference = agentsContent.includes('CODEBASE_ESSENTIALS.md - Validation Matrix') ||
                       agentsContent.includes('CODEBASE_ESSENTIALS.md#validation-matrix');
  
  if (hasReference) {
    if (spinner) spinner.succeed('Validation matrix reference already up to date');
    if (!silent) {
      console.log('');
      console.log(chalk.green('✅ AGENTS.md correctly references CODEBASE_ESSENTIALS.md'));
      console.log('');
    }
    return;
  }
  
  if (spinner) spinner.text = 'Updating AGENTS.md...';
  
  // Find the validation matrix section in AGENTS.md
  // Look for the pattern that might have a duplicated matrix
  const validationSectionRegex = /(\*\*Validation Matrix.*?\*\*)([\s\S]*?)(\n---|\n## |\n\*\*🚨 RULE:)/;
  const match = agentsContent.match(validationSectionRegex);
  
  if (!match) {
    if (spinner) spinner.warn('Could not find validation matrix section in AGENTS.md');
    if (!silent) {
      console.log('');
      console.log(chalk.yellow('⚠️  Manual update required'));
      console.log(chalk.white('Add this to your AGENTS.md validation section:'));
      console.log('');
      console.log(chalk.gray('**Validation Matrix:**'));
      console.log(chalk.gray(''));
      console.log(chalk.gray('👉 **See [CODEBASE_ESSENTIALS.md - Validation Matrix](CODEBASE_ESSENTIALS.md#validation-matrix)**'));
      console.log(chalk.gray(''));
      console.log(chalk.gray('The validation matrix lives in CODEBASE_ESSENTIALS.md as the single source of truth.'));
      console.log('');
    }
    return;
  }
  
  // Replace the validation matrix content with a reference
  const newValidationSection = `${match[1]}

👉 **See [CODEBASE_ESSENTIALS.md - Validation Matrix](CODEBASE_ESSENTIALS.md#validation-matrix)**

The validation matrix lives in CODEBASE_ESSENTIALS.md as the single source of truth. Always run all commands from that matrix after making changes.
`;
  
  agentsContent = agentsContent.replace(validationSectionRegex, newValidationSection + match[3]);
  
  // Write updated AGENTS.md
  fs.writeFileSync(agentsPath, agentsContent);
  
  if (spinner) spinner.succeed('AGENTS.md updated');
  if (!silent) {
    console.log('');
    console.log(chalk.green('✅ Validation matrix reference synced'));
    console.log('');
    console.log(chalk.cyan('💡 What changed:'));
    console.log(chalk.white('  • AGENTS.md now references CODEBASE_ESSENTIALS.md'));
    console.log(chalk.white('  • Update validation matrix in ESSENTIALS.md only (single source of truth)'));
    console.log('');
  }
}
