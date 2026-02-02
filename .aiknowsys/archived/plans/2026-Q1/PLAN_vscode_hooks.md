# Implementation Plan: VSCode Hooks for Session Management

**Status:** ✅ COMPLETE  
**Created:** 2026-01-31  
**Completed:** 2026-01-31  
**Goal:** Implement GitHub Copilot hooks to automate session start/end tracking for aiknowsys projects

---

## Overview

Add VSCode/GitHub Copilot hooks integration to aiknowsys that automatically manages session files when users start/end AI coding sessions. This builds on the existing manual session tracking pattern in `.aiknowsys/sessions/` by automating the file creation and context loading process.

**Key Benefit:** Eliminates manual session file management while maintaining platform-agnostic documentation approach.

---

## Requirements

### Functional Requirements
- Automatically create/update session files when AI sessions start/end
- Load previous session context on sessionStart
- Persist current state on sessionEnd
- Work with existing `.aiknowsys/sessions/` structure
- Integrate with current AGENTS.md workflow
- Support both bash and PowerShell environments

### Non-Functional Requirements
- Platform-agnostic: Hooks are VSCode-specific, but session files remain readable by all AI assistants
- Minimal dependencies: Use Node.js only (already in aiknowsys stack)
- Fail gracefully: If hooks aren't available, manual session management still works
- Optional: Users can disable or not install hooks
- Fast: Hook execution <1 second to avoid slowing down sessions

---

## Architecture Changes

### New Files to Create

1. **`.github/hooks/hooks.json`**
   - VSCode hooks configuration
   - sessionStart and sessionEnd hook definitions
   - Reference to hook scripts

2. **`.github/hooks/session-start.js`**
   - Node.js script executed on session start
   - Checks for recent session files (<7 days)
   - Outputs context reminder to stderr

3. **`.github/hooks/session-end.js`**
   - Node.js script executed on session end
   - Creates/updates today's session file
   - Updates timestamps

4. **`templates/hooks/`** (new directory)
   - `hooks.json.template` - Template hooks configuration
   - `session-start.js.template` - Template session start script
   - `session-end.js.template` - Template session end script

### Modified Files

1. **`lib/commands/init.js`**
   - Add VSCode hooks installation as optional step
   - Prompt: "Install VSCode hooks for automatic session tracking? (Y/n)"
   - Copy hooks templates to `.github/hooks/`

2. **`AGENTS.md`**
   - Update SESSION START protocol to mention automated hooks
   - Add note that hooks complement manual workflow
   - Explain hook behavior for transparency

3. **`CODEBASE_ESSENTIALS.md`**
   - Add VSCode hooks to architecture section
   - Document hook behavior

4. **`SETUP_GUIDE.md`**
   - Add hooks installation section
   - Troubleshooting for hooks
   - How to disable hooks if needed

5. **`README.md`**
   - Add hooks feature to feature list
   - Quick mention in "Getting Started"

---

## Implementation Steps

### Phase 1: Hook Script Implementation

**Goal:** Create working session start/end hooks

#### 1. Create session-start.js hook script
   - **File:** `.github/hooks/session-start.js` (template)
   - **Action:** Node.js script that:
     - Checks `.aiknowsys/sessions/` for files modified in last 7 days
     - Finds most recent session file
     - Outputs reminder to stderr: "[SessionStart] Found recent session: YYYY-MM-DD-session.md"
     - Outputs reminder to stderr: "[SessionStart] Read it to load context"
     - Exits with code 0 (success)
   - **Why:** VSCode displays stderr messages to user/AI, providing automatic context reminder
   - **Dependencies:** None
   - **Risk:** LOW - Read-only operation, no side effects
   - **TDD:** Write test that mocks fs operations, verifies correct file detection

#### 2. Create session-end.js hook script
   - **File:** `.github/hooks/session-end.js` (template)
   - **Action:** Node.js script that:
     - Creates `.aiknowsys/sessions/YYYY-MM-DD-session.md` if doesn't exist
     - If exists, updates "Last Updated" timestamp
     - Uses session template from existing `.aiknowsys/sessions/README.md`
     - Outputs confirmation to stderr
     - Exits with code 0
   - **Why:** Ensures session file exists for AI to populate during session
   - **Dependencies:** Requires session template format
   - **Risk:** MEDIUM - Writes files, but only in designated sessions directory
   - **TDD:** Write test that mocks fs, verifies file creation/update logic

#### 3. Create hooks.json configuration
   - **File:** `.github/hooks/hooks.json` (template)
   - **Action:** JSON config with:
     ```json
     {
       "version": 1,
       "hooks": {
         "sessionStart": [{
           "type": "command",
           "bash": "node .github/hooks/session-start.js",
           "powershell": "node .github/hooks/session-start.js",
           "cwd": ".",
           "timeoutSec": 5
         }],
         "sessionEnd": [{
           "type": "command", 
           "bash": "node .github/hooks/session-end.js",
           "powershell": "node .github/hooks/session-end.js",
           "cwd": ".",
           "timeoutSec": 5
         }]
       }
     }
     ```
   - **Why:** Standard VSCode hooks format, cross-platform Node.js execution
   - **Dependencies:** Requires scripts from steps 1-2
   - **Risk:** LOW - Configuration only
   - **TDD:** Validate JSON schema, verify paths reference correct scripts

### Phase 2: Template Integration

**Goal:** Make hooks installable via `aiknowsys init`

#### 4. Create hooks templates directory
   - **File:** `templates/hooks/`
   - **Action:** Create directory structure:
     ```
     templates/hooks/
       hooks.json.template
       session-start.js.template  
       session-end.js.template
     ```
   - **Why:** Enables init command to copy hooks into user projects
   - **Dependencies:** Steps 1-3 completed
   - **Risk:** LOW - Just file organization
   - **TDD:** N/A - file structure verification in init tests

#### 5. Update init command to install hooks
   - **File:** `lib/commands/init.js`
   - **Action:** Add hook installation step:
     - After project structure creation
     - Before final success message
     - Prompt: "Install VSCode hooks for automatic session tracking? (recommended)"
     - Default: Yes
     - If yes: Copy templates/hooks/* to .github/hooks/
     - Preserve executable permissions if needed (chmod +x not needed for Node scripts)
   - **Why:** Makes hooks opt-in during project setup
   - **Dependencies:** Phase 1 complete, templates exist
   - **Risk:** LOW - Optional step, doesn't break existing flow
   - **TDD:** Test with/without hooks installation, verify files copied correctly

### Phase 3: Documentation Updates

**Goal:** Document hooks for users and AI agents

#### 6. Update AGENTS.md with hooks awareness
   - **File:** `AGENTS.md`
   - **Action:** Update "0️⃣ SESSION START" section:
     - Add note: "If VSCode hooks installed, you'll see automatic session reminder"
     - Explain hooks complement manual workflow
     - Hooks create files, agents populate them
   - **Why:** Transparency - AI agents should understand automation
   - **Dependencies:** None
   - **Risk:** LOW - Documentation only
   - **TDD:** N/A

#### 7. Update SETUP_GUIDE.md
   - **File:** `SETUP_GUIDE.md`
   - **Action:** Add "VSCode Hooks (Optional)" section:
     - What hooks do
     - How to enable/disable
     - Troubleshooting (hook not running, permissions, etc.)
     - How to install manually if skipped during init
   - **Why:** User documentation for optional feature
   - **Dependencies:** None
   - **Risk:** LOW - Documentation only
   - **TDD:** N/A

#### 8. Update CODEBASE_ESSENTIALS.md
   - **File:** `CODEBASE_ESSENTIALS.md`
   - **Action:** Add to "Project Structure" section:
     ```
     .github/hooks/          # VSCode session hooks (optional)
       hooks.json            # Hook configuration
       session-start.js      # Auto-load context
       session-end.js        # Auto-save state
     ```
   - **Why:** Architectural documentation
   - **Dependencies:** None
   - **Risk:** LOW - Documentation only
   - **TDD:** N/A

#### 9. Update README.md feature list
   - **File:** `README.md`
   - **Action:** Add to features:
     - "🪝 Optional VSCode hooks for automatic session tracking"
     - Brief mention in Getting Started section
   - **Why:** Marketing - hooks are a nice feature
   - **Dependencies:** None
   - **Risk:** LOW - Documentation only
   - **TDD:** N/A

### Phase 4: Testing & Validation

**Goal:** Ensure hooks work correctly and don't break anything

#### 10. Write unit tests for hook scripts
   - **File:** `test/hooks.test.js` (new)
   - **Action:** Test suite covering:
     - sessionStart finds recent sessions correctly
     - sessionStart handles empty sessions directory
     - sessionEnd creates new session file with correct format
     - sessionEnd updates existing session timestamp
     - Both scripts exit with code 0 on success
     - Both handle errors gracefully
   - **Why:** Confidence in automation logic
   - **Dependencies:** Phases 1-2 complete
   - **Risk:** LOW - Test code only
   - **TDD:** Write tests BEFORE finalizing scripts (proper RED-GREEN-REFACTOR)

#### 11. Manual testing of hooks in VSCode
   - **Action:** 
     - Install hooks in a test project
     - Verify hooks.json is read by VSCode Copilot
     - Start new session, check for session reminder
     - End session, verify session file created
     - Start another session, verify context loaded
     - Test on both Windows (PowerShell) and Linux (bash)
   - **Why:** Real-world validation
   - **Dependencies:** All implementation complete
   - **Risk:** LOW - Manual verification
   - **TDD:** N/A - Manual QA

#### 12. Run full validation matrix
   - **Action:** Run all validation commands:
     - `npm test` - All tests including new hooks tests
     - `npm run lint` - Verify hook scripts pass linting
     - `node bin/cli.js init --dir /tmp/test-hooks` - Test init with hooks
     - Verify hooks.json is valid JSON
   - **Why:** Ensure nothing broke
   - **Dependencies:** All phases complete
   - **Risk:** LOW - Validation only
   - **TDD:** N/A - Validation step

---

## Testing Strategy

### TDD Approach
**For new hook scripts (steps 1-2):**
- **RED:** Write tests first that expect correct behavior
- **GREEN:** Implement minimal script logic to pass tests
- **REFACTOR:** Clean up script code while keeping tests green

**Test scenarios:**
1. **sessionStart:**
   - No sessions directory → exits cleanly, no error
   - Empty sessions directory → exits cleanly, no reminder
   - Old sessions (>7 days) → exits cleanly, no reminder
   - Recent session exists → outputs session file name to stderr
   - Multiple recent sessions → outputs most recent

2. **sessionEnd:**
   - No sessions directory → creates directory and session file
   - Session file doesn't exist → creates with template
   - Session file exists → updates timestamp only
   - Invalid timestamp format → handles gracefully

### Manual Validation
- Install in fresh test project
- Start VSCode session, verify reminder appears
- End session, check file created with correct format
- Repeat to test update path
- Test on both bash and PowerShell environments

---

## Risks & Mitigations

### Risk: VSCode-specific feature breaks platform-agnostic promise
- **Likelihood:** LOW
- **Impact:** MEDIUM
- **Mitigation:** 
  - Hooks are OPTIONAL during init
  - Session files remain platform-agnostic markdown
  - Manual workflow still documented and supported
  - Document hooks as "VSCode enhancement" not requirement

### Risk: Hooks fail silently, users don't know why sessions aren't tracked
- **Likelihood:** MEDIUM
- **Impact:** LOW
- **Mitigation:**
  - Hook scripts log to stderr (visible in VSCode)
  - Exit code 0 = success, non-zero = failure (VSCode shows errors)
  - SETUP_GUIDE.md includes troubleshooting section
  - Hooks timeout after 5 seconds to avoid hanging

### Risk: Session file format diverges between manual and automated creation
- **Likelihood:** MEDIUM
- **Impact:** LOW
- **Mitigation:**
  - sessionEnd script uses same template as documented in .aiknowsys/sessions/README.md
  - Consider extracting template to shared constant/file
  - Document expected format in both places

### Risk: Hooks slow down session start/end
- **Likelihood:** LOW
- **Impact:** LOW
- **Mitigation:**
  - Scripts are simple file operations (<100ms expected)
  - 5 second timeout prevents hanging
  - If performance issues arise, can optimize or make hooks even more optional

### Risk: Cross-platform compatibility issues (Windows vs Linux paths)
- **Likelihood:** MEDIUM
- **Impact:** MEDIUM
- **Mitigation:**
  - Use Node.js `path` module for cross-platform paths
  - Test on both bash and PowerShell
  - Hooks support both bash/powershell commands in config
  - Use forward slashes in JSON config (works on both platforms)

---

## Success Criteria

- [ ] sessionStart hook detects recent sessions and notifies user
- [ ] sessionEnd hook creates/updates session files correctly
- [ ] hooks.json is valid and recognized by VSCode Copilot
- [ ] `aiknowsys init` offers hooks installation (opt-in)
- [ ] Hooks work on both bash and PowerShell environments
- [ ] All unit tests pass (npm test)
- [ ] Manual testing confirms hook execution
- [ ] Documentation updated (AGENTS.md, SETUP_GUIDE.md, README.md)
- [ ] Validation matrix commands pass
- [ ] Hooks timeout gracefully if taking too long
- [ ] Error messages are helpful for debugging
- [ ] Platform-agnostic session workflow still works without hooks

---

## Notes for Developer

### Key Design Decisions

1. **Node.js vs Bash/PowerShell:** Using Node.js for hooks instead of platform-specific shell scripts
   - Pro: Single script works on all platforms
   - Pro: Consistent with aiknowsys tech stack
   - Pro: Easier to test with existing Jest setup
   - Con: Requires Node.js installed (already required by aiknowsys)

2. **Opt-in vs Opt-out:** Making hooks opt-in during init
   - Pro: Respects user choice, not forced
   - Pro: Clearer what's happening (transparency)
   - Con: Some users might skip and miss benefit
   - Decision: Default to "Yes" but allow No

3. **Session File Template:** Storing template in code vs reading from README
   - Option A: Hardcode template in sessionEnd script (faster, self-contained)
   - Option B: Read template from .aiknowsys/sessions/README.md (DRY, single source)
   - Decision: Start with Option A for simplicity, can refactor to Option B later

4. **Hook Placement:** `.github/hooks/` vs `.aiknowsys/hooks/`
   - VSCode documentation uses `.github/hooks/` as convention
   - Keeps AI-specific files separate from hook automation
   - Decision: Use `.github/hooks/` to match VSCode convention

### Integration Points

- **Existing session workflow:** Hooks CREATE files, AI agents POPULATE them
- **AGENTS.md protocol:** Hooks complement step 0️⃣ (SESSION START)
- **Templates:** Hooks are templates like other aiknowsys templates
- **Init command:** Hooks installed alongside agents/skills

### Gotchas to Watch For

1. **File permissions:** Node.js scripts don't need +x, but hooks.json must be readable
2. **Paths:** VSCode hooks run from project root, use relative paths carefully
3. **Stderr vs stdout:** VSCode shows stderr to user, stdout is for hook data passing
4. **Timeout:** Keep hook execution fast (<1s), 5s timeout is safety net
5. **Git ignore:** Session files already gitignored, hooks.json should NOT be gitignored (project config)

### Related Everything-Claude-Code Patterns

Reviewed their implementation in `/home/arno/development/everything-claude-code/hooks/memory-persistence/`:
- Uses bash scripts with basic template creation
- Checks for .tmp files (temporary session state)
- Similar architecture: sessionStart = load, sessionEnd = save
- Our advantage: Node.js = cross-platform, testable

---

## Next Steps After Implementation

1. **Monitor usage:** See if users enable hooks during init
2. **Gather feedback:** Are hooks helpful? Any issues?
3. **Consider additional hooks:** Could add userPromptSubmitted, preToolUse for other automation
4. **Template refinement:** If session file format evolves, update sessionEnd script template
5. **Documentation improvements:** Based on user questions/issues

---

*This plan integrates VSCode hooks while preserving aiknowsys's platform-agnostic philosophy. Hooks enhance the experience for VSCode users without making them mandatory.*
