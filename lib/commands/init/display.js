/**
 * Display utilities for the init command
 */
import chalk from 'chalk';
import { displayAIPrompt } from '../../utils.js';
import { getProjectTypeName, getLanguageName, getFrameworkName } from './constants.js';

/**
 * Build validation matrix rows from answers
 */
export function buildValidationMatrix(answers) {
  const rows = [];
  
  // Test command
  if (answers.testFramework && answers.testFramework !== 'none') {
    const testCmd = answers.packageManager === 'bun' 
      ? 'bun test'
      : `${answers.packageManager} test`;
    rows.push(`| Tests | \`${testCmd}\` | ✅ Before commit |`);
  }
  
  // Lint command
  if (answers.linter && answers.linter !== 'none') {
    const lintCmd = answers.packageManager === 'bun'
      ? 'bun run lint'
      : `${answers.packageManager} run lint`;
    rows.push(`| Linting | \`${lintCmd}\` | ✅ Before commit |`);
  }
  
  // Type check (for TypeScript)
  if (answers.language === 'typescript') {
    const typeCmd = answers.packageManager === 'bun'
      ? 'bun run type-check'
      : `${answers.packageManager} run type-check`;
    rows.push(`| Type Check | \`${typeCmd}\` | ✅ Before commit |`);
  }
  
  // Build command (for frontend/web-app)
  if ((answers.projectType === 'frontend' || answers.projectType === 'web-app') && answers.buildTool && answers.buildTool !== 'none') {
    const buildCmd = answers.packageManager === 'bun'
      ? 'bun run build'
      : `${answers.packageManager} run build`;
    rows.push(`| Build | \`${buildCmd}\` | ✅ Before push |`);
  }
  
  // Default fallback
  if (rows.length === 0) {
    rows.push(`| Any file | \`${answers.packageManager || 'npm'} test\` (or equivalent) | ✅ Before commit |`);
  }
  
  return rows.join('\n');
}

/**
 * Display project summary after configuration
 */
export function displayProjectSummary(answers) {
  console.log('');
  console.log(chalk.cyan.bold('📋 Summary:'));
  console.log(chalk.white(`   Project: ${answers.projectName}`));
  if (answers.projectDescription) {
    console.log(chalk.gray(`   Description: ${answers.projectDescription}`));
  }
  console.log(chalk.white(`   Type: ${getProjectTypeName(answers.projectType)}`));
  console.log(chalk.white(`   Language: ${getLanguageName(answers.customLanguage || answers.language)}`));
  if (answers.framework) {
    console.log(chalk.white(`   Framework: ${getFrameworkName(answers.framework)}`));
  }
  if (answers.useOpenSpec) {
    console.log(chalk.white('   Workflow: Spec-driven (OpenSpec)'));
  }
  console.log('');
}

/**
 * Display AI bootstrap prompt for the user to copy
 */
export function displayAIBootstrapPrompt(projectName, hasCode, useOpenSpec = false) {
  console.log('');
  console.log(chalk.cyan.bold('🤖 AI-Guided Project Bootstrap'));
  console.log('');
  console.log(chalk.white('Perfect! Let\'s use AI to help you set up your project.'));
  console.log('');
  console.log(chalk.yellow.bold('👉 COPY AND PASTE THIS PROMPT TO YOUR AI ASSISTANT:'));
  console.log(chalk.gray('   (GitHub Copilot Chat, Claude Desktop, ChatGPT, Cursor, etc.)'));
  console.log('');
  
  const openspecNote = useOpenSpec 
    ? '\n   📋 Note: This project uses OpenSpec for spec-driven development\n' 
    : '';
  
  const promptLines = hasCode 
    ? [
        `"I just initialized aiknowsys in my project: ${projectName}`,
        openspecNote,
        'Please help me set up the knowledge system:',
        '',
        '1. Read CODEBASE_ESSENTIALS.md, AGENTS.md, and CODEBASE_CHANGELOG.md',
        '2. Scan my existing project structure',
        '3. Complete all TODO sections based on what you find:',
        '   - Technology Snapshot (all frameworks, tools, versions)',
        '   - Validation Matrix (test commands, linting, build)',
        '   - Core Patterns (how I structure code, conventions)',
        '   - Critical Invariants (rules that must never be violated)',
        '   - Common Gotchas (things that trip up developers)',
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
        '2️⃣ PHASE 2 OF 3 - DOCUMENT: Fill in the knowledge system templates (THEN STOP AND WAIT)',
        '   - Read CODEBASE_ESSENTIALS.md, AGENTS.md, CODEBASE_CHANGELOG.md',
        '   - Fill in Technology Snapshot with our tech choices',
        '   - Document Core Patterns and conventions we agreed on',
        '   - Define Validation Matrix (how to test/build)',
        '   - Add Critical Invariants (rules we must follow)',
        '   - Create first CODEBASE_CHANGELOG.md entry for this session',
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
  
  displayAIPrompt(chalk, promptLines);
  
  console.log('');
  console.log(chalk.cyan('💡 What happens next:'));
  if (hasCode) {
    console.log(chalk.white('   1. Your AI will read the knowledge system templates'));
    console.log(chalk.white('   2. It will scan your existing codebase'));
    console.log(chalk.white('   3. It will complete all TODO sections automatically'));
    console.log(chalk.white('   4. Review and approve the changes'));
  } else {
    console.log(chalk.white('   1. AI helps you discuss and design your project'));
    console.log(chalk.white('   2. AI documents the architecture in knowledge system'));
    console.log(chalk.white('   3. Knowledge system is ready to guide development'));
    console.log(chalk.white('   4. You can then build the project with AI assistance!'));
  }
  console.log('');
  console.log(chalk.green('✨ This demonstrates the power of AI-assisted development from day 1!'));
  console.log('');
}

/**
 * Display manual setup instructions
 */
export function displayManualSetupInstructions() {
  console.log('');
  console.log(chalk.cyan.bold('📖 Manual Setup'));
  console.log('');
  console.log(chalk.white('No problem! Complete these steps manually:'));
  console.log('');
  console.log(chalk.white('   1. Open CODEBASE_ESSENTIALS.md'));
  console.log(chalk.white('   2. Fill in TODO sections:'));
  console.log(chalk.gray('      • Technology Snapshot'));
  console.log(chalk.gray('      • Validation Matrix'));
  console.log(chalk.gray('      • Core Patterns'));
  console.log(chalk.gray('      • Architecture Decisions'));
  console.log('');
  console.log(chalk.white('   3. Customize AGENTS.md validation matrix'));
  console.log('');
  console.log(chalk.yellow('💡 Tip: You can still use AI later with @Developer'));
  console.log('');
}
