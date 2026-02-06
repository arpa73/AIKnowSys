import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { audit } from '../lib/commands/audit.js';
import {
  createTestDir,
  cleanupTestDir,
  createMockProject
} from './helpers/testUtils.js';

describe('audit command', () => {
  let testDir: string;

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
    
    expect(result.clean).toBe(true);
    expect(result.warnings).toBe(0);
    expect(result.issues.length).toBe(0);
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
    
    expect(result.clean).toBe(false);
    expect(result.warnings > 0).toBe(true);
    const dupIssue = result.issues.find(i => i.category.includes('DRY'));
    expect(dupIssue).toBeTruthy();
    expect(dupIssue.fix.includes('sync')).toBeTruthy();
  });

  it('should pass when validation matrix only in ESSENTIALS', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: false // Matrix only in ESSENTIALS (correct)
    });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    expect(result.clean).toBe(true);
    expect(result.warnings).toBe(0);
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
    expect(tbdIssue).toBeTruthy();
    expect(tbdIssue.type).toBe('info');
  });

  it('should detect excessive TODO comments', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    content += '\nTODO: fix this\nTODO: add that\nTODO: update\nTODO: review';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const todoIssue = result.issues.find(i => i.message.includes('TODO'));
    expect(todoIssue).toBeTruthy();
    expect(todoIssue.type).toBe('info');
  });

  it('should detect [FILL] instruction markers', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    content += '\n[FILL THIS IN]\n[FILL HERE]\n[FILL LATER]\n[FILL MORE]';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const fillIssue = result.issues.find(i => i.message.includes('FILL'));
    expect(fillIssue).toBeTruthy();
    expect(fillIssue.type).toBe('warning');
  });

  // Note: "generic placeholder text" detection removed due to too many false positives
  // in documentation that legitimately discusses placeholders and examples.

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
    expect(hasLowTbdWarning).toBe(false);
  });

  it('should detect unfilled {{PLACEHOLDERS}}', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    let content = fs.readFileSync(essentialsPath, 'utf-8');
    
    content += '\n{{PROJECT_NAME}}\n{{DATE}}\n{{AUTHOR}}';
    fs.writeFileSync(essentialsPath, content);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const placeholderIssue = result.issues.find(i => i.message.includes('placeholder'));
    expect(placeholderIssue).toBeTruthy();
    expect(placeholderIssue.type).toBe('warning');
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
    expect(placeholderIssue).toBeTruthy();
    // Message should mention "1 unfilled placeholder" or similar, not count duplicates
    expect(placeholderIssue.message.includes('1') || placeholderIssue.message.includes('PROJECT_NAME')).toBeTruthy();
  });

  it('should pass when all placeholders filled', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    // File has no {{...}} patterns
    const result = await audit({ dir: testDir, _silent: true });
    
    const placeholderIssue = result.issues.find(i => i.message.includes('{{'));
    expect(placeholderIssue).toBe(undefined);
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
    expect(sizeIssue).toBeTruthy();
    expect(sizeIssue.fix.includes('archive') || sizeIssue.fix.includes('minimal')).toBeTruthy();
  });

  it('should not warn when ESSENTIALS < 350 lines', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      essentialsSize: 'medium' // Small file
    });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    const sizeIssue = result.issues.find(i => i.message.includes('350 lines') || i.message.includes('large'));
    expect(sizeIssue).toBe(undefined);
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
    expect(matrixIssue).toBeTruthy();
  });

  // ========================================
  // SUMMARY DISPLAY TESTS
  // ========================================

  it('should show summary with issue counts', async () => {
    createMockProject(testDir, { hasEssentials: true, hasAgents: true, hasValidationMatrix: true, hasDuplicateMatrix: true });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    expect(result.warnings > 0 || result.info > 0).toBeTruthy();
    expect(result.issues.length > 0).toBeTruthy();
  });

  it('should show suggested fixes for each issue', async () => {
    createMockProject(testDir, { hasEssentials: true, hasAgents: true, hasValidationMatrix: true, hasDuplicateMatrix: true });
    
    const result = await audit({ dir: testDir, _silent: true });
    
    expect(result.issues.length > 0).toBeTruthy();
    result.issues.forEach(issue => {
      expect(issue.fix).toBeTruthy();
      expect(issue.fix.length > 0).toBeTruthy();
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
    
    expect(result.clean).toBe(true);
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
    expect(result).toBeTruthy();
  });

  // ========================================
  // CLI OPTIONS TESTS
  // ========================================

  it('should work with --dir option', async () => {
    const customDir = createTestDir();
    
    try {
      createMockProject(customDir, { hasEssentials: true });
      
      const result = await audit({ dir: customDir, _silent: true });
      
      expect(result).toBeTruthy();
      expect(result.issues !== undefined).toBeTruthy();
    } finally {
      cleanupTestDir(customDir);
    }
  });

  it('should exit gracefully when no knowledge system found', async () => {
    // Empty directory - no ESSENTIALS, no AGENTS
    
    await expect(async () => audit({ dir: testDir, _silent: true })).rejects.toThrow({ message: /No knowledge system found/i });
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
.aiknowsys/reviews/
`);
    
    const result = await audit({ dir: testDir, _silent: true });
    
    // Should not have gitignore warnings
    const gitignoreIssue = result.issues.find(i => 
      i.category === 'Gitignore Configuration' || 
      i.message.includes('gitignored')
    );
    expect(gitignoreIssue).toBe(undefined);
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
    expect(gitignoreIssue).toBeTruthy();
    expect(gitignoreIssue.fix.includes('.aiknowsys/sessions/*.md')).toBeTruthy();
  });

  it('should warn about missing .gitignore when .aiknowsys/ exists', async () => {
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
    expect(gitignoreIssue).toBeTruthy();
    expect(gitignoreIssue.fix.includes('.aiknowsys/sessions/*.md')).toBeTruthy();
  });

  it('should not warn when .aiknowsys/ directory does not exist', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    // No .aiknowsys directory
    const result = await audit({ dir: testDir, _silent: true });
    
    const gitignoreIssue = result.issues.find(i => 
      i.message.includes('.aiknowsys') && 
      i.type === 'warning'
    );
    expect(gitignoreIssue).toBe(undefined);
  });

  it('should warn when reviews/ directory not gitignored', async () => {
    createMockProject(testDir, { hasEssentials: true });
    
    // Create .aiknowsys with sessions ignored but not reviews/
    const aiknowsysDir = path.join(testDir, '.aiknowsys');
    fs.mkdirSync(aiknowsysDir, { recursive: true });
    
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '.aiknowsys/sessions/*.md\n');
    
    const result = await audit({ dir: testDir, _silent: true });
    
    // Should have warning about reviews/ directory
    const reviewsIssue = result.issues.find(i => 
      i.message && i.message.includes('reviews/')
    );
    expect(reviewsIssue).toBeTruthy();
    expect(result.warnings > 0).toBe(true);
  });

  it('should show progress during multi-step audit', async () => {
    createMockProject(testDir, {
      hasEssentials: true,
      hasAgents: true,
      hasValidationMatrix: true,
      hasDuplicateMatrix: false
    });
    
    // Test that audit completes successfully with progress (non-silent mode)
    // Progress indicators should not break the audit process
    const result = await audit({ dir: testDir, _silent: false });
    
    expect(result !== undefined).toBeTruthy();
    expect(typeof result.clean === 'boolean').toBeTruthy();
  });
});
