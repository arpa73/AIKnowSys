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
      type: 'list',
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
      default: 'web-app'
    }
  ]);
}

async function getTechStack(basicInfo) {
  const prompts = [
    {
      type: 'list',
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
      default: 'typescript'
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
      type: 'list',
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
      default: 'vue'
    });
  }

  if (needsBackendFramework) {
    prompts.push(
      {
        type: 'list',
        name: 'framework',
        message: '⚙️  Backend framework:',
        when: (ans) => ans.language === 'python',
        choices: [
          { name: 'Django', value: 'django' },
          { name: 'FastAPI', value: 'fastapi' },
          { name: 'Flask', value: 'flask' },
          { name: 'Other', value: 'other' }
        ],
        default: 'fastapi'
      },
      {
        type: 'list',
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
        default: 'express'
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
  
  // Check for existing project
  if (hasExistingProject(targetDir)) {
    console.log(chalk.yellow('🔍 Existing project detected!'));
    console.log('');
    
    if (!options.yes) {
      const { mode } = await inquirer.prompt([{
        type: 'list',
        name: 'mode',
        message: 'Choose setup mode:',
        choices: [
          { name: 'Scan existing codebase (recommended)', value: 'scan' },
          { name: 'Manual setup (blank templates)', value: 'manual' }
        ]
      }]);
      
      if (mode === 'scan') {
        const { migrate } = await import('./migrate.js');
        return migrate({ dir: targetDir });
      }
    }
  }
  
  console.log(chalk.blue('📝 Let\'s set up your project documentation!'));
  console.log('');
  console.log(chalk.gray('I\'ll ask a few questions to customize the knowledge system for your project.'));
  console.log(chalk.gray('This helps AI assistants understand your codebase better.'));
  console.log('');
  
  // Use defaults if --yes flag is provided
  let answers;
  if (options.yes) {
    answers = {
      projectType: 'web-app',
      language: 'typescript',
      framework: 'vue',
      projectName: path.basename(targetDir),
      projectDescription: '',
      useOpenSpec: false
    };
    console.log(chalk.gray('Using defaults (--yes flag):'));
    console.log(chalk.gray(`  Project: ${answers.projectName}`));
    console.log(chalk.gray(`  Type: Web Application`));
    console.log(chalk.gray(`  Stack: TypeScript + Vue`));
    console.log('');
  } else {
    // Step 1: Project Info
    const basicInfo = await getBasicProjectInfo(targetDir);
    
    // Step 2: Technology Stack
    const techStack = await getTechStack(basicInfo);
    
    // Step 3: Team & Workflow
    const workflow = await getWorkflowPreferences();
    
    answers = { ...basicInfo, ...techStack, ...workflow };
    
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
      return;
    }
  }
  
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
    
    spinner.succeed('Core files created');
    
    // Install agents
    const agentSpinner = ora('Installing custom agents...').start();
    const { installAgents } = await import('./install-agents.js');
    await installAgents({ dir: targetDir, essentials: 'CODEBASE_ESSENTIALS.md', _silent: true });
    agentSpinner.succeed('Custom agents installed');
    
    // Install skills
    const skillsSpinner = ora('Installing universal skills...').start();
    const { installSkills } = await import('./install-skills.js');
    await installSkills({ dir: targetDir, _silent: true });
    skillsSpinner.succeed('Universal skills installed');
    
    console.log('');
    console.log(chalk.green.bold('✅ Knowledge system initialized!'));
    console.log('');
    console.log(chalk.white('📁 Created files:'));
    console.log(chalk.gray('   • CODEBASE_ESSENTIALS.md'));
    console.log(chalk.gray('   • AGENTS.md'));
    console.log(chalk.gray('   • CODEBASE_CHANGELOG.md'));
    console.log(chalk.gray('   • .github/agents/developer.agent.md'));
    console.log(chalk.gray('   • .github/agents/architect.agent.md'));
    console.log(chalk.gray('   • .github/skills/'));
    console.log('');
    console.log(chalk.cyan('📖 Next steps:'));
    console.log(chalk.white('   1. Complete TODO sections in CODEBASE_ESSENTIALS.md'));
    console.log(chalk.white('   2. Customize validation matrix in AGENTS.md'));
    console.log(chalk.white('   3. Start using: @Developer <your request>'));
    
    displayAIPrompt(chalk, [
      '"I just initialized aiknowsys in my project. Please help me complete',
      'the TODO sections in CODEBASE_ESSENTIALS.md and AGENTS.md based on my',
      'codebase. Read those files, scan my project structure, and fill in:',
      '1. Technology Snapshot - detect all frameworks/tools',
      '2. Validation Matrix - add appropriate test/lint/build commands',
      '3. Core Patterns - identify common patterns in my code',
      '4. Architecture Decisions - document key choices',
      'Make the documentation specific to MY project, not generic."'
    ]);
    
    // OpenSpec installation
    if (answers.useOpenSpec) {
      console.log('');
      await setupOpenSpec(targetDir);
    }
    
    console.log('');
    
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
