import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getPackageDir, copyTemplate, hasExistingProject, displayAIPrompt } from '../utils.js';

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
      name: 'useOpenSpec',
      message: '📋 Use OpenSpec for spec-driven development?',
      when: (ans) => ans.isTeamProject,
      default: true
    }
  ]);
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
  
  const answers = { ...basicInfo, ...techStack, ...workflow };
  
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
    } catch {
      // Not installed
    }
    
    if (!openspecInstalled) {
      openSpecSpinner.text = 'Installing OpenSpec globally (requires npm permissions)...';
      try {
        execSync('npm install -g openspec', { stdio: 'inherit' });
        openspecInstalled = true;
      } catch {
        // Installation failed - show instructions and exit gracefully
        openSpecSpinner.warn('Global install failed (may need sudo/admin permissions)');
        console.log('');
        console.log(chalk.yellow('💡 To install OpenSpec manually:'));
        console.log(chalk.white('   sudo npm install -g openspec'));
        console.log(chalk.white('   # or'));
        console.log(chalk.white('   npx openspec init'));
        return false;
      }
    }
    
    if (openspecInstalled) {
      openSpecSpinner.text = 'Initializing OpenSpec in your project...';
      execSync('openspec init', { stdio: 'pipe', cwd: targetDir });
      openSpecSpinner.succeed('OpenSpec installed and initialized');
      
      console.log(chalk.gray('   • openspec/project.md'));
      console.log(chalk.gray('   • openspec/AGENTS.md'));
      console.log('');
      console.log(chalk.cyan('📖 OpenSpec Tips:'));
      console.log(chalk.white('   • Create specs: openspec create <feature-name>'));
      console.log(chalk.white('   • Get approval before coding to align the team'));
      return true;
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
    
    // Copy template files
    copyTemplate(
      path.join(packageDir, 'CODEBASE_ESSENTIALS.template.md'),
      path.join(targetDir, 'CODEBASE_ESSENTIALS.md'),
      {
        '{{PROJECT_NAME}}': answers.projectName,
        '{{PROJECT_TYPE}}': getProjectTypeName(answers.projectType || 'web-app'),
        '{{LANGUAGE}}': answers.customLanguage || getLanguageName(answers.language),
        '{{FRAMEWORK}}': getFrameworkName(answers.framework),
        '{{DATE}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        '{{STACK_CATEGORY}}': answers.projectType === 'backend' ? 'Backend Stack' : (answers.projectType === 'frontend' ? 'Frontend Stack' : 'Full Stack'),
        '{{VERSION}}': 'TBD',
        '{{BUILD_TOOL}}': 'TBD',
        '{{PACKAGE_MANAGER}}': 'TBD',
        '{{TEST_FRAMEWORK}}': 'TBD',
        '{{COVERAGE_TOOL}}': 'TBD',
        '{{LINTER}}': 'TBD',
        '{{CONTAINER_PLATFORM}}': 'TBD',
        '{{DATABASE}}': 'TBD',
        '{{DEPLOYMENT_PLATFORM}}': 'TBD',
        '{{VALIDATION_ROWS}}': '| Any file | `npm test` (or equivalent) | ✅ Before commit |'
      }
    );
    
    copyTemplate(
      path.join(packageDir, 'AGENTS.template.md'),
      path.join(targetDir, 'AGENTS.md')
    );
    
    copyTemplate(
      path.join(packageDir, 'CODEBASE_CHANGELOG.template.md'),
      path.join(targetDir, 'CODEBASE_CHANGELOG.md'),
      {
        '{{PROJECT_NAME}}': answers.projectName,
        '{{DATE}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }
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
    
    // Step 4: Success message
    console.log('');
    console.log(chalk.green.bold('✅ Knowledge system initialized!'));
    console.log('');
    console.log(chalk.white('📁 Created files:'));
    console.log(chalk.gray('   • CODEBASE_ESSENTIALS.md (with TODO sections)'));
    console.log(chalk.gray('   • AGENTS.md (custom agents)'));
    console.log(chalk.gray('   • CODEBASE_CHANGELOG.md'));
    console.log(chalk.gray('   • .github/agents/ & .github/skills/'));
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
