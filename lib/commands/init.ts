/**
 * Init command - Initialize knowledge system in a project
 * 
 * This is the main entry point. Logic is organized in:
 * - ./init/constants.ts - Stack configs, name mappers
 * - ./init/prompts.ts - Interactive prompt functions
 * - ./init/display.ts - Output display functions
 * - ./init/openspec.ts - OpenSpec integration
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import inquirer from 'inquirer';
import type { Ora } from 'ora';
import ora from 'ora';
import { createLogger } from '../logger.js';
import { getPackageDir, copyTemplate, hasExistingProject, FileTracker } from '../utils.js';
// @ts-ignore - banner.js not yet migrated to TypeScript, will be migrated in later batch
import { displayBanner } from '../banner.js';
// @ts-ignore - parse-essentials.js not yet migrated to TypeScript, will be migrated in later batch
import { parseEssentialsSections, COMPRESSION_THRESHOLDS } from '../parse-essentials.js';
import { saveConfig, getDefaultConfig } from '../config.js';
import type { Config } from '../config.js';
import type { InitOptions } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version
const packagePath = path.join(__dirname, '..', '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8')) as { version: string };

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
  setupTDDEnforcement,
  setupHooks
} from './init/index.js';
import type { ProjectAnswers, InstallOptions } from './init/index.js';

/**
 * Stack info structure
 */
interface StackInfo {
  name: string;
  display: string;
  description: string;
}

/**
 * Template type for ESSENTIALS.md
 */
type TemplateType = 'full' | 'minimal';

/**
 * Setup mode types
 */
type SetupMode = 'ai' | 'scan' | 'manual';

/**
 * Basic info prompts for stack template
 */
interface BasicInfo {
  projectName: string;
  projectDescription: string;
}

/**
 * Handle --list-stacks flag
 */
function handleListStacks(): void {
  const log = createLogger(false);
  log.blank();
  log.header('Available Stack Templates', '📦');
  Object.values(AVAILABLE_STACKS).forEach((stackInfo: StackInfo) => {
    log.cyan(`  ${stackInfo.name.padEnd(15)} - ${stackInfo.display}`);
    log.dim(`  ${' '.repeat(17)}${stackInfo.description}`);
  });
  log.blank();
  log.dim('💡 Usage: npx aiknowsys init --stack <name>');
  log.dim('   Example: npx aiknowsys init --stack nextjs');
  log.blank();
}

/**
 * Handle --stack option (pre-built stack templates)
 */
async function handleStackTemplate(options: InitOptions, targetDir: string): Promise<void> {
  const log = createLogger(false);
  
  // Validate stack name
  if (!options.stack || !AVAILABLE_STACKS[options.stack]) {
    log.blank();
    log.error(`Unknown stack: "${options.stack}"`);
    log.blank();
    log.yellow('💡 Available stacks:');
    Object.keys(AVAILABLE_STACKS).forEach((name: string) => {
      log.cyan(`   - ${name}`);
    });
    log.blank();
    log.dim('   Use --list-stacks for detailed descriptions');
    log.blank();
    throw new Error(`Invalid stack: ${options.stack}`);
  }

  // Check if project already exists
  if (await hasExistingProject(targetDir)) {
    log.blank();
    log.yellow('⚠️  Knowledge system files already exist in this directory.');
    log.dim('   Run "aiknowsys migrate" to update existing files.');
    log.blank();
    throw new Error('Project already exists');
  }

  const stackInfo = AVAILABLE_STACKS[options.stack] as StackInfo;
  log.blank();
  log.header(`Initializing with ${stackInfo.display}`, '🚀');

  // Minimal prompts for stack template
  const basicInfo = await inquirer.prompt<BasicInfo>([
    {
      type: 'input',
      name: 'projectName',
      message: '📦 Project name:',
      default: path.basename(targetDir),
      validate: (input: string) => input.trim().length > 0 || 'Project name is required'
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: '📝 Brief description:',
      default: ''
    }
  ]);

  const replacements: Record<string, string> = {
    PROJECT_NAME: basicInfo.projectName,
    PROJECT_DESCRIPTION: basicInfo.projectDescription || 'A modern web application',
    DATE: new Date().toISOString().split('T')[0],
    YEAR: new Date().getFullYear().toString()
  };

  // Copy stack template with rollback support
  const packageDir = getPackageDir();
  const stackTemplatePath = path.join(packageDir, 'templates', 'stacks', options.stack, 'CODEBASE_ESSENTIALS.md');
  const essentialsFile = options.essentials || 'CODEBASE_ESSENTIALS.md';
  const targetEssentialsPath = path.join(targetDir, essentialsFile);
  const tracker = new FileTracker();

  const spinner = ora('Copying stack template...').start();
  try {
    let content = await fs.promises.readFile(stackTemplatePath, 'utf-8');
    
    // Replace placeholders
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }

    await fs.promises.mkdir(targetDir, { recursive: true });
    tracker.trackDir(targetDir);
    
    await fs.promises.writeFile(targetEssentialsPath, content, 'utf-8');
    tracker.trackFile(targetEssentialsPath);
    spinner.succeed('Stack template copied');

    // Copy AGENTS and CHANGELOG templates
    const agentsPath = path.join(targetDir, 'AGENTS.md');
    await copyTemplate(
      path.join(packageDir, 'templates/AGENTS.template.md'),
      agentsPath,
      replacements
    );
    tracker.trackFile(agentsPath);
    
    const changelogPath = path.join(targetDir, 'CODEBASE_CHANGELOG.md');
    await copyTemplate(
      path.join(packageDir, 'templates/CODEBASE_CHANGELOG.template.md'),
      changelogPath,
      replacements
    );
    tracker.trackFile(changelogPath);

    // Success message
    log.blank();
    log.green('✅ Knowledge system initialized!');
    log.blank();
    log.section('Created files', '📋');
    log.dim('   - CODEBASE_ESSENTIALS.md  (Pre-filled with stack patterns)');
    log.dim('   - AGENTS.md               (AI agent workflow)');
    log.dim('   - CODEBASE_CHANGELOG.md   (Session history)');
    log.blank();
    log.section('Next steps', '🚀');
    log.dim('   1. Review CODEBASE_ESSENTIALS.md (pre-filled patterns)');
    log.dim('   2. Customize validation commands if needed');
    log.dim('   3. Start building with confidence!');
    log.blank();
    log.yellow('💡 Optional enhancements:');
    log.dim('   - Run "aiknowsys check" to validate your setup');
    log.dim('   - Run "aiknowsys install-agents" for code review workflow');
    log.dim('   - Run "aiknowsys install-skills" for specialized capabilities');
    log.blank();

    return;
  } catch (error) {
    spinner.fail('Failed to copy stack template');
    log.error(`Error: ${(error as Error).message}`);
    await tracker.rollback(log);
    throw error;
  }
}

/**
 * Ask about OpenSpec usage
 */
async function askOpenSpecPreference(hasCode: boolean): Promise<boolean> {
  const log = createLogger(false);
  
  if (hasCode) {
    log.yellow('🔍 Existing project detected!');
    log.blank();
  }
  
  const { openspec } = await inquirer.prompt<{ openspec: boolean }>([{
    type: 'confirm',
    name: 'openspec',
    message: '📋 Use OpenSpec for change management? (Spec-driven development workflow)',
    default: false
  }]);
  
  if (openspec) {
    log.blank();
    log.cyan('✨ Great choice! OpenSpec enforces structured decision-making.');
    log.dim('   • Write specs before code');
    log.dim('   • Get team alignment early');
    log.dim('   • Prevent scope creep');
    log.blank();
  }
  
  return openspec;
}

/**
 * Ask about template size preference
 */
async function askTemplatePreference(): Promise<TemplateType> {
  const { template } = await inquirer.prompt<{ template: TemplateType }>([{
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
    const log = createLogger(false);
    log.blank();
    log.cyan('✨ Using minimal template (10 core sections)');
    log.dim('   • Removed: Security, Performance, Accessibility');
    log.dim('   • You can add these sections later if needed');
    log.blank();
  }
  
  return template;
}

/**
 * Ask about setup mode
 */
async function askSetupMode(isEmpty: boolean): Promise<SetupMode> {
  const { mode } = await inquirer.prompt<{ mode: SetupMode }>([{
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
function displaySuccessMessage(answers: ProjectAnswers, templateType: TemplateType): void {
  const log = createLogger(false);
  
  log.blank();
  log.green('✅ Knowledge system initialized!');
  log.blank();
  log.white('📁 Created files:');
  log.dim(`   • CODEBASE_ESSENTIALS.md (${templateType} template with TODO sections)`);
  log.dim('   • AGENTS.md (custom agents)');
  log.dim('   • CODEBASE_CHANGELOG.md');
  log.dim('   • SETUP_GUIDE.md (customization instructions)');
  log.dim('   • .github/agents/ & .github/skills/');
  log.dim('   • .aiknowsys/sessions/ (session persistence)');
  log.dim('   • .aiknowsys/learned/ (discovered patterns)');
  if (answers.useVSCodeHooks !== false) {
    log.dim('   • .github/hooks/ (VSCode session hooks)');
  }
  if (answers.useTDD) {
    log.dim('   • .git-hooks/ (TDD enforcement hooks)');
    log.dim('   • .github/workflows/tdd-compliance.yml (CI enforcement)');
    log.dim('   • scripts/install-git-hooks.sh');
  }
  log.blank();
  
  if (answers.useTDD) {
    log.header('TDD Enforcement Active', '🧪');
    log.dim('   Run: ./scripts/install-git-hooks.sh to enable pre-commit checks');
    log.dim('   See: .git-hooks/README.md for details');
    log.blank();
  }
  
  log.yellow('⚠️  Important: Reload VS Code to activate custom agents');
  log.dim('   Command Palette → "Developer: Reload Window"');
  log.blank();
}

/**
 * Perform post-init bloat check (prevention)
 * Warns immediately if ESSENTIALS is bloated after initialization
 */
async function performPostInitCheck(targetDir: string, essentialsFile: string, log: ReturnType<typeof createLogger>): Promise<void> {
  const essentialsPath = path.join(targetDir, essentialsFile);
  
  // Only check if file exists
  if (!fs.existsSync(essentialsPath)) return;
  
  const content = fs.readFileSync(essentialsPath, 'utf-8');
  const totalLines = content.split('\n').length;
  
  // Check if bloated
  if (totalLines > COMPRESSION_THRESHOLDS.TOTAL_WARN) {
    log.blank();
    log.yellow('⚠️  Post-init check: ESSENTIALS is larger than recommended');
    log.dim(`   Current: ${totalLines} lines (recommended: <${COMPRESSION_THRESHOLDS.TOTAL_WARN})`);
    log.blank();
    log.cyan('💡 Compress before committing:');
    log.white('   npx aiknowsys compress-essentials --analyze');
    log.dim('   This will show you what can be extracted to docs/');
    log.blank();
    
    // Check for verbose sections
    const sections = parseEssentialsSections(content);
    const verboseSections = sections.filter((s: { lines: number }) => s.lines > COMPRESSION_THRESHOLDS.SECTION_VERBOSE);
    
    if (verboseSections.length > 0) {
      log.white('   Verbose sections detected:');
      verboseSections.slice(0, 3).forEach((section: { name: string; lines: number }) => {
        log.dim(`     • "${section.name}" (${section.lines} lines)`);
      });
      if (verboseSections.length > 3) {
        log.dim(`     • ...and ${verboseSections.length - 3} more`);
      }
      log.blank();
    }
  }
}

/**
 * Main init function
 */
export async function init(options: InitOptions): Promise<void> {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  
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
  const log = createLogger(silent);
  
  // Show banner first (professional first impression)
  if (!silent) {
    displayBanner(log, pkg.version);
  }
  
  log.header('Knowledge System Setup', '🎯');
  
  // Check if project has existing code
  const hasCode = await hasExistingProject(targetDir);
  const isEmpty = !hasCode;
  
  // Step 1: Ask about OpenSpec FIRST (unless --yes flag)
  let useOpenSpec = false;
  let templateType: TemplateType = options.template || 'full';
  let setupMode: SetupMode;
  let answers: ProjectAnswers;
  
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
      // @ts-ignore - migrate.js not yet migrated to TypeScript, will be migrated in later batch
      const { migrate } = await import('./migrate.js');
      return migrate({ dir: targetDir });
    }
    
    // If manual mode, collect answers now
    if (setupMode === 'manual') {
      const manualAnswers = await askManualQuestions(targetDir);
      if (!manualAnswers) return; // User cancelled
      answers = { ...manualAnswers, useOpenSpec };
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
        useVSCodeHooks: true, // Default to enabled
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
      useVSCodeHooks: true, // Default to enabled
      useOpenSpec: false
    };
    log.dim('Using AI-guided mode with defaults (--yes flag)');
    log.dim('   • TDD enforcement: Enabled');
    log.dim('   • Session persistence: Enabled');
    log.blank();
  }
  
  // Step 2: Generate base files
  const spinner: Ora | null = silent ? null : ora('Creating knowledge system files...').start();
  
  try {
    const essentialsFile = options.essentials || 'CODEBASE_ESSENTIALS.md';
    await createKnowledgeSystemFiles(targetDir, answers, templateType, essentialsFile);
    if (spinner) spinner.succeed('Knowledge system files created');
    
    // Step 3: Install agents and skills (conditional)
    const installAgents = !answers.features || answers.features.includes('agents');
    const installSkills = !answers.features || answers.features.includes('skills');
    
    const installOpts: InstallOptions = { agents: installAgents, skills: installSkills };
    if (installAgents || installSkills) {
      await installAgentsAndSkills(targetDir, answers, silent, essentialsFile, installOpts);
    }
    
    // Step 4: Setup session persistence (conditional)
    const enableSessionPersistence = !answers.features || answers.features.includes('sessionPersistence');
    if (enableSessionPersistence) {
      await setupSessionPersistence(targetDir, silent);
    }
    
    // Step 5: Setup VSCode hooks (conditional)
    const enableVSCodeHooks = !answers.features || answers.features.includes('vscodeHooks');
    if (enableVSCodeHooks && answers.useVSCodeHooks !== false) {
      await setupHooks(targetDir, silent);
    }
    
    // Step 6: Setup TDD enforcement (conditional)
    const enableTDDEnforcement = !answers.features || answers.features.includes('tddEnforcement');
    if (enableTDDEnforcement && answers.useTDD) {
      await setupTDDEnforcement(targetDir, silent);
    }
    
    // Step 6.5: Generate config file with feature preferences
    if (answers.features && Array.isArray(answers.features)) {
      const config: Config = getDefaultConfig();
      
      // Update features based on user selection
      type FeatureName = 'agents' | 'skills' | 'vscodeHooks' | 'sessionPersistence' | 'tddEnforcement' | 'openspec' | 'context7';
      const selectedFeatures = answers.features;
      Object.keys(config.features).forEach((feature: string) => {
        const featureKey = feature as keyof typeof config.features;
        config.features[featureKey] = selectedFeatures.includes(feature as FeatureName);
      });
      
      await saveConfig(targetDir, config);
    }
    
    // Step 7: Display success message
    displaySuccessMessage(answers, templateType);
    
    // Step 7: Post-init bloat check (prevention)
    if (!silent) {
      await performPostInitCheck(targetDir, essentialsFile, log);
    }
    
    // Step 8: OpenSpec installation (if requested)
    if (answers.useOpenSpec) {
      log.blank();
      await setupOpenSpec(targetDir, silent);
    }
    
    // Step 9: Show appropriate next steps based on mode
    if (setupMode === 'ai') {
      await displayAIBootstrapPrompt(answers.projectName, hasCode, answers.useOpenSpec);
    } else {
      displayManualSetupInstructions();
    }
    
  } catch (error) {
    if (spinner) spinner.fail('Failed to initialize');
    log.error((error as Error).message);
    throw error;
  }
}
