import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { installSkills } from '../lib/commands/install-skills.js';
import {
  createTestDir,
  cleanupTestDir,
  assertFileExists,
  assertFileNotExists
} from './helpers/testUtils.js';

describe('install-skills command', () => {
  let testDir;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  // ========================================
  // DIRECTORY CREATION TESTS
  // ========================================

  it('should create .github/skills directory', async () => {
    const skillsDir = path.join(testDir, '.github', 'skills');
    
    assertFileNotExists(skillsDir);
    
    await installSkills({ dir: testDir, _silent: true });
    
    assertFileExists(skillsDir);
  });

  it('should not fail if .github/skills directory already exists', async () => {
    const skillsDir = path.join(testDir, '.github', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    
    assertFileExists(skillsDir);
    
    await assert.doesNotReject(
      async () => await installSkills({ dir: testDir, _silent: true }),
      'Should not fail when directory already exists'
    );
  });

  // ========================================
  // DEFAULT SKILLS INSTALLATION TESTS
  // ========================================

  it('should install all 5 default universal skills', async () => {
    await installSkills({ dir: testDir, _silent: true });
    
    const skillsDir = path.join(testDir, '.github', 'skills');
    
    // Verify all 5 default skills are installed
    const expectedSkills = [
      'code-refactoring',
      'dependency-updates',
      'documentation-management',
      'skill-creator',
      'tdd-workflow'
    ];
    
    for (const skill of expectedSkills) {
      const skillPath = path.join(skillsDir, skill);
      assertFileExists(skillPath, `Skill ${skill} should be installed`);
    }
  });

  it('should copy SKILL.md file for each skill', async () => {
    await installSkills({ dir: testDir, _silent: true });
    
    const skillsDir = path.join(testDir, '.github', 'skills');
    
    // Check that each skill has a SKILL.md file
    const skills = ['code-refactoring', 'dependency-updates', 'tdd-workflow'];
    
    for (const skill of skills) {
      const skillMdPath = path.join(skillsDir, skill, 'SKILL.md');
      assertFileExists(skillMdPath, `${skill}/SKILL.md should exist`);
    }
  });

  it('should copy all files in skill directory including subdirectories', async () => {
    await installSkills({ dir: testDir, _silent: true });
    
    const skillsDir = path.join(testDir, '.github', 'skills');
    
    // skill-creator has both SKILL.md and template.md
    const skillCreatorDir = path.join(skillsDir, 'skill-creator');
    assertFileExists(path.join(skillCreatorDir, 'SKILL.md'));
    assertFileExists(path.join(skillCreatorDir, 'template.md'));
  });

  // ========================================
  // SELECTIVE SKILLS INSTALLATION TESTS
  // ========================================

  it('should install only selected skills when --skills option provided', async () => {
    await installSkills({ 
      dir: testDir,
      skills: ['code-refactoring', 'tdd-workflow'],
      _silent: true
    });
    
    const skillsDir = path.join(testDir, '.github', 'skills');
    
    // Should have selected skills
    assertFileExists(path.join(skillsDir, 'code-refactoring'));
    assertFileExists(path.join(skillsDir, 'tdd-workflow'));
    
    // Should NOT have other skills
    assertFileNotExists(path.join(skillsDir, 'dependency-updates'));
    assertFileNotExists(path.join(skillsDir, 'documentation-management'));
    assertFileNotExists(path.join(skillsDir, 'skill-creator'));
  });

  it('should handle comma-separated skills string', async () => {
    // CLI might pass skills as a comma-separated string
    const skillsString = 'code-refactoring,tdd-workflow';
    const skillsArray = skillsString.split(',');
    
    await installSkills({
      dir: testDir,
      skills: skillsArray,
      _silent: true
    });
    
    const skillsDir = path.join(testDir, '.github', 'skills');
    
    assertFileExists(path.join(skillsDir, 'code-refactoring'));
    assertFileExists(path.join(skillsDir, 'tdd-workflow'));
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================

  it('should skip invalid skill name gracefully', async () => {
    // When user provides a skill that doesn't exist
    await assert.doesNotReject(
      async () => await installSkills({
        dir: testDir,
        skills: ['code-refactoring', 'nonexistent-skill', 'tdd-workflow'],
        _silent: true
      }),
      'Should not throw when skill not found'
    );
    
    const skillsDir = path.join(testDir, '.github', 'skills');
    
    // Valid skills should still be installed
    assertFileExists(path.join(skillsDir, 'code-refactoring'));
    assertFileExists(path.join(skillsDir, 'tdd-workflow'));
    
    // Invalid skill should not exist
    assertFileNotExists(path.join(skillsDir, 'nonexistent-skill'));
  });

  // ========================================
  // SILENT MODE TESTS
  // ========================================

  it('should not show console output in silent mode', async () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args);
    
    try {
      await installSkills({ dir: testDir, _silent: true });
      
      // Should have minimal/no output in silent mode
      assert.ok(
        logs.length === 0 || logs.every(log => !log.join('').includes('Installing')),
        'Should not show "Installing" messages in silent mode'
      );
    } finally {
      console.log = originalLog;
    }
  });

  it('should show console output in normal mode', async () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args);
    
    try {
      await installSkills({ dir: testDir, _silent: false });
      
      const hasOutput = logs.some(log =>
        log.join('').includes('Installing') || log.join('').includes('Skills')
      );
      assert.ok(hasOutput, 'Should show console output in normal mode');
    } finally {
      console.log = originalLog;
    }
  });

  // ========================================
  // CLI OPTIONS TESTS
  // ========================================

  it('should work with --dir option to target different directory', async () => {
    const customDir = createTestDir();
    
    try {
      await installSkills({ dir: customDir, _silent: true });
      
      const skillsDir = path.join(customDir, '.github', 'skills');
      assertFileExists(skillsDir);
      assertFileExists(path.join(skillsDir, 'code-refactoring'));
    } finally {
      cleanupTestDir(customDir);
    }
  });

  // ========================================
  // FILE INTEGRITY TESTS
  // ========================================

  it('should preserve SKILL.md format in copied files', async () => {
    await installSkills({ dir: testDir, _silent: true });
    
    const skillMdPath = path.join(testDir, '.github', 'skills', 'tdd-workflow', 'SKILL.md');
    assertFileExists(skillMdPath);
    
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    
    // Verify structure is preserved
    assert.ok(content.includes('# TDD Workflow Skill'), 'Should have title');
    assert.ok(content.includes('**Purpose:**'), 'Should have purpose section');
  });

  it('should copy entire skill directory structure', async () => {
    await installSkills({
      dir: testDir,
      skills: ['skill-creator'],
      _silent: true
    });
    
    const skillCreatorDir = path.join(testDir, '.github', 'skills', 'skill-creator');
    
    // Verify all files in the skill directory are copied
    assertFileExists(path.join(skillCreatorDir, 'SKILL.md'));
    assertFileExists(path.join(skillCreatorDir, 'template.md'));
  });

  // ========================================
  // PROGRESS TRACKING TESTS
  // ========================================

  it('should track installed count correctly', async () => {
    // Install all default skills
    await installSkills({ dir: testDir, _silent: true });
    
    const skillsDir = path.join(testDir, '.github', 'skills');
    const installedSkills = fs.readdirSync(skillsDir);
    
    // Should have 5 skills
    assert.strictEqual(
      installedSkills.length,
      5,
      'Should install exactly 5 default skills'
    );
  });

  it('should track skipped count when invalid skills provided', async () => {
    // Test with mix of valid and invalid skills
    await installSkills({
      dir: testDir,
      skills: ['code-refactoring', 'invalid1', 'tdd-workflow', 'invalid2'],
      _silent: true
    });
    
    const skillsDir = path.join(testDir, '.github', 'skills');
    const installedSkills = fs.readdirSync(skillsDir);
    
    // Should have 2 valid skills installed
    assert.strictEqual(
      installedSkills.length,
      2,
      'Should only install valid skills'
    );
  });
});
