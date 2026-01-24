import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { init } from '../lib/commands/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

describe('init command', () => {
  let testDir;

  before(() => {
    // Create a temporary test directory
    testDir = path.join(__dirname, 'tmp', `test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    // Cleanup test directory
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
  });

  it('should install custom agents', async () => {
    const testDirAgents = path.join(__dirname, 'tmp', `test-agents-${Date.now()}`);
    fs.mkdirSync(testDirAgents, { recursive: true });

    try {
      await init({ dir: testDirAgents, yes: true });

      // Verify agents directory was created
      assert.ok(fs.existsSync(path.join(testDirAgents, '.github', 'agents')), '.github/agents directory should exist');
      assert.ok(fs.existsSync(path.join(testDirAgents, '.github', 'agents', 'developer.agent.md')), 'developer.agent.md should exist');
      assert.ok(fs.existsSync(path.join(testDirAgents, '.github', 'agents', 'architect.agent.md')), 'architect.agent.md should exist');
    } finally {
      fs.rmSync(testDirAgents, { recursive: true, force: true });
    }
  });

  it('should install skills', async () => {
    const testDirSkills = path.join(__dirname, 'tmp', `test-skills-${Date.now()}`);
    fs.mkdirSync(testDirSkills, { recursive: true });

    try {
      await init({ dir: testDirSkills, yes: true });

      // Verify skills directory was created
      assert.ok(fs.existsSync(path.join(testDirSkills, '.github', 'skills')), '.github/skills directory should exist');
      
      // Check for at least one skill
      const skillsDir = path.join(testDirSkills, '.github', 'skills');
      const skills = fs.readdirSync(skillsDir);
      assert.ok(skills.length > 0, 'At least one skill should be installed');
    } finally {
      fs.rmSync(testDirSkills, { recursive: true, force: true });
    }
  });

  it('should use project name from directory', async () => {
    const testDirName = path.join(__dirname, 'tmp', `my-awesome-project-${Date.now()}`);
    fs.mkdirSync(testDirName, { recursive: true });

    try {
      await init({ dir: testDirName, yes: true });

      const essentials = fs.readFileSync(path.join(testDirName, 'CODEBASE_ESSENTIALS.md'), 'utf-8');
      assert.ok(essentials.includes('my-awesome-project'), 'Should include project name from directory');
    } finally {
      fs.rmSync(testDirName, { recursive: true, force: true });
    }
  });

  it('should handle non-existent directory', async () => {
    const newDir = path.join(__dirname, 'tmp', `new-project-${Date.now()}`);

    try {
      // Directory doesn't exist yet
      assert.ok(!fs.existsSync(newDir), 'Directory should not exist initially');

      await init({ dir: newDir, yes: true });

      // Directory should be created
      assert.ok(fs.existsSync(newDir), 'Directory should be created');
      assert.ok(fs.existsSync(path.join(newDir, 'CODEBASE_ESSENTIALS.md')), 'Files should be created in new directory');
    } finally {
      if (fs.existsSync(newDir)) {
        fs.rmSync(newDir, { recursive: true, force: true });
      }
    }
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
});
