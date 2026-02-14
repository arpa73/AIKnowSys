import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findKnowledgeDb } from '../../lib/utils/find-knowledge-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('findKnowledgeDb', () => {
  let tempDirs: string[] = [];
  
  afterEach(() => {
    // Cleanup temp directories
    tempDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
    tempDirs = [];
  });

  it('finds database in current directory', () => {
    // Setup: Create .aiknowsys/knowledge.db in temp directory
    const tempDir = path.join(__dirname, `../../test-tmp-finddb-${Date.now()}`);
    const aiknowsysDir = path.join(tempDir, '.aiknowsys');
    const dbPath = path.join(aiknowsysDir, 'knowledge.db');
    
    fs.mkdirSync(aiknowsysDir, { recursive: true });
    fs.writeFileSync(dbPath, ''); // Create empty file
    tempDirs.push(tempDir);
    
    // Test: Should find database in current directory
    const result = findKnowledgeDb(tempDir);
    
    expect(result).toBe(dbPath);
  });

  it('finds database in parent directory', () => {
    // Setup: Create .aiknowsys/knowledge.db in parent, subdirectory without db
    const tempDir = path.join(__dirname, `../../test-tmp-finddb-${Date.now()}`);
    const aiknowsysDir = path.join(tempDir, '.aiknowsys');
    const dbPath = path.join(aiknowsysDir, 'knowledge.db');
    const subDir = path.join(tempDir, 'subdir');
    
    fs.mkdirSync(aiknowsysDir, { recursive: true });
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(dbPath, '');
    tempDirs.push(tempDir);
    
    // Test: Should find database in parent directory
    const result = findKnowledgeDb(subDir);
    
    expect(result).toBe(dbPath);
  });

  it('finds database in grandparent directory', () => {
    // Setup: Create .aiknowsys/knowledge.db in grandparent
    const tempDir = path.join(__dirname, `../../test-tmp-finddb-${Date.now()}`);
    const aiknowsysDir = path.join(tempDir, '.aiknowsys');
    const dbPath = path.join(aiknowsysDir, 'knowledge.db');
    const subDir = path.join(tempDir, 'sub1', 'sub2');
    
    fs.mkdirSync(aiknowsysDir, { recursive: true });
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(dbPath, '');
    tempDirs.push(tempDir);
    
    // Test: Should find database in grandparent directory
    const result = findKnowledgeDb(subDir);
    
    expect(result).toBe(dbPath);
  });

  it('throws helpful error when database not found', () => {
    // Setup: Empty temp directory with no database (use /tmp to avoid finding project db)
    const tempDir = path.join('/tmp', `test-finddb-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    tempDirs.push(tempDir);
    
    // Test: Should throw error with troubleshooting info
    expect(() => findKnowledgeDb(tempDir)).toThrow(/Database not found/);
    expect(() => findKnowledgeDb(tempDir)).toThrow(/migrate-to-sqlite/);
  });

  it('returns absolute path', () => {
    // Setup: Create .aiknowsys/knowledge.db
    const tempDir = path.join(__dirname, `../../test-tmp-finddb-${Date.now()}`);
    const aiknowsysDir = path.join(tempDir, '.aiknowsys');
    const dbPath = path.join(aiknowsysDir, 'knowledge.db');
    
    fs.mkdirSync(aiknowsysDir, { recursive: true });
    fs.writeFileSync(dbPath, '');
    tempDirs.push(tempDir);
    
    // Test: Should return absolute path
    const result = findKnowledgeDb(tempDir);
    
    expect(path.isAbsolute(result)).toBe(true);
    expect(result).toBe(dbPath);
  });

  it('stops at filesystem root', () => {
    // Setup: Directory that definitely won't have database (use /tmp to avoid finding project db)
    const tempDir = path.join('/tmp', `test-finddb-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    tempDirs.push(tempDir);
    
    // Test: Should stop at root and throw error (not infinite loop)
    expect(() => findKnowledgeDb(tempDir)).toThrow();
  });

  it('uses process.cwd() by default', () => {
    // Test: Should use current working directory when no arg provided
    // This will search from project root which SHOULD have .aiknowsys/knowledge.db
    const result = findKnowledgeDb();
    
    expect(result).toContain('.aiknowsys');
    expect(result).toContain('knowledge.db');
    expect(path.isAbsolute(result)).toBe(true);
  });
});
