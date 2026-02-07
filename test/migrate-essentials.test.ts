import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { migrateEssentials } from '../lib/commands/migrate-essentials.js';
import {
  createTestDir,
  cleanupTestDir,
  assertFileExists,
  assertFileNotExists
} from './helpers/testUtils.js';

describe('migrate-essentials command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  // ========================================
  // DETECTION TESTS
  // ========================================

  it('should detect already-migrated skill-indexed ESSENTIALS', async () => {
    // Create skill-indexed ESSENTIALS (v0.10.0 format)
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const skillIndexedContent = `# Test Project - Codebase Essentials

> **Version:** v0.10.0 (Skill-Indexed Architecture)

## 5. Skill Index

| Skill | Trigger Words | Purpose |
|-------|---------------|---------|
| refactoring-workflow | "refactor", "clean up" | Test-driven refactoring |

This is a skill-indexed ESSENTIALS file.`;
    
    fs.writeFileSync(essentialsPath, skillIndexedContent, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true });

    expect(result.success).toBe(true);
    expect(result.alreadyMigrated).toBe(true);
    expect(result.migrated).toBe(false);
  });

  it('should detect monolithic ESSENTIALS needing migration', async () => {
    // Create old-format (monolithic) ESSENTIALS
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const monolithicContent = `# Test Project - Codebase Essentials

## 4. Critical Invariants

Some very long content here that makes this file over 400 lines...

`.repeat(100); // Make it long enough to not be detected as skill-indexed
    
    fs.writeFileSync(essentialsPath, monolithicContent, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true, dryRun: true });

    expect(result.success).toBe(true);
    expect(result.alreadyMigrated).toBe(false);
  });

  it('should handle missing ESSENTIALS file gracefully', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    assertFileNotExists(essentialsPath);

    const result = await migrateEssentials({ dir: testDir, _silent: true });

    expect(result.success).toBe(false);
    expect(result.migrated).toBe(false);
  });

  // ========================================
  // BACKUP TESTS
  // ========================================

  it('should create backup before migrating', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const backupPattern = /CODEBASE_ESSENTIALS\.md\.pre-v0\.10\.backup$/;
    
    // Create monolithic ESSENTIALS
    const oldContent = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}\n`).join('');
    fs.writeFileSync(essentialsPath, oldContent, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true });

    expect(result.success).toBe(true);
    expect(result.backupCreated).toBe(true);
    
    // Find backup file
    const files = fs.readdirSync(testDir);
    const backupFile = files.find(f => backupPattern.test(f));
    expect(backupFile).toBeDefined();
    
    if (backupFile) {
      const backupPath = path.join(testDir, backupFile);
      assertFileExists(backupPath);
      const backupContent = fs.readFileSync(backupPath, 'utf-8');
      expect(backupContent).toBe(oldContent);
    }
  });

  // ========================================
  // DRY-RUN TESTS
  // ========================================

  it('should not modify ESSENTIALS in dry-run mode', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const originalContent = Array.from({ length: 100 }, (_, i) => `Original line ${i + 1}\n`).join('');
    
    fs.writeFileSync(essentialsPath, originalContent, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true, dryRun: true });

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(false);
    
    // Content should be unchanged
    const currentContent = fs.readFileSync(essentialsPath, 'utf-8');
    expect(currentContent).toBe(originalContent);
  });

  it('should not create backup in dry-run mode', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const content = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}\n`).join('');
    
    fs.writeFileSync(essentialsPath, content, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true, dryRun: true });

    expect(result.success).toBe(true);
    expect(result.backupCreated).toBe(false);
    
    // No backup files should exist
    const files = fs.readdirSync(testDir);
    const backupFiles = files.filter(f => f.includes('.backup'));
    expect(backupFiles.length).toBe(0);
  });

  // ========================================
  // CUSTOMIZATION PRESERVATION TESTS
  // ========================================

  it('should preserve custom technology stack', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const customContent = `# Test Project - Codebase Essentials

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Python 3.11+ |
| Framework | Django 5.0 |
| Database | PostgreSQL 15 |

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| pytest | Run tests |

## 3. Project Structure

\`\`\`
project/
  src/
\`\`\`

## 4. Critical Invariants

Some content here to make it long...

`.repeat(30);
    
    fs.writeFileSync(essentialsPath, customContent, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true });

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    
    // Read new content
    const newContent = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Should preserve Python/Django stack
    expect(newContent).toContain('Python 3.11+');
    expect(newContent).toContain('Django 5.0');
    expect(newContent).toContain('PostgreSQL 15');
  });

  it('should preserve custom validation commands', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const customContent = `# Test Project

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| cargo test | Run Rust tests |
| cargo clippy | Lint Rust code |

## 3. Project Structure

\`\`\`
project/
  src/
\`\`\`

## 4. Critical Invariants

Some content...

`.repeat(30);
    
    fs.writeFileSync(essentialsPath, customContent, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true });

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    
    const newContent = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Should preserve Rust validation commands
    expect(newContent).toContain('cargo test');
    expect(newContent).toContain('cargo clippy');
  });

  it('should preserve custom project structure', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const customContent = `# Test Project

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Run tests |

## 3. Project Structure

\`\`\`
my-custom-app/
  frontend/
    pages/
    components/
  backend/
    api/
    models/
  database/
    migrations/
\`\`\`

## 4. Critical Invariants

Some content...

`.repeat(30);
    
    fs.writeFileSync(essentialsPath, customContent, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true });

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    
    const newContent = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Should preserve custom structure
    expect(newContent).toContain('my-custom-app/');
    expect(newContent).toContain('frontend/');
    expect(newContent).toContain('backend/');
  });

  it('should detect and preserve React framework patterns', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const customContent = `# Test Project

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | React 18 + Next.js 14 |

## 2. Validation Matrix

| Command | Purpose |
|---------|---------|
| npm test | Run tests |

## 3. Project Structure

\`\`\`
project/
  src/
    components/
\`\`\`

## 4. Critical Invariants

Some content...

`.repeat(30);
    
    fs.writeFileSync(essentialsPath, customContent, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true });

    expect(result.success).toBe(true);
    expect(result.customizationsPreserved).toContain('Frontend framework patterns');
  });

  // ========================================
  // MIGRATION OUTPUT TESTS
  // ========================================

  it('should generate skill-indexed ESSENTIALS with Section 4 and 5', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const monolithicContent = Array.from({ length: 100 }, (_, i) => `## 1. Technology\n\nLine ${i + 1}\n`).join('');
    
    fs.writeFileSync(essentialsPath, monolithicContent, 'utf-8');

    const result = await migrateEssentials({ dir: testDir, _silent: true });

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    
    const newContent = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Should have skill-indexed structure
    expect(newContent).toContain('## 4. Critical Invariants');
    expect(newContent).toContain('## 5. Skill Index');
    expect(newContent).toContain('Skill-Indexed Architecture');
  });

  it('should reduce file size significantly', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const monolithicContent = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}\n`).join('');
    
    fs.writeFileSync(essentialsPath, monolithicContent, 'utf-8');
    const originalLines = monolithicContent.split('\n').length;

    const result = await migrateEssentials({ dir: testDir, _silent: true });

    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    
    const newContent = fs.readFileSync(essentialsPath, 'utf-8');
    const newLines = newContent.split('\n').length;
    
    // Should be significantly smaller (target ~327 lines)
    expect(newLines).toBeLessThan(500);
    expect(newLines).toBeLessThan(originalLines);
  });

  // ========================================
  // IDEMPOTENCY TESTS
  // ========================================

  it('should be idempotent - running twice should not change result', async () => {
    const essentialsPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    const monolithicContent = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}\n`).join('');
    
    fs.writeFileSync(essentialsPath, monolithicContent, 'utf-8');

    // First migration
    const result1 = await migrateEssentials({ dir: testDir, _silent: true });
    expect(result1.success).toBe(true);
    expect(result1.migrated).toBe(true);
    
    const contentAfterFirst = fs.readFileSync(essentialsPath, 'utf-8');

    // Second migration (should detect already migrated)
    const result2 = await migrateEssentials({ dir: testDir, _silent: true });
    expect(result2.success).toBe(true);
    expect(result2.alreadyMigrated).toBe(true);
    expect(result2.migrated).toBe(false);
    
    const contentAfterSecond = fs.readFileSync(essentialsPath, 'utf-8');
    
    // Content should be unchanged
    expect(contentAfterSecond).toBe(contentAfterFirst);
  });
});
