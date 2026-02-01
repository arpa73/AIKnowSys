# Implementation Plan: ESSENTIALS Validation

**Status:** 📋 PLANNED  
**Created:** 2026-02-01  
**Goal:** Add `--type essentials` to validate user's CODEBASE_ESSENTIALS.md (high UX value)

**Command Name:** `validate` (renamed from `validate-deliverables` before v0.1.0 release)

---

## Overview

**Current Problem:**  
`--type stacks` scans `templates/stacks/` which is only useful to aiknowsys maintainers, not end users. Users generate their ESSENTIALS once and never touch stack templates again.

**Solution:**  
Add `--type essentials` to scan and validate user's actual `CODEBASE_ESSENTIALS.md` file, detecting outdated patterns in their tech stack documentation.

**User Value:**  
"Your Next.js patterns are outdated (using getServerSideProps - deprecated in v13+). Suggestion: Use Server Components or Route Handlers."

**Naming Decision:**  
Rename command from `validate-deliverables` to `validate` (shorter, clearer). No breaking change since v0.1.0 not yet published.

---

## Requirements

**Functional:**
- Scan CODEBASE_ESSENTIALS.md from project root
- Parse "Technology Snapshot" section (Section 1) to detect tech stack
- Validate each technology against current library docs via Context7
- Report outdated patterns with specific suggestions
- Support all existing output formats (text, JSON, markdown)
- Keep `--type stacks` working (internal maintainer use)
- Change default from `skills + stacks` to `skills + essentials`

**Non-Functional:**
- Backward compatible (no breaking changes for users specifying `--type`)
- Same performance characteristics as existing scanning
- Clear error messages if ESSENTIALS not found
- Graceful degradation if ESSENTIALS doesn't follow expected format

---

## Architecture Changes

**Files Modified:**
1. **lib/validate-deliverables.js** (~50 lines added)
   - Keep filename (internal implementation file, not user-facing)
   - Add `scanEssentials()` function
   - Add `parseTechnologySnapshot()` helper
   - Update type handling (`essentials` alongside skills/stacks)
   - Change default from `['skills', 'stacks']` to `['skills', 'essentials']`

2. **test/validate-deliverables.test.js** (~75 lines added)
   - Keep filename (test file matches implementation file)
   - Add 5 new test cases for ESSENTIALS scanning

3. **index.js** (command registration - 3 lines changed)
   - **Rename command:** `validate-deliverables` → `validate` (user-facing)
   - Update `--type` flag description: `skills|stacks|essentials|all`

4. **README.md** (~40 lines added/modified)
   - Update all command examples: `validate-deliverables` → `validate`
   - Add ESSENTIALS validation use case
   - Document `--type stacks` as "internal maintainer use"

5. **package.json** (1 line changed)
   - Bump version: `0.1.0` → `0.2.0` (minor feature addition)

---

## Implementation Steps

### Phase 1: TDD Setup & RED Phase (10 minutes)

**Goal:** Write failing tests that define expected behavior

1. **Add Test: Scan ESSENTIALS file** (test/validate.test.js)
   - **Action:** Create test case for `--type essentials`
   - **Expected:** Returns `essentials` array with single item (ESSENTIALS file)
   - **Dependencies:** None
   - **Risk:** Low
   - **TDD:** RED (test will fail - scanEssentials not implemented)

2. **Add Test: Parse Technology Snapshot**
   - **Action:** Test extracting libraries from Section 1 table
   - **Expected:** Detects "Next.js", "Vue", "TypeScript" from table rows
   - **Dependencies:** Step 1
   - **Risk:** Low
   - **TDD:** RED

3. **Add Test: Validate ESSENTIALS patterns**
   - **Action:** Test Context7 validation of detected technologies
   - **Expected:** Queries Context7 for each library, detects outdated patterns
   - **Dependencies:** Step 2
   - **Risk:** Low
   - **TDD:** RED

4. **Add Test: Default behavior changed**
   - **Action:** Test that calling `validateDeliverables()` without type scans skills + essentials (not stacks)
   - **Expected:** `result.skills` and `result.essentials` exist, `result.stacks` does not
   - **Dependencies:** None
   - **Risk:** Medium (breaking change for default behavior)
   - **TDD:** RED

5. **Add Test: --type stacks still works**
   - **Action:** Test that `--type stacks` continues to function (internal use)
   - **Expected:** Returns `result.stacks` array, no regression
   - **Dependencies:** None
   - **Risk:** Low (backward compatibility validation)
   - **TDD:** RED

**Validation:**
- ✅ 5 new tests written
- ✅ All 5 failing as expected (function not implemented)
- ✅ Test coverage plan complete

---

### Phase 2: GREEN Phase - Core Implementation (15 minutes)

**Goal:** Implement minimal code to make tests pass

6. **Implement scanEssentials() function** (lib/validate.js)
   - **Action:** 
     ```javascript
     async function scanEssentials(projectRoot, options) {
       const essentialsPath = join(projectRoot, 'CODEBASE_ESSENTIALS.md');
       
       try {
         const content = await readFile(essentialsPath, 'utf-8');
         const libraries = parseTechnologySnapshot(content);
         
         return [{
           path: 'CODEBASE_ESSENTIALS.md',
           type: 'essentials',
           libraries,
           status: 'pending', // Will be validated later
           suggestions: []
         }];
       } catch (error) {
         if (options.mockMode) return options.mockData || [];
         throw new Error(`ESSENTIALS not found: ${error.message}`);
       }
     }
     ```
   - **Why:** Scans user's actual documentation file
   - **Dependencies:** None
   - **Risk:** Low
   - **TDD:** GREEN (first 2 tests should pass)

7. **Implement parseTechnologySnapshot() helper**
   - **Action:**
     ```javascript
     function parseTechnologySnapshot(content) {
       // Extract Section 1: Technology Snapshot
       const sectionMatch = content.match(/## 1\. Technology Snapshot([\s\S]*?)(?=##|$)/);
       if (!sectionMatch) return [];
       
       const section = sectionMatch[1];
       const libraries = [];
       
       // Parse table rows: | Component | Technology |
       const rows = section.match(/\|[^\n]+\|[^\n]+\|/g) || [];
       rows.forEach(row => {
         const cols = row.split('|').map(c => c.trim()).filter(Boolean);
         if (cols.length >= 2 && cols[0] !== 'Component') {
           const tech = cols[1];
           // Match against known patterns
           for (const [lib, pattern] of Object.entries(LIBRARY_PATTERNS)) {
             if (pattern.test(tech)) {
               libraries.push(lib);
             }
           }
         }
       });
       
       return [...new Set(libraries)]; // Deduplicate
     }
     ```
   - **Why:** Extracts tech stack from structured markdown table
   - **Dependencies:** Step 6
   - **Risk:** Low
   - **TDD:** GREEN (test 2 passes)

8. **Update validateDeliverables() to handle essentials type**
   - **Action:** Add essentials scanning logic
     ```javascript
     // Around line 70, add:
     if (type === 'essentials' || type === 'all') {
       result.essentials = await scanEssentials(projectRoot, {
         mockMode,
         mockData: options.mockEssentials || [],
         mockFileError,
         library
       });
     }
     
     // Update type filtering (line 87):
     if (type === 'skills') {
       delete result.stacks;
       delete result.essentials;
     } else if (type === 'stacks') {
       delete result.skills;
       delete result.essentials;
     } else if (type === 'essentials') {
       delete result.skills;
       delete result.stacks;
     }
     
     // Update summary calculation (line 134):
     result.summary.total = (result.skills?.length || 0) + 
                            (result.stacks?.length || 0) + 
                            (result.essentials?.length || 0);
     
     // Update allLibraries collection (line 95):
     [...(result.skills || []), ...(result.stacks || []), ...(result.essentials || [])].forEach(...)
     
     // Update validation loop (around line 125):
     if (result.essentials) {
       for (const item of result.essentials) {
         validateItem(item, libraryCache, mockContext7Error);
       }
     }
     ```
   - **Why:** Integrates ESSENTIALS scanning into existing workflow
   - **Dependencies:** Steps 6-7
   - **Risk:** Low
   - **TDD:** GREEN (test 3 passes)

9. **Change default type**
   - **Action:** Update default parameter
     ```javascript
     // Line 41, change:
     type = 'all',  // Keep 'all' as default value
     
     // But update the scanning logic to interpret 'all' differently:
     // Before: 'all' meant skills + stacks
     // After: 'all' means skills + essentials
     
     // Update doc comment (line 28):
     * @param {string} [options.type='all'] - Type to validate (skills|stacks|essentials|all)
     *   Note: 'all' scans skills + essentials (most useful to end users)
     *         Use 'stacks' explicitly for internal aiknowsys development
     ```
   - **Why:** Better default for end users
   - **Dependencies:** Step 8
   - **Risk:** Medium (changes default behavior)
   - **TDD:** GREEN (test 4 passes)

**Validation:**
- ✅ All 66 tests passing (61 existing + 5 new)
- ✅ Linting clean
- ✅ Core functionality working

---

### Phase 3: REFACTOR Phase (10 minutes)

**Goal:** Improve code quality while keeping tests green

10. **Extract common parsing logic (DRY)**
    - **Action:** Create `extractMarkdownSection()` helper
      ```javascript
      function extractMarkdownSection(content, heading) {
        const regex = new RegExp(`${heading}([\\s\\S]*?)(?=##|$)`);
        const match = content.match(regex);
        return match ? match[1] : '';
      }
      ```
    - **Why:** Reusable for future ESSENTIALS parsing needs
    - **Dependencies:** Step 7
    - **Risk:** Low
    - **TDD:** REFACTOR (tests still pass)

11. **Improve error messages**
    - **Action:** Add specific error for missing ESSENTIALS
      ```javascript
      if (!essentialsPath.exists()) {
        return {
          errors: ['CODEBASE_ESSENTIALS.md not found. Run "aiknowsys init" to create it.'],
          essentials: []
        };
      }
      ```
    - **Why:** User-friendly, actionable error messages
    - **Dependencies:** Step 6
    - **Risk:** Low
    - **TDD:** REFACTOR

12. **Update output formatting**
    - **Action:** Distinguish essentials in text output
      ```javascript
      function formatOutput(result, format) {
        // Add ESSENTIALS section to text format
        if (result.essentials && format === 'text') {
          output += '\n📄 ESSENTIALS Analysis:\n';
          output += `  Total libraries: ${result.essentials[0]?.libraries.length || 0}\n`;
          // ... format outdated patterns
        }
      }
      ```
    - **Why:** Clear visual distinction in output
    - **Dependencies:** Step 8
    - **Risk:** Low
    - **TDD:** REFACTOR

**Validation:**
- ✅ All 66 tests still passing
- ✅ Code quality improved (DRY, clear errors)
- ✅ Linting clean

---

### Phase 4: CLI Integration & Documentation (10 minutes)

**Goal:** Wire up command and update docs

13. **Update CLI flag description** (index.js)
    - **Action:** Rename command and modify `--type` flag
      ```javascript
      // Rename command registration:
      {
        name: 'validate',  // WAS: 'validate'
        description: 'Validate skills, stacks, and documentation against current library docs',
        flags: [
          {
            name: '--type <type>',
            description: 'Type to validate (skills|stacks|essentials|all)',
            // ... rest of flag config
          }
        ]
      }
      ```
    - **Why:** Shorter, clearer command name
    - **Dependencies:** None
    - **Risk:** Low (no users exist yet)

14. **Update README.md usage examples**
    - **Action:** Rename command throughout, add ESSENTIALS examples
      ```markdown
      ### Validate Your Documentation
      
      ```bash
      # Validate your CODEBASE_ESSENTIALS.md tech stack
      npx aiknowsys validate --type essentials
      
      # Validate your custom skills
      npx aiknowsys validate --type skills
      
      # Validate both (recommended for end users)
      npx aiknowsys validate
      
      # Validate stack templates (for aiknowsys maintainers only)
      npx aiknowsys validate --type stacks
      ```
      ```
    - **Why:** Clear guidance + shorter command name
    - **Dependencies:** Step 13
    - **Risk:** Low

15. **Add ESSENTIALS use case section**
    - **Action:** Document in README Use Cases section
      ```markdown
      #### Monthly Documentation Hygiene
      
      Validate your CODEBASE_ESSENTIALS.md stays current:
      
      ```bash
      # Check if your tech stack docs are outdated
      npx aiknowsys validate --type essentials --format markdown > docs/tech-stack-review.md
      
      # Create GitHub issue if patterns are outdated
      if [ $? -eq 1 ]; then
        gh issue create --title "Update ESSENTIALS: Outdated patterns detected"
      fi
      ```
      ```
    - **Why:** Show practical value to users
    - **Dependencies:** Step 14
    - **Risk:** Low

16. **Update package.json version**
    - **Action:** Bump to v0.2.0
      ```json
      "version": "0.2.0",
      ```
    - **Why:** Minor version for new feature (semantic versioning)
    - **Dependencies:** All previous steps
    - **Risk:** Low

**Validation:**
- ✅ Help text updated
- ✅ README comprehensive
- ✅ Version bumped correctly

---

### Phase 5: End-to-End Testing & Validation (10 minutes)

**Goal:** Manual testing and quality assurance

17. **Manual E2E Testing**
    - **Action:** Test all permutations
      ```bash
      # Test new essentials type
      node bin/cli.js validate --type essentials
      
      # Test default (should scan skills + essentials, not stacks)
      node bin/cli.js validate
      
      # Test stacks still works (internal use)
      node bin/cli.js validate --type stacks
      
      # Test help
      node bin/cli.js validate --help
      
      # Test with missing ESSENTIALS (error handling)
      cd /tmp && mkdir test-project && cd test-project
      node /path/to/aiknowsys/bin/cli.js validate --type essentials
      # Should show clear error: "ESSENTIALS not found. Run 'aiknowsys init'..."
      ```
    - **Expected:** All commands work, clear output, proper errors
    - **Dependencies:** All previous steps
    - **Risk:** Low

18. **Run full test suite**
    - **Action:** `npm test` in plugin directory
    - **Expected:** 66/66 tests passing
    - **Dependencies:** All previous steps
    - **Risk:** Low

19. **Run linting**
    - **Action:** `npm run lint`
    - **Expected:** 0 errors, 0 warnings
    - **Dependencies:** All previous steps
    - **Risk:** Low

20. **Integration test with main aiknowsys**
    - **Action:** Test plugin loader discovers and registers command
      ```bash
      cd /home/arno/development/knowledge-system-template
      node bin/cli.js plugins list
      # Should show: aiknowsys-plugin-context7 v0.2.0
      
      node bin/cli.js validate --help
      # Should show updated --type description
      ```
    - **Expected:** Plugin loads, commands work
    - **Dependencies:** Steps 17-19
    - **Risk:** Low

**Validation:**
- ✅ All manual tests pass
- ✅ 66/66 automated tests pass
- ✅ 0 linting errors
- ✅ Plugin integration verified

---

### Phase 6: Dependency Update Detection (BONUS - 10 minutes)

**Goal:** Notify users when package updates might have deprecated their ESSENTIALS patterns

**Scope:** npm/yarn + Python only (most common stacks). Other package managers deferred to future enhancement.

21. **Add post-install hook documentation** (README.md)
    - **Action:** Document recommended workflow for npm/yarn and Python
      ```markdown
      ### After Dependency Updates
      
      When you update packages, validate your ESSENTIALS:
      
      **JavaScript/TypeScript (npm/yarn):**
      ```bash
      # After npm update, yarn upgrade, etc.
      npm update
      npx aiknowsys validate --type essentials
      
      # Or add to package.json scripts:
      {
        "scripts": {
          "postinstall": "npx aiknowsys validate --type essentials --format text"
        }
      }
      ```
      
      **Python (pip/poetry):**
      ```bash
      # After pip install, poetry update, etc.
      pip install -U package-name
      npx aiknowsys validate --type essentials
      
      # Or create a Makefile:
      update-deps:
      	pip install -U -r requirements.txt
      	npx aiknowsys validate --type essentials
      ```
      
      **Why this matters:**  
      Updated libraries may deprecate patterns documented in your ESSENTIALS.
      Regular validation keeps your AI context accurate.
      
      **Supported package managers:** npm, yarn, pip, poetry  
      **Future support:** Rust (Cargo), C# (NuGet), Java (Maven/Gradle), Go
      ```
    - **Why:** Clear guidance on when to run validation
    - **Dependencies:** All previous phases
    - **Risk:** Low (documentation only)

22. **Add package change detection (npm + Python only)**
    - **Action:** Add helper function for common package managers
      ```javascript
      // lib/detect-package-changes.js (NEW FILE - optional)
      import { stat } from 'node:fs/promises';
      import { join } from 'node:path';
      
      /**
       * Detect recent package manager file changes
       * Supports: npm, yarn, pip, poetry
       * @param {string} projectRoot - Project directory
       * @returns {Promise<Object>} Detection result
       */
      export async function detectPackageUpdates(projectRoot) {
        const oneHourAgo = Date.now() - 3600000;
        const updates = [];
        
        // Check npm/yarn files
        const npmFiles = [
          'package.json',
          'package-lock.json',
          'yarn.lock'
        ];
        
        // Check Python files
        const pythonFiles = [
          'requirements.txt',
          'pyproject.toml',
          'Pipfile.lock'
        ];
        
        const allFiles = [...npmFiles, ...pythonFiles];
        
        for (const file of allFiles) {
          try {
            const filePath = join(projectRoot, file);
            const stats = await stat(filePath);
            
            if (stats.mtime.getTime() > oneHourAgo) {
              updates.push({
                file,
                manager: npmFiles.includes(file) ? 'npm' : 'python',
                modifiedAt: stats.mtime
              });
            }
          } catch {
            // File doesn't exist, skip
          }
        }
        
        if (updates.length > 0) {
          return {
            updateDetected: true,
            files: updates,
            suggestion: 'Dependencies recently updated. Consider running: validate --type essentials'
          };
        }
        
        return { updateDetected: false };
      }
      ```
    - **Why:** Proactive notification for most common stacks (JS/TS + Python)
    - **Dependencies:** Step 21
    - **Risk:** Low (optional feature, gracefully handles missing files)
    - **TDD:** Optional (not critical path, can add tests later)
    - **Future:** Extend with more package managers via plugin pattern

23. **Add validation reminder to README Use Cases**
    - **Action:** Document in best practices
      ```markdown
      ### Keeping ESSENTIALS Current
      
      Your CODEBASE_ESSENTIALS.md can become outdated when:
      
      1. **Dependencies are updated** - New library versions deprecate old patterns
      2. **Frameworks release major versions** - Breaking changes invalidate examples
      3. **Project architecture evolves** - Patterns change but docs don't
      
      **Recommended validation schedule:**
      
      ```bash
      # After major dependency updates
      npm update && npx aiknowsys validate --type essentials
      pip install -U package && npx aiknowsys validate --type essentials
      
      # Monthly hygiene (add to calendar)
      npx aiknowsys validate
      
      # In CI/CD (prevent outdated docs in PRs)
      - name: Validate Documentation
        run: npx aiknowsys validate --type essentials --format json
      ```
      
      **Git hook option (automatic):**
      
      Create `.git/hooks/post-merge`:
      ```bash
      #!/bin/bash
      # Detect package manager file changes and suggest validation
      
      changed_files=$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)
      
      # Check for npm/yarn changes
      if echo "$changed_files" | grep -qE "package\.json|package-lock\.json|yarn\.lock"; then
        echo "📦 JavaScript dependencies changed - consider running:"
        echo "  npx aiknowsys validate --type essentials"
      fi
      
      # Check for Python changes
      if echo "$changed_files" | grep -qE "requirements\.txt|pyproject\.toml|Pipfile\.lock"; then
        echo "🐍 Python dependencies changed - consider running:"
        echo "  npx aiknowsys validate --type essentials"
      fi
      ```
      
      **Supported Stacks:**
      - JavaScript/TypeScript (npm, yarn)
      - Python (pip, poetry, pipenv)
      
      **Future Support:** Rust, C#, Java, Go (planned)
      ```
    - **Why:** Multiple triggers for validation (updates, schedule, CI/CD, git hooks)
    - **Dependencies:** Steps 21-22
    - **Risk:** Low (documentation only)

**Validation:**
- ✅ Documentation added for npm/yarn + Python stacks
- ✅ Best practices clearly explained
- ✅ Multiple integration options (postinstall, git hooks, CI/CD, manual)
- ✅ Graceful degradation for other package managers (manual validation still works)
- ✅ Architecture extensible for future package manager support

---

## Success Criteria

**Core Functionality:**
- [ ] All 66 tests passing (61 existing + 5 new)
- [ ] Linting clean (0 errors, 0 warnings)
- [ ] `--type essentials` scans CODEBASE_ESSENTIALS.md
- [ ] `--type essentials` detects tech stack from Section 1
- [ ] Default behavior scans skills + essentials (not stacks)
- [ ] `--type stacks` still works (backward compatible)
- [ ] Clear error if ESSENTIALS not found

**Documentation:**
- [ ] README updated with usage examples
- [ ] ESSENTIALS use case documented
- [ ] Dependency update detection documented (when to run)
- [ ] Best practices section (validation triggers)
- [ ] Git hook example provided
- [ ] CI/CD integration example updated

**Release:**
- [ ] Version bumped to 0.2.0
- [ ] End-to-end testing complete
- [ ] Architect review passes

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ESSENTIALS format varies between users | Medium | Medium | Graceful degradation, clear errors |
| Breaking change for users relying on default | Low | Medium | Default doesn't break explicit `--type` usage |
| Technology Snapshot table parsing fragile | Low | Medium | Regex with fallbacks, comprehensive tests |
| Performance impact from parsing large files | Low | Low | ESSENTIALS typically <1000 lines |
| Package manager diversity (cargo, nuget, etc.) | High | Low | Start with npm + Python (80% coverage), extend later |

---

## Future Enhancements

**Phase 7 (Future): Additional Package Manager Support**

When demand justifies, extend dependency detection to:
- **Rust:** Cargo.toml
- **C#:** *.csproj, packages.config
- **Java:** pom.xml, build.gradle
- **Go:** go.mod
- **Ruby:** Gemfile.lock
- **PHP:** composer.json

**Architecture Note:**  
`detect-package-changes.js` should use a plugin-like pattern to make adding package managers trivial:

```javascript
const PACKAGE_MANAGERS = [
  { name: 'npm', files: ['package.json', 'package-lock.json'] },
  { name: 'yarn', files: ['yarn.lock'] },
  { name: 'python', files: ['requirements.txt', 'pyproject.toml', 'Pipfile.lock'] },
  // Future additions trivial:
  // { name: 'cargo', files: ['Cargo.toml', 'Cargo.lock'] },
  // { name: 'nuget', files: ['packages.config', '*.csproj'] },
];
```

This keeps Phase 6 focused while making future expansion straightforward.

---

## Risks & Mitigations

**Implementation Strategy:**
- Follow TDD strictly (RED-GREEN-REFACTOR)
- Write tests first, see them fail, then implement
- Refactor after green, keep tests passing
- Phase 6 is bonus (high value, documentation-focused)

**Key Decisions:**
- Keep `--type stacks` for internal use (non-breaking)
- Change default to `skills + essentials` (better UX)
- Parse Section 1 table (structured data)
- Reuse existing Context7 validation logic
- **NEW:** Document validation triggers (dependency updates, schedule, CI/CD)

**Testing Focus:**
- ESSENTIALS file parsing (various formats)
- Technology detection accuracy
- Error handling (missing file, malformed content)
- Backward compatibility (stacks type still works)

**Why Phase 6 Matters:**
User updates Next.js 13→15, but ESSENTIALS still documents `getServerSideProps`.
Without notification, they never validate. With it, they maintain accuracy.

**Validation Triggers (Phase 6):**
1. **postinstall script** - Automatic after `npm install` (JavaScript/TypeScript)
2. **Git hook** - After package manager file changes in merge/pull (npm, yarn, pip, poetry)
3. **CI/CD** - On dependency update PRs
4. **Manual schedule** - Monthly hygiene (documented)
5. **Future:** IDE integration (VSCode hook on package.json/requirements.txt change)

**Phase 6 Scope (Pragmatic):**
- ✅ **npm/yarn** (JavaScript/TypeScript) - most common
- ✅ **Python** (pip, poetry, pipenv) - second most common
- ⏳ **Others deferred** (Rust, C#, Java, Go) - future enhancement plan

**Why This Scope:**
- Covers ~80% of aiknowsys users
- Keeps Phase 6 focused (10 minutes, not 30)
- Architecture extensible (easy to add more later)
- Manual validation always works (no package manager needed)

**Estimated Duration:** 55-65 minutes
- Phase 1 (RED): 10 min
- Phase 2 (GREEN): 15 min
- Phase 3 (REFACTOR): 10 min
- Phase 4 (Docs): 10 min
- Phase 5 (Testing): 10 min
- Phase 6 (Dependency Detection): 10 min (bonus - adds high value)

---

*Created by @Planner for @Developer implementation*
