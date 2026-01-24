import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getPackageDir, copyTemplate, hasExistingProject, displayAIPrompt } from '../utils.js';

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
  
  console.log(chalk.blue('📝 Starting fresh project setup...'));
  console.log('');
  
  // Step 1: Technology Stack
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'What\'s your primary language?',
      choices: [
        { name: 'TypeScript/JavaScript', value: 'typescript' },
        { name: 'Python', value: 'python' },
        { name: 'Rust', value: 'rust' },
        { name: 'Go', value: 'go' },
        { name: 'Other', value: 'other' }
      ]
    },
    {
      type: 'input',
      name: 'customLanguage',
      message: 'Enter language name:',
      when: (ans) => ans.language === 'other'
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Frontend framework?',
      when: (ans) => ans.language === 'typescript',
      choices: [
        { name: 'Vue', value: 'vue' },
        { name: 'React', value: 'react' },
        { name: 'Svelte', value: 'svelte' },
        { name: 'Angular', value: 'angular' },
        { name: 'Next.js', value: 'nextjs' },
        { name: 'Vanilla/Other', value: 'vanilla' }
      ]
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Backend framework?',
      when: (ans) => ans.language === 'python',
      choices: [
        { name: 'Django', value: 'django' },
        { name: 'FastAPI', value: 'fastapi' },
        { name: 'Flask', value: 'flask' },
        { name: 'Other', value: 'other' }
      ]
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(targetDir)
    },
    {
      type: 'confirm',
      name: 'useOpenSpec',
      message: 'Use OpenSpec for spec-driven development? (recommended for teams)',
      default: false
    }
  ]);
  
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
        '{{LANGUAGE}}': answers.customLanguage || getLanguageName(answers.language),
        '{{FRAMEWORK}}': getFrameworkName(answers.framework),
        '{{DATE}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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
      const openSpecSpinner = ora('Installing OpenSpec...').start();
      try {
        // Check if openspec is already installed globally
        try {
          execSync('openspec --version', { stdio: 'pipe' });
          openSpecSpinner.text = 'OpenSpec already installed, initializing...';
        } catch {
          // Not installed, install it
          execSync('npm install -g openspec', { stdio: 'pipe', cwd: targetDir });
        }
        
        // Initialize openspec in the project
        execSync('openspec init', { stdio: 'pipe', cwd: targetDir });
        openSpecSpinner.succeed('OpenSpec installed and initialized');
        
        console.log(chalk.gray('   • openspec/project.md'));
        console.log(chalk.gray('   • openspec/AGENTS.md'));
      } catch (error) {
        openSpecSpinner.warn('OpenSpec installation failed (you can install manually)');
        if (error.message) {
          console.log(chalk.gray(`   Reason: ${error.message.split('\n')[0]}`));
        }
        console.log(chalk.gray('   Run: npm install -g openspec && openspec init'));
      }
    }
    console.log('');
    
  } catch (error) {
    spinner.fail('Failed to initialize');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function getLanguageName(key) {
  const names = {
    typescript: 'TypeScript',
    python: 'Python',
    rust: 'Rust',
    go: 'Go'
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
    django: 'Django',
    fastapi: 'FastAPI',
    flask: 'Flask'
  };
  return names[key] || key || 'None specified';
}
