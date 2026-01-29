import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { createLogger } from '../logger.js';
import { scan } from './scan.js';
import { installAgents } from './install-agents.js';
import { installSkills } from './install-skills.js';
import { getPackageDir, copyTemplate, displayAIPrompt, FileTracker } from '../utils.js';

export async function migrate(options) {
  const targetDir = path.resolve(options.dir);
  const essentialsFile = options.essentials || 'CODEBASE_ESSENTIALS.md';
  const log = createLogger(false);
  const tracker = new FileTracker();
  
  log.blank();
  log.header('Knowledge System Migration (Existing Project)', '🚀');
  log.blank();
  log.white('This will:');
  log.dim('  1. Scan your codebase');
  log.dim('  2. Generate draft documentation');
  log.dim('  3. Install custom agents');
  log.dim('  4. Set up skills');
  log.dim('  5. Initialize changelog');
  log.blank();
  
  const { proceed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'proceed',
    message: 'Continue?',
    default: true
  }]);
  
  if (!proceed) {
    log.log('\x1b[33mMigration cancelled.\x1b[0m');
    return;
  }
  
  try {
  
  // Step 1: Scan codebase
  log.blank();
  log.cyan('══════════════════════════════════════════');
  log.header('Step 1/5: Scanning codebase', '');
  log.cyan('══════════════════════════════════════════');
  
  const spinner = ora('Scanning codebase...').start();
  const _findings = await scan({ dir: targetDir, output: 'CODEBASE_ESSENTIALS.draft.md' });
  spinner.succeed('Codebase scan complete');
  
  // Track draft file for rollback if migration fails
  const draftPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.draft.md');
  tracker.trackFile(draftPath);
  
  // Step 2: Review draft
  log.blank();
  log.cyan('══════════════════════════════════════════');
  log.header('Step 2/5: Review generated draft', '');
  log.cyan('══════════════════════════════════════════');
  log.blank();
  log.log('\x1b[33m\x1b[1m📝 CODEBASE_ESSENTIALS.draft.md has been created\x1b[0m');
  log.blank();
  log.white('IMPORTANT: You must complete the TODO sections!');
  log.blank();
  log.dim('Required sections to fill in:');
  log.dim('  - Core Patterns (how you structure code, handle auth, make API calls)');
  log.dim('  - Critical Invariants (rules that must never be violated)');
  log.dim('  - Common Gotchas (issues new contributors encounter)');
  log.dim('  - Architecture Decisions (why you chose this approach)');
  log.blank();
  
  const { reviewed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'reviewed',
    message: `Have you completed and renamed the file to ${essentialsFile}?`,
    default: false
  }]);
  
  const essentialsPath = path.join(targetDir, essentialsFile);
  
  if (!reviewed && !fs.existsSync(essentialsPath)) {
    const { action } = await inquirer.prompt([{
      type: 'rawlist',
      name: 'action',
      message: `${essentialsFile} not found. What would you like to do?`,
      choices: [
        { name: 'Rename draft file now and continue', value: 'rename' },
        { name: 'Continue anyway (not recommended)', value: 'continue' },
        { name: 'Exit and complete the file first', value: 'exit' }
      ],
      default: 1
    }]);
    
    if (action === 'exit') {
      log.log('\x1b[33mComplete CODEBASE_ESSENTIALS.md and run: npx aiknowsys migrate\x1b[0m');
      return;
    }
    
    const draftFilePath = path.join(targetDir, 'CODEBASE_ESSENTIALS.draft.md');
    if (action === 'rename' && fs.existsSync(draftFilePath)) {
      fs.renameSync(draftFilePath, essentialsPath);
      log.success('✅ Renamed to CODEBASE_ESSENTIALS.md');
    }
  }
  
  // Step 3: Generate AGENTS.md
  log.blank();
  log.cyan('══════════════════════════════════════════');
  log.header('Step 3/5: Creating AGENTS.md', '');
  log.cyan('══════════════════════════════════════════');
  
  spinner.start('Creating AGENTS.md...');
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    const packageDir = getPackageDir();
    await copyTemplate(
      path.join(packageDir, 'templates', 'AGENTS.template.md'),
      agentsPath
    );
    tracker.trackFile(agentsPath);
    spinner.succeed('AGENTS.md created');
    log.success('✅ AGENTS.md created (customize validation matrix as needed)');
  } else {
    spinner.info('AGENTS.md already exists');
    log.dim('⏭️  AGENTS.md already exists, skipping');
  }
  
  // Step 4: Install custom agents
  log.blank();
  log.cyan('══════════════════════════════════════════');
  log.header('Step 4/5: Installing custom agents', '');
  log.cyan('══════════════════════════════════════════');
  
  spinner.start('Installing custom agents...');
  await installAgents({ dir: targetDir, essentials: essentialsFile });
  spinner.succeed('Custom agents installed');
  
  // Step 5: Install skills
  log.blank();
  log.cyan('══════════════════════════════════════════');
  log.header('Step 5/5: Installing universal skills', '');
  log.cyan('══════════════════════════════════════════');
  
  spinner.start('Installing universal skills...');
  await installSkills({ dir: targetDir });
  spinner.succeed('Universal skills installed');
  
  // Initialize changelog
  const changelogPath = path.join(targetDir, 'CODEBASE_CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    const packageDir = getPackageDir();
    const projectName = path.basename(targetDir);
    await copyTemplate(
      path.join(packageDir, 'templates', 'CODEBASE_CHANGELOG.template.md'),
      changelogPath,
      {
        '{{PROJECT_NAME}}': projectName,
        '{{DATE}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }
    );
    tracker.trackFile(changelogPath);
    log.success('✅ CODEBASE_CHANGELOG.md initialized');
  }
  
  // Final summary
  log.blank();
  log.log('\x1b[32m\x1b[1m═══════════════════════════════════════════\x1b[0m');
  log.log('\x1b[32m\x1b[1m  ✅ Migration Complete!\x1b[0m');
  log.log('\x1b[32m\x1b[1m═══════════════════════════════════════════\x1b[0m');
  log.blank();
  log.white('📁 Created files:');
  log.dim('   • CODEBASE_ESSENTIALS.md');
  log.dim('   • AGENTS.md');
  log.dim('   • CODEBASE_CHANGELOG.md');
  log.dim('   • .github/agents/');
  log.dim('   • .github/skills/');
  log.blank();
  log.header('Start using', '🚀');
  log.white('   @Developer <your request>');
  log.blank();
  
  displayAIPrompt(log, [
    'If there are still TODO sections, copy this prompt:',
    '',
    '"I migrated my project to aiknowsys. Please review CODEBASE_ESSENTIALS.md',
    'and complete any remaining TODO sections by:',
    '1. Analyzing my actual codebase structure and patterns',
    '2. Filling in specific validation commands (not generic examples)',
    '3. Documenting the core patterns I actually use',
    '4. Recording critical invariants and gotchas',
    '5. Explaining architecture decisions',
    'Make it project-specific, not a template!"'
  ]);
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    await tracker.rollback(log);
    throw error;
  }
}
