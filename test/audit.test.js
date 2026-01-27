import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { audit } from '../lib/commands/audit.js';
import {
  createTestDir,
  cleanupTestDir,
  createMockProject
} from './helpers/testUtils.js';

describe('audit command', () => {
  let testDir;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  // ========================================
  // CLEAN PROJECT TESTS
  // ========================================

  it('should pass audit on clean project with no issues', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: false
    });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    assert.strictEqual(result.clean, true, 'Should be clean');
    assert.strictEqual(result.warnings, 0, 'Should have 0 warnings');
    assert.strictEqual(result.issues.length, 0, 'Should have 0 issues');
  });

  // ========================================
  // DUPLICATION CHECK TESTS
  // ========================================

  it('should detect duplicated validation matrix in both files', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: true // Matrix in both files
    });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    assert.strictEqual(result.clean, false, 'Should not be clean');
    assert.strictEqual(result.warnings > 0, true, 'Should have warnings');
    const dupIssue = result.issues.find(i => i.category.includes('DRY'));
    assert.ok(dupIssue, 'Should have DRY violation issue');
    assert.ok(dupIssue.fix.includes('sync'), 'Should suggest sync command');
  });

  it('should pass when validation matrix only in ESSENTIALS', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: false // Matrix only in ESSENTIALS (correct)
    });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    assert.strictEqual(result.clean, true, 'Should be clean');
    assert.strictEqual(result.warnings, 0, 'Should have 0 warnings');
  });

  // ========================================
  // PLACEHOLDER QUALITY TESTS
  // ========================================

  it('should detect excessive TBD markers', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Add many TBD markers
    content += '\nTBD\nTBD\nTBD\nTBD\nTBD';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const tbdIssue = result.issues.find(i => i.message.includes('TBD'));
    assert.ok(tbdIssue, 'Should detect TBD markers');
    assert.strictEqual(tbdIssue.type, 'info', 'Should be info type');
  });

  it('should detect excessive TODO comments', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    content += '\nTODO: fix this\nTODO: add that\nTODO: update\nTODO: review';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const todoIssue = result.issues.find(i => i.message.includes('TODO'));
    assert.ok(todoIssue, 'Should detect TODO comments');
    assert.strictEqual(todoIssue.type, 'info', 'Should be info type');
  });

  it('should detect [FILL] instruction markers', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    content += '\n[FILL THIS IN]\n[FILL HERE]\n[FILL LATER]\n[FILL MORE]';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const fillIssue = result.issues.find(i => i.message.includes('FILL'));
    assert.ok(fillIssue, 'Should detect [FILL] markers');
    assert.strictEqual(fillIssue.type, 'warning', 'Should be warning type');
  });

  // Note: "generic placeholder text" detection removed - too many false positives
  // in documentation that legitimately discusses placeholders and examples

  it('should allow up to 3 TBD/TODO instances without warning', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Add only 2 TBDs (below threshold)
    content += '\nTBD\nTBD';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    // Should not have TBD/TODO issue since below threshold
    const hasLowTbdWarning = result.issues.some(i => i.message.includes('TBD') || i.message.includes('TODO'));
    assert.strictEqual(hasLowTbdWarning, false, 'Should not warn when below threshold');
  });

  it('should detect unfilled {{PLACEHOLDERS}}', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    content += '\n{{PROJECT_NAME}}\n{{DATE}}\n{{AUTHOR}}';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const placeholderIssue = result.issues.find(i => i.message.includes('placeholder'));
    assert.ok(placeholderIssue, 'Should detect unfilled placeholders');
    assert.strictEqual(placeholderIssue.type, 'warning', 'Should be warning type');
  });

  it('should list unique placeholders without duplicates', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Same placeholder appears multiple times
    content += '\n{{PROJECT_NAME}}\n{{PROJECT_NAME}}\n{{PROJECT_NAME}}';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const placeholderIssue = result.issues.find(i => i.message.includes('placeholder'));
    assert.ok(placeholderIssue, 'Should detect placeholders');
    // Message should mention "1 unfilled placeholder" or similar, not count duplicates
    assert.ok(placeholderIssue.message.includes('1') || placeholderIssue.message.includes('PROJECT_NAME'), 'Should report unique count');
  });

  it('should pass when all placeholders filled', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    // File has no {{...}} patterns
    const result = await audit({ dir: testDir, _silent: true });
    
    const placeholderIssue = result.issues.find(i => i.message.includes('{{'));
    assert.strictEqual(placeholderIssue, undefined, 'Should not detect placeholder issues');
  });

  // ========================================
  // FILE SIZE CHECK TESTS
  // ========================================

  it('should warn when ESSENTIALS > 350 lines', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      essentialsSize: 'large' // Creates 350+ line file
    });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const sizeIssue = result.issues.find(i => i.category === 'File Size' || i.message.includes('lines (consider splitting)'));
    assert.ok(sizeIssue, 'Should warn about file size');
    assert.ok(sizeIssue.fix.includes('archive') || sizeIssue.fix.includes('minimal'), 'Should suggest archiving or minimal template');
  });

  it('should not warn when ESSENTIALS < 350 lines', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      essentialsSize: 'medium' // Small file
    });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const sizeIssue = result.issues.find(i => i.message.includes('350 lines') || i.message.includes('large'));
    assert.strictEqual(sizeIssue, undefined, 'Should not warn about file size');
  });

  // ========================================
  // MISSING SECTIONS CHECK TESTS
  // ========================================

  it('should detect missing Validation Matrix section', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasValidationMatrix: false // No matrix
    });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const matrixIssue = result.issues.find(i => i.message.includes('Validation Matrix') && i.message.includes('missing'));
    assert.ok(matrixIssue, 'Should warn about missing section');
  });

  // ========================================
  // SUMMARY DISPLAY TESTS
  // ========================================

  it('should show summary with issue counts', async () => {
    createMockProject(testDir, { hasEssentials: true, hasAgents: true, hasValidationMatrix: true, hasDuplicateMatrix: true });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    assert.ok(result.warnings > 0 || result.info > 0, 'Should have issue counts');
    assert.ok(result.issues.length > 0, 'Should have issues array');
  });

  it('should show suggested fixes for each issue', async () => {
    createMockProject(testDir, { hasEssentials: true, hasAgents: true, hasValidationMatrix: true, hasDuplicateMatrix: true });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    assert.ok(result.issues.length > 0, 'Should have issues');
    result.issues.forEach(issue => {
      assert.ok(issue.fix, 'Each issue should have a fix suggestion');
      assert.ok(issue.fix.length > 0, 'Fix suggestion should not be empty');
    });
  });

  // ========================================
  // EXIT CODE TESTS
  // ========================================

  it('should exit with code 0 for clean project', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasDuplicateMatrix: false
    });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    assert.strictEqual(result.clean, true, 'Should be clean (exit 0)');
  });

  it('should exit with code 0 for warnings only (non-critical)', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    // Add warning-level issues
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    content += '\n[FILL THIS IN]';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    // Warnings don't fail audit → exit 0 (clean stays true for warnings)
    // The command itself doesn't throw, which means exit 0
    assert.ok(result, 'Should complete without throwing');
  });

  // ========================================
  // CLI OPTIONS TESTS
  // ========================================

  it('should work with --dir option', async () => {
    const customDir = createTestDir();
    
    try {
      createMockProject(customDir, { hasEssentials: true });
      
      const result = await audit({ dir: customDir, _silent: true });
      
      assert.ok(result, 'Should run audit in custom directory');
      assert.ok(result.issues !== undefined, 'Should return audit results');
    } finally {
      cleanupTestDir(customDir);
    }
  });

  it('should exit gracefully when no knowledge system found', async () => {
    // Empty directory - no ESSENTIALS, no AGENTS
    
    await assert.rejects(
      async () => audit({ dir: testDir, _silent: true }),
      { message: /No knowledge system found/i },
      'Should throw error when no knowledge system found'
    );
  });

  // ========================================
  // GITIGNORE VALIDATION TESTS
  // ========================================

  it('should pass when .aiknowsys/ gitignore is configured correctly', async () => {
    createMockProject(testDir, { hasEssentials: true, hasAgents: true });
    
    // Create .aiknowsys directory
    const aiknowsysDir = path.join(testDir, '.aiknowsys');
    const sessionsDir = path.join(aiknowsysDir, 'sessions');
    fs.mkdirSync(sessionsDir, { recursive: true });
    
    // Create proper .gitignore
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, `
.aiknowsys/sessions/*.md
!.aiknowsys/sessions/README.md
.aiknowsys/PENDING_REVIEW.md
`);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    // Should not have gitignore warnings
    const gitignoreIssue = result.issues.find(i => 
      i.category === 'Gitignore Configuration' || 
      i.message.includes('gitignored')
    );
    assert.strictEqual(gitignoreIssue, undefined, 'Should not warn when gitignore configured correctly');
  });

  it('should warn when .aiknowsys/ exists but sessions not gitignored', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    // Create .aiknowsys directory
    const aiknowsysDir = path.join(testDir, '.aiknowsys');
    const sessionsDir = path.join(aiknowsysDir, 'sessions');
    fs.mkdirSync(sessionsDir, { recursive: true });
    
    // Create .gitignore without .aiknowsys rules
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\n.env\n');
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const gitignoreIssue = result.issues.find(i => 
      i.category === 'Gitignore Configuration' && 
      i.message.includes('Session files')
    );
    assert.ok(gitignoreIssue, 'Should warn when sessions not gitignored');
    assert.ok(gitignoreIssue.fix.includes('.aiknowsys/sessions/*.md'), 'Should suggest adding gitignore pattern');
  });

  it('should warn when no .gitignore file exists but .aiknowsys/ does', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    // Create .aiknowsys directory
    const aiknowsysDir = path.join(testDir, '.aiknowsys');
    fs.mkdirSync(aiknowsysDir, { recursive: true });
    
    // No .gitignore file
    const result = await audit({ dir: testDir, _silent: true });
    
    const gitignoreIssue = result.issues.find(i => 
      i.category === 'Missing Configuration' && 
      i.message.includes('.gitignore')
    );
    assert.ok(gitignoreIssue, 'Should warn when no .gitignore exists');
    assert.ok(gitignoreIssue.fix.includes('.aiknowsys/sessions/*.md'), 'Should suggest creating gitignore');
  });

  it('should not warn when .aiknowsys/ directory does not exist', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    // No .aiknowsys directory
    const result = await audit({ dir: testDir, _silent: true });
    
    const gitignoreIssue = result.issues.find(i => 
      i.message.includes('.aiknowsys') && 
      i.type === 'warning'
    );
    assert.strictEqual(gitignoreIssue, undefined, 'Should not warn when .aiknowsys does not exist');
  });

  it('should increment info counter for optional PENDING_REVIEW.md message', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    // Create .aiknowsys with sessions ignored but not PENDING_REVIEW.md
    const aiknowsysDir = path.join(testDir, '.aiknowsys');
    fs.mkdirSync(aiknowsysDir, { recursive: true });
    
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '.aiknowsys/sessions/*.md\n');
    
    const result = await audit({ dir: testDir, _silent: true });
    
    // Should have info message about optional PENDING_REVIEW.md
    assert.ok(result.info > 0, 'Should increment info counter');
  });
});
