/**
 * Display utilities for the init command
 */
import { createLogger } from '../../logger.js';
import { displayAIPrompt } from '../../utils.js';
import { getProjectTypeName, getLanguageName, getFrameworkName } from './constants.js';
import type { ProjectAnswers } from './prompts.js';

/**
 * Build validation matrix rows from answers
 */
export function buildValidationMatrix(answers: ProjectAnswers): string {
  const rows: string[] = [];

  // Test command
  if (answers.testFramework && answers.testFramework !== 'none') {
    const testCmd = answers.packageManager === 'bun'
      ? 'bun test'
      : `${answers.packageManager} test`;
    rows.push(`| Tests | \`${testCmd}\` | Before commit |`);
  }

  // Lint command
  if (answers.linter && answers.linter !== 'none') {
    const lintCmd = answers.packageManager === 'bun'
      ? 'bun run lint'
      : `${answers.packageManager} run lint`;
    rows.push(`| Linting | \`${lintCmd}\` | Before commit |`);
  }

  // Type check (for TypeScript)
  if (answers.language === 'typescript') {
    const typeCmd = answers.packageManager === 'bun'
      ? 'bun run type-check'
      : `${answers.packageManager} run type-check`;
    rows.push(`| Type Check | \`${typeCmd}\` | Before commit |`);
  }

  // Build command (for frontend/web-app)
  if ((answers.projectType === 'frontend' || answers.projectType === 'web-app') && answers.buildTool && answers.buildTool !== 'none') {
    const buildCmd = answers.packageManager === 'bun'
      ? 'bun run build'
      : `${answers.packageManager} run build`;
    rows.push(`| Build | \`${buildCmd}\` | Before push |`);
  }

  // Default fallback
  if (rows.length === 0) {
    rows.push(`| Any file | \`${answers.packageManager || 'npm'} test\` (or equivalent) | Before commit |`);
  }

  return rows.join('\n');
}

/**
 * Display project summary after configuration
 */
export function displayProjectSummary(answers: ProjectAnswers): void {
  const log = createLogger(false);

  log.blank();
  log.section('Summary', '📋');
  log.white(`   Project: ${answers.projectName}`);
  if (answers.projectDescription) {
    log.dim(`   Description: ${answers.projectDescription}`);
  }
  log.white(`   Type: ${getProjectTypeName(answers.projectType)}`);
  log.white(`   Language: ${getLanguageName(answers.customLanguage || answers.language)}`);
  if (answers.framework) {
    log.white(`   Framework: ${getFrameworkName(answers.framework)}`);
  }
  if (answers.useOpenSpec) {
    log.white('   Workflow: Spec-driven (OpenSpec)');
  }
  log.blank();
}

/**
 * Display AI bootstrap prompt for the user to copy
 */
export async function displayAIBootstrapPrompt(projectName: string, hasCode: boolean, useOpenSpec = false): Promise<void> {
  const log = createLogger(false);

  log.blank();
  log.header('AI-Guided Project Bootstrap', '🤖');
  log.blank();
  log.white('Perfect! Let\'s use AI to help you set up your project.');
  log.blank();
  log.log('\x1b[33m\x1b[1m👉 COPY AND PASTE THIS PROMPT TO YOUR AI ASSISTANT:\x1b[0m');
  log.dim('   (GitHub Copilot Chat, Claude Desktop, ChatGPT, Cursor, etc.).');
  log.blank();

  const openspecNote = useOpenSpec
    ? '\n   📋 Note: This project uses OpenSpec for spec-driven development\n'
    : '';

  const promptLines = hasCode
    ? [
      `"I just initialized aiknowsys in my project: ${projectName}`,
      openspecNote,
      'Please help me set up the knowledge system:',
      '',
      '1. Verify database connection:',
      '   - Call mcp_aiknowsys_get_critical_invariants()',
      '   - Ensure 8 base rules are loaded',
      '',
      '2. Read AGENTS.md and CODEBASE_CHANGELOG.md',
      '3. Scan my existing project structure',
      '4. Document project-specific context via MCP:',
      '   - Capture Technology Snapshot (tools, versions)',
      '   - Define Validation Matrix (test commands)',
      '   - Capture Core Patterns (conventions)',
      '   - Add project-specific Invariants (unique rules)',
      '',
      '4. IMPORTANT - Preserve template structure:',
      '   ⚠️ DO NOT change section headings (e.g., keep "Testing Patterns" as-is)',
      '   ⚠️ Replace {{PLACEHOLDERS}} with REAL values from my code, not generic text',
      '   ⚠️ Use actual commands, file paths, and code examples from my project',
      '',
      '5. Make everything specific to MY codebase, not generic',
      useOpenSpec ? '\n6. Note: Use "openspec create <feature-name>" before implementing new features' : '',
      '',
      'Start by reading the files and scanning the project."'
    ].filter(Boolean)
    : [
      `"I just initialized aiknowsys for a new project: ${projectName}`,
      openspecNote,
      'My project directory is currently empty. Please help me SET UP THE KNOWLEDGE SYSTEM:',
      '',
      '🎯 YOUR GOAL: Help me fill in the knowledge system templates, NOT build the full project.',
      '',
      '📋 WORKFLOW (3 phases - stop after each):',
      '',
      '1️⃣ PHASE 1 OF 3 - DISCUSS: Let\'s design the project (THEN STOP AND WAIT)',
      '   - What am I building? (ask me)',
      '   - What technologies should I use? (discuss options)',
      '   - What should the project structure look like?',
      '   - What are the key architecture decisions?',
      '   ⏸️  STOP HERE - Show me the design and wait for my approval',
      '',
      '2️⃣ PHASE 2 OF 3 - SEED: Seed the knowledge system (THEN STOP AND WAIT)',
      '   - Call mcp_aiknowsys_get_critical_invariants() to confirm base rules',
      '   - Seed Technology Snapshot and Core Patterns agreement into DB',
      '   - Define Validation Matrix via mcp_aiknowsys_get_validation_matrix()',
      '   - Create first session log via mcp_aiknowsys_create_session()',
      '   ⚠️ PRESERVE section headings exactly - don\'t rename "Testing Patterns" etc.',
      '   ⚠️ Replace {{PLACEHOLDERS}} with actual values, not generic placeholders',
      '   ⏸️  STOP HERE - Show me what you filled in and wait for my approval',
      '',
      '3️⃣ PHASE 3 OF 3 - DONE: Knowledge system is ready!',
      '   - I can now build the project myself OR ask you to help in a separate session',
      '   - The knowledge system will guide all future development',
      useOpenSpec ? '   - Remember: Create specs with "openspec create" before coding new features' : '',
      '',
      '🚫 DO NOT build the full codebase in this session!',
      '🚫 DO NOT create package.json, source files, or "Hello World"!',
      '✅ ONLY fill in the knowledge system documentation!',
      '',
      'Let\'s start with Phase 1: Discussing what I want to build."'
    ].filter(Boolean);

  await displayAIPrompt(log, promptLines);

  log.blank();
  log.cyan('💡 What happens next:');
  if (hasCode) {
    log.white('   1. Your AI will read the knowledge system templates');
    log.white('   2. It will scan your existing codebase');
    log.white('   3. It will complete all TODO sections automatically');
    log.white('   4. Review and approve the changes');
  } else {
    log.white('   1. AI helps you discuss and design your project');
    log.white('   2. AI documents the architecture in knowledge system');
    log.white('   3. Knowledge system is ready to guide development');
    log.white('   4. You can then build the project with AI assistance!');
  }
  log.blank();
  log.success('This demonstrates the power of AI-assisted development from day 1!');
  log.blank();
}

/**
 * Display manual setup instructions
 */
export function displayManualSetupInstructions(): void {
  const log = createLogger(false);

  log.blank();
  log.header('Manual Setup', '📖');
  log.blank();
  log.white('No problem! Complete these steps manually:');
  log.blank();
  log.white('   1. Verify database availability:');
  log.dim('      • Run: npx aiknowsys mcp-test get_critical_invariants');
  log.white('   2. Configure project context via CLI or MCP:');
  log.dim('      • Technology stack');
  log.dim('      • Validation matrix');
  log.dim('      • Core patterns');
  log.dim('      • Project-specific invariants');
  log.blank();
  log.white('   3. Customize AGENTS.md validation matrix');
  log.blank();
  log.log('\x1b[33m💡 Tip: You can still use AI later with @Developer\x1b[0m');
  log.blank();
}
