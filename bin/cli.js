#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { init } from '../lib/commands/init.js';
import { scan } from '../lib/commands/scan.js';
import { migrate } from '../lib/commands/migrate.js';
import { installAgents } from '../lib/commands/install-agents.js';
import { installSkills } from '../lib/commands/install-skills.js';
import { update } from '../lib/commands/update.js';
import { check } from '../lib/commands/check.js';
import { sync } from '../lib/commands/sync.js';
import { audit } from '../lib/commands/audit.js';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let packageJson;
try {
  packageJson = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf-8')
  );
} catch (error) {
  console.error(chalk.red('Error: Could not read package.json'));
  process.exit(1);
}

const program = new Command();

program
  .name('aiknowsys')
  .description('AI-Powered Development Workflow for Consistent, High-Quality Code')
  .version(packageJson.version);

program
  .command('init')
  .description('Initialize knowledge system with AI-assisted setup')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-t, --template <type>', 'Template size: minimal (10 sections) or full (13+ sections)', 'full')
  .option('-s, --stack <name>', 'Use pre-built stack template (nextjs, vue-express, etc.)')
  .option('--list-stacks', 'List available stack templates')
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

program
  .command('update')
  .description('Update agents, skills, and workflow to latest version')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('-y, --yes', 'Update all components without prompting')
  .option('-f, --force', 'Force update even if already up to date')
  .action(update);

program
  .command('check')
  .description('Validate knowledge system setup and configuration')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(check);

program
  .command('sync')
  .description('Sync AGENTS.md validation reference with CODEBASE_ESSENTIALS.md')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(sync);

program
  .command('audit')
  .description('Find common issues and pattern violations in knowledge system')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(audit);

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
