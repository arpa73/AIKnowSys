/**
 * Tests for input sanitization utilities
 */
import { describe, it, expect } from 'vitest';
import os from 'node:os';
import {
  sanitizeProjectName,
  sanitizeDirectoryPath,
  sanitizeFilename,
  validatePathTraversal,
  sanitizeSkillName
} from '../lib/sanitize.js';

describe('sanitizeProjectName', () => {
  it('should accept valid project names', () => {
    const result = sanitizeProjectName('my-awesome-project');
    expect(result.valid).toEqual(true);
    expect(result.sanitized).toEqual('my-awesome-project');
    expect(result.errors.length).toEqual(0);
  });

  it('should accept scoped package names', () => {
    const result = sanitizeProjectName('@myorg/my-project');
    expect(result.valid).toEqual(true);
    expect(result.sanitized).toEqual('@myorg/my-project');
  });

  it('should reject empty project names', () => {
    const result = sanitizeProjectName('');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('empty'))).toBeTruthy();
  });

  it('should reject project names with spaces', () => {
    const result = sanitizeProjectName('my awesome project');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('spaces'))).toBeTruthy();
  });

  it('should sanitize spaces to hyphens', () => {
    const result = sanitizeProjectName('my awesome project');
    expect(result.sanitized).toEqual('my-awesome-project');
  });

  it('should reject names starting with special chars', () => {
    const result = sanitizeProjectName('.hidden-project');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('cannot start'))).toBeTruthy();
  });

  it('should remove leading special chars in sanitization', () => {
    const result = sanitizeProjectName('.hidden-project');
    expect(result.sanitized).toEqual('hidden-project');
  });

  it('should reject names longer than 214 characters', () => {
    const longName: string = 'a'.repeat(215);
    const result = sanitizeProjectName(longName);
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('too long'))).toBeTruthy();
  });

  it('should reject null/undefined', () => {
    const result = sanitizeProjectName(null as never);
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('required'))).toBeTruthy();
  });

  it('should convert to lowercase', () => {
    const result = sanitizeProjectName('My-Awesome-Project');
    expect(result.sanitized).toEqual('my-awesome-project');
  });

  it('should remove invalid characters', () => {
    const result = sanitizeProjectName('my#awesome$project!');
    expect(result.sanitized).toEqual('myawesomeproject');
  });
});

describe('sanitizeDirectoryPath', () => {
  it('should accept valid directory paths', () => {
    const result = sanitizeDirectoryPath('/home/user/projects');
    expect(result.valid).toEqual(true);
    expect(result.sanitized).toEqual('/home/user/projects');
  });

  it('should accept relative paths', () => {
    const result = sanitizeDirectoryPath('./my-project');
    expect(result.valid).toEqual(true);
    expect(result.sanitized).toEqual('./my-project');
  });

  it('should reject empty paths', () => {
    const result = sanitizeDirectoryPath('');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('empty'))).toBeTruthy();
  });

  it('should reject paths with null bytes', () => {
    const result = sanitizeDirectoryPath('/home/user\0/projects');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('null byte'))).toBeTruthy();
  });

  it('should reject paths with parent directory references', () => {
    const result = sanitizeDirectoryPath('../../../etc/passwd');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('..'))).toBeTruthy();
  });

  it('should reject Windows reserved names', () => {
    const result = sanitizeDirectoryPath('./CON');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('reserved'))).toBeTruthy();
  });

  it('should reject invalid Windows characters', () => {
    const result = sanitizeDirectoryPath('./my<project>');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('invalid characters'))).toBeTruthy();
  });

  await t.test('should handle Windows paths', { skip: os.platform() !== 'win32' }, () => {
    // This test only runs on Windows since the path validation is platform-specific
    // On Unix systems, colons are invalid in paths, but on Windows C:\ is valid
    const result = sanitizeDirectoryPath('C:\\Users\\Name\\projects');
    expect(result.valid).toEqual(true);
  });
});

describe('sanitizeFilename', () => {
  it('should accept valid filenames', () => {
    const result = sanitizeFilename('my-file.txt');
    expect(result.valid).toEqual(true);
    expect(result.sanitized).toEqual('my-file.txt');
  });

  it('should reject empty filenames', () => {
    const result = sanitizeFilename('');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('empty'))).toBeTruthy();
  });

  it('should reject filenames with path separators', () => {
    const result = sanitizeFilename('path/to/file.txt');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('path separators'))).toBeTruthy();
  });

  it('should reject Windows reserved names', () => {
    const result = sanitizeFilename('CON.txt');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('reserved'))).toBeTruthy();
  });

  it('should reject filenames with null bytes', () => {
    const result = sanitizeFilename('file\0.txt');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('null byte'))).toBeTruthy();
  });

  it('should reject filenames longer than 255 characters', () => {
    const longName: string = 'a'.repeat(256) + '.txt';
    const result = sanitizeFilename(longName);
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('too long'))).toBeTruthy();
  });

  it('should sanitize spaces to hyphens', () => {
    const result = sanitizeFilename('my awesome file.txt');
    expect(result.sanitized).toEqual('my-awesome-file.txt');
  });

  it('should remove invalid characters', () => {
    const result = sanitizeFilename('my<file>.txt');
    expect(result.sanitized).toEqual('myfile.txt');
  });

  it('should truncate to 255 characters', () => {
    const longName: string = 'a'.repeat(300);
    const result = sanitizeFilename(longName);
    expect(result.sanitized.length).toEqual(255);
  });
});

describe('validatePathTraversal', () => {
  it('should accept safe relative paths', () => {
    const result = validatePathTraversal('/home/user/projects', 'my-project/file.txt');
    expect(result.valid).toEqual(true);
    expect(result.errors.length).toEqual(0);
  });

  it('should reject absolute paths', () => {
    const result = validatePathTraversal('/home/user/projects', '/etc/passwd');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('relative'))).toBeTruthy();
  });

  it('should reject parent directory references', () => {
    const result = validatePathTraversal('/home/user/projects', '../../../etc/passwd');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('..'))).toBeTruthy();
  });

  it('should reject null bytes', () => {
    const result = validatePathTraversal('/home/user/projects', 'file\0.txt');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('null byte'))).toBeTruthy();
  });

  it('should require both parameters', () => {
    const result = validatePathTraversal('/home/user/projects', null as never);
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('required'))).toBeTruthy();
  });

  it('should normalize backslashes to forward slashes', () => {
    const result = validatePathTraversal('C:\\Users\\Name', 'my-project\\file.txt');
    expect(result.valid).toEqual(true);
  });
});

describe('sanitizeSkillName', () => {
  it('should accept valid skill names', () => {
    const result = sanitizeSkillName('code-refactoring');
    expect(result.valid).toEqual(true);
    expect(result.sanitized).toEqual('code-refactoring');
  });

  it('should reject empty skill names', () => {
    const result = sanitizeSkillName('');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('empty'))).toBeTruthy();
  });

  it('should reject uppercase letters', () => {
    const result = sanitizeSkillName('Code-Refactoring');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('lowercase'))).toBeTruthy();
  });

  it('should sanitize uppercase to lowercase', () => {
    const result = sanitizeSkillName('Code-Refactoring');
    expect(result.sanitized).toEqual('code-refactoring');
  });

  it('should reject spaces', () => {
    const result = sanitizeSkillName('code refactoring');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('lowercase'))).toBeTruthy();
  });

  it('should remove invalid characters', () => {
    const result = sanitizeSkillName('code_refactoring!');
    expect(result.sanitized).toEqual('coderefactoring');
  });

  it('should reject leading hyphens', () => {
    const result = sanitizeSkillName('-code-refactoring');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('cannot start'))).toBeTruthy();
  });

  it('should reject trailing hyphens', () => {
    const result = sanitizeSkillName('code-refactoring-');
    expect(result.valid).toEqual(false);
    expect(result.errors.some(e => e.includes('cannot start'))).toBeTruthy();
  });

  it('should remove leading/trailing hyphens in sanitization', () => {
    const result = sanitizeSkillName('-code-refactoring-');
    expect(result.sanitized).toEqual('code-refactoring');
  });

  it('should accept numbers', () => {
    const result = sanitizeSkillName('skill-v2-update');
    expect(result.valid).toEqual(true);
    expect(result.sanitized).toEqual('skill-v2-update');
  });
});
