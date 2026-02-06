import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { installSkills } from '../lib/commands/install-skills.js';
import {
  createTestDir,
  cleanupTestDir,
  assertFileExists,
  assertFileNotExists
} from './helpers/testUtils.js';

describe('install-skills command', () => {
  let testDir: string;

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
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    
    assertFileNotExists(skillsDir);
    
    await installSkills({ dir: testDir, _silent: true });
    
    assertFileExists(skillsDir);
  });

  it('should not fail if .github/skills directory already exists', async () => {
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    
    assertFileExists(skillsDir);
    
    await expect(installSkills({ dir: testDir, _silent: true })).resolves.not.toThrow();
  });

  // ========================================
  // DEFAULT SKILLS INSTALLATION TESTS
  // ========================================

  it('should install all 10 default universal skills (excluding maintainer-only)', async () => {
    await installSkills({ dir: testDir, _silent: true });
    
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    
    // Verify all 10 default skills are installed
    const expectedSkills: string[] = [
      'ai-friendly-documentation',
      'context7-usage',
      'dependency-management',
      'feature-implementation',
      'pattern-sharing',
      'refactoring-workflow',
      'skill-creator',
      'skill-validation',
      'tdd-workflow',
      'validation-troubleshooting'
    ];
    
    for (const skill of expectedSkills) {
      const skillPath: string = path.join(skillsDir, skill);
      assertFileExists(skillPath, `Skill ${skill} should be installed`);
    }
  });

  it('should copy SKILL.md file for each skill', async () => {
    await installSkills({ dir: testDir, _silent: true });
    
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    
    // Check that each skill has a SKILL.md file
    const skills: string[] = ['ai-friendly-documentation', 'dependency-management', 'tdd-workflow'];
    
    for (const skill of skills) {
      const skillMdPath: string = path.join(skillsDir, skill, 'SKILL.md');
      assertFileExists(skillMdPath, `${skill}/SKILL.md should exist`);
    }
  });

  it('should copy all files in skill directory including subdirectories', async () => {
    await installSkills({ dir: testDir, _silent: true });
    
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    
    // skill-creator has both SKILL.md and template.md
    const skillCreatorDir: string = path.join(skillsDir, 'skill-creator');
    assertFileExists(path.join(skillCreatorDir, 'SKILL.md'));
    assertFileExists(path.join(skillCreatorDir, 'template.md'));
  });

  // ========================================
  // SELECTIVE SKILLS INSTALLATION TESTS
  // ========================================

  it('should install only selected skills when --skills option provided', async () => {
    await installSkills({ 
      dir: testDir,
      skills: ['refactoring-workflow', 'tdd-workflow'],
      _silent: true
    });
    
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    
    // Should have selected skills
    assertFileExists(path.join(skillsDir, 'refactoring-workflow'));
    assertFileExists(path.join(skillsDir, 'tdd-workflow'));
    
    // Should NOT have other skills
    assertFileNotExists(path.join(skillsDir, 'dependency-management'));
    assertFileNotExists(path.join(skillsDir, 'ai-friendly-documentation'));
    assertFileNotExists(path.join(skillsDir, 'skill-creator'));
  });

  it('should handle comma-separated skills string', async () => {
    // CLI might pass skills as a comma-separated string
    const skillsString: string = 'refactoring-workflow,tdd-workflow';
    const skillsArray: string[] = skillsString.split(',');
    
    await installSkills({
      dir: testDir,
      skills: skillsArray,
      _silent: true
    });
    
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    
    assertFileExists(path.join(skillsDir, 'refactoring-workflow'));
    assertFileExists(path.join(skillsDir, 'tdd-workflow'));
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================

  it('should skip invalid skill name gracefully', async () => {
    // When user provides a skill that doesn't exist
    await expect(installSkills({
            dir: testDir,
            skills: ['refactoring-workflow', 'nonexistent-skill', 'tdd-workflow'],
            _silent: true
          })).resolves.not.toThrow();
    
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    
    // Valid skills should still be installed
    assertFileExists(path.join(skillsDir, 'refactoring-workflow'));
    assertFileExists(path.join(skillsDir, 'tdd-workflow'));
    
    // Invalid skill should not exist
    assertFileNotExists(path.join(skillsDir, 'nonexistent-skill'));
  });

  // ========================================
  // SILENT MODE TESTS
  // ========================================

  it('should not show console output in silent mode', async () => {
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);
    
    try {
      await installSkills({ dir: testDir, _silent: true });
      
      // Should have minimal/no output in silent mode
      expect(logs.length === 0 || logs.every((log: any[]) => !log.join('').includes('Installing'))).toBeTruthy();
    } finally {
      console.log = originalLog;
    }
  });

  it('should show console output in normal mode', async () => {
    const logs: any[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args);
    
    try {
      await installSkills({ dir: testDir, _silent: false });
      
      const hasOutput: boolean = logs.some((log: any[]) =>
        log.join('').includes('Installing') || log.join('').includes('Skills')
      );
      expect(hasOutput).toBeTruthy();
    } finally {
      console.log = originalLog;
    }
  });

  // ========================================
  // CLI OPTIONS TESTS
  // ========================================

  it('should work with --dir option to target different directory', async () => {
    const customDir: string = createTestDir();
    
    try {
      await installSkills({ dir: customDir, _silent: true });
      
      const skillsDir: string = path.join(customDir, '.github', 'skills');
      assertFileExists(skillsDir);
      assertFileExists(path.join(skillsDir, 'refactoring-workflow'));
    } finally {
      cleanupTestDir(customDir);
    }
  });

  // ========================================
  // FILE INTEGRITY TESTS
  // ========================================

  it('should preserve SKILL.md format in copied files', async () => {
    await installSkills({ dir: testDir, _silent: true });
    
    const skillMdPath: string = path.join(testDir, '.github', 'skills', 'tdd-workflow', 'SKILL.md');
    assertFileExists(skillMdPath);
    
    const content: string = fs.readFileSync(skillMdPath, 'utf-8');
    
    // Verify structure is preserved
    expect(content.includes('# TDD Workflow Skill')).toBeTruthy();
    expect(content.includes('**Purpose:**')).toBeTruthy();
  });

  it('should copy entire skill directory structure', async () => {
    await installSkills({
      dir: testDir,
      skills: ['skill-creator'],
      _silent: true
    });
    
    const skillCreatorDir: string = path.join(testDir, '.github', 'skills', 'skill-creator');
    
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
    
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    const installedSkills: string[] = fs.readdirSync(skillsDir);
    
    // Should have 10 skills
    expect(installedSkills.length).toBe(10);
  });

  it('should track skipped count when invalid skills provided', async () => {
    // Test with mix of valid and invalid skills
    await installSkills({
      dir: testDir,
      skills: ['refactoring-workflow', 'invalid1', 'tdd-workflow', 'invalid2'],
      _silent: true
    });
    
    const skillsDir: string = path.join(testDir, '.github', 'skills');
    const installedSkills: string[] = fs.readdirSync(skillsDir);
    
    // Should have 2 valid skills installed
    expect(installedSkills.length).toBe(2);
  });
});
