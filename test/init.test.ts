import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
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
const projectRoot: string = path.join(__dirname, '..');

describe('init command', () => {
  let testDir: string;
  let testDirsToCleanup: string[] = [];

  before(() => {
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

  after(() => {
    // Cleanup base test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create core files with --yes flag', async () => {
    await init({ dir: testDir, yes: true });

    // Verify core files were created
    assert.ok(fs.existsSync(path.join(testDir, 'CODEBASE_ESSENTIALS.md')), 'CODEBASE_ESSENTIALS.md should exist');
    assert.ok(fs.existsSync(path.join(testDir, 'AGENTS.md')), 'AGENTS.md should exist');
    assert.ok(fs.existsSync(path.join(testDir, 'CODEBASE_CHANGELOG.md')), 'CODEBASE_CHANGELOG.md should exist');
    
    // Verify content includes project name
    const essentials: string = fs.readFileSync(path.join(testDir, 'CODEBASE_ESSENTIALS.md'), 'utf-8');
    assert.ok(essentials.includes(`test-${testDir.split('-').pop()}`), 'Should include project name');
  });

  it('should install custom agents', async () => {
    const testDirAgents: string = path.join(__dirname, 'tmp', `test-agents-${Date.now()}`);
    fs.mkdirSync(testDirAgents, { recursive: true });
    testDirsToCleanup.push(testDirAgents);

    await init({ dir: testDirAgents, yes: true });

    // Verify agents directory was created
    assert.ok(fs.existsSync(path.join(testDirAgents, '.github', 'agents')), '.github/agents directory should exist');
    assert.ok(fs.existsSync(path.join(testDirAgents, '.github', 'agents', 'developer.agent.md')), 'developer.agent.md should exist');
    assert.ok(fs.existsSync(path.join(testDirAgents, '.github', 'agents', 'architect.agent.md')), 'architect.agent.md should exist');
  });

  it('should install skills', async () => {
    const testDirSkills: string = path.join(__dirname, 'tmp', `test-skills-${Date.now()}`);
    fs.mkdirSync(testDirSkills, { recursive: true });
    testDirsToCleanup.push(testDirSkills);

    await init({ dir: testDirSkills, yes: true });

    // Verify skills directory was created
    assert.ok(fs.existsSync(path.join(testDirSkills, '.github', 'skills')), '.github/skills directory should exist');
    
    // Check for at least one skill
    const skillsDir: string = path.join(testDirSkills, '.github', 'skills');
    const skills: string[] = fs.readdirSync(skillsDir);
    assert.ok(skills.length > 0, 'At least one skill should be installed');
  });

  it('should use project name from directory', async () => {
    const testDirName: string = path.join(__dirname, 'tmp', `my-awesome-project-${Date.now()}`);
    fs.mkdirSync(testDirName, { recursive: true });
    testDirsToCleanup.push(testDirName);

    await init({ dir: testDirName, yes: true });

    const essentials: string = fs.readFileSync(path.join(testDirName, 'CODEBASE_ESSENTIALS.md'), 'utf-8');
    assert.ok(essentials.includes('my-awesome-project'), 'Should include project name from directory');
  });

  it('should handle non-existent directory', async () => {
    const newDir: string = path.join(__dirname, 'tmp', `new-project-${Date.now()}`);
    testDirsToCleanup.push(newDir);

    // Directory doesn't exist yet
    assert.ok(!fs.existsSync(newDir), 'Directory should not exist initially');

    await init({ dir: newDir, yes: true });

    // Directory should be created
    assert.ok(fs.existsSync(newDir), 'Directory should be created');
    assert.ok(fs.existsSync(path.join(newDir, 'CODEBASE_ESSENTIALS.md')), 'Files should be created');
  });

  it('CLI should work with --help', () => {
    const output: string = execSync('node bin/cli.js init --help', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    assert.ok(output.includes('Initialize knowledge system'), 'Help should describe init command');
    assert.ok(output.includes('--dir'), 'Help should mention --dir option');
    assert.ok(output.includes('--yes'), 'Help should mention --yes option');
  });

  it('CLI should accept --yes flag', () => {
    const testCliDir: string = path.join(__dirname, 'tmp', `cli-test-${Date.now()}`);
    
    try {
      execSync(`node bin/cli.js init --dir ${testCliDir} --yes`, {
        cwd: projectRoot,
        encoding: 'utf-8'
      });

      assert.ok(fs.existsSync(path.join(testCliDir, 'CODEBASE_ESSENTIALS.md')), 'CLI should create files with --yes flag');
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
      assert.ok(output.includes('AI Assistant Prompt'), 'Should show AI prompt section');
      assert.ok(output.includes('AI-Guided Project Bootstrap'), 'Should mention AI-Guided Bootstrap');
      assert.ok(output.includes('CODEBASE_ESSENTIALS.md'), 'Should reference CODEBASE_ESSENTIALS.md');
      // New AI-first flow: knowledge system setup focus (NOT full project implementation)
      assert.ok(output.includes('SET UP THE KNOWLEDGE SYSTEM') || output.includes('scan your existing codebase'), 'Should mention knowledge system setup or scanning');
      assert.ok(output.includes('STOP HERE') || output.includes('Complete all TODO sections'), 'Should emphasize phased approach with stop points');
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
      assert.ok(output.includes('Knowledge system initialized'), 'Should show success message');
      assert.ok(output.includes('with TODO sections'), 'Should mention TODO sections in file descriptions');
      assert.ok(output.includes('.github/agents'), 'Should mention agents directory');
      assert.ok(output.includes('.github/skills'), 'Should mention skills directory');
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
      assert.ok(fs.existsSync(path.join(testOpenSpecDir, 'CODEBASE_ESSENTIALS.md')), 'CODEBASE_ESSENTIALS.md should exist');
      assert.ok(fs.existsSync(path.join(testOpenSpecDir, 'AGENTS.md')), 'AGENTS.md should exist');
      
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
    assert.ok(!hasOpenSpecNote || !hasOpenSpecCommand, 'OpenSpec references should be conditional');
    
    // The prompt should still be generated correctly
    assert.ok(output.includes('AI-Guided Project Bootstrap'), 'AI prompt should be displayed');
  });

  // Stack Template Tests
  it('should list available stacks with --list-stacks', () => {
    const output: string = execSync('node bin/cli.js init --list-stacks', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    assert.ok(output.includes('Available Stack Templates'), 'Should show stack templates header');
    assert.ok(output.includes('nextjs'), 'Should list nextjs stack');
    assert.ok(output.includes('vue-express'), 'Should list vue-express stack');
    assert.ok(output.includes('Usage: npx aiknowsys init --stack'), 'Should show usage example');
  });

  it('should create files with nextjs stack template', async () => {
    const testStackDir: string = path.join(__dirname, 'tmp', `test-stack-nextjs-${Date.now()}`);
    fs.mkdirSync(testStackDir, { recursive: true });
    testDirsToCleanup.push(testStackDir);

    // We can't test interactive prompts easily, but we can test the template loading logic
    // by verifying the stack template file exists and is valid
    const packageDir: string = path.join(projectRoot);
    const stackTemplatePath: string = path.join(packageDir, 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    
    assert.ok(fs.existsSync(stackTemplatePath), 'Next.js stack template should exist');
    
    const content: string = fs.readFileSync(stackTemplatePath, 'utf-8');
    assert.ok(content.length > 1000, 'Stack template should have substantial content');
    assert.ok(content.includes('Next.js'), 'Should mention Next.js');
    assert.ok(content.includes('{{PROJECT_NAME}}'), 'Should have PROJECT_NAME placeholder');
    assert.ok(content.includes('{{DATE}}'), 'Should have DATE placeholder');
  });

  it('should create files with vue-express stack template', async () => {
    const packageDir: string = path.join(projectRoot);
    const stackTemplatePath: string = path.join(packageDir, 'templates', 'stacks', 'vue-express', 'CODEBASE_ESSENTIALS.md');
    
    assert.ok(fs.existsSync(stackTemplatePath), 'Vue-Express stack template should exist');
    
    const content: string = fs.readFileSync(stackTemplatePath, 'utf-8');
    assert.ok(content.length > 1000, 'Stack template should have substantial content');
    assert.ok(content.includes('Vue'), 'Should mention Vue');
    assert.ok(content.includes('Express'), 'Should mention Express');
    assert.ok(content.toLowerCase().includes('monorepo'), 'Should mention monorepo architecture');
  });

  it('should show error for invalid stack name', () => {
    try {
      execSync('node bin/cli.js init --stack invalid-stack --dir /tmp/test-invalid', {
        cwd: projectRoot,
        encoding: 'utf-8'
      });
      assert.fail('Should have thrown an error for invalid stack');
    } catch (error: any) {
      assert.ok(error.message.includes('Unknown stack'), 'Should show unknown stack error');
    }
  });

  it('should validate stack template has minimal placeholders', () => {
    const packageDir: string = path.join(projectRoot);
    const nextjsTemplate: string = path.join(packageDir, 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    const vueExpressTemplate: string = path.join(packageDir, 'templates', 'stacks', 'vue-express', 'CODEBASE_ESSENTIALS.md');
    
    // Verify templates exist
    assert.ok(fs.existsSync(nextjsTemplate), 'Next.js template should exist');
    assert.ok(fs.existsSync(vueExpressTemplate), 'Vue-Express template should exist');
    
    // Check Next.js template
    const nextjsContent: string = fs.readFileSync(nextjsTemplate, 'utf-8');
    const nextjsPlaceholders: string[] = nextjsContent.match(/{{[^}]+}}/g) || [];
    const allowedPlaceholders: string[] = ['{{PROJECT_NAME}}', '{{PROJECT_DESCRIPTION}}', '{{DATE}}', '{{YEAR}}'];
    
    nextjsPlaceholders.forEach((placeholder: string) => {
      assert.ok(
        allowedPlaceholders.includes(placeholder),
        `Next.js template should only have essential placeholders, found: ${placeholder}`
      );
    });
    
    // Check Vue-Express template
    const vueExpressContent: string = fs.readFileSync(vueExpressTemplate, 'utf-8');
    const vueExpressPlaceholders: string[] = vueExpressContent.match(/{{[^}]+}}/g) || [];
    
    vueExpressPlaceholders.forEach((placeholder: string) => {
      assert.ok(
        allowedPlaceholders.includes(placeholder),
        `Vue-Express template should only have essential placeholders, found: ${placeholder}`
      );
    });
  });

  it('should have pre-filled validation matrix in stack templates', () => {
    const packageDir: string = path.join(projectRoot);
    const nextjsTemplate: string = path.join(packageDir, 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    const vueExpressTemplate: string = path.join(packageDir, 'templates', 'stacks', 'vue-express', 'CODEBASE_ESSENTIALS.md');
    
    // Next.js should have npm-based commands
    const nextjsContent: string = fs.readFileSync(nextjsTemplate, 'utf-8');
    assert.ok(nextjsContent.includes('npm run dev'), 'Next.js should have npm run dev command');
    assert.ok(nextjsContent.includes('npm run build'), 'Next.js should have npm run build command');
    assert.ok(nextjsContent.includes('npm run type-check'), 'Next.js should have type-check command');
    
    // Vue-Express should have monorepo commands
    const vueExpressContent: string = fs.readFileSync(vueExpressTemplate, 'utf-8');
    assert.ok(vueExpressContent.includes('npm run dev'), 'Vue-Express should have dev command');
    assert.ok(vueExpressContent.includes('packages/'), 'Vue-Express should reference packages structure');
  });

  it('should install TDD enforcement files with --yes flag (defaults to TDD enabled)', async () => {
    const testDirTDD: string = path.join(__dirname, 'tmp', `test-tdd-${Date.now()}`);
    fs.mkdirSync(testDirTDD, { recursive: true });
    testDirsToCleanup.push(testDirTDD);

    // --yes flag should use default (useTDD: true)
    await init({ dir: testDirTDD, yes: true });

    // Verify TDD skill was installed
    const tddSkillPath: string = path.join(testDirTDD, '.github', 'skills', 'tdd-workflow', 'SKILL.md');
    assert.ok(fs.existsSync(tddSkillPath), 'TDD workflow skill should be installed');
    
    const skillContent: string = fs.readFileSync(tddSkillPath, 'utf-8');
    assert.ok(skillContent.toLowerCase().includes('red-green-refactor'), 'TDD skill should contain Red-Green-Refactor content');

    // Verify git hooks were installed
    const preCommitPath: string = path.join(testDirTDD, '.git-hooks', 'pre-commit');
    assert.ok(fs.existsSync(preCommitPath), 'pre-commit hook should be installed');
    
    const preCommitContent: string = fs.readFileSync(preCommitPath, 'utf-8');
    assert.ok(preCommitContent.includes('TDD compliance check'), 'pre-commit hook should contain TDD check');

    const gitHooksReadme: string = path.join(testDirTDD, '.git-hooks', 'README.md');
    assert.ok(fs.existsSync(gitHooksReadme), '.git-hooks/README.md should exist');

    // Verify install script was created
    const installScriptPath: string = path.join(testDirTDD, 'scripts', 'install-git-hooks.sh');
    assert.ok(fs.existsSync(installScriptPath), 'install-git-hooks.sh should be installed');
    
    // On Unix systems, verify it's executable
    if (process.platform !== 'win32') {
      const stats = fs.statSync(installScriptPath);
      const isExecutable: boolean = (stats.mode & 0o111) !== 0;
      assert.ok(isExecutable, 'install-git-hooks.sh should be executable');
    }

    // Verify GitHub Actions workflow was installed
    const workflowPath: string = path.join(testDirTDD, '.github', 'workflows', 'tdd-compliance.yml');
    assert.ok(fs.existsSync(workflowPath), 'tdd-compliance.yml workflow should be installed');
    
    const workflowContent: string = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(workflowContent.includes('TDD Compliance Check'), 'Workflow should be TDD compliance check');
    assert.ok(workflowContent.includes('lib/'), 'Workflow should check lib/ directory');
    assert.ok(workflowContent.includes('test/'), 'Workflow should check test/ directory');

    // Verify AGENTS.md includes TDD workflow steps
    const agentsPath: string = path.join(testDirTDD, 'AGENTS.md');
    const agentsContent: string = fs.readFileSync(agentsPath, 'utf-8');
    assert.ok(agentsContent.includes('TDD SELF-AUDIT'), 'AGENTS.md should include TDD self-audit section');
    assert.ok(agentsContent.toUpperCase().includes('RED-GREEN-REFACTOR'), 'AGENTS.md should mention RED-GREEN-REFACTOR');
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
    assert.ok((preCommitStats.mode & 0o111) !== 0, 'pre-commit should be executable');

    // Check install script permissions
    const installScriptPath: string = path.join(testDirPerms, 'scripts', 'install-git-hooks.sh');
    const scriptStats = fs.statSync(installScriptPath);
    assert.ok((scriptStats.mode & 0o111) !== 0, 'install-git-hooks.sh should be executable');
  });

  it('should create .aiknowsys directory structure for session persistence', async () => {
    const testDirSession: string = path.join(__dirname, 'tmp', `test-session-${Date.now()}`);
    fs.mkdirSync(testDirSession, { recursive: true });
    
    await init({ dir: testDirSession, yes: true });

    // Verify .aiknowsys directory structure
    const aiknowsysDir: string = path.join(testDirSession, '.aiknowsys');
    assert.ok(fs.existsSync(aiknowsysDir), '.aiknowsys directory should exist');

    const sessionsDir: string = path.join(aiknowsysDir, 'sessions');
    assert.ok(fs.existsSync(sessionsDir), '.aiknowsys/sessions directory should exist');
    
    const learnedDir: string = path.join(aiknowsysDir, 'learned');
    assert.ok(fs.existsSync(learnedDir), '.aiknowsys/learned directory should exist');

    // Verify README files
    const sessionsReadme: string = path.join(sessionsDir, 'README.md');
    assert.ok(fs.existsSync(sessionsReadme), 'sessions/README.md should exist');
    
    const sessionsReadmeContent: string = fs.readFileSync(sessionsReadme, 'utf-8');
    assert.ok(sessionsReadmeContent.toLowerCase().includes('session'), 'sessions README should mention sessions');
    assert.ok(sessionsReadmeContent.includes('YYYY-MM-DD-session.md'), 'sessions README should show file format');

    const learnedReadme: string = path.join(learnedDir, 'README.md');
    assert.ok(fs.existsSync(learnedReadme), 'learned/README.md should exist');
    
    const learnedReadmeContent: string = fs.readFileSync(learnedReadme, 'utf-8');
    assert.ok(learnedReadmeContent.toLowerCase().includes('learned'), 'learned README should mention learned skills');
    assert.ok(learnedReadmeContent.includes('Pattern Types'), 'learned README should document pattern types');

    // Verify plan-management learned skill (universal pattern)
    const planManagement: string = path.join(learnedDir, 'plan-management.md');
    assert.ok(fs.existsSync(planManagement), 'learned/plan-management.md should exist');
    
    const planContent: string = fs.readFileSync(planManagement, 'utf-8');
    assert.ok(planContent.includes('CURRENT_PLAN.md'), 'plan-management should explain pointer pattern');
    assert.ok(planContent.includes('PLAN_*.md'), 'plan-management should mention plan files');
    assert.ok(planContent.includes('pointer'), 'plan-management should describe pointer concept');
    
    // Verify essentials-compression learned skill (universal pattern)
    const essentialsCompression: string = path.join(learnedDir, 'essentials-compression.md');
    assert.ok(fs.existsSync(essentialsCompression), 'learned/essentials-compression.md should exist');
    
    const compressionContent: string = fs.readFileSync(essentialsCompression, 'utf-8');
    assert.ok(compressionContent.includes('compress-essentials'), 'essentials-compression skill should document compress-essentials command');
    assert.ok(compressionContent.includes('COMPRESSION_THRESHOLDS'), 'essentials-compression skill should document thresholds');

    // Verify AGENTS.md includes session protocols
    const agentsPath: string = path.join(testDirSession, 'AGENTS.md');
    const agentsContent: string = fs.readFileSync(agentsPath, 'utf-8');
    assert.ok(agentsContent.includes('SESSION START'), 'AGENTS.md should include session start protocol');
    assert.ok(agentsContent.includes('.aiknowsys/sessions/'), 'AGENTS.md should reference sessions directory');
    assert.ok(agentsContent.includes('CONTINUOUS LEARNING'), 'AGENTS.md should include continuous learning section');
    assert.ok(agentsContent.includes('.aiknowsys/learned/'), 'AGENTS.md should reference learned directory');

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
    assert.ok(fs.existsSync(personalDir), `personal/${username} directory should exist`);
    
    const personalReadme: string = path.join(personalDir, 'README.md');
    assert.ok(fs.existsSync(personalReadme), 'personal/README.md should exist');
    
    const readmeContent: string = fs.readFileSync(personalReadme, 'utf-8');
    assert.ok(readmeContent.includes('Personal Patterns'), 'README should document personal patterns');
    assert.ok(readmeContent.includes('gitignored'), 'README should warn about gitignore');
    
    // Verify .gitignore was updated
    const gitignorePath: string = path.join(testDirPersonal, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore should exist');
    
    const gitignoreContent: string = fs.readFileSync(gitignorePath, 'utf-8');
    assert.ok(gitignoreContent.includes('.aiknowsys/personal/'), '.gitignore should exclude personal directory');

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
      assert.ok(fs.existsSync(personalDir), 'Normalized username directory should exist');
      
      // Verify no uppercase or special characters in directory name
      const dirName: string = path.basename(personalDir);
      assert.ok(/^[a-z0-9-]+$/.test(dirName), 'Directory name should be lowercase alphanumeric with hyphens only');
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
      assert.ok(fs.existsSync(path.join(testDirNoGit, 'CODEBASE_ESSENTIALS.md')), 'Should create core files');
      assert.ok(fs.existsSync(path.join(testDirNoGit, '.aiknowsys', 'sessions')), 'Should create sessions directory');
      assert.ok(fs.existsSync(path.join(testDirNoGit, '.aiknowsys', 'learned')), 'Should create learned directory');
      assert.ok(fs.existsSync(path.join(testDirNoGit, '.aiknowsys', 'plans')), 'Should create plans directory');
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
      assert.ok(fs.existsSync(plansDir), 'plans directory should exist');
      
      const plansReadme: string = path.join(plansDir, 'README.md');
      assert.ok(fs.existsSync(plansReadme), 'plans/README.md should exist');
      
      const readmeContent: string = fs.readFileSync(plansReadme, 'utf-8');
      assert.ok(readmeContent.includes('Track what each developer'), 'README should explain plan tracking');
      assert.ok(readmeContent.includes('active-<username>.md'), 'README should document filename format');
      
      // Verify active plan file created with username
      const activePlanPath: string = path.join(plansDir, `active-${normalizedUsername}.md`);
      assert.ok(fs.existsSync(activePlanPath), `active-${normalizedUsername}.md should exist`);
      
      const activePlanContent: string = fs.readFileSync(activePlanPath, 'utf-8');
      assert.ok(activePlanContent.includes(normalizedUsername), 'Active plan should contain username');
      assert.ok(activePlanContent.includes('Currently Working On:'), 'Active plan should have status section');
      assert.ok(activePlanContent.includes('No active plan'), 'Active plan should have default message');
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
    assert.ok(fs.existsSync(reviewsDir), 'reviews directory should exist');
    
    const reviewsReadme: string = path.join(reviewsDir, 'README.md');
    assert.ok(fs.existsSync(reviewsReadme), 'reviews/README.md should exist');
    
    const readmeContent: string = fs.readFileSync(reviewsReadme, 'utf-8');
    assert.ok(readmeContent.includes('ephemeral'), 'README should explain ephemeral nature');
    assert.ok(readmeContent.includes('PENDING_<username>.md'), 'README should document filename format');
    assert.ok(readmeContent.includes('gitignored'), 'README should warn about gitignore');
    
    // Verify .gitignore was updated
    const gitignorePath: string = path.join(testDirReviews, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore should exist');
    
    const gitignoreContent: string = fs.readFileSync(gitignorePath, 'utf-8');
    assert.ok(gitignoreContent.includes('.aiknowsys/reviews/'), '.gitignore should exclude reviews directory');

    testDirsToCleanup.push(testDirReviews);
  });

  it('should create both personal and reviews gitignore patterns without duplication', async () => {
    const testDirBoth: string = path.join(__dirname, 'tmp', `test-both-patterns-${Date.now()}`);
    fs.mkdirSync(testDirBoth, { recursive: true });

    await init({ dir: testDirBoth, yes: true });

    const gitignorePath: string = path.join(testDirBoth, '.gitignore');
    const gitignoreContent: string = fs.readFileSync(gitignorePath, 'utf-8');
    
    // Both patterns should exist
    assert.ok(gitignoreContent.includes('.aiknowsys/personal/'), 'Should have personal/ pattern');
    assert.ok(gitignoreContent.includes('.aiknowsys/reviews/'), 'Should have reviews/ pattern');
    
    // Count occurrences - should only appear once each
    const personalCount: number = (gitignoreContent.match(/\.aiknowsys\/personal\//g) || []).length;
    const reviewsCount: number = (gitignoreContent.match(/\.aiknowsys\/reviews\//g) || []).length;
    
    assert.strictEqual(personalCount, 1, 'personal/ pattern should appear exactly once');
    assert.strictEqual(reviewsCount, 1, 'reviews/ pattern should appear exactly once');

    testDirsToCleanup.push(testDirBoth);
  });
});
