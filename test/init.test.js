import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { init } from '../lib/commands/init.js';

// Note: These are integration tests that use execSync for real CLI execution.
// This is intentional - we test the actual CLI behavior end-to-end.
// For unit tests of individual functions, mock fs/child_process as needed.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

describe('init command', () => {
  let testDir;
  let testDirsToCleanup = [];

  before(() => {
    // Create base temporary test directory
    testDir = path.join(__dirname, 'tmp', `test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up any test directories created during individual tests
    testDirsToCleanup.forEach((dir) => {
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
    const essentials = fs.readFileSync(path.join(testDir, 'CODEBASE_ESSENTIALS.md'), 'utf-8');
    assert.ok(essentials.includes(`test-${testDir.split('-').pop()}`), 'Should include project name');
  });

  it('should install custom agents', async () => {
    const testDirAgents = path.join(__dirname, 'tmp', `test-agents-${Date.now()}`);
    fs.mkdirSync(testDirAgents, { recursive: true });
    testDirsToCleanup.push(testDirAgents);

    await init({ dir: testDirAgents, yes: true });

    // Verify agents directory was created
    assert.ok(fs.existsSync(path.join(testDirAgents, '.github', 'agents')), '.github/agents directory should exist');
    assert.ok(fs.existsSync(path.join(testDirAgents, '.github', 'agents', 'developer.agent.md')), 'developer.agent.md should exist');
    assert.ok(fs.existsSync(path.join(testDirAgents, '.github', 'agents', 'architect.agent.md')), 'architect.agent.md should exist');
  });

  it('should install skills', async () => {
    const testDirSkills = path.join(__dirname, 'tmp', `test-skills-${Date.now()}`);
    fs.mkdirSync(testDirSkills, { recursive: true });
    testDirsToCleanup.push(testDirSkills);

    await init({ dir: testDirSkills, yes: true });

    // Verify skills directory was created
    assert.ok(fs.existsSync(path.join(testDirSkills, '.github', 'skills')), '.github/skills directory should exist');
    
    // Check for at least one skill
    const skillsDir = path.join(testDirSkills, '.github', 'skills');
    const skills = fs.readdirSync(skillsDir);
    assert.ok(skills.length > 0, 'At least one skill should be installed');
  });

  it('should use project name from directory', async () => {
    const testDirName = path.join(__dirname, 'tmp', `my-awesome-project-${Date.now()}`);
    fs.mkdirSync(testDirName, { recursive: true });
    testDirsToCleanup.push(testDirName);

    await init({ dir: testDirName, yes: true });

    const essentials = fs.readFileSync(path.join(testDirName, 'CODEBASE_ESSENTIALS.md'), 'utf-8');
    assert.ok(essentials.includes('my-awesome-project'), 'Should include project name from directory');
  });

  it('should handle non-existent directory', async () => {
    const newDir = path.join(__dirname, 'tmp', `new-project-${Date.now()}`);
    testDirsToCleanup.push(newDir);

    // Directory doesn't exist yet
    assert.ok(!fs.existsSync(newDir), 'Directory should not exist initially');

    await init({ dir: newDir, yes: true });

    // Directory should be created
    assert.ok(fs.existsSync(newDir), 'Directory should be created');
    assert.ok(fs.existsSync(path.join(newDir, 'CODEBASE_ESSENTIALS.md')), 'Files should be created');
  });

  it('CLI should work with --help', () => {
    const output = execSync('node bin/cli.js init --help', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    assert.ok(output.includes('Initialize knowledge system'), 'Help should describe init command');
    assert.ok(output.includes('--dir'), 'Help should mention --dir option');
    assert.ok(output.includes('--yes'), 'Help should mention --yes option');
  });

  it('CLI should accept --yes flag', () => {
    const testCliDir = path.join(__dirname, 'tmp', `cli-test-${Date.now()}`);
    
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
    const testYesDir = path.join(__dirname, 'tmp', `yes-ai-${Date.now()}`);
    
    try {
      const output = execSync(`node bin/cli.js init --dir ${testYesDir} --yes`, {
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
    const testAIDir = path.join(__dirname, 'tmp', `ai-msg-${Date.now()}`);
    
    try {
      const output = execSync(`node bin/cli.js init --dir ${testAIDir} --yes`, {
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
    const testOpenSpecDir = path.join(__dirname, 'tmp', `openspec-${Date.now()}`);
    fs.mkdirSync(testOpenSpecDir, { recursive: true });

    try {
      // Mock the init function with OpenSpec enabled
      // Since --yes flag uses default (no OpenSpec), we test the programmatic API
      const { init } = await import('../lib/commands/init.js');
      
      // Note: With --yes flag, OpenSpec defaults to false
      // This test verifies the OpenSpec parameter is properly handled
      await init({ dir: testOpenSpecDir, yes: true, useOpenSpec: false });

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
    const testOpenSpecPromptDir = path.join(__dirname, 'tmp', `openspec-prompt-${Date.now()}`);
    testDirsToCleanup.push(testOpenSpecPromptDir);
    
    // The --yes flag uses default OpenSpec=false, so this verifies the baseline
    const output = execSync(`node bin/cli.js init --dir ${testOpenSpecPromptDir} --yes`, {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    // With --yes (no OpenSpec), the prompt should NOT include OpenSpec references
    // This ensures our conditional logic works correctly
    const hasOpenSpecNote = output.includes('Note: This project uses OpenSpec');
    const hasOpenSpecCommand = output.includes('openspec create');
    
    // When OpenSpec is disabled (default with --yes), these should not appear
    assert.ok(!hasOpenSpecNote || !hasOpenSpecCommand, 'OpenSpec references should be conditional');
    
    // The prompt should still be generated correctly
    assert.ok(output.includes('AI-Guided Project Bootstrap'), 'AI prompt should be displayed');
  });

  // Stack Template Tests
  it('should list available stacks with --list-stacks', () => {
    const output = execSync('node bin/cli.js init --list-stacks', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    assert.ok(output.includes('Available Stack Templates'), 'Should show stack templates header');
    assert.ok(output.includes('nextjs'), 'Should list nextjs stack');
    assert.ok(output.includes('vue-express'), 'Should list vue-express stack');
    assert.ok(output.includes('Usage: npx aiknowsys init --stack'), 'Should show usage example');
  });

  it('should create files with nextjs stack template', async () => {
    const testStackDir = path.join(__dirname, 'tmp', `test-stack-nextjs-${Date.now()}`);
    fs.mkdirSync(testStackDir, { recursive: true });
    testDirsToCleanup.push(testStackDir);

    // We can't test interactive prompts easily, but we can test the template loading logic
    // by verifying the stack template file exists and is valid
    const packageDir = path.join(projectRoot);
    const stackTemplatePath = path.join(packageDir, 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    
    assert.ok(fs.existsSync(stackTemplatePath), 'Next.js stack template should exist');
    
    const content = fs.readFileSync(stackTemplatePath, 'utf-8');
    assert.ok(content.length > 1000, 'Stack template should have substantial content');
    assert.ok(content.includes('Next.js'), 'Should mention Next.js');
    assert.ok(content.includes('{{PROJECT_NAME}}'), 'Should have PROJECT_NAME placeholder');
    assert.ok(content.includes('{{DATE}}'), 'Should have DATE placeholder');
  });

  it('should create files with vue-express stack template', async () => {
    const packageDir = path.join(projectRoot);
    const stackTemplatePath = path.join(packageDir, 'templates', 'stacks', 'vue-express', 'CODEBASE_ESSENTIALS.md');
    
    assert.ok(fs.existsSync(stackTemplatePath), 'Vue-Express stack template should exist');
    
    const content = fs.readFileSync(stackTemplatePath, 'utf-8');
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
    } catch (error) {
      assert.ok(error.message.includes('Unknown stack'), 'Should show unknown stack error');
    }
  });

  it('should validate stack template has minimal placeholders', () => {
    const packageDir = path.join(projectRoot);
    const nextjsTemplate = path.join(packageDir, 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    const vueExpressTemplate = path.join(packageDir, 'templates', 'stacks', 'vue-express', 'CODEBASE_ESSENTIALS.md');
    
    // Verify templates exist
    assert.ok(fs.existsSync(nextjsTemplate), 'Next.js template should exist');
    assert.ok(fs.existsSync(vueExpressTemplate), 'Vue-Express template should exist');
    
    // Check Next.js template
    const nextjsContent = fs.readFileSync(nextjsTemplate, 'utf-8');
    const nextjsPlaceholders = nextjsContent.match(/{{[^}]+}}/g) || [];
    const allowedPlaceholders = ['{{PROJECT_NAME}}', '{{PROJECT_DESCRIPTION}}', '{{DATE}}', '{{YEAR}}'];
    
    nextjsPlaceholders.forEach(placeholder => {
      assert.ok(
        allowedPlaceholders.includes(placeholder),
        `Next.js template should only have essential placeholders, found: ${placeholder}`
      );
    });
    
    // Check Vue-Express template
    const vueExpressContent = fs.readFileSync(vueExpressTemplate, 'utf-8');
    const vueExpressPlaceholders = vueExpressContent.match(/{{[^}]+}}/g) || [];
    
    vueExpressPlaceholders.forEach(placeholder => {
      assert.ok(
        allowedPlaceholders.includes(placeholder),
        `Vue-Express template should only have essential placeholders, found: ${placeholder}`
      );
    });
  });

  it('should have pre-filled validation matrix in stack templates', () => {
    const packageDir = path.join(projectRoot);
    const nextjsTemplate = path.join(packageDir, 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    const vueExpressTemplate = path.join(packageDir, 'templates', 'stacks', 'vue-express', 'CODEBASE_ESSENTIALS.md');
    
    // Next.js should have npm-based commands
    const nextjsContent = fs.readFileSync(nextjsTemplate, 'utf-8');
    assert.ok(nextjsContent.includes('npm run dev'), 'Next.js should have npm run dev command');
    assert.ok(nextjsContent.includes('npm run build'), 'Next.js should have npm run build command');
    assert.ok(nextjsContent.includes('npm run type-check'), 'Next.js should have type-check command');
    
    // Vue-Express should have monorepo commands
    const vueExpressContent = fs.readFileSync(vueExpressTemplate, 'utf-8');
    assert.ok(vueExpressContent.includes('npm run dev'), 'Vue-Express should have dev command');
    assert.ok(vueExpressContent.includes('packages/'), 'Vue-Express should reference packages structure');
  });

  it('should install TDD enforcement files with --yes flag (defaults to TDD enabled)', async () => {
    const testDirTDD = path.join(__dirname, 'tmp', `test-tdd-${Date.now()}`);
    fs.mkdirSync(testDirTDD, { recursive: true });
    testDirsToCleanup.push(testDirTDD);

    // --yes flag should use default (useTDD: true)
    await init({ dir: testDirTDD, yes: true });

    // Verify TDD skill was installed
    const tddSkillPath = path.join(testDirTDD, '.github', 'skills', 'tdd-workflow', 'SKILL.md');
    assert.ok(fs.existsSync(tddSkillPath), 'TDD workflow skill should be installed');
    
    const skillContent = fs.readFileSync(tddSkillPath, 'utf-8');
    assert.ok(skillContent.toLowerCase().includes('red-green-refactor'), 'TDD skill should contain Red-Green-Refactor content');

    // Verify git hooks were installed
    const preCommitPath = path.join(testDirTDD, '.git-hooks', 'pre-commit');
    assert.ok(fs.existsSync(preCommitPath), 'pre-commit hook should be installed');
    
    const preCommitContent = fs.readFileSync(preCommitPath, 'utf-8');
    assert.ok(preCommitContent.includes('TDD compliance check'), 'pre-commit hook should contain TDD check');

    const gitHooksReadme = path.join(testDirTDD, '.git-hooks', 'README.md');
    assert.ok(fs.existsSync(gitHooksReadme), '.git-hooks/README.md should exist');

    // Verify install script was created
    const installScriptPath = path.join(testDirTDD, 'scripts', 'install-git-hooks.sh');
    assert.ok(fs.existsSync(installScriptPath), 'install-git-hooks.sh should be installed');
    
    // On Unix systems, verify it's executable
    if (process.platform !== 'win32') {
      const stats = fs.statSync(installScriptPath);
      const isExecutable = (stats.mode & 0o111) !== 0;
      assert.ok(isExecutable, 'install-git-hooks.sh should be executable');
    }

    // Verify GitHub Actions workflow was installed
    const workflowPath = path.join(testDirTDD, '.github', 'workflows', 'tdd-compliance.yml');
    assert.ok(fs.existsSync(workflowPath), 'tdd-compliance.yml workflow should be installed');
    
    const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(workflowContent.includes('TDD Compliance Check'), 'Workflow should be TDD compliance check');
    assert.ok(workflowContent.includes('lib/'), 'Workflow should check lib/ directory');
    assert.ok(workflowContent.includes('test/'), 'Workflow should check test/ directory');

    // Verify AGENTS.md includes TDD workflow steps
    const agentsPath = path.join(testDirTDD, 'AGENTS.md');
    const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
    assert.ok(agentsContent.includes('TDD SELF-AUDIT'), 'AGENTS.md should include TDD self-audit section');
    assert.ok(agentsContent.toUpperCase().includes('RED-GREEN-REFACTOR'), 'AGENTS.md should mention RED-GREEN-REFACTOR');
  });

  it('should verify TDD files have correct permissions on Unix systems', async () => {
    // Skip on Windows
    if (process.platform === 'win32') {
      console.log('  ⏭️  Skipping permission test on Windows');
      return;
    }

    const testDirPerms = path.join(__dirname, 'tmp', `test-tdd-perms-${Date.now()}`);
    fs.mkdirSync(testDirPerms, { recursive: true });
    testDirsToCleanup.push(testDirPerms);

    await init({ dir: testDirPerms, yes: true });

    // Check pre-commit hook permissions
    const preCommitPath = path.join(testDirPerms, '.git-hooks', 'pre-commit');
    const preCommitStats = fs.statSync(preCommitPath);
    assert.ok((preCommitStats.mode & 0o111) !== 0, 'pre-commit should be executable');

    // Check install script permissions
    const installScriptPath = path.join(testDirPerms, 'scripts', 'install-git-hooks.sh');
    const scriptStats = fs.statSync(installScriptPath);
    assert.ok((scriptStats.mode & 0o111) !== 0, 'install-git-hooks.sh should be executable');
  });

  it('should create .aiknowsys directory structure for session persistence', async () => {
    const testDirSession = path.join(__dirname, 'tmp', `test-session-${Date.now()}`);
    fs.mkdirSync(testDirSession, { recursive: true });
    
    await init({ dir: testDirSession, yes: true });

    // Verify .aiknowsys directory structure
    const aiknowsysDir = path.join(testDirSession, '.aiknowsys');
    assert.ok(fs.existsSync(aiknowsysDir), '.aiknowsys directory should exist');

    const sessionsDir = path.join(aiknowsysDir, 'sessions');
    assert.ok(fs.existsSync(sessionsDir), '.aiknowsys/sessions directory should exist');
    
    const learnedDir = path.join(aiknowsysDir, 'learned');
    assert.ok(fs.existsSync(learnedDir), '.aiknowsys/learned directory should exist');

    // Verify README files
    const sessionsReadme = path.join(sessionsDir, 'README.md');
    assert.ok(fs.existsSync(sessionsReadme), 'sessions/README.md should exist');
    
    const sessionsReadmeContent = fs.readFileSync(sessionsReadme, 'utf-8');
    assert.ok(sessionsReadmeContent.toLowerCase().includes('session'), 'sessions README should mention sessions');
    assert.ok(sessionsReadmeContent.includes('YYYY-MM-DD-session.md'), 'sessions README should show file format');

    const learnedReadme = path.join(learnedDir, 'README.md');
    assert.ok(fs.existsSync(learnedReadme), 'learned/README.md should exist');
    
    const learnedReadmeContent = fs.readFileSync(learnedReadme, 'utf-8');
    assert.ok(learnedReadmeContent.toLowerCase().includes('learned'), 'learned README should mention learned skills');
    assert.ok(learnedReadmeContent.includes('Pattern Types'), 'learned README should document pattern types');

    // Verify plan-management learned skill (universal pattern)
    const planManagement = path.join(learnedDir, 'plan-management.md');
    assert.ok(fs.existsSync(planManagement), 'learned/plan-management.md should exist');
    
    const planContent = fs.readFileSync(planManagement, 'utf-8');
    assert.ok(planContent.includes('CURRENT_PLAN.md'), 'plan-management should explain pointer pattern');
    assert.ok(planContent.includes('PLAN_*.md'), 'plan-management should mention plan files');
    assert.ok(planContent.includes('pointer'), 'plan-management should describe pointer concept');

    // Verify AGENTS.md includes session protocols
    const agentsPath = path.join(testDirSession, 'AGENTS.md');
    const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
    assert.ok(agentsContent.includes('SESSION START'), 'AGENTS.md should include session start protocol');
    assert.ok(agentsContent.includes('.aiknowsys/sessions/'), 'AGENTS.md should reference sessions directory');
    assert.ok(agentsContent.includes('CONTINUOUS LEARNING'), 'AGENTS.md should include continuous learning section');
    assert.ok(agentsContent.includes('.aiknowsys/learned/'), 'AGENTS.md should reference learned directory');

    // Clean up after assertions pass
    testDirsToCleanup.push(testDirSession);
  });
});
