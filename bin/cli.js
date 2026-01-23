#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { init } from '../lib/commands/init.js';
import { scan } from '../lib/commands/scan.js';
import { migrate } from '../lib/commands/migrate.js';
import { installAgents } from '../lib/commands/install-agents.js';
import { installSkills } from '../lib/commands/install-skills.js';

const program = new Command();

program
  .name('aiknowsys')
  .description('AI-Powered Development Workflow for Consistent, High-Quality Code')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize knowledge system for a new project')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(init);

program
  .command('scan')
  .description('Scan existing codebase and generate draft ESSENTIALS')
  .option('-d, --dir <directory>', 'Project directory to scan', '.')
  .option('-o, --output <file>', 'Output file name', 'CODEBASE_ESSENTIALS.draft.md')
  .action(scan);

program
  .command('migrate')
  .description('Full migration workflow for existing projects')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .action(migrate);

program
  .command('install-agents')
  .description('Install Developer + Architect custom agents')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-e, --essentials <file>', 'ESSENTIALS file name', 'CODEBASE_ESSENTIALS.md')
  .action(installAgents);

program
  .command('install-skills')
  .description('Install universal skills to .github/skills/')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-s, --skills <skills...>', 'Specific skills to install')
  .action(installSkills);

// Default command - show help with styled banner
program
  .action(() => {
    console.log('');
    console.log(chalk.cyan('  ╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('  ║') + chalk.bold.white('         🎯 Knowledge System Template                   ') + chalk.cyan('║'));
    console.log(chalk.cyan('  ║') + chalk.gray('         AI-Powered Development Workflow                ') + chalk.cyan('║'));
    console.log(chalk.cyan('  ╚════════════════════════════════════════════════════════╝'));
    console.log('');
    program.outputHelp();
  });

program.parse();
