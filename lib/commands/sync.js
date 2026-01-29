import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { createLogger } from '../logger.js';
import { ErrorTemplates } from '../error-helpers.js';

/**
 * Sync command - Syncs AGENTS.md validation reference with CODEBASE_ESSENTIALS.md
 * Ensures AGENTS.md correctly references the validation matrix from ESSENTIALS
 */
export async function sync(options) {
  const targetDir = path.resolve(options.dir);
  const essentialsFile = options.essentials || 'CODEBASE_ESSENTIALS.md';
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.blank();
  log.header('🔄 Sync Validation Matrix Reference');
  log.blank();
  
  const essentialsPath = path.join(targetDir, essentialsFile);
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  
  // Check files exist
  if (!fs.existsSync(essentialsPath)) {
    throw ErrorTemplates.fileNotFound(essentialsFile, ['npx aiknowsys init']);
  }
  
  if (!fs.existsSync(agentsPath)) {
    throw ErrorTemplates.fileNotFound('AGENTS.md', ['npx aiknowsys init']);
  }
  
  const spinner = silent ? null : ora('Checking validation matrix...').start();
  
  // Read ESSENTIALS to verify validation matrix exists
  const essentialsContent = fs.readFileSync(essentialsPath, 'utf-8');
  const hasValidationMatrix = essentialsContent.includes('## 2. Validation Matrix') || 
                               essentialsContent.includes('## Validation Matrix');
  
  if (!hasValidationMatrix) {
    if (spinner) spinner.fail('Validation matrix not found in CODEBASE_ESSENTIALS.md');
    throw ErrorTemplates.missingSection('Validation Matrix', essentialsFile);
  }
  
  if (spinner) spinner.text = 'Reading AGENTS.md...';
  
  // Read AGENTS.md
  let agentsContent = fs.readFileSync(agentsPath, 'utf-8');
  
  // Check if AGENTS already has the reference format
  const hasReference = agentsContent.includes(`${essentialsFile} - Validation Matrix`) ||
                       agentsContent.includes(`${essentialsFile}#validation-matrix`);
  
  if (hasReference) {
    if (spinner) spinner.succeed('Validation matrix reference already up to date');
    log.blank();
    log.success(`AGENTS.md correctly references ${essentialsFile}`);
    log.blank();
    return;
  }
  
  if (spinner) spinner.text = 'Updating AGENTS.md...';
  
  // Find the validation matrix section in AGENTS.md
  // Look for the pattern that might have a duplicated matrix
  const validationSectionRegex = /(\*\*Validation Matrix.*?\*\*)([\s\S]*?)(\n---|\n## |\n\*\*🚨 RULE:)/;
  const match = agentsContent.match(validationSectionRegex);
  
  if (!match) {
    if (spinner) spinner.warn('Could not find validation matrix section in AGENTS.md');
    log.blank();
    log.warn('Manual update required');
    log.white('Add this to your AGENTS.md validation section:');
    log.blank();
    log.dim('**Validation Matrix:**');
    log.dim('');
    log.dim(`👉 **See [${essentialsFile} - Validation Matrix](${essentialsFile}#validation-matrix)**`);
    log.dim('');
    log.dim(`The validation matrix lives in ${essentialsFile} as the single source of truth.`);
    log.blank();
    return;
  }
  
  // Replace the validation matrix content with a reference
  const newValidationSection = `${match[1]}

👉 **See [${essentialsFile} - Validation Matrix](${essentialsFile}#validation-matrix)**

The validation matrix lives in ${essentialsFile} as the single source of truth. Always run all commands from that matrix after making changes.
`;
  
  agentsContent = agentsContent.replace(validationSectionRegex, newValidationSection + match[3]);
  
  // Write updated AGENTS.md
  fs.writeFileSync(agentsPath, agentsContent);
  
  if (spinner) spinner.succeed('AGENTS.md updated');
  log.blank();
  log.success('Validation matrix reference synced');
  log.blank();
  log.info('What changed:');
  log.white('  • AGENTS.md now references CODEBASE_ESSENTIALS.md');
  log.white('  • Update validation matrix in ESSENTIALS.md only (single source of truth)');
  log.blank();
}
