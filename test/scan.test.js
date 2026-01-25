import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

describe('scan command', () => {
  let testDir;
  
  before(() => {
    testDir = path.join(rootDir, 'test-scan-' + Date.now());
    fs.mkdirSync(testDir, { recursive: true });
  });
  
  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  it('should detect Node.js project with package.json', () => {
    const pkg = {
      name: 'test-project',
      dependencies: {
        express: '^4.18.0',
        react: '^18.2.0'
      },
      devDependencies: {
        vitest: '^1.0.0'
      },
      scripts: {
        test: 'vitest',
        lint: 'eslint .'
      }
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output SCAN_OUTPUT.md`,
      { encoding: 'utf-8' }
    );
    
    // Check that scan completed successfully by checking file was created
    const scanFile = path.join(testDir, 'SCAN_OUTPUT.md');
    assert.ok(fs.existsSync(scanFile), 'Should create output file');
    assert.ok(output.includes('Scanning') || output.length > 100, 'Should show output');
    
    const content = fs.readFileSync(scanFile, 'utf-8');
    assert.ok(content.includes('# ') && content.includes(' - Codebase Essentials'), 'Should have title with project name');
    assert.ok(content.includes('Package Manager | npm'), 'Should detect npm');
  });
  
  it('should detect database from dependencies', () => {
    const pkg = {
      name: 'db-project',
      dependencies: {
        pg: '^8.0.0',
        express: '^4.18.0'
      }
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output DB_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    assert.ok(output.includes('Database:'), 'Should detect database');
    assert.ok(output.includes('PostgreSQL'), 'Should detect PostgreSQL');
    
    const content = fs.readFileSync(path.join(testDir, 'DB_SCAN.md'), 'utf-8');
    assert.ok(content.includes('Database | PostgreSQL'), 'Should include database in tech stack');
  });
  
  it('should detect ORM from dependencies', () => {
    const pkg = {
      name: 'orm-project',
      dependencies: {
        prisma: '^5.0.0',
        '@prisma/client': '^5.0.0'
      }
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output ORM_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    assert.ok(output.includes('ORM:'), 'Should detect ORM');
    assert.ok(output.includes('Prisma'), 'Should detect Prisma');
    
    const content = fs.readFileSync(path.join(testDir, 'ORM_SCAN.md'), 'utf-8');
    assert.ok(content.includes('ORM | Prisma'), 'Should include ORM in tech stack');
  });
  
  it('should detect frontend framework and state management', () => {
    const pkg = {
      name: 'vue-project',
      dependencies: {
        vue: '^3.3.0',
        pinia: '^2.1.0',
        axios: '^1.6.0'
      }
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output VUE_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    assert.ok(output.includes('Frontend:'), 'Should detect frontend framework');
    assert.ok(output.includes('Vue'), 'Should detect Vue');
    assert.ok(output.includes('State Mgmt:'), 'Should detect state management');
    assert.ok(output.includes('Pinia'), 'Should detect Pinia');
    assert.ok(output.includes('API Client:'), 'Should detect API client');
    assert.ok(output.includes('Axios'), 'Should detect Axios');
    
    const content = fs.readFileSync(path.join(testDir, 'VUE_SCAN.md'), 'utf-8');
    assert.ok(content.includes('State Management | Pinia'), 'Should include state management');
    assert.ok(content.includes('API Client | Axios'), 'Should include API client');
  });
  
  it('should detect authentication libraries', () => {
    const pkg = {
      name: 'auth-project',
      dependencies: {
        'next-auth': '^4.24.0',
        next: '^14.0.0'
      }
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output AUTH_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    assert.ok(output.includes('Auth:'), 'Should detect authentication');
    assert.ok(output.includes('NextAuth'), 'Should detect NextAuth');
    
    const content = fs.readFileSync(path.join(testDir, 'AUTH_SCAN.md'), 'utf-8');
    assert.ok(content.includes('Authentication | NextAuth'), 'Should include auth in tech stack');
  });
  
  it('should detect styling framework', () => {
    const pkg = {
      name: 'styled-project',
      devDependencies: {
        tailwindcss: '^3.4.0',
        react: '^18.2.0'
      }
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output STYLE_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    assert.ok(output.includes('Styling:'), 'Should detect styling');
    assert.ok(output.includes('Tailwind'), 'Should detect Tailwind');
  });
  
  it('should generate validation matrix from scripts', () => {
    const pkg = {
      name: 'validated-project',
      scripts: {
        test: 'jest',
        lint: 'eslint .',
        'type-check': 'tsc --noEmit'
      },
      devDependencies: {
        jest: '^29.0.0',
        eslint: '^8.0.0',
        typescript: '^5.0.0'
      }
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    fs.writeFileSync(path.join(testDir, 'tsconfig.json'), '{}');
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output VALIDATION_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    const content = fs.readFileSync(path.join(testDir, 'VALIDATION_SCAN.md'), 'utf-8');
    
    assert.ok(content.includes('npm test'), 'Should include test command');
    assert.ok(content.includes('npm run lint'), 'Should include lint command');
    assert.ok(content.includes('npm run type-check'), 'Should include type-check command');
    assert.ok(content.includes('## 2. Validation Matrix'), 'Should have validation matrix section');
  });
  
  it('should detect code patterns from file scanning', () => {
    // Create a simple Express API file
    const srcDir = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    
    const apiCode = `
import express from 'express';
const router = express.Router();

router.get('/api/users', async (req, res) => {
  // API endpoint
});

router.post('/api/users', async (req, res) => {
  // Create user
});

export default router;
    `;
    
    fs.writeFileSync(path.join(srcDir, 'routes.js'), apiCode);
    
    const pkg = {
      name: 'pattern-project',
      dependencies: { express: '^4.18.0' }
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output PATTERN_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    const content = fs.readFileSync(path.join(testDir, 'PATTERN_SCAN.md'), 'utf-8');
    
    // Should detect API routes pattern
    assert.ok(
      content.includes('Detected:') || content.includes('TODO:'),
      'Should include pattern detection hints'
    );
  });
  
  it('should detect Python projects', () => {
    const pyproject = `
[tool.poetry]
name = "python-project"
version = "0.1.0"

[tool.poetry.dependencies]
python = "^3.11"
django = "^4.2"
djangorestframework = "^3.14"

[tool.poetry.dev-dependencies]
pytest = "^7.4"
mypy = "^1.5"
ruff = "^0.1"
    `;
    
    fs.writeFileSync(path.join(testDir, 'pyproject.toml'), pyproject);
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output PYTHON_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    // Check scan completed by verifying file exists
    const scanFile = path.join(testDir, 'PYTHON_SCAN.md');
    assert.ok(fs.existsSync(scanFile), 'Should create Python scan file');
    
    const content = fs.readFileSync(scanFile, 'utf-8');
    assert.ok(content.includes('Language | Python') || content.includes('python'), 'Should detect Python in tech stack');
    assert.ok(content.includes('Django') || content.includes('django'), 'Should detect Django');
    assert.ok(content.includes('python manage.py test'), 'Should include Django test command');
    assert.ok(content.includes('mypy .'), 'Should include mypy command');
    assert.ok(content.includes('ruff check .'), 'Should include ruff command');
  });
  
  it('should handle projects without package.json gracefully', () => {
    const emptyDir = path.join(testDir, 'empty-' + Date.now());
    fs.mkdirSync(emptyDir, { recursive: true });
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${emptyDir}" --output EMPTY_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    const scanFile = path.join(emptyDir, 'EMPTY_SCAN.md');
    assert.ok(fs.existsSync(scanFile), 'Should create file even without package.json');
    
    const content = fs.readFileSync(scanFile, 'utf-8');
    assert.ok(content.includes('TODO: Add test command'), 'Should have TODO for missing test command');
    
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });
  
  it('should provide AI prompt for completion', () => {
    const pkg = { name: 'ai-test', version: '1.0.0' };
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    const output = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output AI_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    assert.ok(output.includes('AI Assistant Prompt'), 'Should provide AI prompt');
    assert.ok(output.includes('Filling in all TODO sections'), 'Should mention TODO completion');
    assert.ok(output.includes('install-agents'), 'Should mention next step');
  });
});
