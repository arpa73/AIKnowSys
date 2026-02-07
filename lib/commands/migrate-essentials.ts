import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createLogger } from '../logger.js';

export interface MigrateEssentialsOptions {
  dir?: string;
  _silent?: boolean;
  dryRun?: boolean;
}

interface MigrateEssentialsResult {
  success: boolean;
  migrated?: boolean;
  alreadyMigrated?: boolean;
  backupCreated?: boolean;
  customizationsPreserved?: string[];
}

/**
 * Migrate CODEBASE_ESSENTIALS.md from monolithic to skill-indexed format
 * 
 * Preserves project-specific content while adopting skill-indexed architecture.
 * 
 * @param options - Command options
 * @returns Migration result
 */
export async function migrateEssentials(options: MigrateEssentialsOptions = {}): Promise<MigrateEssentialsResult> {
  const targetDir = resolve(options.dir || process.cwd());
  const silent = options._silent || false;
  const dryRun = options.dryRun || false;
  const log = createLogger(silent);

  const essentialsPath = join(targetDir, 'CODEBASE_ESSENTIALS.md');
  const backupPath = join(targetDir, 'CODEBASE_ESSENTIALS.md.pre-v0.10.backup');

  log.header('Migrate ESSENTIALS to v0.10.0', '🔄');

  try {
    // Check if ESSENTIALS exists
    if (!existsSync(essentialsPath)) {
      log.error('❌ CODEBASE_ESSENTIALS.md not found');
      log.dim('   Run from project root or use --dir flag');
      return { success: false, migrated: false };
    }

    // Read current ESSENTIALS
    const content = readFileSync(essentialsPath, 'utf-8');
    const lineCount = content.split('\n').length;

    // Detect if already migrated (skill-indexed format)
    const isSkillIndexed = content.includes('Skill-Indexed Architecture') ||
                          content.includes('## 5. Skill Index') ||
                          (lineCount < 400 && content.includes('trigger words'));

    if (isSkillIndexed) {
      log.info('✓ Already migrated to skill-indexed format');
      log.dim(`  Current size: ${lineCount} lines`);
      return { success: true, alreadyMigrated: true, migrated: false };
    }

    log.info(`📊 Current ESSENTIALS: ${lineCount} lines`);
    log.dim('   Old format: Monolithic workflows embedded');

    // Parse current content for project-specific sections
    const customizations = extractCustomizations(content);
    
    if (customizations.length > 0) {
      log.info('📝 Found project customizations:');
      customizations.forEach(c => log.dim(`   • ${c}`));
    }

    if (dryRun) {
      log.cyan('🔍 Dry run - no changes made');
      log.info('Would create:');
      log.dim(`   • ${backupPath}`);
      log.dim('   • New skill-indexed ESSENTIALS.md (~327 lines)');
      if (customizations.length > 0) {
        log.dim(`   • Preserve ${customizations.length} customizations`);
      }
      return { 
        success: true, 
        migrated: false, 
        alreadyMigrated: false,
        backupCreated: false,
        customizationsPreserved: customizations 
      };
    }

    // Create backup
    log.info('💾 Creating backup...');
    copyFileSync(essentialsPath, backupPath);
    log.success(`✓ Backup saved: ${backupPath}`);

    // Generate new skill-indexed ESSENTIALS
    log.info('✨ Generating skill-indexed ESSENTIALS...');
    const newContent = generateSkillIndexedTemplate(content, customizations);
    writeFileSync(essentialsPath, newContent, 'utf-8');

    const newLineCount = newContent.split('\n').length;
    const reduction = ((lineCount - newLineCount) / lineCount * 100).toFixed(1);

    log.success('✓ Migration complete!');
    log.info('📊 Results:');
    log.dim(`   • Old size: ${lineCount} lines`);
    log.dim(`   • New size: ${newLineCount} lines`);
    log.dim(`   • Reduction: ${reduction}%`);
    
    if (customizations.length > 0) {
      log.dim(`   • Preserved ${customizations.length} customizations`);
    }

    log.cyan('\n📖 Next steps:');
    log.white('   1. Review new CODEBASE_ESSENTIALS.md');
    log.white('   2. Verify customizations preserved correctly');
    log.white('   3. Update any automation referencing old format');
    log.white(`   4. Backup available at: ${backupPath}`);

    return { 
      success: true, 
      migrated: true, 
      backupCreated: true,
      customizationsPreserved: customizations
    };

  } catch (error) {
    const err = error as Error;
    log.error(`❌ Migration failed: ${err.message}`);
    return { success: false, migrated: false };
  }
}

/**
 * Extract project-specific customizations from old ESSENTIALS
 */
function extractCustomizations(content: string): string[] {
  const customizations: string[] = [];

  // Check for custom technology stack
  if (content.includes('Runtime | ') && !content.includes('Node.js 20+')) {
    customizations.push('Custom technology stack');
  }

  // Check for custom validation commands
  const validationSection = content.match(/## 2\. Validation Matrix[\s\S]*?(?=##|$)/);
  if (validationSection && !validationSection[0].includes('npm test')) {
    customizations.push('Custom validation commands');
  }

  // Check for custom project structure
  if (content.includes('## 3. Project Structure') && 
      !content.includes('aiknowsys/')) {
    customizations.push('Project-specific structure');
  }

  // Check for stack-specific patterns
  if (content.includes('Python') || content.includes('Django') || 
      content.includes('FastAPI') || content.includes('Flask')) {
    customizations.push('Python stack patterns');
  }
  if (content.includes('React') || content.includes('Next.js') || 
      content.includes('Vue')) {
    customizations.push('Frontend framework patterns');
  }
  if (content.includes('Rust') || content.includes('Actix')) {
    customizations.push('Rust stack patterns');
  }

  return customizations;
}

/**
 * Generate skill-indexed ESSENTIALS template
 * Preserves technology stack and validation matrix from old format
 */
function generateSkillIndexedTemplate(oldContent: string, customizations: string[]): string {
  // Extract technology snapshot
  const techMatch = oldContent.match(/## 1\. Technology Snapshot([\s\S]*?)(?=##|$)/);
  const techSection = techMatch ? techMatch[0].trim() : getDefaultTechSection();

  // Extract validation matrix
  const validationMatch = oldContent.match(/## 2\. Validation Matrix([\s\S]*?)(?=##|$)/);
  const validationSection = validationMatch ? validationMatch[0].trim() : getDefaultValidationSection();

  // Extract project structure if custom
  const structureMatch = oldContent.match(/## 3\. Project Structure([\s\S]*?)(?=##|$)/);
  const structureSection = structureMatch ? structureMatch[0].trim() : getDefaultStructureSection();

  // Build new content
  return `# Codebase Essentials

> **Last Updated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  
> **Purpose:** AI-Powered Development Workflow Template  
> **Version:** v0.10.0 (Skill-Indexed Architecture)

⚠️ **MAJOR CHANGE:** ESSENTIALS is now a skill index, not a workflow encyclopedia.  
**Full workflows** are in [\`.github/skills/\`](.github/skills/) (auto-loaded on trigger detection).

${customizations.length > 0 ? `\n**Migrated from v0.9.x** - Preserved customizations: ${customizations.join(', ')}\n` : ''}
---

${techSection}

---

${validationSection}

---

${structureSection}

---

## 4. Critical Invariants (ALWAYS ENFORCED - NOT OPTIONAL)

These 8 rules are MANDATORY. AI agents cannot skip or "think they know" these.

### 1. ES Modules Only
- All **internal** files use \`import\`/\`export\`, never \`require()\`
- package.json has \`"type": "module"\`
- **Exception:** Templates distributed to user projects may use \`.cjs\` for compatibility

### 2. Absolute Paths Required
- Always use \`path.resolve()\` for user-provided paths
- Use \`getPackageDir()\` for template paths

### 3. Graceful Failures
- All commands must handle missing files/directories
- Show helpful error messages, not stack traces

### 4. Template Preservation
- Never modify files in \`templates/\` - they're the source of truth
- User customization happens in generated files

### 5. Template Structure Integrity
- When AI fills CODEBASE_ESSENTIALS.md, NEVER change section headings
- Replace \`{{PLACEHOLDERS}}\` with real values, not generic placeholders
- Preserve template structure exactly (don't rename sections)

### 6. Backwards Compatibility
- Bash scripts in \`scripts/\` must remain functional
- npm CLI is additive, not replacement

### 7. Test-Driven Development (TDD) - MANDATORY
- **For new features:** Write tests BEFORE implementation (RED → GREEN → REFACTOR)
- **For bugfixes:** Write test that reproduces bug FIRST, then fix, then refactor
- Follow RED-GREEN-REFACTOR cycle for both features and bugs
- **Exception:** Configuration-only changes (adding properties to const objects)
- **Full workflow:** [\`.github/skills/tdd-workflow/SKILL.md\`](.github/skills/tdd-workflow/SKILL.md)

### 8. Deliverables Consistency
- Templates (\`templates/\` directory) are **deliverables** distributed to users
- ANY change to core functionality MUST update corresponding templates
- Templates must match non-template equivalents
- Run \`npx aiknowsys validate-deliverables\` before commits/releases
- Pre-commit hook automatically validates when templates/ changed

---

## 5. Skill Index (Auto-Load on Trigger Detection)

**How this works:**
1. AI agent detects trigger words in user request
2. AI reads relevant skill from \`.github/skills/\`
3. AI follows loaded workflow (cannot skip or "think they know")

**Why this prevents mistakes:**
- Critical invariants ALWAYS loaded (above section, not optional)
- Detailed workflows loaded ON-DEMAND (prevents "I thought I knew" failures)
- 60-80% token reduction per session

---

### Development Workflows

#### Testing & Validation
**[tdd-workflow](.github/skills/tdd-workflow/SKILL.md)**
- **Triggers:** "write tests", "TDD", "test first", "failing test", "RED-GREEN-REFACTOR"
- **Summary:** Complete TDD cycle - write failing test FIRST, implement minimal code, refactor
- **Why use:** Prevents "I'll add tests later" - tests drive design
- **Output:** Test file paths, test execution logs

**[validation-troubleshooting](.github/skills/validation-troubleshooting/SKILL.md)**
- **Triggers:** "test fail", "validation error", "build broken", "tests not passing"
- **Summary:** Debug validation failures - common issues, fixes, rollback procedures
- **Why use:** Systematic debugging instead of guessing
- **Output:** Root cause, fix steps, validation commands

#### Code Quality
**[refactoring-workflow](.github/skills/refactoring-workflow/SKILL.md)**
- **Triggers:** "refactor", "clean up", "simplify", "extract function", "reduce duplication"
- **Summary:** Test-driven refactoring - tests pass BEFORE and AFTER each change
- **Why use:** Safe code improvements without breaking functionality
- **Output:** Refactored code paths, test results

**[ai-friendly-documentation](.github/skills/ai-friendly-documentation/SKILL.md)**
- **Triggers:** "write docs", "update README", "changelog", "documentation"
- **Summary:** AI-optimized documentation for RAG systems - self-contained sections, explicit terminology
- **Why use:** Better AI comprehension and retrieval
- **Output:** Documentation files, changelog entries

#### Architecture & Planning
**[feature-implementation](.github/skills/feature-implementation/SKILL.md)**
- **Triggers:** "new feature", "implement", "add capability", "build feature"
- **Summary:** Step-by-step feature planning - when to use OpenSpec, implementation patterns
- **Why use:** Structured approach prevents scope creep
- **Output:** Plan file, implementation steps, OpenSpec proposal (if needed)

**[context-query](.github/skills/context-query/SKILL.md)**
- **Triggers:** "find plan", "query sessions", "search context", "what's the current plan"
- **Summary:** Query CLI commands instead of file searching - O(1) index lookup
- **Why use:** 100x faster than grep_search for >100 items
- **Output:** JSON with structured metadata, file paths

---

### Dependencies & Tools

**[dependency-management](.github/skills/dependency-management/SKILL.md)**
- **Triggers:** "update deps", "upgrade packages", "security fix", "npm update"
- **Summary:** Safe upgrade procedures - security-first, incremental updates, rollback plans
- **Why use:** Prevents breaking changes from surprise dependencies
- **Output:** Updated package.json, test results

**[context7-usage](.github/skills/context7-usage/SKILL.md)**
- **Triggers:** "query framework docs", "Context7", "library documentation"
- **Summary:** Query up-to-date documentation via Context7 MCP server
- **Why use:** Always current docs instead of outdated web search
- **Output:** Framework-specific code examples, API documentation

---

### Skill Management

**[skill-creator](.github/skills/skill-creator/SKILL.md)**
- **Triggers:** "create skill", "new skill", "make this a skill"
- **Summary:** Create new Agent Skills from guides - follows VS Code Agent Skills standard
- **Why use:** Proper skill format and metadata
- **Output:** SKILL.md file, registered in AVAILABLE_SKILLS

**[skill-validation](.github/skills/skill-validation/SKILL.md)**
- **Triggers:** "validate skill", "check skill format"
- **Summary:** Validate skill format and content against standards
- **Why use:** Ensures skill works correctly
- **Output:** Validation report, errors/warnings

**[pattern-sharing](.github/skills/pattern-sharing/SKILL.md)**
- **Triggers:** "share pattern", "team pattern", "collaborate"
- **Summary:** AI-assisted workflow for sharing personal patterns with team
- **Why use:** Detects valuable patterns, checks duplicates
- **Output:** Pattern file in learned/ or personal/

---

## 6. Quick Reference

### Validation Before Claiming "Done"
\`\`\`bash
npm test              # All tests pass
npm run lint          # No errors
npm run build         # Clean compilation
\`\`\`

### Common Patterns

**Logger pattern (all commands):**
\`\`\`typescript
import { createLogger } from '../logger.js';
const log = createLogger(options._silent);
log.header('Title', '🎯');
log.success('Done');
\`\`\`

**TypeScript imports (REQUIRED):**
\`\`\`typescript
import { myFunction } from './file.js';  // ✅ .js extension required
import type { MyType } from './types.js';  // ✅ type-only import
\`\`\`

**Absolute paths (REQUIRED):**
\`\`\`typescript
const targetDir = path.resolve(options.dir || process.cwd());
\`\`\`

---

## 7. Common Gotchas

**ESM \`__dirname\` not available:**
\`\`\`typescript
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
\`\`\`

**Import extensions required:**
\`\`\`typescript
import { fn } from './utils.js';  // ✅ .js extension required
import { fn } from './utils';     // ❌ Won't resolve
\`\`\`

**For detailed solutions:** See [\`.aiknowsys/learned/common-gotchas.md\`](.aiknowsys/learned/common-gotchas.md)

---

## 8. When to Document Where

**Add to CODEBASE_ESSENTIALS.md when:**
- Core architecture decision (technology choice)
- Critical invariant (cannot be violated)
- Project structure change

**Add to .github/skills/ when:**
- Repeatable workflow (refactoring, testing, deployment)
- Multi-step process requiring guidance
- Pattern that prevents common mistakes

**Add to .aiknowsys/learned/ when:**
- Project-specific discovery
- Workaround for library quirk
- Error resolution that might recur

---

**Target:** ESSENTIALS <400 lines (skill-indexed architecture)  
**Full workflows:** [\`.github/skills/\`](.github/skills/) (auto-loaded on trigger detection)
`;
}

function getDefaultTechSection(): string {
  return `## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Test Framework | Vitest |
| Package Manager | npm |`;
}

function getDefaultValidationSection(): string {
  return `## 2. Validation Matrix

| Command | Purpose | Expected |
|---------|---------|----------|
| \`npm test\` | Run unit tests | All tests pass |
| \`npm run lint\` | Lint codebase | No errors or warnings |
| \`npm run build\` | Compile code | Clean build |`;
}

function getDefaultStructureSection(): string {
  return `## 3. Project Structure

\`\`\`
project/
├── lib/              # Source code
├── test/             # Test files
├── .aiknowsys/       # AI knowledge system
└── package.json
\`\`\``;
}
