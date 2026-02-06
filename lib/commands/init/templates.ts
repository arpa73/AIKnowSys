/**
 * Template file creation and setup functions for init command
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import ora, { type Ora } from 'ora';
import { getPackageDir, copyTemplate, type Replacements } from '../../utils.js';
// @ts-ignore - JavaScript module, will be migrated in later batch
import { getGitUsername } from '../../utils/git-username.js';
import { getProjectTypeName, getLanguageName, getFrameworkName, buildValidationMatrix, TEMPLATE_PATHS, type ProjectAnswers } from './index.js';

/**
 * Options for selective installation of agents and skills
 */
export interface InstallOptions {
  agents?: boolean;
  skills?: boolean;
}

/**
 * Create knowledge system files with template substitution
 * @param targetDir - Absolute path to target directory
 * @param answers - User answers from prompts
 * @param templateType - 'full' or 'minimal'
 * @param essentialsFile - Custom essentials filename (default: CODEBASE_ESSENTIALS.md)
 */
export async function createKnowledgeSystemFiles(
  targetDir: string, 
  answers: ProjectAnswers, 
  templateType: 'full' | 'minimal', 
  essentialsFile: string = 'CODEBASE_ESSENTIALS.md'
): Promise<void> {
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
  const replacements: Replacements = {
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
  await copyTemplate(
    path.join(packageDir, templateFile),
    path.join(targetDir, essentialsFile),
    replacements
  );
  
  await copyTemplate(
    path.join(packageDir, TEMPLATE_PATHS.AGENTS),
    path.join(targetDir, 'AGENTS.md')
  );
  
  await copyTemplate(
    path.join(packageDir, TEMPLATE_PATHS.CHANGELOG),
    path.join(targetDir, 'CODEBASE_CHANGELOG.md'),
    {
      '{{PROJECT_NAME}}': answers.projectName,
      '{{DATE}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }
  );
  
  await copyTemplate(
    path.join(packageDir, TEMPLATE_PATHS.SETUP_GUIDE),
    path.join(targetDir, 'SETUP_GUIDE.md')
  );
}

/**
 * Install agents and skills, then update AGENTS.md with skill mapping
 * @param targetDir - Absolute path to target directory
 * @param answers - User answers including useTDD
 * @param silent - Whether to suppress spinner output
 * @param essentialsFile - Name of essentials file
 * @param options - Optional selective installation { agents: boolean, skills: boolean }
 */
export async function installAgentsAndSkills(
  targetDir: string, 
  answers: ProjectAnswers, 
  silent: boolean = false, 
  essentialsFile: string = 'CODEBASE_ESSENTIALS.md', 
  options: InstallOptions = {}
): Promise<void> {
  const { agents = true, skills = true } = options;
  
  if (agents) {
    const agentSpinner: Ora | null = silent ? null : ora('Installing custom agents...').start();
    // @ts-ignore - JavaScript module, will be migrated in later batch
    const { installAgents } = await import('../install-agents.js');
    await installAgents({ 
      dir: targetDir, 
      essentials: essentialsFile, 
      useTDD: answers.useTDD,
      _silent: true 
    });
    if (agentSpinner) agentSpinner.succeed('Custom agents installed');
  }
  
  if (skills) {
    const skillsSpinner: Ora | null = silent ? null : ora('Installing universal skills...').start();
    // @ts-ignore - JavaScript module, will be migrated in later batch
    const { installSkills } = await import('../install-skills.js');
    await installSkills({ dir: targetDir, _silent: true });
    if (skillsSpinner) skillsSpinner.succeed('Universal skills installed');
  }
  
  // Generate skill mapping and update AGENTS.md (only if skills installed)
  if (skills) {
    const mappingSpinner: Ora | null = silent ? null : ora('Generating skill mapping...').start();
    // @ts-ignore - JavaScript module, will be migrated in later batch
    const { buildSkillMapping } = await import('../../skill-mapping.js');
    const skillMapping = await buildSkillMapping(targetDir);
    
    // Update AGENTS.md with generated skill mapping
    const agentsPath = path.join(targetDir, 'AGENTS.md');
    let agentsContent = await fs.promises.readFile(agentsPath, 'utf-8');
    agentsContent = agentsContent.replace('{{SKILL_MAPPING}}', skillMapping);
    await fs.promises.writeFile(agentsPath, agentsContent, 'utf-8');
    
    if (mappingSpinner) mappingSpinner.succeed('Skill mapping generated');
  }
}

/**
 * Setup session persistence directories
 * @param targetDir - Absolute path to target directory
 * @param silent - Whether to suppress spinner output
 */
export async function setupSessionPersistence(targetDir: string, silent: boolean = false): Promise<void> {
  const aiknowsysSpinner: Ora | null = silent ? null : ora('Setting up session persistence...').start();
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
  
  // Copy plan-management learned skill (universal pattern)
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.PLAN_MANAGEMENT),
    path.join(learnedDir, 'plan-management.md')
  );
  
  // Copy essentials-compression learned skill (universal pattern)
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.ESSENTIALS_COMPRESSION),
    path.join(learnedDir, 'essentials-compression.md')
  );
  
  // Setup personal patterns directory (gitignored)
  const username = getGitUsername();
  if (username) {
    const personalDir = path.join(aiknowsysDir, 'personal', username);
    await fs.promises.mkdir(personalDir, { recursive: true });
    
    await fs.promises.copyFile(
      path.join(packageDir, TEMPLATE_PATHS.PERSONAL_README),
      path.join(personalDir, 'README.md')
    );
    
    // Update .gitignore to exclude personal/ directory
    const gitignorePath = path.join(targetDir, '.gitignore');
    let gitignoreContent = '';
    
    try {
      gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf-8');
    } catch {
      // .gitignore doesn't exist, will create it
    }
    
    // Add personal/ pattern if not already present (check for variations)
    const hasPersonalPattern = gitignoreContent.match(/^\.?\/?\.aiknowsys\/personal[/*]?$/m);
    if (!hasPersonalPattern) {
      const personalPattern = '\n# AIKnowSys personal patterns (not shared)\n.aiknowsys/personal/\n';
      gitignoreContent += personalPattern;
      await fs.promises.writeFile(gitignorePath, gitignoreContent);
    }
    
    // Add reviews/ pattern (ephemeral, gitignored)
    const hasReviewsPattern = gitignoreContent.match(/^\.?\/?\.aiknowsys\/reviews[/*]?$/m);
    if (!hasReviewsPattern) {
      const reviewsPattern = '\n# AIKnowSys pending reviews (ephemeral)\n.aiknowsys/reviews/\n';
      gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf-8'); // Re-read in case it was just created
      gitignoreContent += reviewsPattern;
      await fs.promises.writeFile(gitignorePath, gitignoreContent);
    }
  }
  
  // Create plans directory (per-developer active plans - committed)
  const plansDir = path.join(aiknowsysDir, 'plans');
  await fs.promises.mkdir(plansDir, { recursive: true });
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.PLANS_README),
    path.join(plansDir, 'README.md')
  );
  
  // Create initial active plan for current user
  if (username) {
    const activePlanContent = (await fs.promises.readFile(
      path.join(packageDir, TEMPLATE_PATHS.ACTIVE_PLAN),
      'utf-8'
    ))
      .replace(/{{USERNAME}}/g, username)
      .replace(/{{DATE}}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    
    await fs.promises.writeFile(
      path.join(plansDir, `active-${username}.md`),
      activePlanContent
    );
  }
  
  // Create reviews directory (per-developer pending reviews - gitignored)
  const reviewsDir = path.join(aiknowsysDir, 'reviews');
  await fs.promises.mkdir(reviewsDir, { recursive: true });
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.REVIEWS_README),
    path.join(reviewsDir, 'README.md')
  // @ts-ignore - JavaScript module, will be migrated in later batch
  );
  
  // Generate CURRENT_PLAN.md as team index (auto-generated from plans/)
  const { syncPlans } = await import('../sync-plans.js');
  await syncPlans({ dir: targetDir, _silent: true });
  
  if (aiknowsysSpinner) aiknowsysSpinner.succeed('Session persistence ready');
}

/**
 * Setup TDD enforcement tools
 * @param targetDir - Absolute path to target directory
 * @param silent - Whether to suppress spinner output
 */
export async function setupTDDEnforcement(targetDir: string, silent: boolean = false): Promise<void> {
  const tddSpinner: Ora | null = silent ? null : ora('Setting up TDD enforcement...').start();
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
  } catch {
    // Chmod may fail on Windows, but that's OK
  }
  
  // Copy GitHub Actions workflow
  const workflowsDir = path.join(targetDir, '.github', 'workflows');
  await fs.promises.mkdir(workflowsDir, { recursive: true });
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.TDD_WORKFLOW),
    path.join(workflowsDir, 'tdd-compliance.yml')
  );
  
  if (tddSpinner) tddSpinner.succeed('TDD enforcement configured');
}

/**
 * Setup all hooks (VSCode automation + git collaboration)
 * @param targetDir - Absolute path to target directory
 * @param silent - Whether to suppress spinner output
 */
export async function setupHooks(targetDir: string, silent: boolean = false): Promise<void> {
  const hooksSpinner: Ora | null = silent ? null : ora('Setting up hooks...').start();
  const packageDir = getPackageDir();
  
  // Create .github/hooks directory
  const hooksDir = path.join(targetDir, '.github', 'hooks');
  await fs.promises.mkdir(hooksDir, { recursive: true });
  
  // Copy hook scripts (5 files total)
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_HOOKS_JSON),
    path.join(hooksDir, 'hooks.json')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_SESSION_START),
    path.join(hooksDir, 'session-start.js')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_SESSION_END),
    path.join(hooksDir, 'session-end.js')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_VALIDATION_REMINDER),
    path.join(hooksDir, 'validation-reminder.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_TDD_REMINDER),
    path.join(hooksDir, 'tdd-reminder.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_HOOKS_CONFIG),
    path.join(hooksDir, 'config.json')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_SKILL_DETECTOR),
    path.join(hooksDir, 'skill-detector.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_SKILL_PREREQ_CHECK),
    path.join(hooksDir, 'skill-prereq-check.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_WORKSPACE_HEALTH),
    path.join(hooksDir, 'workspace-health.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_QUALITY_HEALTH),
    path.join(hooksDir, 'quality-health.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_COLLABORATION_CHECK),
    path.join(hooksDir, 'collaboration-check.mjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_DOC_SYNC),
    path.join(hooksDir, 'doc-sync.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_MIGRATION_CHECK),
    path.join(hooksDir, 'migration-check.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.VSCODE_PERFORMANCE_MONITOR),
    path.join(hooksDir, 'performance-monitor.cjs')
  );
  
  // Copy git collaboration hooks (Phase 3)
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.GIT_HOOK_LEARNED_REMINDER),
    path.join(hooksDir, 'learned-reminder.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.GIT_HOOK_PLAN_REMINDER),
    path.join(hooksDir, 'plan-reminder.cjs')
  );
  
  await fs.promises.copyFile(
    path.join(packageDir, TEMPLATE_PATHS.GIT_HOOK_SYNC_PLANS),
    path.join(hooksDir, 'sync-plans.cjs')
  );
  
  // Make all hook scripts executable (required by GitHub Copilot)
  // https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks
  // Generate list from TEMPLATE_PATHS constants (DRY principle)
  const hookEntries = [
    { name: 'VSCODE_SESSION_START', path: TEMPLATE_PATHS.VSCODE_SESSION_START },
    { name: 'VSCODE_SESSION_END', path: TEMPLATE_PATHS.VSCODE_SESSION_END },
    { name: 'VSCODE_VALIDATION_REMINDER', path: TEMPLATE_PATHS.VSCODE_VALIDATION_REMINDER },
    { name: 'VSCODE_TDD_REMINDER', path: TEMPLATE_PATHS.VSCODE_TDD_REMINDER },
    { name: 'VSCODE_SKILL_DETECTOR', path: TEMPLATE_PATHS.VSCODE_SKILL_DETECTOR },
    { name: 'VSCODE_SKILL_PREREQ_CHECK', path: TEMPLATE_PATHS.VSCODE_SKILL_PREREQ_CHECK },
    { name: 'VSCODE_WORKSPACE_HEALTH', path: TEMPLATE_PATHS.VSCODE_WORKSPACE_HEALTH },
    { name: 'VSCODE_QUALITY_HEALTH', path: TEMPLATE_PATHS.VSCODE_QUALITY_HEALTH },
    { name: 'VSCODE_COLLABORATION_CHECK', path: TEMPLATE_PATHS.VSCODE_COLLABORATION_CHECK },
    { name: 'VSCODE_DOC_SYNC', path: TEMPLATE_PATHS.VSCODE_DOC_SYNC },
    { name: 'VSCODE_MIGRATION_CHECK', path: TEMPLATE_PATHS.VSCODE_MIGRATION_CHECK },
    { name: 'VSCODE_PERFORMANCE_MONITOR', path: TEMPLATE_PATHS.VSCODE_PERFORMANCE_MONITOR },
    { name: 'GIT_HOOK_LEARNED_REMINDER', path: TEMPLATE_PATHS.GIT_HOOK_LEARNED_REMINDER },
    { name: 'GIT_HOOK_PLAN_REMINDER', path: TEMPLATE_PATHS.GIT_HOOK_PLAN_REMINDER },
    { name: 'GIT_HOOK_SYNC_PLANS', path: TEMPLATE_PATHS.GIT_HOOK_SYNC_PLANS }
  ];
  
  // Make hooks executable (best effort - may fail on Windows/restricted filesystems)
  for (const { path: hookPath } of hookEntries) {
    const filename = path.basename(hookPath);
    try {
      await fs.promises.chmod(path.join(hooksDir, filename), 0o755);
    } catch (err) {
      // chmod may fail on Windows or restricted filesystems
      // Files are still copied, hooks may still work if shell executes them
      if (!silent && hooksSpinner) {
        hooksSpinner.warn(`Could not make ${filename} executable (may not affect Windows)`);
      }
    }
  }
  
  // Auto-calculate counts for accurate reporting (filter on constant names, not paths)
  const vscodeCount = hookEntries.filter(e => e.name.startsWith('VSCODE_')).length;
  const gitCount = hookEntries.filter(e => e.name.startsWith('GIT_HOOK_')).length;
  if (hooksSpinner) hooksSpinner.succeed(`Hooks installed (${vscodeCount} VSCode + ${gitCount} Git = ${hookEntries.length} total)`);
}
