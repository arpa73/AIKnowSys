/**
 * Template file creation and setup functions for init command
 */
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { createLogger } from '../../logger.js';
import { getPackageDir, copyTemplate } from '../../utils.js';
import { getProjectTypeName, getLanguageName, getFrameworkName, buildValidationMatrix, TEMPLATE_PATHS } from './index.js';

/**
 * Create knowledge system files with template substitution
 * @param {string} targetDir - Absolute path to target directory
 * @param {Object} answers - User answers from prompts
 * @param {string} templateType - 'full' or 'minimal'
 * @returns {Promise<void>}
 */
export async function createKnowledgeSystemFiles(targetDir, answers, templateType) {
  const packageDir = getPackageDir();
  
  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Determine which template file to use
  const templateFile = templateType === 'minimal' 
    ? TEMPLATE_PATHS.ESSENTIALS_MINIMAL
    : TEMPLATE_PATHS.ESSENTIALS_FULL;
  
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
    path.join(packageDir, TEMPLATE_PATHS.AGENTS),
    path.join(targetDir, 'AGENTS.md')
  );
  
  copyTemplate(
    path.join(packageDir, TEMPLATE_PATHS.CHANGELOG),
    path.join(targetDir, 'CODEBASE_CHANGELOG.md'),
    {
      '{{PROJECT_NAME}}': answers.projectName,
      '{{DATE}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }
  );
  
  copyTemplate(
    path.join(packageDir, TEMPLATE_PATHS.SETUP_GUIDE),
    path.join(targetDir, 'SETUP_GUIDE.md')
  );
}

/**
 * Install agents and skills
 * @param {string} targetDir - Absolute path to target directory
 * @returns {Promise<void>}
 */
export async function installAgentsAndSkills(targetDir) {
  const agentSpinner = ora('Installing custom agents...').start();
  const { installAgents } = await import('../install-agents.js');
  await installAgents({ dir: targetDir, essentials: 'CODEBASE_ESSENTIALS.md', _silent: true });
  agentSpinner.succeed('Custom agents installed');
  
  const skillsSpinner = ora('Installing universal skills...').start();
  const { installSkills } = await import('../install-skills.js');
  await installSkills({ dir: targetDir, _silent: true });
  skillsSpinner.succeed('Universal skills installed');
}

/**
 * Setup session persistence directories
 * @param {string} targetDir - Absolute path to target directory
 * @returns {Promise<void>}
 */
export async function setupSessionPersistence(targetDir) {
  const aiknowsysSpinner = ora('Setting up session persistence...').start();
  const packageDir = getPackageDir();
  const aiknowsysDir = path.join(targetDir, '.aiknowsys');
  const sessionsDir = path.join(aiknowsysDir, 'sessions');
  const learnedDir = path.join(aiknowsysDir, 'learned');
  
  await fs.promises.mkdir(sessionsDir, { recursive: true });
  await fs.promises.mkdir(learnedDir, { recursive: true });
  
  // Copy README files to explain the directories
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.SESSIONS_README),
    path.join(sessionsDir, 'README.md')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.LEARNED_README),
    path.join(learnedDir, 'README.md')
  );
  
  aiknowsysSpinner.succeed('Session persistence ready');
}

/**
 * Setup TDD enforcement tools
 * @param {string} targetDir - Absolute path to target directory
 * @returns {Promise<void>}
 */
export async function setupTDDEnforcement(targetDir) {
  const tddSpinner = ora('Setting up TDD enforcement...').start();
  const packageDir = getPackageDir();
  
  // Install TDD skill if not already present
  const tddSkillPath = path.join(targetDir, '.github', 'skills', 'tdd-workflow');
  if (!fs.existsSync(tddSkillPath)) {
    await fs.promises.mkdir(tddSkillPath, { recursive: true });
    await fs.promises.copyFile(
      path.join(packageDir, TEMPLATE_PATHS.TDD_SKILL),
      path.join(tddSkillPath, 'SKILL.md')
    );
  }
  
  // Copy git hooks
  const gitHooksDir = path.join(targetDir, '.git-hooks');
  await fs.promises.mkdir(gitHooksDir, { recursive: true });
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.GIT_HOOK_PRE_COMMIT),
    path.join(gitHooksDir, 'pre-commit')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.GIT_HOOK_README),
    path.join(gitHooksDir, 'README.md')
  );
  
  // Copy install script
  const scriptsDir = path.join(targetDir, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    await fs.promises.mkdir(scriptsDir, { recursive: true });
  }
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.INSTALL_HOOKS_SCRIPT),
    path.join(scriptsDir, 'install-git-hooks.sh')
  );
  
  // Make files executable
  try {
    await fs.promises.chmod(path.join(gitHooksDir, 'pre-commit'), 0o755);
    await fs.promises.chmod(path.join(scriptsDir, 'install-git-hooks.sh'), 0o755);
  } catch (_error) {
    // Chmod may fail on Windows, but that's OK
  }
  
  // Copy GitHub Actions workflow
  const workflowsDir = path.join(targetDir, '.github', 'workflows');
  await fs.promises.mkdir(workflowsDir, { recursive: true });
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.TDD_WORKFLOW),
    path.join(workflowsDir, 'tdd-compliance.yml')
  );
  
  tddSpinner.succeed('TDD enforcement configured');
}
