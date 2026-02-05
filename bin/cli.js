#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { init } from '../dist/lib/commands/init.js';
import { scan } from '../dist/lib/commands/scan.js';
import { migrate } from '../dist/lib/commands/migrate.js';
import { installAgents } from '../dist/lib/commands/install-agents.js';
import { installSkills } from '../dist/lib/commands/install-skills.js';
import { update } from '../dist/lib/commands/update.js';
import { check } from '../dist/lib/commands/check.js';
import { sync } from '../dist/lib/commands/sync.js';
import { audit } from '../dist/lib/commands/audit.js';
import { compressEssentials } from '../dist/lib/commands/compress-essentials.js';
import { archiveSessions } from '../dist/lib/commands/archive-sessions.js';
import { archivePlans } from '../dist/lib/commands/archive-plans.js';
import { clean } from '../dist/lib/commands/clean.js';
import { qualityCheck } from '../dist/lib/commands/quality-check.js';
import { ciCheck } from '../dist/lib/commands/ci-check.js';
import { depsHealth } from '../dist/lib/commands/deps-health.js';
import { enableFeature, disableFeature, uninstall } from '../dist/lib/commands/config.js';
import { listPlugins } from '../dist/lib/commands/plugins.js';
import { listPatterns as learnListPatterns, extractPattern, autoCreateSkills } from '../dist/lib/commands/learn.js';
import { sharePattern } from '../dist/lib/commands/share-pattern.js';
import { listPatterns } from '../dist/lib/commands/list-patterns.js';
import { syncPlans } from '../dist/lib/commands/sync-plans.js';
import { migrateToMultidev } from '../dist/lib/commands/migrate-to-multidev.js';
import { validateDeliverables } from '../dist/lib/commands/validate-deliverables.js';
import { loadPlugins } from '../dist/lib/plugins/loader.js';

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
  .command('sync-plans')
  .description('Sync individual developer plans into team index (CURRENT_PLAN.md)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(syncPlans);

program
  .command('migrate-to-multidev')
  .description('Migrate from single-dev to multi-dev pattern (v0.9.0)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(migrateToMultidev);

program
  .command('audit')
  .description('Find common issues and pattern violations in knowledge system')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-e, --essentials <file>', 'ESSENTIALS file name', 'CODEBASE_ESSENTIALS.md')
  .action(audit);

// Learn command - Pattern management
program
  .command('learn')
  .description('Manage learned patterns and skills')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--list', 'List all detected patterns')
  .option('--extract <pattern>', 'Extract specific pattern to skill file')
  .option('--auto', 'Auto-create skills for high-frequency patterns')
  .option('--threshold <number>', 'Minimum pattern frequency for auto-create', '3')
  .option('--shared', 'Save to shared learned/ directory (default: personal)')
  .action(async (options) => {
    if (options.list) {
      await learnListPatterns(options);
    } else if (options.extract) {
      await extractPattern({ ...options, pattern: options.extract });
    } else if (options.auto) {
      await autoCreateSkills({ ...options, threshold: parseInt(options.threshold, 10) });
    } else {
      console.log('Use --list, --extract, or --auto. See --help for details.');
    }
  });

// Share pattern command
program
  .command('share-pattern <name>')
  .description('Share a personal pattern with the team (move to learned/)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(async (name, options) => {
    await sharePattern(name, options);
  });

// List patterns command
program
  .command('list-patterns')
  .description('List all learned patterns (personal and team)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(async (options) => {
    await listPatterns(options);
  });

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
  .description('Archive plans by status to archive folder')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--threshold <days>', 'Archive plans older than N days (use 0 for immediate)', '7')
  .option('--status <status>', 'Status to archive (COMPLETE, CANCELLED, etc.)', 'COMPLETE')
  .option('--dry-run', 'Preview what would be archived without moving files')
  .action(async (options) => {
    await archivePlans({
      dir: options.dir,
      threshold: parseInt(options.threshold, 10),
      status: options.status,
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

// Validate deliverables command
program
  .command('validate-deliverables')
  .description('Validate all deliverable files (templates)')
  .option('--full', 'Run expensive checks (template execution + fresh init)')
  .option('--fix', 'Attempt to auto-fix simple pattern issues')
  .option('--metrics', 'Show validation metrics and history')
  .action(async (options) => {
    const result = await validateDeliverables(options);
    process.exit(result.exitCode);
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

// Plugin management command
program
  .command('plugins')
  .description('List installed plugins')
  .action(async (options) => {
    await listPlugins(options);
  });

// Config management commands
program
  .command('enable <feature>')
  .description('Enable a feature (agents, skills, vscodeHooks, sessionPersistence, tddEnforcement, openspec)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-e, --essentials <file>', 'ESSENTIALS file name', 'CODEBASE_ESSENTIALS.md')
  .action(async (feature, options) => {
    await enableFeature(feature, options);
  });

program
  .command('disable <feature>')
  .description('Disable a feature')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--keep-files', 'Keep files when disabling (only update config)')
  .option('--remove-files', 'Remove files when disabling')
  .action(async (feature, options) => {
    await disableFeature(feature, options);
  });

program
  .command('uninstall')
  .description('Completely uninstall AIKnowSys from project')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    await uninstall(options);
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

// Load plugins (adds additional commands from installed plugins)
await loadPlugins(program);

program.parse();
