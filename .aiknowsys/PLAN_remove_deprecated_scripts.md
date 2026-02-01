# Implementation Plan: Remove Deprecated Shell Scripts

**Status:** ✅ COMPLETE  
**Created:** 2026-02-01 15:00  
**Completed:** 2026-02-01 16:45  
**Goal:** Remove legacy bash scripts (setup.sh, migrate-existing.sh, scan-codebase.sh) now fully replaced by CLI commands

## Overview

The CLI (`npx aiknowsys init`, `migrate`, `scan`) has fully replaced the original bash scripts. Per `scripts/README.md`, three scripts are marked deprecated but still exist in the codebase, creating confusion. Time to clean up.

**What stays:**
- `templates/scripts/install-git-hooks.sh` - Active template copied to user projects
- `templates/agents/setup-agents.sh` - Template for custom agent installation

**What goes:**
- `scripts/setup.sh` → Replaced by `npx aiknowsys init`
- `scripts/migrate-existing.sh` → Replaced by `npx aiknowsys migrate`
- `scripts/scan-codebase.sh` → Replaced by `npx aiknowsys scan`

## Requirements

- Remove deprecated scripts from `scripts/` directory
- Update documentation to remove bash script references
- Preserve `scripts/README.md` with deprecation notice (historical context)
- Update templates if they reference deprecated scripts
- No breaking changes (all functionality exists in CLI)

## Architecture Changes

- [scripts/setup.sh](scripts/setup.sh) - DELETE
- [scripts/migrate-existing.sh](scripts/migrate-existing.sh) - DELETE
- [scripts/scan-codebase.sh](scripts/scan-codebase.sh) - DELETE
- [scripts/README.md](scripts/README.md) - UPDATE (note removal, link to CLI)
- [README.md](README.md) - UPDATE (remove bash alternative sections)
- [docs/customization-guide.md](docs/customization-guide.md) - UPDATE (CLI-only workflow)
- [docs/migration-guide.md](docs/migration-guide.md) - UPDATE (CLI-only workflow)

## Implementation Steps

### Phase 1: Remove Script Files

**Goal:** Delete deprecated bash scripts from repository

1. **Delete setup.sh** (File: `scripts/setup.sh`)
   - **Action:** Remove file completely
   - **Why:** Fully replaced by `npx aiknowsys init`
   - **Dependencies:** None
   - **Risk:** Low (documented as deprecated since v0.2.0)

2. **Delete migrate-existing.sh** (File: `scripts/migrate-existing.sh`)
   - **Action:** Remove file completely
   - **Why:** Fully replaced by `npx aiknowsys migrate`
   - **Dependencies:** None
   - **Risk:** Low (documented as deprecated)

3. **Delete scan-codebase.sh** (File: `scripts/scan-codebase.sh`)
   - **Action:** Remove file completely
   - **Why:** Fully replaced by `npx aiknowsys scan`
   - **Dependencies:** None
   - **Risk:** Low (documented as deprecated)

### Phase 2: Update scripts/README.md

**Goal:** Update deprecation notice to reflect removal

4. **Update scripts/README.md** (File: `scripts/README.md`)
   - **Action:** Change status from "LEGACY / MIGRATION PATH" to "REMOVED - SEE CLI"
   - **Why:** Inform users looking for old scripts where to go
   - **Dependencies:** Step 1-3 complete
   - **Risk:** Low
   
   **New content:**
   ```markdown
   # Scripts Directory
   
   ## Status: DEPRECATED SCRIPTS REMOVED
   
   The bash scripts (`setup.sh`, `migrate-existing.sh`, `scan-codebase.sh`) have been removed as of v0.9.0. They were fully replaced by CLI commands.
   
   ## ✅ Use the CLI Instead
   
   ```bash
   npx aiknowsys init         # New projects (was: setup.sh)
   npx aiknowsys migrate      # Existing projects (was: migrate-existing.sh)
   npx aiknowsys scan         # Scan codebase (was: scan-codebase.sh)
   ```
   
   ## What About install-git-hooks.sh?
   
   ✅ **STILL ACTIVE** - This is a template, not a setup script!
   
   - Located in `templates/scripts/install-git-hooks.sh`
   - Copied to user projects during `npx aiknowsys init`
   - Installs git hooks for TDD enforcement
   - Run it in YOUR project (not aiknowsys itself)
   
   ## History
   
   Bash scripts were the original setup method (v0.1.0 - v0.2.0). CLI replaced them in v0.2.0+. Scripts were kept for migration path but removed in v0.9.0 after sufficient adoption time.
   ```

### Phase 3: Update README.md

**Goal:** Remove references to bash scripts as alternatives

5. **Remove bash script mentions from README** (File: `README.md`)
   - **Action:** Remove or update sections mentioning setup.sh and migrate-existing.sh
   - **Why:** No longer valid alternative, confuses users
   - **Dependencies:** Step 1-3 complete
   - **Risk:** Low
   - **Locations to check:**
     - Line ~542 (Alternative: Manual Setup section)
     - Line ~557 (migrate-existing.sh reference)
     - Line ~967 (setup.sh reference)
     - Line ~985 (migrate-existing.sh reference)

### Phase 4: Update Documentation Guides

**Goal:** Update guides to show CLI-only workflow

6. **Update customization-guide.md** (File: `docs/customization-guide.md`)
   - **Action:** Replace "Path A/B" with CLI workflows, remove bash script examples
   - **Why:** Lines 33-34 and 65-100 still document bash script workflow
   - **Dependencies:** Step 1-3 complete
   - **Risk:** Low
   - **Changes:**
     - Line 33-34: Change "Use scripts/setup.sh" to "Use npx aiknowsys init"
     - Lines 65-100: Replace bash workflow with CLI workflow
     - Update code examples from `bash scripts/setup.sh` to `npx aiknowsys init`

7. **Update migration-guide.md** (File: `docs/migration-guide.md`)
   - **Action:** Replace bash workflow (line 139+) with CLI workflow
   - **Why:** Still shows `bash scripts/migrate-existing.sh`
   - **Dependencies:** Step 1-3 complete
   - **Risk:** Low
   - **Changes:**
     - Line 139+: Replace entire bash migration section
     - Update examples from bash to CLI commands
     - Keep structure, change command syntax only

### Phase 5: Verify Templates

**Goal:** Ensure templates don't reference deprecated scripts

8. **Search templates for script references** (File: `templates/**`)
   - **Action:** Grep for setup.sh, migrate-existing.sh, scan-codebase.sh in templates/
   - **Why:** Templates shouldn't reference removed files
   - **Dependencies:** None (can run in parallel with other steps)
   - **Risk:** Low
   - **Command:** `grep -r "setup\.sh\|migrate-existing\.sh\|scan-codebase\.sh" templates/`
   - **Note:** install-git-hooks.sh references are OK (active template)

### Phase 6: Cross-Platform Compatibility (NEW)

**Goal:** Convert bash git hook installer to Node.js for full Windows compatibility

**Current problem:**
- `install-git-hooks.sh` is bash-only (requires Git Bash/WSL on Windows)
- Git hooks (`pre-commit`) are bash scripts (same limitation)
- Node.js is already required for CLI, so conversion makes sense
- VSCode hooks already use Node.js (consistency)

9. **Create Node.js git hook installer** (File: `templates/scripts/install-git-hooks.js`)
   - **Action:** Convert install-git-hooks.sh to Node.js
   - **Why:** Native Windows support without Git Bash/WSL
   - **Dependencies:** Step 1-8 complete
   - **Risk:** Medium (new implementation)
   - **Reference:** [everything-claude-code/scripts/lib/utils.js](../../everything-claude-code/scripts/lib/utils.js) for patterns
   
   **Implementation notes:**
   ```javascript
   #!/usr/bin/env node
   // Use Node.js built-ins: fs, path (cross-platform)
   // Detect platform: process.platform
   // Use path.join() for all paths (not hardcoded separators)
   // Use readline for prompts (works on all platforms)
   // Preserve same logic: copy .git-hooks/* to .git/hooks/
   ```

10. **Update git hooks to be cross-platform compatible** (Files: `templates/git-hooks/pre-commit*`)
    - **Action:** Review pre-commit hooks for Windows compatibility
    - **Why:** Bash scripts may not work in Windows CMD/PowerShell
    - **Dependencies:** Step 9 complete
    - **Risk:** Medium (git hooks must be executable)
    
    **Options:**
    - Option A: Keep bash (works with Git Bash which is bundled with Git for Windows)
    - Option B: Convert to Node.js (full compatibility but more complex)
    - **Recommended:** Option A initially (Git Bash is standard), document requirement
    - **Future:** Option B if users report issues

11. **Update package.json with install command** (File: `package.json`)
    - **Action:** Add npm script for git hook installation
    - **Why:** Provide cross-platform way to run installer
    - **Dependencies:** Step 9 complete
    - **Risk:** Low
    
    ```json
    "scripts": {
      "install-hooks": "node templates/scripts/install-git-hooks.js"
    }
    ```

12. **Update init command to use Node.js installer** (File: `lib/commands/init.js`)
    - **Action:** Update TDD enforcement files to copy .js instead of .sh
    - **Why:** Consistency with new Node.js installer
    - **Dependencies:** Step 9 complete
    - **Risk:** Low
    
    **Changes:**
    - Update `INSTALL_HOOKS_SCRIPT` constant to point to `.js` file
    - Update file copy logic
    - Keep .sh as deprecated fallback temporarily

13. **Update documentation for cross-platform usage** (Files: Multiple)
    - **Action:** Update all references to install-git-hooks.sh
    - **Why:** Show cross-platform command syntax
    - **Dependencies:** Step 9-12 complete
    - **Risk:** Low
    
    **Files to update:**
    - README.md: `./scripts/install-git-hooks.sh` → `npm run install-hooks` or `node scripts/install-git-hooks.js`
    - templates/git-hooks/README.md: Same updates
    - .git-hooks/README.md (generated): Same updates
    
14. **Test on multiple platforms** (Manual testing)
    - **Action:** Verify installation works on Windows, macOS, Linux
    - **Why:** Ensure true cross-platform compatibility
    - **Dependencies:** Step 9-13 complete
    - **Risk:** High (requires access to all platforms)
    
    **Test matrix:**
    ```
    | Platform | Method | Expected |
    |----------|--------|----------|
    | Windows 10/11 | CMD | ✅ Works |
    | Windows 10/11 | PowerShell | ✅ Works |
    | Windows 10/11 | Git Bash | ✅ Works |
    | macOS | Terminal | ✅ Works |
    | Linux (Ubuntu) | Terminal | ✅ Works |
    ```
    
    **Test steps:**
    1. Run `npx aiknowsys init --tdd-enforcement`
    2. Verify hooks installed in .git/hooks/
    3. Verify hooks are executable
    4. Test pre-commit hook triggers on commit
    5. Verify interactive prompt works

## Testing Strategy

**Manual Validation:**
- [ ] Run `npx aiknowsys init` in test directory
- [ ] Run `npx aiknowsys migrate` in existing project
- [ ] Run `npx aiknowsys scan` to generate draft
- [ ] Verify all functionality works without bash scripts
- [ ] Check documentation renders correctly
- [ ] Search codebase for remaining references: `grep -r "setup\.sh\|migrate-existing\.sh\|scan-codebase\.sh" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.aiknowsys`

**Cross-Platform Validation (Phase 6):**
- [ ] Test git hook installer on Windows (CMD, PowerShell, Git Bash)
- [ ] Test git hook installer on macOS
- [ ] Test git hook installer on Linux
- [ ] Verify hooks execute correctly on all platforms
- [ ] Test interactive prompts work cross-platform
- [ ] Run full test suite on all platforms

**Documentation Review:**
- [ ] README.md has no bash script references (or clearly marks as obsolete)
- [ ] customization-guide.md shows CLI workflow only
- [ ] migration-guide.md shows CLI workflow only
- [ ] scripts/README.md explains removal and redirects to CLI
- [ ] Git hooks documentation updated for cross-platform usage

## Risks & Mitigations

- **Risk:** Users with old bookmarks looking for setup.sh
  - **Likelihood:** Medium
  - **Impact:** Low (scripts/README.md redirects to CLI)
  - **Mitigation:** Keep scripts/README.md with clear redirect message

- **Risk:** Templates still reference deprecated scripts
  - **Likelihood:** Low (will check in Phase 5)
  - **Impact:** Medium (could break user setup)
  - **Mitigation:** Thorough grep search, fix any references found

- **Risk:** Breaking users on older documentation versions
  - **Likelihood:** Low (deprecated since v0.2.0, well-communicated)
  - **Impact:** Low (CLI exists, well-documented)
  - **Mitigation:** Release notes explain removal, GitHub issues link to this plan

- **Risk:** Node.js git hook installer doesn't work on some platform
  - **Likelihood:** Medium (new cross-platform code)
**Phase 1-5 (Cleanup):**
- [ ] setup.sh, migrate-existing.sh, scan-codebase.sh deleted from scripts/
- [ ] scripts/README.md updated with removal notice and CLI redirect
- [ ] README.md has no confusing bash script references
- [ ] docs/customization-guide.md shows CLI-only workflow
- [ ] docs/migration-guide.md shows CLI-only workflow
- [ ] No broken references in templates/
- [ ] CLI commands verified working (init, migrate, scan)
- [ ] Documentation is consistent and clear
- [ ] All 255+ tests still passing

**Phase 6 (Cross-Platform):**
- [ ] install-git-hooks.js created and working
- [ ] Installer tested on Windows (CMD, PowerShell, Git Bash)
- [ ] Installer tested on macOS
- [ ] Installer tested on Linux
- [ ] Git hooks execute correctly on all platforms
- [ ] package.json includes install-hooks script
- [ ] init command uses Node.js installer
- [ ] Documentation updated for cross-platform usage
- [ ] Tests added for Node.js installer
- [ ] All tests passing on all platforms (Windows, macOS, Linux)

- [ ] setup.sh, migrate-existing.sh, scan-codebase.sh deleted from scripts/
- [ ] scripts/README.md updated with removal notice and CLI redirect
- [ ] README.md has no confusing bash script references
- [ ] docs/customization-guide.md shows CLI-only workflow
- [ ] docs/migration-guide.md shows CLI-only workflow
- [ ] No broken references in templates/
- [ ] CLI commands verified working (init, migrate, scan)
- [ ] Documentation is consistent and clear
- [ ] All 255+ tests still passing

## Notes for Developer

**Historical Context:**
- Bash scripts were original implementation (v0.1.0)
- CLI replaced them in v0.2.0
- Scripts kept for migration path per scripts/README.md
- User confirmed ready to remove (Feb 1, 2026)
- Sufficient time passed for users to migrate to CLI

**What NOT to remove:**
- `templates/scripts/install-git-hooks.sh` - Active template!
- `templates/agents/setup-agents.sh` - Active template!
- Any `.sh` files in `templates/` (they're templates, not legacy code)
- `scripts/README.md` (keep with updated content explaining removal)

**Grep patterns to find stragglers:**

**Phase 6 inspiration:** Reference `everything-claude-code` project in workspace which already solved this:
- See `everything-claude-code/scripts/lib/utils.js` for cross-platform patterns
- Platform detection: `process.platform === 'win32'`
- Path handling: `path.join()` always
- Command existence check: Platform-aware
- File operations: Node.js fs module (works everywhere)

**Why Node.js for installer:**
- ✅ Already required for CLI (no new dependency)
- ✅ Cross-platform by default (works on Windows/macOS/Linux)
- ✅ Consistent with VSCode hooks (already in Node.js)
- ✅ Easier testing (part of test suite)
- ✅ Better error handling and user feedback
- ✅ Can use existing utilities from lib/

**Future enhancement:** If bash git hooks cause Windows issues, convert them to Node.js too. But Git for Windows includes bash, so current hooks should work fine.
```bash
# After cleanup, these should return zero results (excluding .aiknowsys/PLAN_*.md):
grep -r "scripts/setup\.sh" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.aiknowsys
grep -r "scripts/migrate-existing\.sh" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.aiknowsys
grep -r "scripts/scan-codebase\.sh" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.aiknowsys
```

**Important edge case:**
- Some documentation may mention bash scripts as historical context (e.g., "Before v0.9.0, we used bash scripts...")
- This is OK! Just ensure it's clear they're obsolete and links to CLI
- Don't remove ALL mentions, just ensure they're not presented as current options

**Release notes:** Document this cleanup in next release notes (suggest v0.9.0) under "Breaking Changes" or "Removed Features"
