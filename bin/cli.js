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
import { compressEssentials } from '../lib/commands/compress-essentials.js';
import { archiveSessions } from '../lib/commands/archive-sessions.js';
import { archivePlans } from '../lib/commands/archive-plans.js';
import { clean } from '../lib/commands/clean.js';
import { qualityCheck } from '../lib/commands/quality-check.js';
import { ciCheck } from '../lib/commands/ci-check.js';
import { depsHealth } from '../lib/commands/deps-health.js';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let packageJson;
try {
  packageJson = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf-8')
  );
} catch (_error) {
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
  .option('-e, --essentials <file>', 'ESSENTIALS file name', 'CODEBASE_ESSENTIALS.md')
  .option('-y, --yes', 'Update all components without prompting')
  .option('-f, --force', 'Force update even if already up to date')
  .action(update);

program
  .command('check')
  .description('Validate knowledge system setup and configuration')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-e, --essentials <file>', 'ESSENTIALS file name', 'CODEBASE_ESSENTIALS.md')
  .action(check);

program
  .command('sync')
  .description('Sync AGENTS.md validation reference with CODEBASE_ESSENTIALS.md')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-e, --essentials <file>', 'ESSENTIALS file name', 'CODEBASE_ESSENTIALS.md')
  .action(sync);

program
  .command('audit')
  .description('Find common issues and pattern violations in knowledge system')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-e, --essentials <file>', 'ESSENTIALS file name', 'CODEBASE_ESSENTIALS.md')
  .action(audit);

program
  .command('compress-essentials')
  .description('Reduce ESSENTIALS bloat by extracting verbose content to docs/patterns/')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-e, --essentials <file>', 'ESSENTIALS file name', 'CODEBASE_ESSENTIALS.md')
  .option('--analyze', 'Analyze and report compression opportunities (dry-run)')
  .option('--interactive', 'Interactively confirm each extraction')
  .option('--auto', 'Automatically extract all verbose content (>20 lines)')
  .action(compressEssentials);

program
  .command('archive-sessions')
  .description('Archive old session files to dated folders')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--threshold <days>', 'Archive sessions older than N days', '30')
  .option('--dry-run', 'Preview what would be archived without moving files')
  .action(async (options) => {
    await archiveSessions({
      dir: options.dir,
      threshold: parseInt(options.threshold, 10),
      dryRun: options.dryRun
    });
  });

program
  .command('archive-plans')
  .description('Archive completed plans to archive folder')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--threshold <days>', 'Archive completed plans older than N days', '7')
  .option('--dry-run', 'Preview what would be archived without moving files')
  .action(async (options) => {
    await archivePlans({
      dir: options.dir,
      threshold: parseInt(options.threshold, 10),
      dryRun: options.dryRun
    });
  });

// Quality check command
program
  .command('quality-check')
  .description('Run code quality and health checks')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(async (options) => {
    await qualityCheck({
      dir: options.dir
    });
  });

// CI check command
program
  .command('ci-check')
  .description('Validate CI/CD readiness before pushing')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(async (options) => {
    await ciCheck({
      dir: options.dir
    });
  });

// Clean command
program
  .command('clean')
  .description('Clean workspace: archive old sessions/plans and remove temp files')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--dry-run', 'Preview what would be cleaned without making changes')
  .action(async (options) => {
    await clean({
      dir: options.dir,
      dryRun: options.dryRun
    });
  });

// Dependency health command
program
  .command('deps-health')
  .description('Check dependency health: security advisories and outdated packages')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(async (options) => {
    await depsHealth({
      dir: options.dir
    });
  });

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
