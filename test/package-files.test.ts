/**
 * Test that all files referenced in code are included in package.json
 * Prevents regression: files needed by commands but missing from npm package
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use PROJECT_ROOT env var set by test script (avoids dist/ path issues)
const rootDir = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');

describe('Package Files Validation', () => {
  it('should include SETUP_GUIDE.md in package.json files array', () => {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    assert.ok(packageJson.files, 'package.json should have files array');
    assert.ok(
      packageJson.files.includes('SETUP_GUIDE.md'),
      'SETUP_GUIDE.md must be in files array (referenced in init/templates.js)'
    );
  });
  
  it('should include all template files referenced in init/templates.js', () => {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    // Files that init/templates.js tries to copy
    const requiredFiles = [
      'SETUP_GUIDE.md',
      'templates/AGENTS.template.md',
      'templates/CODEBASE_CHANGELOG.template.md',
      'templates/CODEBASE_ESSENTIALS.template.md',
      'templates/CODEBASE_ESSENTIALS.minimal.template.md',
      'templates/agents',
      'templates/skills',
      'templates/aiknowsys-structure',
      'templates/git-hooks',
      'templates/workflows',
      'scripts/install-git-hooks.sh',
    ];
    
    const missingFiles = requiredFiles.filter(file => {
      return !packageJson.files.some((pattern: string) => {
        // Check exact match
        if (pattern === file) return true;
        
        // Check glob patterns like templates/* or lib/**
        if (pattern.endsWith('/*') && file.startsWith(pattern.slice(0, -2))) return true;
        if (pattern.endsWith('/**') && file.startsWith(pattern.slice(0, -3))) return true;
        
        // Check directory patterns: templates/ covers templates/agents, templates/skills, etc.
        if (pattern.endsWith('/') && file.startsWith(pattern)) return true;
        
        // Check directory without trailing slash: templates covers templates/agents, etc.
        if (!pattern.endsWith('/') && !pattern.includes('.') && file.startsWith(pattern + '/')) return true;
        
        return false;
      });
    });
    
    assert.strictEqual(
      missingFiles.length,
      0,
      `Missing files in package.json: ${missingFiles.join(', ')}`
    );
  });
  
  it('should include all files that npm pack would include', async () => {
    // This is a more comprehensive check - simulate what npm pack does
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    // Critical files that MUST be in package
    const criticalFiles = [
      'SETUP_GUIDE.md',
      'README.md',
      'LICENSE',
    ];
    
    for (const file of criticalFiles) {
      const fileExists = fs.existsSync(path.join(rootDir, file));
      const fileIncluded = packageJson.files.includes(file);
      
      assert.ok(
        fileExists,
        `Critical file ${file} must exist in repository`
      );
      assert.ok(
        fileIncluded,
        `Critical file ${file} must be in package.json files array`
      );
    }
  });
});
