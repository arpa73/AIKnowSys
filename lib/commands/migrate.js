import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { scan } from './scan.js';
import { installAgents } from './install-agents.js';
import { installSkills } from './install-skills.js';
import { getPackageDir, copyTemplate, displayAIPrompt } from '../utils.js';

export async function migrate(options) {
  const targetDir = path.resolve(options.dir);
  
  console.log('');
  console.log(chalk.cyan.bold('🚀 Knowledge System Migration (Existing Project)'));
  console.log('');
  console.log(chalk.white('This will:'));
  console.log(chalk.gray('  1. Scan your codebase'));
  console.log(chalk.gray('  2. Generate draft documentation'));
  console.log(chalk.gray('  3. Install custom agents'));
  console.log(chalk.gray('  4. Set up skills'));
  console.log(chalk.gray('  5. Initialize changelog'));
  console.log('');
  
  const { proceed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'proceed',
    message: 'Continue?',
    default: true
  }]);
  
  if (!proceed) {
    console.log(chalk.yellow('Migration cancelled.'));
    return;
  }
  
  // Step 1: Scan codebase
  console.log('');
  console.log(chalk.cyan('══════════════════════════════════════════'));
  console.log(chalk.cyan.bold('Step 1/5: Scanning codebase...'));
  console.log(chalk.cyan('══════════════════════════════════════════'));
  
  const _findings = await scan({ dir: targetDir, output: 'CODEBASE_ESSENTIALS.draft.md' });
  
  // Step 2: Review draft
  console.log('');
  console.log(chalk.cyan('══════════════════════════════════════════'));
  console.log(chalk.cyan.bold('Step 2/5: Review generated draft'));
  console.log(chalk.cyan('══════════════════════════════════════════'));
  console.log('');
  console.log(chalk.yellow.bold('📝 CODEBASE_ESSENTIALS.draft.md has been created'));
  console.log('');
  console.log(chalk.white('IMPORTANT: You must complete the TODO sections!'));
  console.log('');
  console.log(chalk.gray('Required sections to fill in:'));
  console.log(chalk.gray('  - Core Patterns (how you structure code, handle auth, make API calls)'));
  console.log(chalk.gray('  - Critical Invariants (rules that must never be violated)'));
  console.log(chalk.gray('  - Common Gotchas (issues new contributors encounter)'));
  console.log(chalk.gray('  - Architecture Decisions (why you chose this approach)'));
  console.log('');
  
  const { reviewed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'reviewed',
    message: 'Have you completed and renamed the file to CODEBASE_ESSENTIALS.md?',
    default: false
  }]);
  
  const essentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
  const draftPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.draft.md');
  
  if (!reviewed && !fs.existsSync(essentialsPath)) {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'CODEBASE_ESSENTIALS.md not found. What would you like to do?',
      choices: [
        { name: 'Rename draft file now and continue', value: 'rename' },
        { name: 'Continue anyway (not recommended)', value: 'continue' },
        { name: 'Exit and complete the file first', value: 'exit' }
      ]
    }]);
    
    if (action === 'exit') {
      console.log(chalk.yellow('Complete CODEBASE_ESSENTIALS.md and run: npx aiknowsys migrate'));
      return;
    }
    
    if (action === 'rename' && fs.existsSync(draftPath)) {
      fs.renameSync(draftPath, essentialsPath);
      console.log(chalk.green('✅ Renamed to CODEBASE_ESSENTIALS.md'));
    }
  }
  
  // Step 3: Generate AGENTS.md
  console.log('');
  console.log(chalk.cyan('══════════════════════════════════════════'));
  console.log(chalk.cyan.bold('Step 3/5: Creating AGENTS.md'));
  console.log(chalk.cyan('══════════════════════════════════════════'));
  
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    const packageDir = getPackageDir();
    copyTemplate(
      path.join(packageDir, 'templates', 'AGENTS.template.md'),
      agentsPath
    );
    console.log(chalk.green('✅ AGENTS.md created (customize validation matrix as needed)'));
  } else {
    console.log(chalk.gray('⏭️  AGENTS.md already exists, skipping'));
  }
  
  // Step 4: Install custom agents
  console.log('');
  console.log(chalk.cyan('══════════════════════════════════════════'));
  console.log(chalk.cyan.bold('Step 4/5: Installing custom agents...'));
  console.log(chalk.cyan('══════════════════════════════════════════'));
  
  await installAgents({ dir: targetDir, essentials: 'CODEBASE_ESSENTIALS.md' });
  
  // Step 5: Install skills
  console.log('');
  console.log(chalk.cyan('══════════════════════════════════════════'));
  console.log(chalk.cyan.bold('Step 5/5: Installing universal skills...'));
  console.log(chalk.cyan('══════════════════════════════════════════'));
  
  await installSkills({ dir: targetDir });
  
  // Initialize changelog
  const changelogPath = path.join(targetDir, 'CODEBASE_CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    const packageDir = getPackageDir();
    const projectName = path.basename(targetDir);
    copyTemplate(
      path.join(packageDir, 'templates', 'CODEBASE_CHANGELOG.template.md'),
      changelogPath,
      {
        '{{PROJECT_NAME}}': projectName,
        '{{DATE}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }
    );
    console.log(chalk.green('✅ CODEBASE_CHANGELOG.md initialized'));
  }
  
  // Final summary
  console.log('');
  console.log(chalk.green.bold('═══════════════════════════════════════════'));
  console.log(chalk.green.bold('  ✅ Migration Complete!'));
  console.log(chalk.green.bold('═══════════════════════════════════════════'));
  console.log('');
  console.log(chalk.white('📁 Created files:'));
  console.log(chalk.gray('   • CODEBASE_ESSENTIALS.md'));
  console.log(chalk.gray('   • AGENTS.md'));
  console.log(chalk.gray('   • CODEBASE_CHANGELOG.md'));
  console.log(chalk.gray('   • .github/agents/'));
  console.log(chalk.gray('   • .github/skills/'));
  console.log('');
  console.log(chalk.cyan.bold('🚀 Start using:'));
  console.log(chalk.white('   @Developer <your request>'));
  
  displayAIPrompt(chalk, [
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
}
