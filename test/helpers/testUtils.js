import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'node:assert';

/**
 * Create a unique temporary test directory
 * @returns {string} Absolute path to temp directory
 */
export function createTestDir() {
  const tmpDir = path.join(os.tmpdir(), `aiknowsys-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  return tmpDir;
}

/**
 * Clean up test directory after tests
 * @param {string} dirPath - Path to directory to remove
 */
export function cleanupTestDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Create a mock project structure for testing
 * @param {string} dir - Target directory
 * @param {Object} options - Configuration options
 * @param {boolean} options.hasEssentials - Create CODEBASE_ESSENTIALS.md
 * @param {boolean} options.hasAgents - Create AGENTS.md
 * @param {boolean} options.hasChangelog - Create CODEBASE_CHANGELOG.md
 * @param {string} options.version - Version string for .aiknowsys-version
 * @param {boolean} options.hasValidationMatrix - Include validation matrix in ESSENTIALS
 * @param {boolean} options.hasDuplicateMatrix - Include matrix in AGENTS too
 * @param {string} options.essentialsSize - 'small' | 'medium' | 'large'
 */
export function createMockProject(dir, options = {}) {
  const {
    hasEssentials = false,
    hasAgents = false,
    hasChangelog = false,
    version = null,
    hasValidationMatrix = true,
    hasDuplicateMatrix = false,
    essentialsSize = 'medium'
  } = options;

  if (hasEssentials) {
    const essentialsContent = generateEssentials({ hasValidationMatrix, size: essentialsSize });
    fs.writeFileSync(path.join(dir, 'CODEBASE_ESSENTIALS.md'), essentialsContent);
  }

  if (hasAgents) {
    const agentsContent = generateAgents({ hasDuplicateMatrix });
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), agentsContent);
  }

  if (hasChangelog) {
    const changelogContent = generateChangelog();
    fs.writeFileSync(path.join(dir, 'CODEBASE_CHANGELOG.md'), changelogContent);
  }

  if (version) {
    fs.writeFileSync(path.join(dir, '.aiknowsys-version'), version);
  }

  // Create basic package.json
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    type: 'module'
  }, null, 2));
}

/**
 * Generate sample CODEBASE_ESSENTIALS.md content
 */
function generateEssentials({ hasValidationMatrix, size }) {
  let content = `# Test Project - Codebase Essentials

> **Last Updated:** 2026-01-25
> **Purpose:** Test project for aiknowsys

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | JavaScript |
`;

  if (hasValidationMatrix) {
    content += `
## 2. Validation Matrix

| Command | Purpose | Expected |
|---------|---------|----------|
| \`npm test\` | Run tests | All tests pass |
| \`npm run lint\` | Linting | No errors |
`;
  }

  content += `
## 3. Project Structure

\`\`\`
project/
├── src/
└── test/
\`\`\`

## 4. Core Patterns

Example patterns here.

## 5. Critical Invariants

1. Always use ES Modules
2. Test before commit
`;

  if (size === 'large') {
    // Add 350+ lines for file size testing (threshold is 350)
    for (let i = 0; i < 120; i++) {
      content += `\n## Additional Section ${i}\n\nSome content here.\nMore content to make it longer.\nEven more content.\n`;
    }
  }

  return content;
}

/**
 * Generate sample AGENTS.md content
 */
function generateAgents({ hasDuplicateMatrix }) {
  let content = `# AI Agent Instructions

## Workflow

1. Read context
2. Plan work
3. Implement
4. Validate
`;

  if (hasDuplicateMatrix) {
    content += `

**Validation Matrix:**

| Command | Purpose | Expected |
|---------|---------|----------|
| \`npm test\` | Run tests | All tests pass |

---
`;
  }

  return content;
}

/**
 * Generate sample CODEBASE_CHANGELOG.md content
 */
function generateChangelog() {
  return `# Codebase Changelog

## Session: Initial Setup (Jan 25, 2026)

**Goal:** Set up knowledge system

**Changes:**
- Created CODEBASE_ESSENTIALS.md
- Created AGENTS.md

**Validation:**
- ✅ Files created
`;
}

/**
 * Assert that a file exists
 * @param {string} filePath - Path to file
 * @param {string} message - Optional assertion message
 */
export function assertFileExists(filePath, message) {
  assert.ok(
    fs.existsSync(filePath),
    message || `Expected file to exist: ${filePath}`
  );
}

/**
 * Assert that a file does not exist
 * @param {string} filePath - Path to file
 * @param {string} message - Optional assertion message
 */
export function assertFileNotExists(filePath, message) {
  assert.ok(
    !fs.existsSync(filePath),
    message || `Expected file not to exist: ${filePath}`
  );
}

/**
 * Assert that a file contains specific content
 * @param {string} filePath - Path to file
 * @param {string|RegExp} content - Content to search for
 * @param {string} message - Optional assertion message
 */
export function assertFileContains(filePath, content, message) {
  assertFileExists(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  if (typeof content === 'string') {
    assert.ok(
      fileContent.includes(content),
      message || `Expected file to contain: ${content}`
    );
  } else if (content instanceof RegExp) {
    assert.ok(
      content.test(fileContent),
      message || `Expected file to match pattern: ${content}`
    );
  }
}

/**
 * Assert that a file does not contain specific content
 * @param {string} filePath - Path to file
 * @param {string|RegExp} content - Content to search for
 * @param {string} message - Optional assertion message
 */
export function assertFileNotContains(filePath, content, message) {
  assertFileExists(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  if (typeof content === 'string') {
    assert.ok(
      !fileContent.includes(content),
      message || `Expected file not to contain: ${content}`
    );
  } else if (content instanceof RegExp) {
    assert.ok(
      !content.test(fileContent),
      message || `Expected file not to match pattern: ${content}`
    );
  }
}

/**
 * Assert that a placeholder was replaced in a file
 * @param {string} filePath - Path to file
 * @param {string} placeholder - Placeholder name (without {{ }})
 * @param {string} message - Optional assertion message
 */
export function assertPlaceholderReplaced(filePath, placeholder, message) {
  assertFileNotContains(
    filePath,
    `{{${placeholder}}}`,
    message || `Expected {{${placeholder}}} to be replaced`
  );
}

/**
 * Assert that a placeholder was NOT replaced (still exists)
 * @param {string} filePath - Path to file
 * @param {string} placeholder - Placeholder name (without {{ }})
 * @param {string} message - Optional assertion message
 */
export function assertPlaceholderExists(filePath, placeholder, message) {
  assertFileContains(
    filePath,
    `{{${placeholder}}}`,
    message || `Expected {{${placeholder}}} to still exist`
  );
}

/**
 * Create a mock inquirer prompt response
 * Useful for stubbing inquirer.prompt in tests
 * @param {Object} answers - Object with prompt answers
 * @returns {Function} Mock function that returns answers
 */
export function mockInquirerPrompt(answers) {
  return async (questions) => {
    // Return answers for the questions asked
    const result = {};
    for (const question of questions) {
      if (Object.hasOwn(answers, question.name)) {
        result[question.name] = answers[question.name];
      }
    }
    return result;
  };
}

/**
 * Count lines in a file
 * @param {string} filePath - Path to file
 * @returns {number} Number of lines
 */
export function countLines(filePath) {
  assertFileExists(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

/**
 * Create a simple Node.js project structure for scanning
 * @param {string} dir - Target directory
 * @param {Object} options - Configuration
 */
export function createSampleNodeProject(dir, options = {}) {
  const {
    hasTests = true,
    hasDatabase = true
  } = options;

  // Create package.json
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'sample-project',
    version: '1.0.0',
    type: 'module',
    dependencies: {
      express: '^4.18.0',
      ...(hasDatabase && { pg: '^8.11.0', prisma: '^5.7.0' })
    },
    devDependencies: {
      ...(hasTests && { vitest: '^1.0.0' })
    }
  }, null, 2));

  // Create basic source files
  const srcDir = path.join(dir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  
  fs.writeFileSync(path.join(srcDir, 'app.js'), `import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello' });
});

export default app;
`);

  if (hasTests) {
    const testDir = path.join(dir, 'test');
    fs.mkdirSync(testDir, { recursive: true });
    
    fs.writeFileSync(path.join(testDir, 'app.test.js'), `import { describe, it } from 'vitest';
import app from '../src/app.js';

describe('App', () => {
  it('should work', () => {
    // test here
  });
});
`);
  }

  if (hasDatabase) {
    const prismaDir = path.join(dir, 'prisma');
    fs.mkdirSync(prismaDir, { recursive: true });
    
    fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`);
  }
}
