/**
 * Interactive prompts for the init command
 */
import * as path from 'node:path';
import inquirer from 'inquirer';
import type { DistinctQuestion } from 'inquirer';
import { sanitizeProjectName } from '../../sanitize.js';

/**
 * Interface for basic project information
 */
export interface BasicProjectInfo {
  projectName: string;
  projectDescription: string;
  projectType: 'web-app' | 'frontend' | 'backend' | 'library' | 'cli' | 'other';
}

/**
 * Interface for tech stack information
 */
export interface TechStackInfo {
  language: 'typescript' | 'python' | 'rust' | 'go' | 'java' | 'csharp' | 'other';
  customLanguage?: string;
  framework?: 'vue' | 'react' | 'nextjs' | 'svelte' | 'angular' | 'solid' | 'vanilla' | 
              'django' | 'fastapi' | 'flask' | 'express' | 'fastify' | 'nestjs' | 'hono' | 'other';
}

/**
 * Interface for workflow preferences
 */
export interface WorkflowPreferences {
  isTeamProject: boolean;
  useTDD: boolean;
  useOpenSpec?: boolean;
}

/**
 * Interface for feature preferences
 */
export interface FeaturePreferences {
  features: Array<'agents' | 'skills' | 'vscodeHooks' | 'sessionPersistence' | 'tddEnforcement' | 'openspec' | 'context7'>;
}

/**
 * Interface for tooling details
 */
export interface ToolingDetails {
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  buildTool?: 'vite' | 'webpack' | 'rollup' | 'esbuild' | 'none';
  testFramework: 'pytest' | 'unittest' | 'nose2' | 'vitest' | 'jest' | 'mocha' | 'node-test' | 'none';
  linter: 'ruff' | 'flake8' | 'pylint' | 'eslint' | 'biome' | 'none';
  database?: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'none';
}

/**
 * Combined project answers interface
 */
export interface ProjectAnswers extends BasicProjectInfo, TechStackInfo, WorkflowPreferences, FeaturePreferences, ToolingDetails {}

/**
 * Get basic project information (name, description, type)
 */
export async function getBasicProjectInfo(targetDir: string): Promise<BasicProjectInfo> {
  return inquirer.prompt<BasicProjectInfo>([
    {
      type: 'input',
      name: 'projectName',
      message: '📦 Project name:',
      default: path.basename(targetDir),
      validate: (input: string) => {
        const result = sanitizeProjectName(input);
        if (!result.valid) {
          return result.errors.join(', ');
        }
        return true;
      }
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

/**
 * Get tech stack information (language, framework)
 */
export async function getTechStack(basicInfo: BasicProjectInfo): Promise<TechStackInfo> {
  const prompts: DistinctQuestion<TechStackInfo>[] = [
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
      when: (ans: Partial<TechStackInfo>) => ans.language === 'other'
    }
  ];

  const needsFrontendFramework = basicInfo.projectType === 'web-app' || basicInfo.projectType === 'frontend';
  const needsBackendFramework = basicInfo.projectType === 'web-app' || basicInfo.projectType === 'backend';

  if (needsFrontendFramework) {
    prompts.push({
      type: 'rawlist',
      name: 'framework',
      message: '🎨 Frontend framework:',
      when: (ans: Partial<TechStackInfo>) => ans.language === 'typescript',
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
        when: (ans: Partial<TechStackInfo>) => ans.language === 'python',
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
        when: (ans: Partial<TechStackInfo>) => ans.language === 'typescript',
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

  return inquirer.prompt<TechStackInfo>(prompts);
}

/**
 * Get workflow preferences (team, TDD, OpenSpec)
 */
export async function getWorkflowPreferences(): Promise<WorkflowPreferences> {
  return inquirer.prompt<WorkflowPreferences>([
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

/**
 * Get feature preferences for AIKnowSys features
 * Allows users to enable/disable optional components
 */
export async function getFeaturePreferences(): Promise<FeaturePreferences> {
  return inquirer.prompt<FeaturePreferences>([
    {
      type: 'checkbox',
      name: 'features',
      message: '🎯 Select features to enable:',
      choices: [
        {
          name: 'Custom Agents (@Developer, @Planner, @SeniorArchitect)',
          value: 'agents',
          checked: true
        },
        {
          name: 'Universal Skills Library (.github/skills/)',
          value: 'skills',
          checked: true
        },
        {
          name: 'VSCode Session Hooks (auto-load context, validation reminders)',
          value: 'vscodeHooks',
          checked: true
        },
        {
          name: 'Session Persistence (.aiknowsys/sessions/ tracking)',
          value: 'sessionPersistence',
          checked: true
        },
        {
          name: 'TDD Enforcement (git hooks, CI checks)',
          value: 'tddEnforcement',
          checked: true
        },
        {
          name: 'OpenSpec (spec-driven development, change proposals)',
          value: 'openspec',
          checked: false
        },
        {
          name: 'Context7 (external documentation queries)',
          value: 'context7',
          checked: false
        }
      ],
      default: ['agents', 'skills', 'vscodeHooks', 'sessionPersistence', 'tddEnforcement'],
      validate: (answer: string[]) => {
        if (answer.length < 1) {
          return 'You must enable at least one feature';
        }
        return true;
      }
    }
  ]);
}

/**
 * Get tooling details (package manager, build tool, test framework, linter, database)
 */
export async function getToolingDetails(answers: BasicProjectInfo & TechStackInfo): Promise<ToolingDetails> {
  const prompts: DistinctQuestion<ToolingDetails>[] = [];
  
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
  
  return inquirer.prompt<ToolingDetails>(prompts);
}

/**
 * Complete manual question flow
 */
export async function askManualQuestions(targetDir: string): Promise<ProjectAnswers> {
  const basicInfo = await getBasicProjectInfo(targetDir);
  const techStack = await getTechStack(basicInfo);
  const workflowPrefs = await getWorkflowPreferences();
  const featurePrefs = await getFeaturePreferences();
  
  // Merge answers
  const answers = { ...basicInfo, ...techStack, ...workflowPrefs, ...featurePrefs };
  
  // Get tooling details
  const tooling = await getToolingDetails(answers);
  
  return { ...answers, ...tooling };
}
