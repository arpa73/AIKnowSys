# Implementation Plan: Feature Configuration System

**Status:** 🎯 ACTIVE  
**Created:** 2026-01-31  
**Goal:** Add user-configurable options for optional features (OpenSpec, VSCode Hooks, TDD enforcement, session persistence, etc.)

---

## Overview

Currently, `npx aiknowsys init` installs all features by default with minimal configuration options. Users who want simpler setups get features they don't need, and there's no way to enable/disable features later.

This plan adds:
1. **Interactive prompts** during init to choose which features to install
2. **Configuration file** (`.aiknowsys.config.json`) to track enabled features
3. **Enable/disable commands** to toggle features post-init
4. **Smarter defaults** based on project type (simple vs complex)

**Design Goals:**
- Don't overcomplicate simple use cases
- Reasonable defaults (enable common features)
- Easy to enable/disable later
- Configuration file acts as source of truth
- Features remain independent (enabling one doesn't require others)

---

## Current State Analysis

**Currently Configurable:**
- ✅ Template size (`--template minimal` or `full`)
- ✅ Stack templates (`--stack nextjs`)
- ✅ OpenSpec (prompted if team project)
- ✅ TDD enforcement (prompted via `useTDD`)
- ⚠️ VSCode Hooks (always installed, default `useVSCodeHooks: true`)

**Currently NOT Configurable:**
- ❌ Session persistence (always installed)
- ❌ Custom agents (always installed)
- ❌ Universal skills (always installed)
- ❌ VSCode hooks (prompted but not in prompts.js, hardcoded in init.js)
- ❌ Context7 integration (mentioned in user request, not yet implemented)

**Code Locations:**
- **Prompts**: `lib/commands/init/prompts.js` (getWorkflowPreferences)
- **Setup functions**: `lib/commands/init/templates.js` (setupSessionPersistence, setupTDDEnforcement, setupVSCodeHooks)
- **Main flow**: `lib/commands/init.js` (init function, line 350-493)
- **OpenSpec**: `lib/commands/init/openspec.js` (setupOpenSpec)

---

## Requirements

### Functional Requirements
1. **User prompts during init** to choose features
2. **Configuration file** (`.aiknowsys.config.json`) stores enabled features
3. **Commands** to enable/disable features post-init:
   - `npx aiknowsys enable <feature>`
   - `npx aiknowsys disable <feature>`
4. **Check command** validates config and shows enabled features
5. **Backward compatibility** with existing projects (no config = all enabled)

### Non-Functional Requirements
- Keep prompts concise (don't overwhelm users)
- Reasonable defaults (enable common features, disable advanced ones)
- Configuration file is JSON (human-readable, AI-parseable)
- Features can be enabled/disabled independently
- No breaking changes to existing projects

---

## Architecture Changes

### New Files

**1. `.aiknowsys.config.json` (generated in user workspace)**
```json
{
  "version": "1.0",
  "features": {
    "agents": true,
    "skills": true,
    "vscodeHooks": true,
    "sessionPersistence": true,
    "tddEnforcement": true,
    "openspec": false,
    "context7": false
  },
  "preferences": {
    "templateType": "full",
    "stackName": null
  }
}
```

**2. `lib/commands/enable.js` (NEW)**
- Command: `npx aiknowsys enable <feature>`
- Validates feature name
- Updates config file
- Installs feature if not present
- Displays success message

**3. `lib/commands/disable.js` (NEW)**
- Command: `npx aiknowsys disable <feature>`
- Validates feature name
- Updates config file
- Optionally removes files (or just disables in config)
- Displays success message

**4. `lib/config.js` (NEW - shared utilities)**
- `loadConfig(targetDir)` - Read config file, return defaults if missing
- `saveConfig(targetDir, config)` - Write config file
- `validateConfig(config)` - Validate structure
- `getDefaultConfig()` - Default config for new projects
- `isFeatureEnabled(targetDir, featureName)` - Check if feature enabled

### Modified Files

**1. `lib/commands/init/prompts.js`**
- Add `getFeaturePreferences()` function
- Prompts for each feature (grouped by category)
- Smart defaults based on project type
- Add to `askManualQuestions()` flow

**2. `lib/commands/init.js`**
- Import config utilities
- After file generation, create `.aiknowsys.config.json`
- Use config to determine which features to install
- Update success message to show which features were enabled

**3. `lib/commands/check.js`**
- Add config validation
- Show enabled/disabled features
- Detect config-vs-filesystem mismatches (e.g., hooks disabled but files present)

**4. `bin/cli.js`**
- Register `enable` command
- Register `disable` command

**5. `templates/CODEBASE_ESSENTIALS.template.md`**
- Add Configuration section explaining `.aiknowsys.config.json`
- Document how to enable/disable features

---

## Implementation Steps

### Phase 1: Configuration Infrastructure (Foundation)
**Goal:** Create config file system and utilities

**1. Create config utilities** (File: `lib/config.js`)
   - **Action**: Create new file with loadConfig, saveConfig, getDefaultConfig, isFeatureEnabled functions
   - **Why**: Centralized config management prevents duplication
   - **Dependencies**: None
   - **Risk**: Low - isolated new module
   - **TDD**: Write tests first in `test/config.test.js`

**2. Update check command** (File: `lib/commands/check.js`)
   - **Action**: Add config file validation and feature status display
   - **Why**: Users need to see current configuration
   - **Dependencies**: Step 1 (config.js)
   - **Risk**: Low - additive change
   - **TDD**: Add tests to `test/check.test.js`

**3. Add config section to template** (File: `templates/CODEBASE_ESSENTIALS.template.md`)
   - **Action**: Add "Configuration (.aiknowsys.config.json)" section after VSCode Hooks section
   - **Why**: Users need to know config file exists and how to use it
   - **Dependencies**: None
   - **Risk**: Low - documentation only
   - **TDD**: N/A (documentation)

### Phase 2: Feature Prompts (User Choice)
**Goal:** Add interactive prompts for feature selection

**4. Add feature preferences prompts** (File: `lib/commands/init/prompts.js`)
   - **Action**: Create `getFeaturePreferences()` function with grouped feature prompts
   - **Why**: Users choose which features to install
   - **Dependencies**: None (prompts only)
   - **Risk**: Low - isolated function
   - **TDD**: Write tests in `test/init-prompts.test.js` (new file)
   - **Prompt Groups**:
     - **Core Features** (agents, skills) - default enabled
     - **Workflow Automation** (VSCode hooks, session persistence) - default enabled
     - **Quality Enforcement** (TDD enforcement) - default enabled
     - **Advanced Tools** (OpenSpec, Context7) - default disabled

**5. Integrate prompts into init flow** (File: `lib/commands/init.js`)
   - **Action**: Call `getFeaturePreferences()` in manual mode, add to answers object
   - **Why**: Collect user preferences before installation
   - **Dependencies**: Step 4
   - **Risk**: Low - additive change to existing flow
   - **TDD**: Update `test/init.test.js`

**6. Generate config file during init** (File: `lib/commands/init.js`)
   - **Action**: After file generation, call `saveConfig()` with user answers
   - **Why**: Persist user choices for later reference
   - **Dependencies**: Steps 1, 5
   - **Risk**: Low - new file generation
   - **TDD**: Update `test/init.test.js`

### Phase 3: Conditional Feature Installation (Respect Config)
**Goal:** Only install features user chose

**7. Make agents installation optional** (File: `lib/commands/init.js`)
   - **Action**: Wrap `installAgentsAndSkills()` in `if (answers.useAgents !== false)`
   - **Why**: Respect user choice to skip agents
   - **Dependencies**: Step 5
   - **Risk**: Low - existing function, just conditional
   - **TDD**: Update `test/init.test.js`

**8. Make skills installation optional** (File: `lib/commands/init/templates.js`)
   - **Action**: Split `installAgentsAndSkills()` into separate functions, make skills conditional
   - **Why**: Users might want agents without skills (or vice versa)
   - **Dependencies**: Step 7
   - **Risk**: Medium - refactoring existing function
   - **TDD**: Update `test/init.test.js`

**9. Make session persistence optional** (File: `lib/commands/init.js`)
   - **Action**: Wrap `setupSessionPersistence()` in `if (answers.useSessionPersistence !== false)`
   - **Why**: Respect user choice to skip sessions
   - **Dependencies**: Step 5
   - **Risk**: Low - existing function, just conditional
   - **TDD**: Update `test/init.test.js`

**10. Move VSCode hooks prompt** (File: `lib/commands/init/prompts.js`)
   - **Action**: Add VSCode hooks to `getFeaturePreferences()` instead of hardcoded in init.js
   - **Why**: Consistent with other features
   - **Dependencies**: Step 4
   - **Risk**: Low - moving existing logic
   - **TDD**: Update `test/init.test.js`

### Phase 4: Enable/Disable Commands (Post-Init Control)
**Goal:** Allow users to toggle features after initialization

**11. Create enable command** (File: `lib/commands/enable.js`)
   - **Action**: 
     - Load config
     - Validate feature name
     - Install feature files if not present
     - Update config (set feature: true)
     - Display success
   - **Why**: Users can enable features they initially skipped
   - **Dependencies**: Step 1 (config.js), existing install functions
   - **Risk**: Medium - needs to handle partial installs
   - **TDD**: Write tests first in `test/enable.test.js`

**12. Create disable command** (File: `lib/commands/disable.js`)
   - **Action**:
     - Load config
     - Validate feature name
     - Update config (set feature: false)
     - Optionally remove files (prompt user)
     - Display success
   - **Why**: Users can disable features they no longer need
   - **Dependencies**: Step 1 (config.js)
   - **Risk**: Low - mainly config update (file removal is optional)
   - **TDD**: Write tests first in `test/disable.test.js`

**13. Create uninstall command** (File: `lib/commands/uninstall.js`)
   - **Action**:
     - Display warning about data loss
     - Prompt for confirmation (with safety check - type project name)
     - Offer options: "Remove all" vs "Keep user data" (sessions, learned)
     - Remove knowledge system files:
       * CODEBASE_ESSENTIALS.md, AGENTS.md, CODEBASE_CHANGELOG.md, SETUP_GUIDE.md
       * .github/agents/, .github/skills/, .github/hooks/
       * .github/workflows/tdd-compliance.yml (if exists)
       * .git-hooks/ and scripts/install-git-hooks.sh
       * .aiknowsys.config.json
     - Optionally keep: .aiknowsys/sessions/, .aiknowsys/learned/
     - Display summary of removed files
     - Show "Reinstall" instructions
   - **Why**: Users need clean uninstall option
   - **Dependencies**: Step 1 (config.js for detecting features)
   - **Risk**: High - destructive operation, needs careful confirmation
   - **TDD**: Write tests first in `test/uninstall.test.js` (use temp dirs, never delete real files in tests)

**14. Register commands in CLI** (File: `bin/cli.js`)
   - **Action**: Add `.command('enable')`, `.command('disable')`, and `.command('uninstall')` with options
   - **Why**: Make commands available via CLI
   - **Dependencies**: Steps 11, 12, 13
   - **Risk**: Low - standard Commander.js registration
   - **TDD**: Update `test/cli.test.js` (if exists)

### Phase 5: Context7 Integration (Future Extension)
**Goal:** Prepare for Context7 integration (not implemented yet)

**14. Add Context7 placeholder** (File: `lib/config.js`)
   - **Action**: Include `context7: false` in default config
   - **Why**: Reserve config key for future feature
   - **Dependencies**: Step 1
   - **Risk**: None - just a config key
   - **TDD**: N/A (config default)

**15. Add uninstall to documentation** (Files: `templates/CODEBASE_ESSENTIALS.template.md`, `README.md`)
   - **Action**: 
     - Add uninstall section to Configuration in ESSENTIALS template
     - Add to README under "Commands" section
     - Document safety features (confirmation, data preservation options)
   - **Why**: Users need to know how to cleanly remove the system
   - **Dependencies**: Step 13
   - **Risk**: None - documentation only
   - **TDD**: N/A (documentation)

**16. Document Context7 in config template** (File: `templates/CODEBASE_ESSENTIALS.template.md`)
   - **Action**: Add note in Configuration section: "context7: (Future) Integration with Context7 memory system"
   - **Why**: Transparency about planned features
   - **Dependencies**: None
   - **Risk**: None - documentation only
   - **TDD**: N/A (documentation)

---

## Testing Strategy

**TDD Approach:** (for all new code)
- Write failing tests first (RED)
- Implement minimal code (GREEN)
- Refactor while keeping tests green (REFACTOR)

**Test Coverage:**

**Unit Tests:**
- `test/config.test.js` (NEW)
  - loadConfig with missing file returns defaults
  - saveConfig creates file with correct structure
  - isFeatureEnabled returns correct boolean
  - validateConfig catches invalid structure
- `test/enable.test.js` (NEW)
  - Enable command updates config
  - Enable command installs missing files
  - Enable command validates feature name
  - Enable command fails gracefully on errors
- `test/disable.test.js` (NEW)
  - Disable command updates config
  - Disable command prompts for file removal
  - Disable command validates feature name
- `test/uninstall.test.js` (NEW)
  - Uninstall command prompts for confirmation
  - Uninstall removes all knowledge system files
  - Uninstall preserves user data when requested
  - Uninstall validates project name for safety
  - Uninstall displays summary of removed files
  - **CRITICAL:** All tests use temporary directories (never delete real files)
- `test/init-prompts.test.js` (NEW)
  - getFeaturePreferences prompts shown correctly
  - Smart defaults based on project type
- `test/init.test.js` (UPDATE)
  - Config file generated during init
  - Features installed based on config
  - Backward compatibility (no config = all enabled)
- `test/check.test.js` (UPDATE)
  - Config validation added
  - Feature status display

**Integration Tests:**
- Full init flow with various feature combinations
- Enable/disable commands modify filesystem correctly
- Uninstall command cleanly removes all files
- Check command detects mismatches

**Manual Validation:**
- Run `npx aiknowsys init` and verify prompts
- Enable/disable features and verify file changes
- Run `npx aiknowsys uninstall` in test project and verify clean removal
- Run `npx aiknowsys check` and verify output

---

## Risks & Mitigations

**Risk 1: Breaking existing projects**
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** If `.aiknowsys.config.json` missing, assume all features enabled (backward compatibility)

**Risk 2: Partial feature installations**
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:** Enable command checks for existing files before re-installing, disable command prompts before removing files

**Risk 3: Config-vs-filesystem drift**
- **Likelihood:** High (users manually delete files)
- **Impact:** Low (check command detects and warns)
- **Mitigation:** `npx aiknowsys check` validates config against filesystem

**Risk 4: Too many prompts overwhelm users**
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:** 
  - Group features into 3-4 categories
  - Smart defaults (most features enabled)
  - Add `--yes` flag support to skip prompts
  - Add `--minimal` preset (only core features)

**Risk 5: Accidental uninstall (data loss)**
- **Likelihood:** Medium (fat-finger command)
- **Impact:** High (lose work, session history, learned patterns)
- **Mitigation:**
  - Require project name confirmation (type to confirm)
  - Display clear warning with list of files to be deleted
  - Offer "Keep user data" option (preserve .aiknowsys/sessions/ and .aiknowsys/learned/)
  - Show restore instructions after uninstall
  - Tests NEVER delete real files (use temp directories only)

**Risk 6: Context7 not yet implemented**
- **Likelihood:** N/A (planned feature)
- **Impact:** Low (just a config placeholder)
- **Mitigation:** Document as "(Future)" in config, implement when ready

---

## Success Criteria

**Functional:**
- [ ] Users can choose which features to install during init
- [ ] `.aiknowsys.config.json` generated with user choices
- [ ] `npx aiknowsys enable <feature>` installs and enables feature
- [ ] `npx aiknowsys disable <feature>` disables feature (optionally removes files)
- [ ] `npx aiknowsys uninstall` cleanly removes knowledge system with confirmation
- [ ] Uninstall offers "Keep user data" option (sessions, learned patterns)
- [ ] `npx aiknowsys check` shows enabled features and validates config
- [ ] Existing projects without config work as before (all features enabled)
- [ ] Template documents configuration system and uninstall process

**Quality:**
- [ ] All tests passing (460+ existing + ~60 new = 520+ total)
- [ ] TDD followed for all new features (tests written first)
- [ ] Uninstall tests use temp directories ONLY (never delete real files)
- [ ] No breaking changes to existing workflows
- [ ] Documentation updated (CODEBASE_ESSENTIALS.md, SETUP_GUIDE.md, README.md)

**User Experience:**
- [ ] Feature prompts are clear and concise
- [ ] Smart defaults reduce decision fatigue
- [ ] Enable/disable commands provide helpful feedback
- [ ] Uninstall command has safety checks (confirmation, data preservation)
- [ ] Check command clearly shows feature status

---

## Notes for Developer

**Feature Naming Convention:**
- Use camelCase in code: `vscodeHooks`, `sessionPersistence`, `tddEnforcement`
- Use kebab-case in CLI: `vscode-hooks`, `session-persistence`, `tdd-enforcement`
- Map between them in enable/disable commands

**Config File Location:**
- Always: `<targetDir>/.aiknowsys.config.json`
- Gitignore: No (should be committed - it's project configuration)
- Validation: Required structure, optional features (defaults to false)

**Feature Dependencies:**
- **Agents** can exist without Skills (but less useful)
- **Skills** require Agents to function (enforce dependency)
- **TDD enforcement** requires Skills (tdd-workflow) - install automatically
- **VSCode hooks** are independent (no dependencies)
- **Session persistence** is independent (no dependencies)
- **OpenSpec** is independent (external tool)
- **Context7** (future) will be independent

**Smart Defaults by Project Type:**
```javascript
// Simple projects (library, cli, prototype)
{
  agents: true,           // Always useful
  skills: true,           // Always useful
  vscodeHooks: false,     // Might be overkill
  sessionPersistence: false, // Not needed for simple projects
  tddEnforcement: false,  // Optional for prototypes
  openspec: false,        // Team workflow, not needed
  context7: false         // Advanced feature
}

// Complex projects (web-app, backend, team projects)
{
  agents: true,
  skills: true,
  vscodeHooks: true,      // Helpful for automation
  sessionPersistence: true, // Track complex sessions
  tddEnforcement: true,   // Enforce quality
  openspec: true,         // Team alignment
  context7: false         // Still experimental
}
```

**Prompt Flow:**
1. Basic project info (name, type, language)
2. Tech stack (framework, database, etc.)
3. Workflow preferences (team project, TDD)
4. **Feature selection** (NEW - grouped by category)
5. Tooling details (package manager, test framework)

**Enable/Disable Behavior:**
- **Enable**: Install files if missing, update config, show success
- **Disable**: Update config, prompt "Remove files? (y/N)", show success
- **Both**: Validate feature name first, show helpful error if invalid

**Backward Compatibility:**
```javascript
// In config.js
export function loadConfig(targetDir) {
  const configPath = path.join(targetDir, '.aiknowsys.config.json');
  if (!fs.existsSync(configPath)) {
    // No config = assume all features enabled (backward compatibility)
    return getDefaultConfig({ allEnabled: true });
  }
  // ... normal load
}
```

**File Removal Strategy:**
When disabling features, prompt user:
```
⚠️  Feature disabled in config. Remove files?
  • .github/hooks/ (14 files)
  • .aiknowsys/sessions/ (user data - recommend keeping)
  
  Remove files? (y/N):
```

If user says yes:
- VSCode Hooks: Remove `.github/hooks/` directory
- Session Persistence: Remove `.aiknowsys/sessions/` (warn about data loss)
- TDD Enforcement: Remove `.git-hooks/`, `scripts/install-git-hooks.sh`, `.github/workflows/tdd-compliance.yml`
- Agents: Remove `.github/agents/` directory
- Skills: Remove `.github/skills/` directory
- OpenSpec: Remove `openspec/` directory (created by OpenSpec CLI)

**Uninstall Behavior:**
```
⚠️  WARNING: This will remove the knowledge system from your project

Files to be removed:
  • CODEBASE_ESSENTIALS.md
  • AGENTS.md
  • CODEBASE_CHANGELOG.md
  • SETUP_GUIDE.md
  • .github/agents/ (custom agents)
  • .github/skills/ (universal skills)
  • .github/hooks/ (VSCode hooks)
  • .github/workflows/tdd-compliance.yml
  • .git-hooks/ (TDD enforcement)
  • scripts/install-git-hooks.sh
  • .aiknowsys.config.json

Options:
  [1] Remove everything (clean slate)
  [2] Keep user data (.aiknowsys/sessions/, .aiknowsys/learned/)
  [3] Cancel

Choice: _

Type the project name to confirm: _
```

**Safety Features:**
1. Display comprehensive file list
2. Offer "keep user data" option (sessions + learned patterns)
3. Require typing project name to confirm (prevents accidental deletion)
4. Show restore instructions after completion
5. All tests use temp directories (NEVER delete real files)
  • .aiknowsys/sessions/ (user data - recommend keeping)
  
  Remove files? (y/N):
```

If user says yes:
- VSCode Hooks: Remove `.github/hooks/` directory
- Session Persistence: Remove `.aiknowsys/sessions/` (warn about data loss)
- TDD Enforcement: Remove `.git-hooks/`, `scripts/install-git-hooks.sh`, `.github/workflows/tdd-compliance.yml`
- Agents: Remove `.github/agents/` directory
- Skills: Remove `.github/skills/` directory
- OpenSpec: Remove `openspec/` directory (created by OpenSpec CLI)


**Testing Priorities:**
1. Config utilities (load, save, validate, defaults)
2. Init flow with various feature combinations
3. Enable command (install + config update)
4. Disable command (config update + optional file removal)
5. **Uninstall command** (confirmation flow + file removal + safety checks)
6. Check command (validation + status display)
7. Backward compatibility (no config file)

---

**Total Estimated Changes:**
- New files: 5 (config.js, enable.js, disable.js, uninstall.js, + 4 test files)
- Modified files: 7 (init/prompts.js, init.js, check.js, bin/cli.js, templates/CODEBASE_ESSENTIALS.template.md, SETUP_GUIDE.md, README.md)
- Lines added: ~900-1200 (code + tests + docs)
- Complexity: Medium-High (config system + conditional installation + destructive operations)

---

*Plan ready for implementation. All 5 phases designed with TDD workflow, backward compatibility, safety features, and user experience in mind.*
