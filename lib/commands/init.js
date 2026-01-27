/**
 * Init command - Initialize knowledge system in a project
 * 
 * This is the main entry point. Logic is organized in:
 * - ./init/constants.js - Stack configs, name mappers
 * - ./init/prompts.js - Interactive prompt functions
 * - ./init/display.js - Output display functions
 * - ./init/openspec.js - OpenSpec integration
 */
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getPackageDir, copyTemplate, hasExistingProject } from '../utils.js';

// Import from modules
import {
  AVAILABLE_STACKS,
  askManualQuestions,
  displayAIBootstrapPrompt,
  displayManualSetupInstructions,
  setupOpenSpec,
  createKnowledgeSystemFiles,
  installAgentsAndSkills,
  setupSessionPersistence,
  setupTDDEnforcement
} from './init/index.js';

/**
 * Handle --list-stacks flag
 */
function handleListStacks() {
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
}

/**
 * Handle --stack option (pre-built stack templates)
 */
async function handleStackTemplate(options, targetDir) {
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
    throw new Error(`Invalid stack: ${options.stack}`);
  }

  // Check if project already exists
  if (hasExistingProject(targetDir)) {
    console.log('');
    console.log(chalk.yellow('⚠️  Knowledge system files already exist in this directory.'));
    console.log(chalk.gray('   Run "aiknowsys migrate" to update existing files.'));
    console.log('');
    throw new Error('Project already exists');
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
    throw error;
  }
}

/**
 * Ask about OpenSpec usage
 */
async function askOpenSpecPreference(hasCode) {
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
  
  if (openspec) {
    console.log('');
    console.log(chalk.cyan('✨ Great choice! OpenSpec enforces structured decision-making.'));
    console.log(chalk.gray('   • Write specs before code'));
    console.log(chalk.gray('   • Get team alignment early'));
    console.log(chalk.gray('   • Prevent scope creep'));
    console.log('');
  }
  
  return openspec;
}

/**
 * Ask about template size preference
 */
async function askTemplatePreference() {
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
  
  if (template === 'minimal') {
    console.log('');
    console.log(chalk.cyan('✨ Using minimal template (10 core sections)'));
    console.log(chalk.gray('   • Removed: Security, Performance, Accessibility'));
    console.log(chalk.gray('   • You can add these sections later if needed'));
    console.log('');
  }
  
  return template;
}

/**
 * Ask about setup mode
 */
async function askSetupMode(isEmpty) {
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
  
  return mode;
}

/**
 * Display success message
 */
function displaySuccessMessage(answers, templateType) {
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
}

/**
 * Main init function
 */
export async function init(options) {
  const targetDir = path.resolve(options.dir);
  
  // Handle --list-stacks option
  if (options.listStacks) {
    handleListStacks();
    return;
  }

  // Handle --stack option (pre-built stack templates)
  if (options.stack) {
    return handleStackTemplate(options, targetDir);
  }

  // Original interactive setup flow
  console.log('');
  console.log(chalk.cyan.bold('🎯 Knowledge System Setup'));
  console.log('');
  
  // Check if project has existing code
  const hasCode = hasExistingProject(targetDir);
  const isEmpty = !hasCode;
  
  // Step 1: Ask about OpenSpec FIRST (unless --yes flag)
  let useOpenSpec = false;
  let templateType = options.template || 'full';
  let setupMode;
  let answers;
  
  if (!options.yes) {
    useOpenSpec = await askOpenSpecPreference(hasCode);
    
    // Ask about template size (unless specified via --template flag)
    if (!options.template) {
      templateType = await askTemplatePreference();
    }
    
    // Ask setup mode
    setupMode = await askSetupMode(isEmpty);
    
    // If scan mode for existing project
    if (setupMode === 'scan' && hasCode) {
      const { migrate } = await import('./migrate.js');
      return migrate({ dir: targetDir });
    }
    
    // If manual mode, collect answers now
    if (setupMode === 'manual') {
      answers = await askManualQuestions(targetDir);
      if (!answers) return; // User cancelled
      answers.useOpenSpec = useOpenSpec;
    } else {
      // AI mode: use defaults for file generation
      answers = {
        projectType: 'web-app',
        language: 'typescript',
        framework: 'vue',
        projectName: path.basename(targetDir),
        projectDescription: '',
        isTeamProject: false,
        useTDD: true,
        useOpenSpec: useOpenSpec
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
      useTDD: true,
      useOpenSpec: false
    };
    console.log(chalk.gray('Using AI-guided mode with defaults (--yes flag)'));
    console.log('');
  }
  
  // Step 2: Generate base files
  const spinner = ora('Creating knowledge system files...').start();
  
  try {
    await createKnowledgeSystemFiles(targetDir, answers, templateType);
    spinner.succeed('Knowledge system files created');
    
    // Step 3: Install agents and skills
    await installAgentsAndSkills(targetDir);
    
    // Step 4: Setup session persistence
    await setupSessionPersistence(targetDir);
    
    // Step 5: Setup TDD enforcement (if requested)
    if (answers.useTDD) {
      await setupTDDEnforcement(targetDir);
    }
    
    // Step 6: Display success message
    displaySuccessMessage(answers, templateType);
    
    // Step 7: OpenSpec installation (if requested)
    if (answers.useOpenSpec) {
      console.log('');
      await setupOpenSpec(targetDir);
    }
    
    // Step 8: Show appropriate next steps based on mode
    if (setupMode === 'ai') {
      displayAIBootstrapPrompt(answers.projectName, hasCode, answers.useOpenSpec);
    } else {
      displayManualSetupInstructions();
    }
    
  } catch (error) {
    spinner.fail('Failed to initialize');
    console.error(chalk.red(error.message));
    throw error;
  }
}
