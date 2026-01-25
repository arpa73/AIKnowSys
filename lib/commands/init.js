import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getPackageDir, copyTemplate, hasExistingProject, displayAIPrompt } from '../utils.js';

const AVAILABLE_STACKS = {
  nextjs: {
    name: 'nextjs',
    display: 'Next.js 15 (App Router + TypeScript + Tailwind + Prisma)',
    description: 'Full-stack React framework with Server Components'
  },
  'vue-express': {
    name: 'vue-express',
    display: 'Vue 3 + Express (Full-stack monorepo with shared types)',
    description: 'Frontend + Backend + Shared packages'
  }
};


// Helper functions for prompt logic (KISS principle)
async function getBasicProjectInfo(targetDir) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: '📦 Project name:',
      default: path.basename(targetDir),
      validate: (input) => input.trim().length > 0 || 'Project name is required'
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: '📝 Brief description (what does this project do?):',
      default: ''
    },
    {
      type: 'rawlist',
      name: 'projectType',
      message: '🎯 What type of project are you building?',
      choices: [
        { name: '🌐 Web Application (frontend + backend)', value: 'web-app' },
        { name: '🎨 Frontend Only (SPA, static site)', value: 'frontend' },
        { name: '⚙️  Backend API/Service', value: 'backend' },
        { name: '📦 Library/Package', value: 'library' },
        { name: '🔧 CLI Tool', value: 'cli' },
        { name: '🤖 Other', value: 'other' }
      ],
      default: 1
    }
  ]);
}

async function getTechStack(basicInfo) {
  const prompts = [
    {
      type: 'rawlist',
      name: 'language',
      message: '💻 Primary programming language:',
      choices: [
        { name: 'TypeScript/JavaScript', value: 'typescript' },
        { name: 'Python', value: 'python' },
        { name: 'Rust', value: 'rust' },
        { name: 'Go', value: 'go' },
        { name: 'Java/Kotlin', value: 'java' },
        { name: 'C#/.NET', value: 'csharp' },
        { name: 'Other', value: 'other' }
      ],
      default: 1
    },
    {
      type: 'input',
      name: 'customLanguage',
      message: 'Enter language name:',
      when: (ans) => ans.language === 'other'
    }
  ];

  const needsFrontendFramework = basicInfo.projectType === 'web-app' || basicInfo.projectType === 'frontend';
  const needsBackendFramework = basicInfo.projectType === 'web-app' || basicInfo.projectType === 'backend';

  if (needsFrontendFramework) {
    prompts.push({
      type: 'rawlist',
      name: 'framework',
      message: '🎨 Frontend framework:',
      when: (ans) => ans.language === 'typescript',
      choices: [
        { name: 'Vue 3', value: 'vue' },
        { name: 'React', value: 'react' },
        { name: 'Next.js (React)', value: 'nextjs' },
        { name: 'Svelte/SvelteKit', value: 'svelte' },
        { name: 'Angular', value: 'angular' },
        { name: 'Solid.js', value: 'solid' },
        { name: 'Vanilla JS/HTML', value: 'vanilla' },
        { name: 'Other', value: 'other' }
      ],
      default: 1
    });
  }

  if (needsBackendFramework) {
    prompts.push(
      {
        type: 'rawlist',
        name: 'framework',
        message: '⚙️  Backend framework:',
        when: (ans) => ans.language === 'python',
        choices: [
          { name: 'Django', value: 'django' },
          { name: 'FastAPI', value: 'fastapi' },
          { name: 'Flask', value: 'flask' },
          { name: 'Other', value: 'other' }
        ],
        default: 2
      },
      {
        type: 'rawlist',
        name: 'framework',
        message: '⚙️  Backend framework:',
        when: (ans) => ans.language === 'typescript',
        choices: [
          { name: 'Express.js', value: 'express' },
          { name: 'Fastify', value: 'fastify' },
          { name: 'NestJS', value: 'nestjs' },
          { name: 'Hono', value: 'hono' },
          { name: 'Other', value: 'other' }
        ],
        default: 1
      }
    );
  }

  return inquirer.prompt(prompts);
}

async function getWorkflowPreferences() {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'isTeamProject',
      message: '👥 Is this a team project (multiple developers)?',
      default: false
    },
    {
      type: 'confirm',
      name: 'useTDD',
      message: '🧪 Enforce Test-Driven Development (write tests before code)?',
      default: true
    },
    {
      type: 'confirm',
      name: 'useOpenSpec',
      message: '📋 Use OpenSpec for spec-driven development?',
      when: (ans) => ans.isTeamProject,
      default: true
    }
  ]);
}

async function getToolingDetails(answers) {
  const prompts = [];
  
  // Package manager
  prompts.push({
    type: 'rawlist',
    name: 'packageManager',
    message: '📦 Package manager:',
    choices: [
      { name: 'npm', value: 'npm' },
      { name: 'yarn', value: 'yarn' },
      { name: 'pnpm', value: 'pnpm' },
      { name: 'bun', value: 'bun' }
    ],
    default: 0
  });
  
  // Build tool (for bundled projects)
  if (answers.projectType === 'frontend' || answers.projectType === 'web-app') {
    prompts.push({
      type: 'rawlist',
      name: 'buildTool',
      message: '🔨 Build tool:',
      choices: [
        { name: 'Vite', value: 'vite' },
        { name: 'Webpack', value: 'webpack' },
        { name: 'Rollup', value: 'rollup' },
        { name: 'esbuild', value: 'esbuild' },
        { name: 'Other/None', value: 'none' }
      ],
      default: 0
    });
  }
  
  // Test framework
  prompts.push({
    type: 'rawlist',
    name: 'testFramework',
    message: '🧪 Test framework:',
    choices: answers.language === 'python' 
      ? [
          { name: 'pytest', value: 'pytest' },
          { name: 'unittest', value: 'unittest' },
          { name: 'nose2', value: 'nose2' },
          { name: 'Other/None', value: 'none' }
        ]
      : [
          { name: 'Vitest', value: 'vitest' },
          { name: 'Jest', value: 'jest' },
          { name: 'Mocha', value: 'mocha' },
          { name: 'Node Test Runner', value: 'node-test' },
          { name: 'Other/None', value: 'none' }
        ],
    default: 0
  });
  
  // Linter
  prompts.push({
    type: 'rawlist',
    name: 'linter',
    message: '📏 Linter:',
    choices: answers.language === 'python'
      ? [
          { name: 'ruff', value: 'ruff' },
          { name: 'flake8', value: 'flake8' },
          { name: 'pylint', value: 'pylint' },
          { name: 'Other/None', value: 'none' }
        ]
      : [
          { name: 'ESLint', value: 'eslint' },
          { name: 'Biome', value: 'biome' },
          { name: 'Other/None', value: 'none' }
        ],
    default: 0
  });
  
  // Database (for backend/fullstack)
  if (answers.projectType === 'backend' || answers.projectType === 'web-app') {
    prompts.push({
      type: 'rawlist',
      name: 'database',
      message: '💾 Database:',
      choices: [
        { name: 'PostgreSQL', value: 'postgresql' },
        { name: 'MySQL', value: 'mysql' },
        { name: 'SQLite', value: 'sqlite' },
        { name: 'MongoDB', value: 'mongodb' },
        { name: 'Redis', value: 'redis' },
        { name: 'None/Other', value: 'none' }
      ],
      default: 0
    });
  }
  
  return inquirer.prompt(prompts);
}

function buildValidationMatrix(answers) {
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

function displayProjectSummary(answers) {
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
    console.log(chalk.white(`   Workflow: Spec-driven (OpenSpec)`));
  }
  console.log('');
}

function displayAIBootstrapPrompt(projectName, hasCode, useOpenSpec = false) {
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

function displayManualSetupInstructions() {
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

function displayQuickAIPrompt() {
  console.log(chalk.cyan('📖 Next step:'));
  console.log(chalk.white('   Use AI to complete TODO sections in CODEBASE_ESSENTIALS.md'));
  console.log('');
  
  displayAIPrompt(chalk, [
    '"Complete TODO sections in CODEBASE_ESSENTIALS.md and AGENTS.md',
    'based on my project structure."'
  ]);
}

async function askManualQuestions(targetDir, hasCode) {
  console.log('');
  console.log(chalk.blue('📝 Let\'s configure your knowledge system'));
  console.log('');
  console.log(chalk.gray('I\'ll ask a few questions to customize for your project.'));
  if (!hasCode) {
    console.log(chalk.gray('Note: Since your project is empty, these are just initial settings.'));
  }
  console.log('');
  
  // Step 1: Project Info
  const basicInfo = await getBasicProjectInfo(targetDir);
  
  // Step 2: Technology Stack
  const techStack = await getTechStack(basicInfo);
  
  // Step 3: Team & Workflow
  const workflow = await getWorkflowPreferences();
  
  // Step 4: Tooling Details (NEW)
  const tooling = await getToolingDetails({ ...basicInfo, ...techStack });
  
  const answers = { ...basicInfo, ...techStack, ...workflow, ...tooling };
  
  // Show summary
  displayProjectSummary(answers);
  
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: 'Looks good?',
    default: true
  }]);
  
  if (!confirm) {
    console.log(chalk.yellow('Setup cancelled. Run the command again to start over.'));
    return null;
  }
  
  return answers;
}

async function setupOpenSpec(targetDir) {
  const openSpecSpinner = ora('Setting up OpenSpec...').start();
  
  try {
    // Check if openspec is already installed globally
    let openspecInstalled = false;
    try {
      execSync('openspec --version', { stdio: 'pipe' });
      openspecInstalled = true;
      openSpecSpinner.text = 'OpenSpec already installed, initializing...';
    } catch {
      // Not installed - try to install it
      openSpecSpinner.text = 'Installing OpenSpec globally...';
      try {
        execSync('npm install -g openspec', { stdio: 'inherit' });
        openspecInstalled = true;
        openSpecSpinner.text = 'OpenSpec installed, initializing...';
      } catch (installError) {
        // Installation failed - show instructions and exit gracefully
        openSpecSpinner.warn('Could not install OpenSpec globally');
        console.log('');
        console.log(chalk.yellow('💡 To install OpenSpec manually:'));
        console.log(chalk.white('   npm install -g openspec'));
        console.log(chalk.white('   openspec init'));
        console.log('');
        console.log(chalk.gray('   Or use npx (no install required):'));
        console.log(chalk.white('   npx openspec init'));
        console.log('');
        return false;
      }
    }
    
    // Initialize OpenSpec in the project directory
    if (openspecInstalled) {
      try {
        execSync('openspec init', { stdio: 'inherit', cwd: targetDir });
        openSpecSpinner.succeed('OpenSpec initialized successfully');
        
        console.log('');
        console.log(chalk.cyan('📖 OpenSpec Tips:'));
        console.log(chalk.white('   • Create specs: openspec create <feature-name>'));
        console.log(chalk.white('   • Get approval before coding to align the team'));
        console.log('');
        return true;
      } catch (initError) {
        openSpecSpinner.fail('OpenSpec initialization failed');
        console.log('');
        console.log(chalk.yellow('⚠️  You can initialize it later with:'));
        console.log(chalk.white('   cd ' + path.basename(targetDir)));
        console.log(chalk.white('   openspec init'));
        console.log('');
        return false;
      }
    }
  } catch (error) {
    openSpecSpinner.fail('OpenSpec initialization failed');
    console.log('');
    console.log(chalk.yellow('⚠️  OpenSpec setup encountered an issue:'));
    console.log(chalk.gray(`   ${error.message.split('\n')[0]}`));
    console.log('');
    console.log(chalk.white('You can set it up later with:'));
    console.log(chalk.gray('   npm install -g openspec && openspec init'));
    return false;
  }
  
  return false;
}

export async function init(options) {
  const targetDir = path.resolve(options.dir);
  
  // Handle --list-stacks option
  if (options.listStacks) {
    console.log('');
    console.log(chalk.blue.bold('📦 Available Stack Templates:\n'));
    Object.values(AVAILABLE_STACKS).forEach((stackInfo) => {
      console.log(chalk.cyan(`  ${stackInfo.name.padEnd(15)} - ${stackInfo.display}`));
      console.log(chalk.gray(`  ${' '.repeat(17)}${stackInfo.description}`));
    });
    console.log('');
    console.log(chalk.gray('💡 Usage: npx aiknowsys init --stack <name>'));
    console.log(chalk.gray('   Example: npx aiknowsys init --stack nextjs'));
    console.log('');
    return;
  }

  // Handle --stack option (pre-built stack templates)
  if (options.stack) {
    // Validate stack name
    if (!AVAILABLE_STACKS[options.stack]) {
      console.log('');
      console.error(chalk.red(`❌ Unknown stack: "${options.stack}"`));
      console.log('');
      console.log(chalk.yellow('💡 Available stacks:'));
      Object.keys(AVAILABLE_STACKS).forEach((name) => {
        console.log(chalk.cyan(`   - ${name}`));
      });
      console.log('');
      console.log(chalk.gray('   Use --list-stacks for detailed descriptions'));
      console.log('');
      process.exit(1);
    }

    // Check if project already exists
    if (hasExistingProject(targetDir)) {
      console.log('');
      console.log(chalk.yellow('⚠️  Knowledge system files already exist in this directory.'));
      console.log(chalk.gray('   Run "aiknowsys migrate" to update existing files.'));
      console.log('');
      process.exit(1);
    }

    const stackInfo = AVAILABLE_STACKS[options.stack];
    console.log('');
    console.log(chalk.blue.bold(`🚀 Initializing with ${stackInfo.display}`));
    console.log('');

    // Minimal prompts for stack template
    const basicInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: '📦 Project name:',
        default: path.basename(targetDir),
        validate: (input) => input.trim().length > 0 || 'Project name is required'
      },
      {
        type: 'input',
        name: 'projectDescription',
        message: '📝 Brief description:',
        default: ''
      }
    ]);

    const replacements = {
      PROJECT_NAME: basicInfo.projectName,
      PROJECT_DESCRIPTION: basicInfo.projectDescription || 'A modern web application',
      DATE: new Date().toISOString().split('T')[0],
      YEAR: new Date().getFullYear().toString()
    };

    // Copy stack template
    const packageDir = getPackageDir();
    const stackTemplatePath = path.join(packageDir, 'templates', 'stacks', options.stack, 'CODEBASE_ESSENTIALS.md');
    const targetEssentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');

    const spinner = ora('Copying stack template...').start();
    try {
      let content = await fs.promises.readFile(stackTemplatePath, 'utf-8');
      
      // Replace placeholders
      for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
      }

      await fs.promises.mkdir(targetDir, { recursive: true });
      await fs.promises.writeFile(targetEssentialsPath, content, 'utf-8');
      spinner.succeed('Stack template copied');

      // Copy AGENTS and CHANGELOG templates
      await copyTemplate(packageDir, targetDir, 'templates/AGENTS.template.md', 'AGENTS.md', replacements);
      await copyTemplate(packageDir, targetDir, 'templates/CODEBASE_CHANGELOG.template.md', 'CODEBASE_CHANGELOG.md', replacements);

      // Success message
      console.log('');
      console.log(chalk.green.bold('✅ Knowledge system initialized!'));
      console.log('');
      console.log(chalk.blue('📋 Created files:'));
      console.log(chalk.gray('   - CODEBASE_ESSENTIALS.md  (Pre-filled with stack patterns)'));
      console.log(chalk.gray('   - AGENTS.md               (AI agent workflow)'));
      console.log(chalk.gray('   - CODEBASE_CHANGELOG.md   (Session history)'));
      console.log('');
      console.log(chalk.blue('🚀 Next steps:'));
      console.log(chalk.gray('   1. Review CODEBASE_ESSENTIALS.md (pre-filled patterns)'));
      console.log(chalk.gray('   2. Customize validation commands if needed'));
      console.log(chalk.gray('   3. Start building with confidence!'));
      console.log('');
      console.log(chalk.yellow('💡 Optional enhancements:'));
      console.log(chalk.gray('   - Run "aiknowsys check" to validate your setup'));
      console.log(chalk.gray('   - Run "aiknowsys install-agents" for code review workflow'));
      console.log(chalk.gray('   - Run "aiknowsys install-skills" for specialized capabilities'));
      console.log('');

      return;
    } catch (error) {
      spinner.fail('Failed to copy stack template');
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  }

  // Original interactive setup flow continues below
  console.log('');
  console.log(chalk.cyan.bold('🎯 Knowledge System Setup'));
  console.log('');
  
  // Check if project has existing code
  const hasCode = hasExistingProject(targetDir);
  const isEmpty = !hasCode;
  
  // Step 1: Ask about OpenSpec FIRST (unless --yes flag)
  let useOpenSpec = false;
  
  if (!options.yes) {
    if (hasCode) {
      console.log(chalk.yellow('🔍 Existing project detected!'));
      console.log('');
    }
    
    const { openspec } = await inquirer.prompt([{
      type: 'confirm',
      name: 'openspec',
      message: '📋 Use OpenSpec for change management? (Spec-driven development workflow)',
      default: false
    }]);
    
    useOpenSpec = openspec;
    
    if (useOpenSpec) {
      console.log('');
      console.log(chalk.cyan('✨ Great choice! OpenSpec enforces structured decision-making.'));
      console.log(chalk.gray('   • Write specs before code'));
      console.log(chalk.gray('   • Get team alignment early'));
      console.log(chalk.gray('   • Prevent scope creep'));
      console.log('');
    }
  }
  
  // Step 1.5: Ask about template size (unless specified via --template flag)
  let templateType = options.template || 'full';
  
  if (!options.yes && !options.template) {
    const { template } = await inquirer.prompt([{
      type: 'rawlist',
      name: 'template',
      message: '📋 Which template would you like to use?',
      choices: [
        { name: '📚 Full Template (13+ sections) - Production projects, complex systems', value: 'full' },
        { name: '📋 Minimal Template (10 sections) - Learning projects, prototypes, simple tools', value: 'minimal' }
      ],
      default: 0
    }]);
    
    templateType = template;
    
    if (templateType === 'minimal') {
      console.log('');
      console.log(chalk.cyan('✨ Using minimal template (10 core sections)'));
      console.log(chalk.gray('   • Removed: Security, Performance, Accessibility'));
      console.log(chalk.gray('   • You can add these sections later if needed'));
      console.log('');
    }
  }
  
  // Step 2: Ask setup mode (AI-guided or manual)
  let setupMode;
  let answers;
  
  if (!options.yes) {
    if (hasCode) {
      console.log(chalk.yellow('🔍 Existing project detected!'));
      console.log('');
    }
    
    const { mode } = await inquirer.prompt([{
      type: 'rawlist',
      name: 'mode',
      message: isEmpty 
        ? '🚀 How would you like to set up your project?'
        : '🚀 How would you like to set up the knowledge system?',
      choices: isEmpty 
        ? [
            { name: '🤖 AI-Guided Bootstrap (Recommended) - AI helps design & build your project', value: 'ai' },
            { name: '📝 Manual Setup - Answer questions and set up yourself', value: 'manual' }
          ]
        : [
            { name: '🤖 AI-Guided Documentation (Recommended) - AI scans and documents your code', value: 'ai' },
            { name: '🔍 Scan Codebase - Auto-detect tech stack', value: 'scan' },
            { name: '📝 Manual Setup - Fill templates yourself', value: 'manual' }
          ]
    }]);
    
    setupMode = mode;
    
    // If scan mode for existing project
    if (mode === 'scan' && hasCode) {
      const { migrate } = await import('./migrate.js');
      return migrate({ dir: targetDir });
    }
    
    // If manual mode, collect answers now
    if (mode === 'manual') {
      answers = await askManualQuestions(targetDir, hasCode);
      if (!answers) return; // User cancelled
      answers.useOpenSpec = useOpenSpec; // Add OpenSpec preference
    } else {
      // AI mode: use defaults for file generation
      answers = {
        projectType: 'web-app',
        language: 'typescript',
        framework: 'vue',
        projectName: path.basename(targetDir),
        projectDescription: '',
        isTeamProject: false,
        useTDD: true, // Default to TDD enabled
        useOpenSpec: useOpenSpec // Use the answer from step 1
      };
    }
  } else {
    // --yes flag: default to AI mode with defaults
    setupMode = 'ai';
    answers = {
      projectType: 'web-app',
      language: 'typescript',
      framework: 'vue',
      projectName: path.basename(targetDir),
      projectDescription: '',
      isTeamProject: false,
      useTDD: true, // Default to TDD enabled
      useOpenSpec: false // Default to no OpenSpec with --yes flag
    };
    console.log(chalk.gray('Using AI-guided mode with defaults (--yes flag)'));
    console.log('');
  }
  
  // Step 2: Generate base files (always needed)
  const spinner = ora('Creating knowledge system files...').start();
  
  try {
    const packageDir = getPackageDir();
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Determine which template file to use
    const templateFile = templateType === 'minimal' 
      ? 'templates/CODEBASE_ESSENTIALS.minimal.template.md'
      : 'templates/CODEBASE_ESSENTIALS.template.md';
    
    // Build replacement map with auto-filled values from answers
    const replacements = {
      '{{PROJECT_NAME}}': answers.projectName,
      '{{PROJECT_TYPE}}': getProjectTypeName(answers.projectType || 'web-app'),
      '{{LANGUAGE}}': answers.customLanguage || getLanguageName(answers.language),
      '{{FRAMEWORK}}': getFrameworkName(answers.framework),
      '{{DATE}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      '{{STACK_CATEGORY}}': answers.projectType === 'backend' ? 'Backend Stack' : (answers.projectType === 'frontend' ? 'Frontend Stack' : 'Full Stack'),
      '{{VERSION}}': 'TBD',
      '{{BUILD_TOOL}}': answers.buildTool || 'TBD',
      '{{PACKAGE_MANAGER}}': answers.packageManager || 'npm',
      '{{TEST_FRAMEWORK}}': answers.testFramework || 'TBD',
      '{{COVERAGE_TOOL}}': answers.testFramework === 'vitest' ? 'Vitest (built-in)' : (answers.testFramework === 'jest' ? 'Jest (built-in)' : 'TBD'),
      '{{LINTER}}': answers.linter || 'TBD',
      '{{CONTAINER_PLATFORM}}': 'TBD',
      '{{DATABASE}}': answers.database || 'TBD',
      '{{DEPLOYMENT_PLATFORM}}': 'TBD'
    };
    
    // Add individual command placeholders
    const pm = answers.packageManager || 'npm';
    const isBun = pm === 'bun';
    
    replacements['{{TEST_CMD}}'] = answers.testFramework && answers.testFramework !== 'none'
      ? (isBun ? 'bun test' : `${pm} test`)
      : `${pm} test`;
    
    replacements['{{TYPE_CHECK_CMD}}'] = answers.language === 'typescript'
      ? (isBun ? 'bun run type-check' : `${pm} run type-check`)
      : 'N/A (not using TypeScript)';
    
    replacements['{{LINT_CMD}}'] = answers.linter && answers.linter !== 'none'
      ? (isBun ? 'bun run lint' : `${pm} run lint`)
      : 'TBD';
    
    // Build validation matrix rows based on answers
    const validationRows = buildValidationMatrix(answers);
    replacements['{{VALIDATION_ROWS}}'] = validationRows;
    
    // Copy template files with replacements
    copyTemplate(
      path.join(packageDir, templateFile),
      path.join(targetDir, 'CODEBASE_ESSENTIALS.md'),
      replacements
    );
    
    copyTemplate(
      path.join(packageDir, 'templates', 'AGENTS.template.md'),
      path.join(targetDir, 'AGENTS.md')
    );
    
    copyTemplate(
      path.join(packageDir, 'templates', 'CODEBASE_CHANGELOG.template.md'),
      path.join(targetDir, 'CODEBASE_CHANGELOG.md'),
      {
        '{{PROJECT_NAME}}': answers.projectName,
        '{{DATE}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }
    );
    
    copyTemplate(
      path.join(packageDir, 'SETUP_GUIDE.md'),
      path.join(targetDir, 'SETUP_GUIDE.md')
    );
    
    spinner.succeed('Knowledge system files created');
    
    // Step 3: Install agents and skills (always)
    const agentSpinner = ora('Installing custom agents...').start();
    const { installAgents } = await import('./install-agents.js');
    await installAgents({ dir: targetDir, essentials: 'CODEBASE_ESSENTIALS.md', _silent: true });
    agentSpinner.succeed('Custom agents installed');
    
    const skillsSpinner = ora('Installing universal skills...').start();
    const { installSkills } = await import('./install-skills.js');
    await installSkills({ dir: targetDir, _silent: true });
    skillsSpinner.succeed('Universal skills installed');
    
    // Step 3.6: Create .aiknowsys directory structure for session persistence and learned skills
    const aiknowsysSpinner = ora('Setting up session persistence...').start();
    const aiknowsysDir = path.join(targetDir, '.aiknowsys');
    const sessionsDir = path.join(aiknowsysDir, 'sessions');
    const learnedDir = path.join(aiknowsysDir, 'learned');
    
    await fs.promises.mkdir(sessionsDir, { recursive: true });
    await fs.promises.mkdir(learnedDir, { recursive: true });
    
    // Copy README files to explain the directories
    await fs.promises.copyFile(
      path.join(packageDir, 'templates', 'aiknowsys-structure', 'sessions', 'README.md'),
      path.join(sessionsDir, 'README.md')
    );
    
    await fs.promises.copyFile(
      path.join(packageDir, 'templates', 'aiknowsys-structure', 'learned', 'README.md'),
      path.join(learnedDir, 'README.md')
    );
    
    aiknowsysSpinner.succeed('Session persistence ready');
    
    // Step 3.7: Install TDD enforcement tools (if requested)
    if (answers.useTDD) {
      const tddSpinner = ora('Setting up TDD enforcement...').start();
      
      // Install TDD skill if not already present
      const tddSkillPath = path.join(targetDir, '.github', 'skills', 'tdd-workflow');
      if (!fs.existsSync(tddSkillPath)) {
        await fs.promises.mkdir(tddSkillPath, { recursive: true });
        await fs.promises.copyFile(
          path.join(packageDir, 'templates', 'skills', 'tdd-workflow', 'SKILL.md'),
          path.join(tddSkillPath, 'SKILL.md')
        );
      }
      
      // Copy git hooks
      const gitHooksDir = path.join(targetDir, '.git-hooks');
      await fs.promises.mkdir(gitHooksDir, { recursive: true });
      
      await fs.promises.copyFile(
        path.join(packageDir, 'templates', 'git-hooks', 'pre-commit'),
        path.join(gitHooksDir, 'pre-commit')
      );
      
      await fs.promises.copyFile(
        path.join(packageDir, 'templates', 'git-hooks', 'README.md'),
        path.join(gitHooksDir, 'README.md')
      );
      
      // Copy install script
      const scriptsDir = path.join(targetDir, 'scripts');
      if (!fs.existsSync(scriptsDir)) {
        await fs.promises.mkdir(scriptsDir, { recursive: true });
      }
      
      await fs.promises.copyFile(
        path.join(packageDir, 'templates', 'scripts', 'install-git-hooks.sh'),
        path.join(scriptsDir, 'install-git-hooks.sh')
      );
      
      // Make files executable
      try {
        await fs.promises.chmod(path.join(gitHooksDir, 'pre-commit'), 0o755);
        await fs.promises.chmod(path.join(scriptsDir, 'install-git-hooks.sh'), 0o755);
      } catch (error) {
        // Chmod may fail on Windows, but that's OK
      }
      
      // Copy GitHub Actions workflow
      const workflowsDir = path.join(targetDir, '.github', 'workflows');
      await fs.promises.mkdir(workflowsDir, { recursive: true });
      
      await fs.promises.copyFile(
        path.join(packageDir, 'templates', 'workflows', 'tdd-compliance.yml'),
        path.join(workflowsDir, 'tdd-compliance.yml')
      );
      
      tddSpinner.succeed('TDD enforcement configured');
    }
    
    // Step 4: Success message
    console.log('');
    console.log(chalk.green.bold('✅ Knowledge system initialized!'));
    console.log('');
    console.log(chalk.white('📁 Created files:'));
    console.log(chalk.gray(`   • CODEBASE_ESSENTIALS.md (${templateType} template with TODO sections)`));
    console.log(chalk.gray('   • AGENTS.md (custom agents)'));
    console.log(chalk.gray('   • CODEBASE_CHANGELOG.md'));
    console.log(chalk.gray('   • SETUP_GUIDE.md (customization instructions)'));
    console.log(chalk.gray('   • .github/agents/ & .github/skills/'));
    console.log(chalk.gray('   • .aiknowsys/sessions/ (session persistence)'));
    console.log(chalk.gray('   • .aiknowsys/learned/ (discovered patterns)'));
    if (answers.useTDD) {
      console.log(chalk.gray('   • .git-hooks/ (TDD enforcement hooks)'));
      console.log(chalk.gray('   • .github/workflows/tdd-compliance.yml (CI enforcement)'));
      console.log(chalk.gray('   • scripts/install-git-hooks.sh'));
    }
    console.log('');
    
    if (answers.useTDD) {
      console.log(chalk.cyan.bold('🧪 TDD Enforcement Active'));
      console.log(chalk.gray('   Run: ./scripts/install-git-hooks.sh to enable pre-commit checks'));
      console.log(chalk.gray('   See: .git-hooks/README.md for details'));
      console.log('');
    }
    
    console.log(chalk.yellow.bold('⚠️  Important: Reload VS Code to activate custom agents'));
    console.log(chalk.gray('   Command Palette → "Developer: Reload Window"'));
    console.log('');
    
    // Step 5: OpenSpec installation (if requested)
    if (answers.useOpenSpec) {
      console.log('');
      await setupOpenSpec(targetDir);
    }
    
    // Step 6: Show appropriate next steps based on mode
    if (setupMode === 'ai') {
      displayAIBootstrapPrompt(answers.projectName, hasCode, answers.useOpenSpec);
    } else {
      displayManualSetupInstructions();
    }
    
  } catch (error) {
    spinner.fail('Failed to initialize');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function getProjectTypeName(key) {
  const names = {
    'web-app': 'Web Application',
    'frontend': 'Frontend Application',
    'backend': 'Backend Service/API',
    'library': 'Library/Package',
    'cli': 'CLI Tool',
    'other': 'Other'
  };
  return names[key] || key;
}

function getLanguageName(key) {
  const names = {
    typescript: 'TypeScript',
    python: 'Python',
    rust: 'Rust',
    go: 'Go',
    java: 'Java',
    csharp: 'C#'
  };
  return names[key] || key;
}

function getFrameworkName(key) {
  const names = {
    vue: 'Vue 3',
    react: 'React',
    svelte: 'Svelte',
    angular: 'Angular',
    nextjs: 'Next.js',
    solid: 'Solid.js',
    vanilla: 'Vanilla JS',
    django: 'Django',
    fastapi: 'FastAPI',
    flask: 'Flask',
    express: 'Express.js',
    fastify: 'Fastify',
    nestjs: 'NestJS',
    hono: 'Hono'
  };
  return names[key] || key || 'None specified';
}
