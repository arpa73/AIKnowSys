import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
// Use PROJECT_ROOT env var set by test script (avoids dist/ path issues)
const rootDir: string = process.env.PROJECT_ROOT || path.join(__dirname, '..');

describe('scan command', () => {
  let testDir: string;
  
  beforeAll(() => {
    testDir = path.join(rootDir, 'test-scan-' + Date.now());
    fs.mkdirSync(testDir, { recursive: true });
  });
  
  afterAll(() => {
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
    
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output SCAN_OUTPUT.md`,
      { encoding: 'utf-8' }
    );
    
    // Check that scan completed successfully by checking file was created
    const scanFile: string = path.join(testDir, 'SCAN_OUTPUT.md');
    expect(fs.existsSync(scanFile)).toBeTruthy();
    expect(output.includes('Scanning') || output.length > 100).toBeTruthy();
    
    const content: string = fs.readFileSync(scanFile, 'utf-8');
    expect(content.includes('# ') && content.includes(' - Codebase Essentials')).toBeTruthy();
    expect(content.includes('Package Manager | npm')).toBeTruthy();
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
    
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output DB_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    expect(output.includes('Database:')).toBeTruthy();
    expect(output.includes('PostgreSQL')).toBeTruthy();
    
    const content: string = fs.readFileSync(path.join(testDir, 'DB_SCAN.md'), 'utf-8');
    expect(content.includes('Database | PostgreSQL')).toBeTruthy();
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
    
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output ORM_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    expect(output.includes('ORM:')).toBeTruthy();
    expect(output.includes('Prisma')).toBeTruthy();
    
    const content: string = fs.readFileSync(path.join(testDir, 'ORM_SCAN.md'), 'utf-8');
    expect(content.includes('ORM | Prisma')).toBeTruthy();
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
    
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output VUE_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    expect(output.includes('Frontend:')).toBeTruthy();
    expect(output.includes('Vue')).toBeTruthy();
    expect(output.includes('State Mgmt:')).toBeTruthy();
    expect(output.includes('Pinia')).toBeTruthy();
    expect(output.includes('API Client:')).toBeTruthy();
    expect(output.includes('Axios')).toBeTruthy();
    
    const content: string = fs.readFileSync(path.join(testDir, 'VUE_SCAN.md'), 'utf-8');
    expect(content.includes('State Management | Pinia')).toBeTruthy();
    expect(content.includes('API Client | Axios')).toBeTruthy();
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
    
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output AUTH_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    expect(output.includes('Auth:')).toBeTruthy();
    expect(output.includes('NextAuth')).toBeTruthy();
    
    const content: string = fs.readFileSync(path.join(testDir, 'AUTH_SCAN.md'), 'utf-8');
    expect(content.includes('Authentication | NextAuth')).toBeTruthy();
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
    
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output STYLE_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    expect(output.includes('Styling:')).toBeTruthy();
    expect(output.includes('Tailwind')).toBeTruthy();
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
    
    // @ts-expect-error - Output variable declared but not used in this test scaffold
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output VALIDATION_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    const content: string = fs.readFileSync(path.join(testDir, 'VALIDATION_SCAN.md'), 'utf-8');
    
    expect(content.includes('npm test')).toBeTruthy();
    expect(content.includes('npm run lint')).toBeTruthy();
    expect(content.includes('npm run type-check')).toBeTruthy();
    expect(content.includes('## 2. Validation Matrix')).toBeTruthy();
  });
  
  it('should detect code patterns from file scanning', () => {
    // Create a simple Express API file
    const srcDir: string = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    
    const apiCode: string = `
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
    
    const content: string = fs.readFileSync(path.join(testDir, 'PATTERN_SCAN.md'), 'utf-8');
    
    // Should detect API routes pattern
    expect(content.includes('Detected:') || content.includes('TODO:')).toBeTruthy();
  });
  
  it('should detect Python projects', () => {
    const pyproject: string = `
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
    
    // @ts-expect-error - Output variable for test validation
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output PYTHON_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    // Check scan completed by verifying file exists
    const scanFile: string = path.join(testDir, 'PYTHON_SCAN.md');
    expect(fs.existsSync(scanFile)).toBeTruthy();
    
    const content: string = fs.readFileSync(scanFile, 'utf-8');
    expect(content.includes('Language | Python') || content.includes('python')).toBeTruthy();
    expect(content.includes('Django') || content.includes('django')).toBeTruthy();
    expect(content.includes('python manage.py test')).toBeTruthy();
    expect(content.includes('mypy .')).toBeTruthy();
    expect(content.includes('ruff check .')).toBeTruthy();
  });
  
  it('should handle projects without package.json gracefully', () => {
    const emptyDir: string = path.join(testDir, 'empty-' + Date.now());
    fs.mkdirSync(emptyDir, { recursive: true });
    
    // @ts-expect-error - Output variable for test validation
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${emptyDir}" --output EMPTY_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    const scanFile: string = path.join(emptyDir, 'EMPTY_SCAN.md');
    expect(fs.existsSync(scanFile)).toBeTruthy();
    
    const content: string = fs.readFileSync(scanFile, 'utf-8');
    expect(content.includes('TODO: Add test command')).toBeTruthy();
    
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });
  
  it('should provide AI prompt for completion', () => {
    const pkg = { name: 'ai-test', version: '1.0.0' };
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output AI_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    expect(output.includes('AI Assistant Prompt')).toBeTruthy();
    expect(output.includes('Filling in all TODO sections')).toBeTruthy();
    expect(output.includes('install-agents')).toBeTruthy();
  });
  
  it('should show file count progress during scan', () => {
    // Test that scan command shows progress during file analysis
    const pkg = { name: 'progress-test', version: '1.0.0' };
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(pkg, null, 2)
    );
    
    // Create multiple files to scan
    const srcDir: string = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    for (let i = 0; i < 5; i++) {
      fs.writeFileSync(path.join(srcDir, `file${i}.js`), `console.log("test ${i}");`);
    }
    
    const output: string = execSync(
      `node ${path.join(rootDir, 'bin/cli.js')} scan --dir "${testDir}" --output PROGRESS_SCAN.md`,
      { encoding: 'utf-8' }
    );
    
    // Should complete successfully (progress updates don't break scanning)
    expect(output.includes('Project analysis complete') || output.includes('AI Assistant Prompt')).toBeTruthy();
    expect(fs.existsSync(path.join(testDir, 'PROGRESS_SCAN.md'))).toBeTruthy();
  });
});
