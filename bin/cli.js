#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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
import { migrateToMultidev } from '../dist/lib/commands/migrate-to-multidev.js';
import { migrateEssentials } from '../dist/lib/commands/migrate-essentials.js';
import { migrateToSqlite } from '../dist/lib/commands/migrate-to-sqlite.js';
import { migrateToEvents } from '../dist/lib/commands/migrate-to-events.js';
import { exportSession } from '../dist/lib/commands/export-session.js';
import { exportSessions } from '../dist/lib/commands/export-sessions.js';
import { exportPlan } from '../dist/lib/commands/export-plan.js';
import { validateDeliverables } from '../dist/lib/commands/validate-deliverables.js';
import { queryPlans } from '../dist/lib/commands/query-plans.js';
import { querySessions } from '../dist/lib/commands/query-sessions.js';
import { searchContext } from '../dist/lib/commands/search-context.js';
import { rebuildIndex } from '../dist/lib/commands/rebuild-index.js';
import { createSession } from '../dist/lib/commands/create-session.js';
import { updateSession } from '../dist/lib/commands/update-session.js';
import { createPlan } from '../dist/lib/commands/create-plan.js';
import { updatePlan } from '../dist/lib/commands/update-plan.js';
import { mcpTest } from '../dist/lib/commands/mcp-test.js';
import { loadPlugins } from '../dist/lib/plugins/loader.js';
import { createKnowledgeSystemFiles } from '../dist/lib/commands/feature-setup/templates.js';
import { askManualQuestions } from '../dist/lib/commands/feature-setup/prompts.js';
import { displayProjectSummary, displayAIBootstrapPrompt } from '../dist/lib/commands/feature-setup/display.js';
import { createLogger } from '../dist/lib/logger.js';

import ora from 'ora';
import path from 'path';

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
  .description('Initialize aiknowsys in a new or existing project (Database-First)')
  .option('-d, --dir <directory>', 'Target directory', process.cwd())
  .option('--skip-db', 'Skip database seeding (Phase 2)', false)
  .action(async (options) => {
    const targetDir = path.resolve(options.dir);
    const log = createLogger();

    log.header('AIKnowSys Initialization', '📦');

    try {
      const answers = await askManualQuestions(targetDir);

      const spinner = ora('Creating knowledge system files...').start();
      await createKnowledgeSystemFiles(targetDir, answers, 'minimal', { skipDb: options.skipDb });
      spinner.succeed('Core files and database initialized');

      displayProjectSummary(answers);
      await displayAIBootstrapPrompt(answers.projectName, true, answers.useOpenSpec);

    } catch (error) {
      log.error(`Initialization failed: ${error.message}`);
      process.exit(1);
    }
  });

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
  .command('migrate-to-multidev')
  .description('Migrate from single-dev to multi-dev pattern (v0.9.0)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(migrateToMultidev);

program
  .command('migrate-essentials')
  .description('Migrate ESSENTIALS from monolithic to skill-indexed format (v0.10.0)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--dry-run', 'Preview changes without applying')
  .action(migrateEssentials);

program
  .command('migrate-to-sqlite')
  .description('Migrate .aiknowsys files to SQLite database (Phase 1: Migration Tools)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--db-path <path>', 'Database file path', './knowledge.db')
  .option('--dry-run', 'Preview migration without creating database')
  .option('-v, --verbose', 'Show detailed progress')
  .action(migrateToSqlite);

program
  .command('migrate-to-events')
  .description('Migrate markdown sessions/plans to event-sourced storage (Phase 2.1: Hybrid Storage)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--db-path <path>', 'Database file path', './knowledge.db')
  .option('-s, --session <id>', 'Migrate specific session by ID')
  .option('-p, --plan <id>', 'Migrate specific plan by ID')
  .option('--all', 'Migrate all sessions and plans')
  .option('--archive-markdown', 'Archive active markdown session/plan files after successful migration')
  .option('--dry-run', 'Preview migration without making changes')
  .option('-v, --verbose', 'Show detailed progress')
  .action(async (options) => {
    await migrateToEvents({
      dir: options.dir || '.',
      dbPath: options.dbPath || './knowledge.db',
      sessionId: options.session,
      planId: options.plan,
      all: options.all,
      archiveMarkdown: options.archiveMarkdown,
      dryRun: options.dryRun,
      verbose: options.verbose
    });
  });

async function runExportSession(id, options) {
  const result = await exportSession({
    dir: options.dir || '.',
    dbPath: options.dbPath || './knowledge.db',
    sessionId: id,
    date: options.date,
    output: options.output,
    format: options.format || 'narrative',
    verbose: options.verbose
  });

  if (!result.success) {
    console.error(chalk.red('✗'), result.error);
    process.exit(1);
  }

  if (!options.output && result.markdown) {
    console.log(result.markdown);
  }

  if (result.outputPath) {
    console.log(chalk.green('✓'), `Exported to ${result.outputPath}`);
    if (options.verbose && result.eventCount) {
      console.log(chalk.dim(`  ${result.eventCount} events processed`));
    }
  }

  if (result.warning) {
    console.warn(chalk.yellow('⚠'), result.warning);
  }
}

async function runExportPlan(id, options) {
  const result = await exportPlan({
    planId: id,
    dbPath: options.dbPath || './knowledge.db',
    output: options.output,
    format: options.format,
    verbose: options.verbose
  });

  if (!result.success) {
    console.error(chalk.red('✗'), result.error);
    process.exit(1);
  }

  if (!options.output && result.markdown) {
    console.log(result.markdown);
  }

  if (result.outputPath) {
    console.log(chalk.green('✓'), `Exported to ${result.outputPath}`);
    if (options.verbose) {
      console.log(chalk.dim(`  ${result.sessionCount || 0} sessions, ${result.reviewCount || 0} reviews`));
    }
  }
}

const exportCommand = program
  .command('export')
  .description('Export markdown views from database-backed knowledge');

exportCommand
  .command('session')
  .description('Export single session from event storage as markdown')
  .argument('[id]', 'Session ID to export (optional if --date provided)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--db-path <path>', 'Database file path', './knowledge.db')
  .option('--date <YYYY-MM-DD>', 'Export session by date (alternative to ID)')
  .option('-o, --output <path>', 'Output file path (defaults to stdout)')
  .option('--format <type>', 'Export format: narrative|timeline|grouped|custom', 'narrative')
  .option('-v, --verbose', 'Show detailed event information')
  .action(async (id, options) => {
    await runExportSession(id, options);
  });

exportCommand
  .command('sessions')
  .description('Export multiple sessions as markdown with filtering')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--db-path <path>', 'Database file path', './knowledge.db')
  .option('--output-dir <path>', 'Output directory for exported markdown files (required)')
  .option('--from <YYYY-MM-DD>', 'Filter: sessions from date (inclusive)')
  .option('--to <YYYY-MM-DD>', 'Filter: sessions to date (inclusive)')
  .option('--project-id <id>', 'Filter: sessions for specific project')
  .option('--dry-run', 'Preview export without writing files')
  .option('-v, --verbose', 'Show detailed progress for each session')
  .action(async (options) => {
    const result = await exportSessions({
      dir: options.dir || '.',
      dbPath: options.dbPath || './knowledge.db',
      outputDir: options.outputDir,
      from: options.from,
      to: options.to,
      projectId: options.projectId,
      dryRun: options.dryRun,
      verbose: options.verbose
    });

    if (!result.success) {
      console.error(chalk.red('✗'), result.error);
      if (result.errors && result.errors.length > 0) {
        console.error(chalk.dim('\nErrors:'));
        result.errors.forEach(err => {
          console.error(chalk.dim(`  ${err.sessionId}: ${err.error}`));
        });
      }
      process.exit(1);
    }

    if (options.dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE'));
    }

    console.log(chalk.green('✓'), 'Export complete');
    console.log(chalk.dim(`  Exported: ${result.exported}`));
    if (result.failed > 0) {
      console.log(chalk.yellow(`  Failed: ${result.failed}`));
    }
    if (result.skipped > 0) {
      console.log(chalk.dim(`  Skipped: ${result.skipped}`));
    }
    if (result.outputDir) {
      console.log(chalk.dim(`  Output: ${result.outputDir}`));
    }

    if (result.errors && result.errors.length > 0 && !options.verbose) {
      console.log(chalk.yellow('\n⚠ Some exports failed. Use --verbose for details.'));
    }
  });

exportCommand
  .command('plan')
  .description('Export single plan with linked sessions/reviews as markdown')
  .argument('<id>', 'Plan ID to export')
  .option('--db-path <path>', 'Database file path', './knowledge.db')
  .option('-o, --output <path>', 'Output file path (defaults to stdout)')
  .option('--format <type>', 'Export format: narrative|timeline|grouped|custom (custom=scaffold)', 'narrative')
  .option('-v, --verbose', 'Show detailed export statistics')
  .action(async (id, options) => {
    await runExportPlan(id, options);
  });

program
  .command('export-session')
  .description('Export single session from event storage as markdown (Phase 3: Markdown Exports)')
  .argument('[id]', 'Session ID to export (optional if --date provided)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--db-path <path>', 'Database file path', './knowledge.db')
  .option('--date <YYYY-MM-DD>', 'Export session by date (alternative to ID)')
  .option('-o, --output <path>', 'Output file path (defaults to stdout)')
  .option('--format <type>', 'Export format: narrative|timeline|grouped|custom', 'narrative')
  .option('-v, --verbose', 'Show detailed event information')
  .action(async (id, options) => {
    await runExportSession(id, options);
  });

program
  .command('export-sessions')
  .description('Export multiple sessions as markdown with filtering (Phase 3: Markdown Exports)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--db-path <path>', 'Database file path', './knowledge.db')
  .option('--output-dir <path>', 'Output directory for exported markdown files (required)')
  .option('--from <YYYY-MM-DD>', 'Filter: sessions from date (inclusive)')
  .option('--to <YYYY-MM-DD>', 'Filter: sessions to date (inclusive)')
  .option('--project-id <id>', 'Filter: sessions for specific project')
  .option('--dry-run', 'Preview export without writing files')
  .option('-v, --verbose', 'Show detailed progress for each session')
  .action(async (options) => {
    const result = await exportSessions({
      dir: options.dir || '.',
      dbPath: options.dbPath || './knowledge.db',
      outputDir: options.outputDir,
      from: options.from,
      to: options.to,
      projectId: options.projectId,
      dryRun: options.dryRun,
      verbose: options.verbose
    });

    // Handle result
    if (!result.success) {
      console.error(chalk.red('✗'), result.error);
      if (result.errors && result.errors.length > 0) {
        console.error(chalk.dim('\nErrors:'));
        result.errors.forEach(err => {
          console.error(chalk.dim(`  ${err.sessionId}: ${err.error}`));
        });
      }
      process.exit(1);
    }

    // Show statistics
    if (options.dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE'));
    }

    console.log(chalk.green('✓'), 'Export complete');
    console.log(chalk.dim(`  Exported: ${result.exported}`));
    if (result.failed > 0) {
      console.log(chalk.yellow(`  Failed: ${result.failed}`));
    }
    if (result.skipped > 0) {
      console.log(chalk.dim(`  Skipped: ${result.skipped}`));
    }
    if (result.outputDir) {
      console.log(chalk.dim(`  Output: ${result.outputDir}`));
    }

    // Show individual errors if any
    if (result.errors && result.errors.length > 0 && !options.verbose) {
      console.log(chalk.yellow('\n⚠ Some exports failed. Use --verbose for details.'));
    }
  });

program
  .command('export-plan')
  .description('Export single plan with linked sessions/reviews as markdown')
  .argument('<id>', 'Plan ID to export')
  .option('--db-path <path>', 'Database file path', './knowledge.db')
  .option('-o, --output <path>', 'Output file path (defaults to stdout)')
  .option('--format <type>', 'Export format: narrative|timeline|grouped|custom (custom=scaffold)', 'narrative')
  .option('-v, --verbose', 'Show detailed export statistics')
  .action(async (id, options) => {
    await runExportPlan(id, options);
  });

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

// Context query commands
program
  .command('query-plans')
  .description('Query plan metadata with filters (status, author, topic, dates)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-s, --status <status>', 'Filter by status: ACTIVE, PAUSED, PLANNED, COMPLETE, CANCELLED')
  .option('-a, --author <author>', 'Filter by author')
  .option('-t, --topic <topic>', 'Filter by topic (fuzzy match)')
  .option('--updated-after <date>', 'Filter by plans updated after date (YYYY-MM-DD)')
  .option('--updated-before <date>', 'Filter by plans updated before date (YYYY-MM-DD)')
  .option('--all-projects', 'Query across all projects in global database (default: current project only)')
  .option('--project-id <id>', 'Filter by specific project ID')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (options) => {
    await queryPlans(options);
  });

program
  .command('query-sessions')
  .description('Query session history with filters (date, topic, plan)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--date <date>', 'Filter by exact date (YYYY-MM-DD)')
  .option('--date-after <date>', 'Filter by sessions after date (YYYY-MM-DD)')
  .option('--date-before <date>', 'Filter by sessions before date (YYYY-MM-DD)')
  .option('-t, --topic <topic>', 'Filter by topic (fuzzy match)')
  .option('-p, --plan <plan>', 'Filter by plan reference')
  .option('--days <number>', 'Filter by sessions from last N days (convenience)')
  .option('--all-projects', 'Query across all projects in global database (default: current project only)')
  .option('--project-id <id>', 'Filter by specific project ID')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (options) => {
    // Convert days to number if provided
    if (options.days) {
      options.days = parseInt(options.days, 10);
    }
    await querySessions(options);
  });

program
  .command('search-context <query>')
  .description('Full-text search across plans, sessions, and learned patterns')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-s, --scope <scope>', 'Search scope: all, plans, sessions, learned (default: all)')
  .option('--all-projects', 'Query across all projects in global database (default: current project only)')
  .option('--project-id <id>', 'Filter by specific project ID')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (query, options) => {
    await searchContext(query, options);
  });

program
  .command('rebuild-index')
  .description('Rebuild context index from markdown files')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (options) => {
    await rebuildIndex(options);
  });

// Context mutation commands (v0.10.0+)
program
  .command('create-session')
  .description('Create new session file with YAML frontmatter (human CLI; MCP preferred for AI/programmatic use)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-t, --topics <topics>', 'Comma-separated topics (e.g., "TDD,validation")')
  .option('-p, --plan <plan>', 'Link to active plan (e.g., PLAN_xyz)')
  .option('--title <title>', 'Session title', 'Work Session')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (options) => {
    // Parse topics from comma-separated string
    if (options.topics) {
      options.topics = options.topics.split(',').map(t => t.trim());
    }
    await createSession(options);
  });

program
  .command('update-session')
  .description('Modify today\'s session metadata and content (human CLI; MCP preferred for AI/programmatic use)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--date <YYYY-MM-DD>', 'Target session by date (defaults to today)')
  .option('--add-topic <topic>', 'Add topic to session')
  .option('--add-file <file>', 'Add file to session')
  .option('--set-status <status>', 'Set status: in-progress, complete, abandoned')
  .option('--append-section <title>', 'Append markdown section header (e.g., "## Notes")')
  .option('--content <text>', 'Section body content (requires --append-section)')
  .option('--append-file <path>', 'Append content from markdown file')
  // Advanced insertion options (Phase 1)
  .option('--prepend-section <title>', 'Prepend section at beginning (after frontmatter)')
  .option('--insert-after <pattern>', 'Insert section after matching LITERAL string (not regex)')
  .option('--insert-before <pattern>', 'Insert section before matching LITERAL string (not regex)')
  // Shortcuts (Phase 4.2)
  .option('--done', 'Shortcut for --set-status complete')
  .option('--wip', 'Shortcut for --set-status in-progress')
  .option('--append <content>', 'Shortcut: Add "Update" section with content/file (auto-detects file paths)')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (options) => {
    await updateSession(options);
  });

// === Phase 4.4: Command Shortcuts (Aliases) ===

program
  .command('done')
  .description('Mark today\'s session as complete (shortcut for update-session --done)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (options) => {
    await updateSession({ ...options, done: true });
  });

program
  .command('wip')
  .description('Mark today\'s session as in-progress (shortcut for update-session --wip)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (options) => {
    await updateSession({ ...options, wip: true });
  });

program
  .command('log <message>')
  .description('Add quick note to session (shortcut for update-session --append)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (message, options) => {
    await updateSession({ ...options, append: message });
  });

program
  .command('create-plan')
  .description('Create new implementation plan (status-based model; MCP preferred for AI/programmatic use)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-t, --title <title>', 'Plan title (REQUIRED)')
  .option('-a, --author <author>', 'Plan author (auto-detected from git)')
  .option('--topics <topics>', 'Comma-separated topics')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (options) => {
    // Parse topics from comma-separated string
    if (options.topics) {
      options.topics = options.topics.split(',').map(t => t.trim());
    }
    // title is required - error if missing
    if (!options.title) {
      console.error(chalk.red('Error: --title is required'));
      console.error('Usage: aiknowsys create-plan --title "Plan Name"');
      process.exit(1);
    }
    await createPlan(options);
  });

program
  .command('update-plan [planId]')
  .description('Update plan status and progress (human CLI; MCP preferred for AI/programmatic use)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-s, --set-status <status>', 'Set plan status (PLANNED|ACTIVE|PAUSED|COMPLETE|CANCELLED)')
  .option('--append <content>', 'Append progress note')
  .option('--append-file <file>', 'Append content from file')
  .option('-a, --author <author>', 'Plan author (auto-detected from git)')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (planId, options) => {
    // Validate status if provided
    const validStatuses = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'];
    if (options.setStatus && !validStatuses.includes(options.setStatus)) {
      console.error(chalk.red(`Error: Invalid status. Valid: ${validStatuses.join(', ')}`));
      process.exit(1);
    }

    await updatePlan({ ...options, planId, targetDir: options.dir });
  });

// Plan shortcuts (Phase 2)
program
  .command('plan-activate <planId>')
  .description('Activate plan (shortcut for update-plan --set-status ACTIVE)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (planId, options) => {
    await updatePlan({ ...options, planId, setStatus: 'ACTIVE', targetDir: options.dir });
  });

program
  .command('plan-complete <planId>')
  .description('Mark plan complete (shortcut for update-plan --set-status COMPLETE)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (planId, options) => {
    await updatePlan({ ...options, planId, setStatus: 'COMPLETE', targetDir: options.dir });
  });

program
  .command('plan-pause <planId>')
  .description('Pause plan (shortcut for update-plan --set-status PAUSED)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (planId, options) => {
    await updatePlan({ ...options, planId, setStatus: 'PAUSED', targetDir: options.dir });
  });

program
  .command('plan-cancel <planId>')
  .description('Cancel plan (shortcut for update-plan --set-status CANCELLED)')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('--json', 'Output JSON (for AI agents)')
  .action(async (planId, options) => {
    await updatePlan({ ...options, planId, setStatus: 'CANCELLED', targetDir: options.dir });
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

program
  .command('mcp-test <tool-name> [args-json]')
  .description('Test MCP tools with JSON arguments (no dbPath needed!)')
  .option('--silent', 'Suppress output (for scripting)')
  .option('--json', 'Output raw JSON (no pretty-print)')
  .action(async (toolName, argsJson, options) => {
    await mcpTest(toolName, argsJson, { _silent: options.silent, json: options.json });
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
