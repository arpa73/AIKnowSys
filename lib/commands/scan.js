import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { createLogger } from '../logger.js';
import { displayAIPrompt } from '../utils.js';

export async function scan(options) {
  const targetDir = path.resolve(options.dir);
  const outputFile = options.output;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.blank();
  log.header('Scanning Codebase', '🔍');
  log.blank();
  
  const projectName = path.basename(targetDir);
  log.cyan(`📁 Project: ${projectName}`);
  log.blank();
  
  const spinner = silent ? null : ora('Detecting project configuration...').start();
  
  const findings = {
    projectName,
    frontendFramework: '',
    backendFramework: '',
    language: '',
    buildTool: '',
    testFramework: '',
    packageManager: '',
    database: '',
    orm: '',
    stateManagement: '',
    apiClient: '',
    authentication: '',
    styling: '',
    testCommands: [],
    lintCommands: [],
    typeCheckCommands: [],
    hasOpenSpec: false,
    openSpecVersion: '',
    // Pattern hints from code analysis
    patterns: {
      hasApiRoutes: false,
      hasAuthMiddleware: false,
      hasErrorHandling: false,
      hasValidation: false
    }
  };
  
  try {
    // Detect package.json (Node.js projects)
    const packageJsonPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      findings.packageManager = 'npm';
      
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      // Detect frontend framework
      if (deps.vue) findings.frontendFramework = `Vue ${deps.vue}`;
      else if (deps.react) findings.frontendFramework = `React ${deps.react}`;
      else if (deps['@angular/core']) findings.frontendFramework = 'Angular';
      else if (deps.svelte) findings.frontendFramework = 'Svelte';
      
      // Detect build tool
      if (deps.vite) findings.buildTool = 'Vite';
      else if (deps.webpack) findings.buildTool = 'Webpack';
      else if (deps.next) findings.buildTool = 'Next.js';
      
      // Detect test framework
      if (deps.vitest) {
        findings.testFramework = 'Vitest';
        if (pkg.scripts?.test) findings.testCommands.push('npm test');
        else if (pkg.scripts?.['test:run']) findings.testCommands.push('npm run test:run');
      } else if (deps.jest) {
        findings.testFramework = 'Jest';
        findings.testCommands.push('npm test');
      }
      
      // Detect type checking
      if (pkg.scripts?.['type-check']) {
        findings.typeCheckCommands.push('npm run type-check');
      }
      
      // Detect linting
      if (pkg.scripts?.lint) {
        findings.lintCommands.push('npm run lint');
      }
      
      // Detect database
      if (deps.pg || deps.postgres) findings.database = 'PostgreSQL';
      else if (deps.mysql || deps.mysql2) findings.database = 'MySQL';
      else if (deps.mongodb || deps.mongoose) findings.database = 'MongoDB';
      else if (deps.sqlite3 || deps['better-sqlite3']) findings.database = 'SQLite';
      
      // Detect ORM
      if (deps.prisma) findings.orm = 'Prisma';
      else if (deps.drizzle || deps['drizzle-orm']) findings.orm = 'Drizzle ORM';
      else if (deps.typeorm) findings.orm = 'TypeORM';
      else if (deps.sequelize) findings.orm = 'Sequelize';
      else if (deps.mongoose) findings.orm = 'Mongoose';
      
      // Detect state management (frontend)
      if (deps.pinia) findings.stateManagement = 'Pinia';
      else if (deps['@reduxjs/toolkit'] || deps.redux) findings.stateManagement = 'Redux Toolkit';
      else if (deps.zustand) findings.stateManagement = 'Zustand';
      else if (deps.mobx) findings.stateManagement = 'MobX';
      else if (deps.jotai) findings.stateManagement = 'Jotai';
      
      // Detect API client
      if (deps.axios) findings.apiClient = 'Axios';
      else if (deps['@tanstack/react-query'] || deps['@tanstack/vue-query']) {
        findings.apiClient = 'TanStack Query (React Query)';
      }
      
      // Detect authentication
      if (deps['next-auth']) findings.authentication = 'NextAuth.js';
      else if (deps.passport) findings.authentication = 'Passport.js';
      else if (deps['@auth0/auth0-react'] || deps['@auth0/auth0-vue']) findings.authentication = 'Auth0';
      else if (deps.supabase || deps['@supabase/supabase-js']) findings.authentication = 'Supabase Auth';
      else if (deps.firebase) findings.authentication = 'Firebase Auth';
      
      // Detect styling
      if (deps.tailwindcss) findings.styling = 'Tailwind CSS';
      else if (deps['@mui/material']) findings.styling = 'Material UI';
      else if (deps['styled-components']) findings.styling = 'Styled Components';
      else if (deps['@emotion/react']) findings.styling = 'Emotion';
      else if (deps.sass || deps.scss) findings.styling = 'Sass/SCSS';
    }
    
    // Detect TypeScript
    if (fs.existsSync(path.join(targetDir, 'tsconfig.json'))) {
      findings.language = 'TypeScript';
      if (findings.typeCheckCommands.length === 0) {
        findings.typeCheckCommands.push('npx tsc --noEmit');
      }
    }
    
    // Detect Python
    const pyprojectPath = path.join(targetDir, 'pyproject.toml');
    const requirementsPath = path.join(targetDir, 'requirements.txt');
    
    if (fs.existsSync(pyprojectPath) || fs.existsSync(requirementsPath)) {
      findings.language = findings.language || 'Python';
      findings.packageManager = 'pip';
      
      let pyContent = '';
      if (fs.existsSync(pyprojectPath)) {
        pyContent = fs.readFileSync(pyprojectPath, 'utf-8');
      }
      if (fs.existsSync(requirementsPath)) {
        pyContent += fs.readFileSync(requirementsPath, 'utf-8');
      }
      
      if (pyContent.includes('django')) {
        findings.backendFramework = 'Django';
        findings.testCommands.push('python manage.py test');
      } else if (pyContent.includes('fastapi')) {
        findings.backendFramework = 'FastAPI';
        findings.testCommands.push('pytest');
      } else if (pyContent.includes('flask')) {
        findings.backendFramework = 'Flask';
        findings.testCommands.push('pytest');
      }
      
      if (pyContent.includes('pytest')) {
        findings.testFramework = 'pytest';
        if (!findings.testCommands.includes('pytest')) {
          findings.testCommands.push('pytest');
        }
      }
      
      if (pyContent.includes('mypy')) {
        findings.typeCheckCommands.push('mypy .');
      }
      
      if (pyContent.includes('ruff')) {
        findings.lintCommands.push('ruff check .');
      } else if (pyContent.includes('flake8')) {
        findings.lintCommands.push('flake8');
      }
    }
    
    // Detect Rust
    if (fs.existsSync(path.join(targetDir, 'Cargo.toml'))) {
      findings.language = 'Rust';
      findings.packageManager = 'cargo';
      findings.testCommands.push('cargo test');
      findings.typeCheckCommands.push('cargo check');
      findings.lintCommands.push('cargo clippy');
    }
    
    // Detect Go
    if (fs.existsSync(path.join(targetDir, 'go.mod'))) {
      findings.language = 'Go';
      findings.packageManager = 'go mod';
      findings.testCommands.push('go test ./...');
      findings.lintCommands.push('golangci-lint run');
    }
    
    // Detect Docker
    if (fs.existsSync(path.join(targetDir, 'docker-compose.yml')) || 
        fs.existsSync(path.join(targetDir, 'docker-compose.yaml'))) {
      findings.containerPlatform = 'Docker Compose';
    } else if (fs.existsSync(path.join(targetDir, 'Dockerfile'))) {
      findings.containerPlatform = 'Docker';
    }
    
    // Detect OpenSpec
    const openSpecDir = path.join(targetDir, 'openspec');
    if (fs.existsSync(openSpecDir) && fs.existsSync(path.join(openSpecDir, 'project.md'))) {
      findings.hasOpenSpec = true;
      // Try to detect version from package.json or openspec config
      const openSpecPkgPath = path.join(targetDir, 'node_modules', 'openspec', 'package.json');
      if (fs.existsSync(openSpecPkgPath)) {
        try {
          const openSpecPkg = JSON.parse(fs.readFileSync(openSpecPkgPath, 'utf-8'));
          findings.openSpecVersion = openSpecPkg.version || '';
        } catch (_e) {
          // Ignore version detection errors
        }
      }
    }
    
    // Scan for common pattern directories
    const commonDirs = ['src', 'lib', 'server', 'backend', 'api', 'app'];
    let filesScanned = 0;
    for (const dir of commonDirs) {
      const dirPath = path.join(targetDir, dir);
      if (fs.existsSync(dirPath)) {
        filesScanned = scanForPatterns(dirPath, findings, spinner, filesScanned);
      }
    }
    
    if (spinner) spinner.succeed('Project analysis complete');
    
    // Display findings
    log.blank();
    log.section('Detected Configuration', '📊');
    log.blank();
    if (findings.language) log.dim(`   Language:       ${findings.language}`);
    if (findings.frontendFramework) log.dim(`   Frontend:       ${findings.frontendFramework}`);
    if (findings.backendFramework) log.dim(`   Backend:        ${findings.backendFramework}`);
    if (findings.database) log.dim(`   Database:       ${findings.database}`);
    if (findings.orm) log.dim(`   ORM:            ${findings.orm}`);
    if (findings.stateManagement) log.dim(`   State Mgmt:     ${findings.stateManagement}`);
    if (findings.apiClient) log.dim(`   API Client:     ${findings.apiClient}`);
    if (findings.authentication) log.dim(`   Auth:           ${findings.authentication}`);
    if (findings.styling) log.dim(`   Styling:        ${findings.styling}`);
    if (findings.buildTool) log.dim(`   Build Tool:     ${findings.buildTool}`);
    if (findings.testFramework) log.dim(`   Test Runner:    ${findings.testFramework}`);
    if (findings.packageManager) log.dim(`   Package Mgr:    ${findings.packageManager}`);
    if (findings.hasOpenSpec) {
      const version = findings.openSpecVersion ? ` (v${findings.openSpecVersion})` : '';
      log.dim(`   OpenSpec:       Detected${version}`);
    }
    log.blank();
    
    // Generate draft ESSENTIALS
    const draftSpinner = silent ? null : ora('Generating draft CODEBASE_ESSENTIALS...').start();
    
    const draft = generateEssentialsDraft(findings);
    // Support both relative and absolute output paths
    const outputPath = path.isAbsolute(outputFile) ? outputFile : path.join(targetDir, outputFile);
    fs.writeFileSync(outputPath, draft);
    
    if (draftSpinner) draftSpinner.succeed(`Generated ${outputFile}`);
    
    log.blank();
    log.log('\x1b[33m\x1b[1m📝 Next Steps:\x1b[0m');
    log.white(`   1. Review and complete TODO sections in ${outputFile}`);
    log.white('   2. Rename to CODEBASE_ESSENTIALS.md when ready');
    log.white('   3. Run: ');
    log.cyan('      npx aiknowsys install-agents');
    log.blank();
    
    displayAIPrompt(log, [
      '"I just ran aiknowsys scan on my project. Please help me complete',
      `${outputFile} by:`,
      '1. Filling in all TODO sections with accurate project details',
      '2. Adding missing validation commands (tests, linting, type-checking)',
      '3. Documenting core patterns you find in my codebase',
      '4. Identifying architecture decisions and rationale',
      '5. Once complete, rename it to CODEBASE_ESSENTIALS.md',
      'Then run: npx aiknowsys install-agents"'
    ]);
    
    return findings;
    
  } catch (error) {
    if (spinner) spinner.fail('Scan failed');
    log.error(error.message);
    throw error;
  }
}

function scanForPatterns(dir, findings, spinner = null, filesScanned = 0, depth = 0) {
  // Limit recursion depth to avoid performance issues
  if (depth > 2) return filesScanned;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules and other common excludes
      if (entry.name === 'node_modules' || entry.name === '.git' || 
          entry.name === 'dist' || entry.name === 'build') {
        continue;
      }
      
      if (entry.isDirectory()) {
        // Check for common pattern directories
        if (entry.name === 'routes' || entry.name === 'api') findings.patterns.hasApiRoutes = true;
        if (entry.name === 'middleware' || entry.name === 'auth') findings.patterns.hasAuthMiddleware = true;
        
        // Recurse into subdirectories
        filesScanned = scanForPatterns(fullPath, findings, spinner, filesScanned, depth + 1);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        filesScanned++;
        
        // Update spinner text every 50 files for better performance
        if (spinner && filesScanned % 50 === 0) {
          spinner.text = `Analyzing codebase... (${filesScanned} files scanned)`;
        }
        
        // Quick scan of file content for patterns
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // Look for common patterns
          if (/router\.|app\.(get|post|put|delete|patch)/.test(content)) {
            findings.patterns.hasApiRoutes = true;
          }
          if (/authenticate|requireAuth|isAuth|jwt\.verify/.test(content)) {
            findings.patterns.hasAuthMiddleware = true;
          }
          if (/try.*catch|\.catch\(|throw new|error handler/i.test(content)) {
            findings.patterns.hasErrorHandling = true;
          }
          if (/validate|joi\.|yup\.|zod\.|validator\./.test(content)) {
            findings.patterns.hasValidation = true;
          }
        } catch (_e) {
          // Skip files we can't read
        }
      }
    }
  } catch (_e) {
    // Skip directories we can't read
  }
  
  return filesScanned;
}

function generateEssentialsDraft(findings) {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  let techStack = '';
  if (findings.frontendFramework) {
    techStack += `| Frontend | ${findings.frontendFramework} |\n`;
  }
  if (findings.backendFramework) {
    techStack += `| Backend | ${findings.backendFramework} |\n`;
  }
  if (findings.language) {
    techStack += `| Language | ${findings.language} |\n`;
  }
  if (findings.database) {
    techStack += `| Database | ${findings.database} |\n`;
  }
  if (findings.orm) {
    techStack += `| ORM | ${findings.orm} |\n`;
  }
  if (findings.stateManagement) {
    techStack += `| State Management | ${findings.stateManagement} |\n`;
  }
  if (findings.apiClient) {
    techStack += `| API Client | ${findings.apiClient} |\n`;
  }
  if (findings.authentication) {
    techStack += `| Authentication | ${findings.authentication} |\n`;
  }
  if (findings.styling) {
    techStack += `| Styling | ${findings.styling} |\n`;
  }
  if (findings.buildTool) {
    techStack += `| Build Tool | ${findings.buildTool} |\n`;
  }
  if (findings.testFramework) {
    techStack += `| Testing | ${findings.testFramework} |\n`;
  }
  if (findings.packageManager) {
    techStack += `| Package Manager | ${findings.packageManager} |\n`;
  }
  
  let validationMatrix = '';
  for (const cmd of findings.testCommands) {
    validationMatrix += `| \`${cmd}\` | Tests | All tests must pass |\n`;
  }
  for (const cmd of findings.typeCheckCommands) {
    validationMatrix += `| \`${cmd}\` | Type Check | No type errors |\n`;
  }
  for (const cmd of findings.lintCommands) {
    validationMatrix += `| \`${cmd}\` | Lint | No lint errors |\n`;
  }
  
  if (!validationMatrix) {
    validationMatrix = '| `TODO: Add test command` | Tests | All tests must pass |\n';
  }
  
  return `# ${findings.projectName} - Codebase Essentials

> **Last Updated:** ${date}  
> **Status:** DRAFT - Complete TODO sections before using

---

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
${techStack || '| TODO | Add your stack |\n'}

---

## 2. Validation Matrix

| Command | Purpose | Expected |
|---------|---------|----------|
${validationMatrix}

---

## 3. Core Patterns

<!-- Document how your project handles common concerns -->

### API Calls
\`\`\`${findings.apiClient ? `
Detected: ${findings.apiClient}
TODO: Document standard usage pattern
Example: How do you create API instances? Base URL configuration? Error handling?
` : `
TODO: How do you make API calls? What's the standard pattern?
Example: useApi() composable, axios instance, fetch wrapper, etc.
`}\`\`\`

### State Management
\`\`\`${findings.stateManagement ? `
Detected: ${findings.stateManagement}
TODO: Document store structure and usage
Example: How are stores organized? Naming conventions? Actions vs mutations?
` : `
TODO: How is state managed?
Example: Pinia stores, Redux, Context API, etc.
`}\`\`\`

### Database & ORM${findings.database || findings.orm ? `
\`\`\`
Detected: ${[findings.database, findings.orm].filter(Boolean).join(' + ')}
TODO: Document database patterns
Example: Connection setup, query patterns, migrations, seeding
\`\`\`` : ''}

### Authentication${findings.authentication ? `
\`\`\`
Detected: ${findings.authentication}${findings.patterns.hasAuthMiddleware ? ' (middleware detected)' : ''}
TODO: Document auth flow
Example: Token storage, protected routes, refresh tokens, logout
\`\`\`` : `
\`\`\`
TODO: How does auth work?
Example: JWT tokens, session cookies, OAuth flow, etc.
\`\`\``}

### Error Handling${findings.patterns.hasErrorHandling ? `
\`\`\`
Detected: Error handling patterns found in codebase
TODO: Document standard error handling
Example: Global error boundary? Logging service? User notifications?
\`\`\`` : `
\`\`\`
TODO: Standard error handling pattern
Example: Global error boundary, toast notifications, error logging, etc.
\`\`\``}

### Validation${findings.patterns.hasValidation ? `
\`\`\`
Detected: Validation patterns found in codebase
TODO: Document validation approach
Example: Schema validation library? Client-side vs server-side? Error messages?
\`\`\`` : ''}

---

## 4. Critical Invariants

<!-- TODO: Rules that must NEVER be violated -->

1. **TODO:** Add your first invariant
   - Example: "All API endpoints must be authenticated except /public/*"
   
2. **TODO:** Add another invariant
   - Example: "Database migrations must be backwards-compatible"

3. **TODO:** Add testing requirement
   - Example: "All new features must have tests before merging"

---

## 5. Common Gotchas

<!-- TODO: Things that trip up new contributors -->

1. **TODO:** First common gotcha
   - Example: "Run \`npm install\` after pulling - we update deps frequently"

2. **TODO:** Second common gotcha
   - Example: "The dev database resets on restart - use \`npm run seed\` to restore data"

---

## 6. Quick Reference

### Development Setup
\`\`\`bash
# TODO: Add your setup commands
# Example:
# npm install
# cp .env.example .env
# npm run dev
\`\`\`

### Running Tests
\`\`\`bash
${findings.testCommands.join('\n') || '# TODO: Add test commands'}
\`\`\`

---

## 7. Architecture Decisions

<!-- TODO: Key decisions and their rationale -->

### Why ${findings.frontendFramework || findings.backendFramework || 'this stack'}?
TODO: Explain why you chose this technology

### Project Structure
TODO: Brief overview of folder organization

---

## 8. Change Management (OpenSpec)

${findings.hasOpenSpec ? `**✅ OpenSpec Detected** - This project uses spec-driven development.

**Commands:**
\`\`\`bash
openspec list              # List active changes
openspec list --specs      # List specifications
openspec validate --strict # Validate all specs
\`\`\`

**Workflow:**
1. Create proposal: \`openspec create add-feature-name\`
2. Fill out \`proposal.md\` and \`tasks.md\`
3. Validate: \`openspec validate add-feature-name --strict\`
4. Get approval, then implement
5. Archive after deployment

**See:** \`openspec/AGENTS.md\` for full workflow.
` : `**Recommended:** Consider using OpenSpec for spec-driven development.

OpenSpec helps manage:
- Breaking changes and API contracts
- Architecture decisions with proposals
- Feature planning with structured tasks
- Change tracking and archiving

**Setup:**
\`\`\`bash
npm install -g openspec    # Install CLI
openspec init              # Initialize in project
\`\`\`

**When to use OpenSpec proposals:**
- New features or capabilities
- Breaking changes (API, schema)
- Architecture changes
- Security-related changes

**Skip proposals for:**
- Bug fixes, typos, formatting
- Non-breaking dependency updates
- Configuration changes

**Learn more:** https://github.com/your-org/openspec
`}

---

*This file is the single source of truth for AI assistants working on this project.*
*Keep it updated and concise.*
`;
}
