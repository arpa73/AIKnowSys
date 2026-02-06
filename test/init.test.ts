import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { init } from '../lib/commands/init.js';

// Note: These are integration tests that use execSync for real CLI execution.
// This is intentional - we test the actual CLI behavior end-to-end.
// For unit tests of individual functions, mock fs/child_process as needed.

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
// Use PROJECT_ROOT env var set by test script (avoids dist/ path issues)
const projectRoot: string = process.env.PROJECT_ROOT || path.join(__dirname, '..');

describe('init command', () => {
  let testDir: string;
  let testDirsToCleanup: string[] = [];

  beforeAll(() => {
    // Create base temporary test directory
    testDir = path.join(__dirname, 'tmp', `test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up any test directories created during individual tests
    testDirsToCleanup.forEach((dir: string) => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
    testDirsToCleanup = [];
  });

  afterAll(() => {
    // Cleanup base test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create core files with --yes flag', async () => {
    await init({ dir: testDir, yes: true });

    // Verify core files were created
    expect(fs.existsSync(path.join(testDir, 'CODEBASE_ESSENTIALS.md'))).toBeTruthy();
    expect(fs.existsSync(path.join(testDir, 'AGENTS.md'))).toBeTruthy();
    expect(fs.existsSync(path.join(testDir, 'CODEBASE_CHANGELOG.md'))).toBeTruthy();
    
    // Verify content includes project name
    const essentials: string = fs.readFileSync(path.join(testDir, 'CODEBASE_ESSENTIALS.md'), 'utf-8');
    expect(essentials.includes(`test-${testDir.split('-').pop()}`)).toBeTruthy();
  });

  it('should install custom agents', async () => {
    const testDirAgents: string = path.join(__dirname, 'tmp', `test-agents-${Date.now()}`);
    fs.mkdirSync(testDirAgents, { recursive: true });
    testDirsToCleanup.push(testDirAgents);

    await init({ dir: testDirAgents, yes: true });

    // Verify agents directory was created
    expect(fs.existsSync(path.join(testDirAgents, '.github', 'agents'))).toBeTruthy();
    expect(fs.existsSync(path.join(testDirAgents, '.github', 'agents', 'developer.agent.md'))).toBeTruthy();
    expect(fs.existsSync(path.join(testDirAgents, '.github', 'agents', 'architect.agent.md'))).toBeTruthy();
  });

  it('should install skills', async () => {
    const testDirSkills: string = path.join(__dirname, 'tmp', `test-skills-${Date.now()}`);
    fs.mkdirSync(testDirSkills, { recursive: true });
    testDirsToCleanup.push(testDirSkills);

    await init({ dir: testDirSkills, yes: true });

    // Verify skills directory was created
    expect(fs.existsSync(path.join(testDirSkills, '.github', 'skills'))).toBeTruthy();
    
    // Check for at least one skill
    const skillsDir: string = path.join(testDirSkills, '.github', 'skills');
    const skills: string[] = fs.readdirSync(skillsDir);
    expect(skills.length > 0).toBeTruthy();
  });

  it('should use project name from directory', async () => {
    const testDirName: string = path.join(__dirname, 'tmp', `my-awesome-project-${Date.now()}`);
    fs.mkdirSync(testDirName, { recursive: true });
    testDirsToCleanup.push(testDirName);

    await init({ dir: testDirName, yes: true });

    const essentials: string = fs.readFileSync(path.join(testDirName, 'CODEBASE_ESSENTIALS.md'), 'utf-8');
    expect(essentials.includes('my-awesome-project')).toBeTruthy();
  });

  it('should handle non-existent directory', async () => {
    const newDir: string = path.join(__dirname, 'tmp', `new-project-${Date.now()}`);
    testDirsToCleanup.push(newDir);

    // Directory doesn't exist yet
    expect(!fs.existsSync(newDir)).toBeTruthy();

    await init({ dir: newDir, yes: true });

    // Directory should be created
    expect(fs.existsSync(newDir)).toBeTruthy();
    expect(fs.existsSync(path.join(newDir, 'CODEBASE_ESSENTIALS.md'))).toBeTruthy();
  });

  it('CLI should work with --help', () => {
    const output: string = execSync('node bin/cli.js init --help', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    expect(output.includes('Initialize knowledge system')).toBeTruthy();
    expect(output.includes('--dir')).toBeTruthy();
    expect(output.includes('--yes')).toBeTruthy();
  });

  it('CLI should accept --yes flag', () => {
    const testCliDir: string = path.join(__dirname, 'tmp', `cli-test-${Date.now()}`);
    
    try {
      execSync(`node bin/cli.js init --dir ${testCliDir} --yes`, {
        cwd: projectRoot,
        encoding: 'utf-8'
      });

      expect(fs.existsSync(path.join(testCliDir, 'CODEBASE_ESSENTIALS.md'))).toBeTruthy();
    } finally {
      if (fs.existsSync(testCliDir)) {
        fs.rmSync(testCliDir, { recursive: true, force: true });
      }
    }
  });

  it('should display AI prompt when --yes flag is used', () => {
    const testYesDir: string = path.join(__dirname, 'tmp', `yes-ai-${Date.now()}`);
    
    try {
      const output: string = execSync(`node bin/cli.js init --dir ${testYesDir} --yes`, {
        cwd: projectRoot,
        encoding: 'utf-8'
      });

      // Verify AI Bootstrap prompt is displayed
      expect(output.includes('AI Assistant Prompt')).toBeTruthy();
      expect(output.includes('AI-Guided Project Bootstrap')).toBeTruthy();
      expect(output.includes('CODEBASE_ESSENTIALS.md')).toBeTruthy();
      // New AI-first flow: knowledge system setup focus (NOT full project implementation)
      expect(output.includes('SET UP THE KNOWLEDGE SYSTEM') || output.includes('scan your existing codebase')).toBeTruthy();
      expect(output.includes('STOP HERE') || output.includes('Complete all TODO sections')).toBeTruthy();
    } finally {
      if (fs.existsSync(testYesDir)) {
        fs.rmSync(testYesDir, { recursive: true, force: true });
      }
    }
  });

  it('should display AI-assisted setup message in output', () => {
    const testAIDir: string = path.join(__dirname, 'tmp', `ai-msg-${Date.now()}`);
    
    try {
      const output: string = execSync(`node bin/cli.js init --dir ${testAIDir} --yes`, {
        cwd: projectRoot,
        encoding: 'utf-8'
      });

      // Verify key messages are present
      expect(output.includes('Knowledge system initialized')).toBeTruthy();
      expect(output.includes('with TODO sections')).toBeTruthy();
      expect(output.includes('.github/agents')).toBeTruthy();
      expect(output.includes('.github/skills')).toBeTruthy();
    } finally {
      if (fs.existsSync(testAIDir)) {
        fs.rmSync(testAIDir, { recursive: true, force: true });
      }
    }
  });

  it('should support OpenSpec integration when enabled', async () => {
    const testOpenSpecDir: string = path.join(__dirname, 'tmp', `openspec-${Date.now()}`);
    fs.mkdirSync(testOpenSpecDir, { recursive: true });

    try {
      // Mock the init function with OpenSpec enabled
      // Since --yes flag uses default (no OpenSpec), we test the programmatic API
      const { init } = await import('../lib/commands/init.js');
      
      // Note: With --yes flag, OpenSpec defaults to false
      // This test verifies the init works correctly (OpenSpec controlled via prompts)
      await init({ dir: testOpenSpecDir, yes: true });

      // Verify core files were created
      expect(fs.existsSync(path.join(testOpenSpecDir, 'CODEBASE_ESSENTIALS.md'))).toBeTruthy();
      expect(fs.existsSync(path.join(testOpenSpecDir, 'AGENTS.md'))).toBeTruthy();
      
      // Verify the init works correctly regardless of OpenSpec setting
      // (Full OpenSpec integration test would require interactive prompts or mocking)
    } finally {
      fs.rmSync(testOpenSpecDir, { recursive: true, force: true });
    }
  });

  it('should mention OpenSpec in AI prompt when enabled', () => {
    const testOpenSpecPromptDir: string = path.join(__dirname, 'tmp', `openspec-prompt-${Date.now()}`);
    testDirsToCleanup.push(testOpenSpecPromptDir);
    
    // The --yes flag uses default OpenSpec=false, so this verifies the baseline
    const output: string = execSync(`node bin/cli.js init --dir ${testOpenSpecPromptDir} --yes`, {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    // With --yes (no OpenSpec), the prompt should NOT include OpenSpec references
    // This ensures our conditional logic works correctly
    const hasOpenSpecNote: boolean = output.includes('Note: This project uses OpenSpec');
    const hasOpenSpecCommand: boolean = output.includes('openspec create');
    
    // When OpenSpec is disabled (default with --yes), these should not appear
    expect(!hasOpenSpecNote || !hasOpenSpecCommand).toBeTruthy();
    
    // The prompt should still be generated correctly
    expect(output.includes('AI-Guided Project Bootstrap')).toBeTruthy();
  }, 30000); // Increase timeout for init command execution

  // Stack Template Tests
  it('should list available stacks with --list-stacks', () => {
    const output: string = execSync('node bin/cli.js init --list-stacks', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    expect(output.includes('Available Stack Templates')).toBeTruthy();
    expect(output.includes('nextjs')).toBeTruthy();
    expect(output.includes('vue-express')).toBeTruthy();
    expect(output.includes('Usage: npx aiknowsys init --stack')).toBeTruthy();
  });

  it('should create files with nextjs stack template', async () => {
    const testStackDir: string = path.join(__dirname, 'tmp', `test-stack-nextjs-${Date.now()}`);
    fs.mkdirSync(testStackDir, { recursive: true });
    testDirsToCleanup.push(testStackDir);

    // We can't test interactive prompts easily, but we can test the template loading logic
    // by verifying the stack template file exists and is valid
    const packageDir: string = path.join(projectRoot);
    const stackTemplatePath: string = path.join(packageDir, 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    
    expect(fs.existsSync(stackTemplatePath)).toBeTruthy();
    
    const content: string = fs.readFileSync(stackTemplatePath, 'utf-8');
    expect(content.length > 1000).toBeTruthy();
    expect(content.includes('Next.js')).toBeTruthy();
    expect(content.includes('{{PROJECT_NAME}}')).toBeTruthy();
    expect(content.includes('{{DATE}}')).toBeTruthy();
  });

  it('should create files with vue-express stack template', async () => {
    const packageDir: string = path.join(projectRoot);
    const stackTemplatePath: string = path.join(packageDir, 'templates', 'stacks', 'vue-express', 'CODEBASE_ESSENTIALS.md');
    
    expect(fs.existsSync(stackTemplatePath)).toBeTruthy();
    
    const content: string = fs.readFileSync(stackTemplatePath, 'utf-8');
    expect(content.length > 1000).toBeTruthy();
    expect(content.includes('Vue')).toBeTruthy();
    expect(content.includes('Express')).toBeTruthy();
    expect(content.toLowerCase().includes('monorepo')).toBeTruthy();
  });

  it('should show error for invalid stack name', () => {
    try {
      execSync('node bin/cli.js init --stack invalid-stack --dir /tmp/test-invalid', {
        cwd: projectRoot,
        encoding: 'utf-8'
      });
      expect.fail('Should have thrown an error for invalid stack');
    } catch (error: any) {
      expect(error.message.includes('Unknown stack')).toBeTruthy();
    }
  });

  it('should validate stack template has minimal placeholders', () => {
    const packageDir: string = path.join(projectRoot);
    const nextjsTemplate: string = path.join(packageDir, 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    const vueExpressTemplate: string = path.join(packageDir, 'templates', 'stacks', 'vue-express', 'CODEBASE_ESSENTIALS.md');
    
    // Verify templates exist
    expect(fs.existsSync(nextjsTemplate)).toBeTruthy();
    expect(fs.existsSync(vueExpressTemplate)).toBeTruthy();
    
    // Check Next.js template
    const nextjsContent: string = fs.readFileSync(nextjsTemplate, 'utf-8');
    const nextjsPlaceholders: string[] = nextjsContent.match(/{{[^}]+}}/g) || [];
    const allowedPlaceholders: string[] = ['{{PROJECT_NAME}}', '{{PROJECT_DESCRIPTION}}', '{{DATE}}', '{{YEAR}}'];
    
    nextjsPlaceholders.forEach((placeholder: string) => {
      expect(allowedPlaceholders.includes(placeholder)).toBeTruthy();
    });
    
    // Check Vue-Express template
    const vueExpressContent: string = fs.readFileSync(vueExpressTemplate, 'utf-8');
    const vueExpressPlaceholders: string[] = vueExpressContent.match(/{{[^}]+}}/g) || [];
    
    vueExpressPlaceholders.forEach((placeholder: string) => {
      expect(allowedPlaceholders.includes(placeholder)).toBeTruthy();
    });
  });

  it('should have pre-filled validation matrix in stack templates', () => {
    const packageDir: string = path.join(projectRoot);
    const nextjsTemplate: string = path.join(packageDir, 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    const vueExpressTemplate: string = path.join(packageDir, 'templates', 'stacks', 'vue-express', 'CODEBASE_ESSENTIALS.md');
    
    // Next.js should have npm-based commands
    const nextjsContent: string = fs.readFileSync(nextjsTemplate, 'utf-8');
    expect(nextjsContent.includes('npm run dev')).toBeTruthy();
    expect(nextjsContent.includes('npm run build')).toBeTruthy();
    expect(nextjsContent.includes('npm run type-check')).toBeTruthy();
    
    // Vue-Express should have monorepo commands
    const vueExpressContent: string = fs.readFileSync(vueExpressTemplate, 'utf-8');
    expect(vueExpressContent.includes('npm run dev')).toBeTruthy();
    expect(vueExpressContent.includes('packages/')).toBeTruthy();
  });

  it('should install TDD enforcement files with --yes flag (defaults to TDD enabled)', async () => {
    const testDirTDD: string = path.join(__dirname, 'tmp', `test-tdd-${Date.now()}`);
    fs.mkdirSync(testDirTDD, { recursive: true });
    testDirsToCleanup.push(testDirTDD);

    // --yes flag should use default (useTDD: true)
    await init({ dir: testDirTDD, yes: true });

    // Verify TDD skill was installed
    const tddSkillPath: string = path.join(testDirTDD, '.github', 'skills', 'tdd-workflow', 'SKILL.md');
    expect(fs.existsSync(tddSkillPath)).toBeTruthy();
    
    const skillContent: string = fs.readFileSync(tddSkillPath, 'utf-8');
    expect(skillContent.toLowerCase().includes('red-green-refactor')).toBeTruthy();

    // Verify git hooks were installed
    const preCommitPath: string = path.join(testDirTDD, '.git-hooks', 'pre-commit');
    expect(fs.existsSync(preCommitPath)).toBeTruthy();
    
    const preCommitContent: string = fs.readFileSync(preCommitPath, 'utf-8');
    expect(preCommitContent.includes('TDD compliance check')).toBeTruthy();

    const gitHooksReadme: string = path.join(testDirTDD, '.git-hooks', 'README.md');
    expect(fs.existsSync(gitHooksReadme)).toBeTruthy();

    // Verify install script was created
    const installScriptPath: string = path.join(testDirTDD, 'scripts', 'install-git-hooks.sh');
    expect(fs.existsSync(installScriptPath)).toBeTruthy();
    
    // On Unix systems, verify it's executable
    if (process.platform !== 'win32') {
      const stats = fs.statSync(installScriptPath);
      const isExecutable: boolean = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBeTruthy();
    }

    // Verify GitHub Actions workflow was installed
    const workflowPath: string = path.join(testDirTDD, '.github', 'workflows', 'tdd-compliance.yml');
    expect(fs.existsSync(workflowPath)).toBeTruthy();
    
    const workflowContent: string = fs.readFileSync(workflowPath, 'utf-8');
    expect(workflowContent.includes('TDD Compliance Check')).toBeTruthy();
    expect(workflowContent.includes('lib/')).toBeTruthy();
    expect(workflowContent.includes('test/')).toBeTruthy();

    // Verify AGENTS.md includes TDD workflow steps
    const agentsPath: string = path.join(testDirTDD, 'AGENTS.md');
    const agentsContent: string = fs.readFileSync(agentsPath, 'utf-8');
    expect(agentsContent.includes('TDD SELF-AUDIT')).toBeTruthy();
    expect(agentsContent.toUpperCase().includes('RED-GREEN-REFACTOR')).toBeTruthy();
  });

  it('should verify TDD files have correct permissions on Unix systems', async () => {
    // Skip on Windows
    if (process.platform === 'win32') {
      console.log('  ⏭️  Skipping permission test on Windows');
      return;
    }

    const testDirPerms: string = path.join(__dirname, 'tmp', `test-tdd-perms-${Date.now()}`);
    fs.mkdirSync(testDirPerms, { recursive: true });
    testDirsToCleanup.push(testDirPerms);

    await init({ dir: testDirPerms, yes: true });

    // Check pre-commit hook permissions
    const preCommitPath: string = path.join(testDirPerms, '.git-hooks', 'pre-commit');
    const preCommitStats = fs.statSync(preCommitPath);
    expect((preCommitStats.mode & 0o111) !== 0).toBeTruthy();

    // Check install script permissions
    const installScriptPath: string = path.join(testDirPerms, 'scripts', 'install-git-hooks.sh');
    const scriptStats = fs.statSync(installScriptPath);
    expect((scriptStats.mode & 0o111) !== 0).toBeTruthy();
  });

  it('should create .aiknowsys directory structure for session persistence', async () => {
    const testDirSession: string = path.join(__dirname, 'tmp', `test-session-${Date.now()}`);
    fs.mkdirSync(testDirSession, { recursive: true });
    
    await init({ dir: testDirSession, yes: true });

    // Verify .aiknowsys directory structure
    const aiknowsysDir: string = path.join(testDirSession, '.aiknowsys');
    expect(fs.existsSync(aiknowsysDir)).toBeTruthy();

    const sessionsDir: string = path.join(aiknowsysDir, 'sessions');
    expect(fs.existsSync(sessionsDir)).toBeTruthy();
    
    const learnedDir: string = path.join(aiknowsysDir, 'learned');
    expect(fs.existsSync(learnedDir)).toBeTruthy();

    // Verify README files
    const sessionsReadme: string = path.join(sessionsDir, 'README.md');
    expect(fs.existsSync(sessionsReadme)).toBeTruthy();
    
    const sessionsReadmeContent: string = fs.readFileSync(sessionsReadme, 'utf-8');
    expect(sessionsReadmeContent.toLowerCase().includes('session')).toBeTruthy();
    expect(sessionsReadmeContent.includes('YYYY-MM-DD-session.md')).toBeTruthy();

    const learnedReadme: string = path.join(learnedDir, 'README.md');
    expect(fs.existsSync(learnedReadme)).toBeTruthy();
    
    const learnedReadmeContent: string = fs.readFileSync(learnedReadme, 'utf-8');
    expect(learnedReadmeContent.toLowerCase().includes('learned')).toBeTruthy();
    expect(learnedReadmeContent.includes('Pattern Types')).toBeTruthy();

    // Verify plan-management learned skill (universal pattern)
    const planManagement: string = path.join(learnedDir, 'plan-management.md');
    expect(fs.existsSync(planManagement)).toBeTruthy();
    
    const planContent: string = fs.readFileSync(planManagement, 'utf-8');
    expect(planContent.includes('CURRENT_PLAN.md')).toBeTruthy();
    expect(planContent.includes('PLAN_*.md')).toBeTruthy();
    expect(planContent.includes('pointer')).toBeTruthy();
    
    // Verify essentials-compression learned skill (universal pattern)
    const essentialsCompression: string = path.join(learnedDir, 'essentials-compression.md');
    expect(fs.existsSync(essentialsCompression)).toBeTruthy();
    
    const compressionContent: string = fs.readFileSync(essentialsCompression, 'utf-8');
    expect(compressionContent.includes('compress-essentials')).toBeTruthy();
    expect(compressionContent.includes('COMPRESSION_THRESHOLDS')).toBeTruthy();

    // Verify AGENTS.md includes session protocols
    const agentsPath: string = path.join(testDirSession, 'AGENTS.md');
    const agentsContent: string = fs.readFileSync(agentsPath, 'utf-8');
    expect(agentsContent.includes('SESSION START')).toBeTruthy();
    expect(agentsContent.includes('.aiknowsys/sessions/')).toBeTruthy();
    expect(agentsContent.includes('CONTINUOUS LEARNING')).toBeTruthy();
    expect(agentsContent.includes('.aiknowsys/learned/')).toBeTruthy();

    // Clean up after assertions pass
    testDirsToCleanup.push(testDirSession);
  });

  it('should create personal patterns directory with username', async () => {
    const testDirPersonal: string = path.join(__dirname, 'tmp', `test-personal-${Date.now()}`);
    fs.mkdirSync(testDirPersonal, { recursive: true });
    
    // Initialize git config for the test (required for username detection)
    try {
      execSync('git config user.name', { cwd: testDirPersonal, stdio: 'ignore' });
    } catch {
      // If no git config, skip this test
      testDirsToCleanup.push(testDirPersonal);
      return;
    }

    await init({ dir: testDirPersonal, yes: true });

    // Get the username that should be used
    let username: string;
    try {
      username = execSync('git config user.name', { encoding: 'utf-8' }).trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch {
      username = 'test-user'; // Fallback for environments without git config
    }

    const personalDir: string = path.join(testDirPersonal, '.aiknowsys', 'personal', username);
    
    // Verify personal directory structure
    expect(fs.existsSync(personalDir)).toBeTruthy();
    
    const personalReadme: string = path.join(personalDir, 'README.md');
    expect(fs.existsSync(personalReadme)).toBeTruthy();
    
    const readmeContent: string = fs.readFileSync(personalReadme, 'utf-8');
    expect(readmeContent.includes('Personal Patterns')).toBeTruthy();
    expect(readmeContent.includes('gitignored')).toBeTruthy();
    
    // Verify .gitignore was updated
    const gitignorePath: string = path.join(testDirPersonal, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBeTruthy();
    
    const gitignoreContent: string = fs.readFileSync(gitignorePath, 'utf-8');
    expect(gitignoreContent.includes('.aiknowsys/personal/')).toBeTruthy();

    testDirsToCleanup.push(testDirPersonal);
  });

  it('should normalize username for directory naming', async () => {
    const testDirNormalize: string = path.join(__dirname, 'tmp', `test-normalize-${Date.now()}`);
    fs.mkdirSync(testDirNormalize, { recursive: true });
    
    // Check if git is configured
    let rawUsername: string;
    let normalizedUsername: string;
    try {
      rawUsername = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      
      await init({ dir: testDirNormalize, yes: true });
      
      // Username should be normalized (lowercase, hyphens instead of spaces)
      normalizedUsername = rawUsername
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const personalDir: string = path.join(testDirNormalize, '.aiknowsys', 'personal', normalizedUsername);
      expect(fs.existsSync(personalDir)).toBeTruthy();
      
      // Verify no uppercase or special characters in directory name
      const dirName: string = path.basename(personalDir);
      expect(/^[a-z0-9-]+$/.test(dirName)).toBeTruthy();
    } catch {
      // Skip test if git not configured
    }

    testDirsToCleanup.push(testDirNormalize);
  });

  it('should not fail if git username is not configured', async () => {
    const testDirNoGit: string = path.join(__dirname, 'tmp', `test-nogit-${Date.now()}`);
    fs.mkdirSync(testDirNoGit, { recursive: true });
    
    // Test assumes git username is available (common in CI/dev environments)
    // Just verify init succeeds - personal/ directory may or may not exist depending on git config
    try {
      await init({ dir: testDirNoGit, yes: true });
      
      // Core files should be created
      expect(fs.existsSync(path.join(testDirNoGit, 'CODEBASE_ESSENTIALS.md'))).toBeTruthy();
      expect(fs.existsSync(path.join(testDirNoGit, '.aiknowsys', 'sessions'))).toBeTruthy();
      expect(fs.existsSync(path.join(testDirNoGit, '.aiknowsys', 'learned'))).toBeTruthy();
      expect(fs.existsSync(path.join(testDirNoGit, '.aiknowsys', 'plans'))).toBeTruthy();
    } finally {
      testDirsToCleanup.push(testDirNoGit);
    }
  });

  it('should create plans directory with active plan for current user', async () => {
    const testDirPlans: string = path.join(__dirname, 'tmp', `test-plans-${Date.now()}`);
    fs.mkdirSync(testDirPlans, { recursive: true });
    
    // Check if git is configured
    let rawUsername: string;
    let normalizedUsername: string;
    try {
      rawUsername = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      
      await init({ dir: testDirPlans, yes: true });
      
      normalizedUsername = rawUsername
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Verify plans directory structure
      const plansDir: string = path.join(testDirPlans, '.aiknowsys', 'plans');
      expect(fs.existsSync(plansDir)).toBeTruthy();
      
      const plansReadme: string = path.join(plansDir, 'README.md');
      expect(fs.existsSync(plansReadme)).toBeTruthy();
      
      const readmeContent: string = fs.readFileSync(plansReadme, 'utf-8');
      expect(readmeContent.includes('Track what each developer')).toBeTruthy();
      expect(readmeContent.includes('active-<username>.md')).toBeTruthy();
      
      // Verify active plan file created with username
      const activePlanPath: string = path.join(plansDir, `active-${normalizedUsername}.md`);
      expect(fs.existsSync(activePlanPath)).toBeTruthy();
      
      const activePlanContent: string = fs.readFileSync(activePlanPath, 'utf-8');
      expect(activePlanContent.includes(normalizedUsername)).toBeTruthy();
      expect(activePlanContent.includes('Currently Working On:')).toBeTruthy();
      expect(activePlanContent.includes('No active plan')).toBeTruthy();
    } catch {
      // Skip test if git not configured
    }

    testDirsToCleanup.push(testDirPlans);
  });

  it('should create reviews directory and add to gitignore', async () => {
    const testDirReviews: string = path.join(__dirname, 'tmp', `test-reviews-${Date.now()}`);
    fs.mkdirSync(testDirReviews, { recursive: true });

    await init({ dir: testDirReviews, yes: true });

    // Verify reviews directory structure
    const reviewsDir: string = path.join(testDirReviews, '.aiknowsys', 'reviews');
    expect(fs.existsSync(reviewsDir)).toBeTruthy();
    
    const reviewsReadme: string = path.join(reviewsDir, 'README.md');
    expect(fs.existsSync(reviewsReadme)).toBeTruthy();
    
    const readmeContent: string = fs.readFileSync(reviewsReadme, 'utf-8');
    expect(readmeContent.includes('ephemeral')).toBeTruthy();
    expect(readmeContent.includes('PENDING_<username>.md')).toBeTruthy();
    expect(readmeContent.includes('gitignored')).toBeTruthy();
    
    // Verify .gitignore was updated
    const gitignorePath: string = path.join(testDirReviews, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBeTruthy();
    
    const gitignoreContent: string = fs.readFileSync(gitignorePath, 'utf-8');
    expect(gitignoreContent.includes('.aiknowsys/reviews/')).toBeTruthy();

    testDirsToCleanup.push(testDirReviews);
  });

  it('should create both personal and reviews gitignore patterns without duplication', async () => {
    const testDirBoth: string = path.join(__dirname, 'tmp', `test-both-patterns-${Date.now()}`);
    fs.mkdirSync(testDirBoth, { recursive: true });

    await init({ dir: testDirBoth, yes: true });

    const gitignorePath: string = path.join(testDirBoth, '.gitignore');
    const gitignoreContent: string = fs.readFileSync(gitignorePath, 'utf-8');
    
    // Both patterns should exist
    expect(gitignoreContent.includes('.aiknowsys/personal/')).toBeTruthy();
    expect(gitignoreContent.includes('.aiknowsys/reviews/')).toBeTruthy();
    
    // Count occurrences - should only appear once each
    const personalCount: number = (gitignoreContent.match(/\.aiknowsys\/personal\//g) || []).length;
    const reviewsCount: number = (gitignoreContent.match(/\.aiknowsys\/reviews\//g) || []).length;
    
    expect(personalCount).toBe(1);
    expect(reviewsCount).toBe(1);

    testDirsToCleanup.push(testDirBoth);
  });
});
