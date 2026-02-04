/**
 * Tests for input sanitization utilities
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import {
  sanitizeProjectName,
  sanitizeDirectoryPath,
  sanitizeFilename,
  validatePathTraversal,
  sanitizeSkillName
} from '../lib/sanitize.js';

test('sanitizeProjectName', async (t) => {
  await t.test('should accept valid project names', () => {
    const result = sanitizeProjectName('my-awesome-project');
    assert.equal(result.valid, true);
    assert.equal(result.sanitized, 'my-awesome-project');
    assert.equal(result.errors.length, 0);
  });

  await t.test('should accept scoped package names', () => {
    const result = sanitizeProjectName('@myorg/my-project');
    assert.equal(result.valid, true);
    assert.equal(result.sanitized, '@myorg/my-project');
  });

  await t.test('should reject empty project names', () => {
    const result = sanitizeProjectName('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('empty')));
  });

  await t.test('should reject project names with spaces', () => {
    const result = sanitizeProjectName('my awesome project');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('spaces')));
  });

  await t.test('should sanitize spaces to hyphens', () => {
    const result = sanitizeProjectName('my awesome project');
    assert.equal(result.sanitized, 'my-awesome-project');
  });

  await t.test('should reject names starting with special chars', () => {
    const result = sanitizeProjectName('.hidden-project');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('cannot start')));
  });

  await t.test('should remove leading special chars in sanitization', () => {
    const result = sanitizeProjectName('.hidden-project');
    assert.equal(result.sanitized, 'hidden-project');
  });

  await t.test('should reject names longer than 214 characters', () => {
    const longName: string = 'a'.repeat(215);
    const result = sanitizeProjectName(longName);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('too long')));
  });

  await t.test('should reject null/undefined', () => {
    const result = sanitizeProjectName(null as never);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('required')));
  });

  await t.test('should convert to lowercase', () => {
    const result = sanitizeProjectName('My-Awesome-Project');
    assert.equal(result.sanitized, 'my-awesome-project');
  });

  await t.test('should remove invalid characters', () => {
    const result = sanitizeProjectName('my#awesome$project!');
    assert.equal(result.sanitized, 'myawesomeproject');
  });
});

test('sanitizeDirectoryPath', async (t) => {
  await t.test('should accept valid directory paths', () => {
    const result = sanitizeDirectoryPath('/home/user/projects');
    assert.equal(result.valid, true);
    assert.equal(result.sanitized, '/home/user/projects');
  });

  await t.test('should accept relative paths', () => {
    const result = sanitizeDirectoryPath('./my-project');
    assert.equal(result.valid, true);
    assert.equal(result.sanitized, './my-project');
  });

  await t.test('should reject empty paths', () => {
    const result = sanitizeDirectoryPath('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('empty')));
  });

  await t.test('should reject paths with null bytes', () => {
    const result = sanitizeDirectoryPath('/home/user\0/projects');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('null byte')));
  });

  await t.test('should reject paths with parent directory references', () => {
    const result = sanitizeDirectoryPath('../../../etc/passwd');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('..')));
  });

  await t.test('should reject Windows reserved names', () => {
    const result = sanitizeDirectoryPath('./CON');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('reserved')));
  });

  await t.test('should reject invalid Windows characters', () => {
    const result = sanitizeDirectoryPath('./my<project>');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('invalid characters')));
  });

  await t.test('should handle Windows paths', { skip: os.platform() !== 'win32' }, () => {
    // This test only runs on Windows since the path validation is platform-specific
    // On Unix systems, colons are invalid in paths, but on Windows C:\ is valid
    const result = sanitizeDirectoryPath('C:\\Users\\Name\\projects');
    assert.equal(result.valid, true);
  });
});

test('sanitizeFilename', async (t) => {
  await t.test('should accept valid filenames', () => {
    const result = sanitizeFilename('my-file.txt');
    assert.equal(result.valid, true);
    assert.equal(result.sanitized, 'my-file.txt');
  });

  await t.test('should reject empty filenames', () => {
    const result = sanitizeFilename('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('empty')));
  });

  await t.test('should reject filenames with path separators', () => {
    const result = sanitizeFilename('path/to/file.txt');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('path separators')));
  });

  await t.test('should reject Windows reserved names', () => {
    const result = sanitizeFilename('CON.txt');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('reserved')));
  });

  await t.test('should reject filenames with null bytes', () => {
    const result = sanitizeFilename('file\0.txt');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('null byte')));
  });

  await t.test('should reject filenames longer than 255 characters', () => {
    const longName: string = 'a'.repeat(256) + '.txt';
    const result = sanitizeFilename(longName);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('too long')));
  });

  await t.test('should sanitize spaces to hyphens', () => {
    const result = sanitizeFilename('my awesome file.txt');
    assert.equal(result.sanitized, 'my-awesome-file.txt');
  });

  await t.test('should remove invalid characters', () => {
    const result = sanitizeFilename('my<file>.txt');
    assert.equal(result.sanitized, 'myfile.txt');
  });

  await t.test('should truncate to 255 characters', () => {
    const longName: string = 'a'.repeat(300);
    const result = sanitizeFilename(longName);
    assert.equal(result.sanitized.length, 255);
  });
});

test('validatePathTraversal', async (t) => {
  await t.test('should accept safe relative paths', () => {
    const result = validatePathTraversal('/home/user/projects', 'my-project/file.txt');
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  await t.test('should reject absolute paths', () => {
    const result = validatePathTraversal('/home/user/projects', '/etc/passwd');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('relative')));
  });

  await t.test('should reject parent directory references', () => {
    const result = validatePathTraversal('/home/user/projects', '../../../etc/passwd');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('..')));
  });

  await t.test('should reject null bytes', () => {
    const result = validatePathTraversal('/home/user/projects', 'file\0.txt');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('null byte')));
  });

  await t.test('should require both parameters', () => {
    const result = validatePathTraversal('/home/user/projects', null as never);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('required')));
  });

  await t.test('should normalize backslashes to forward slashes', () => {
    const result = validatePathTraversal('C:\\Users\\Name', 'my-project\\file.txt');
    assert.equal(result.valid, true);
  });
});

test('sanitizeSkillName', async (t) => {
  await t.test('should accept valid skill names', () => {
    const result = sanitizeSkillName('code-refactoring');
    assert.equal(result.valid, true);
    assert.equal(result.sanitized, 'code-refactoring');
  });

  await t.test('should reject empty skill names', () => {
    const result = sanitizeSkillName('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('empty')));
  });

  await t.test('should reject uppercase letters', () => {
    const result = sanitizeSkillName('Code-Refactoring');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('lowercase')));
  });

  await t.test('should sanitize uppercase to lowercase', () => {
    const result = sanitizeSkillName('Code-Refactoring');
    assert.equal(result.sanitized, 'code-refactoring');
  });

  await t.test('should reject spaces', () => {
    const result = sanitizeSkillName('code refactoring');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('lowercase')));
  });

  await t.test('should remove invalid characters', () => {
    const result = sanitizeSkillName('code_refactoring!');
    assert.equal(result.sanitized, 'coderefactoring');
  });

  await t.test('should reject leading hyphens', () => {
    const result = sanitizeSkillName('-code-refactoring');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('cannot start')));
  });

  await t.test('should reject trailing hyphens', () => {
    const result = sanitizeSkillName('code-refactoring-');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('cannot start')));
  });

  await t.test('should remove leading/trailing hyphens in sanitization', () => {
    const result = sanitizeSkillName('-code-refactoring-');
    assert.equal(result.sanitized, 'code-refactoring');
  });

  await t.test('should accept numbers', () => {
    const result = sanitizeSkillName('skill-v2-update');
    assert.equal(result.valid, true);
    assert.equal(result.sanitized, 'skill-v2-update');
  });
});
