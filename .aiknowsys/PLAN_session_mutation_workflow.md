# Implementation Plan: Session Mutation Workflow Enhancement

**Status:** 📋 PLANNED  
**Created:** 2026-02-07 22:30  
**Goal:** Enable AI agents to fully manage session documentation via mutation commands instead of manual file editing

---

## Overview

AI agents currently use manual `replace_string_in_file` for session documentation because mutation commands only handle YAML frontmatter metadata. This creates workflow gaps, bypasses validation, and makes it "harder" instead of "easier" to use the proper tooling.

**Current Problem:**
- `update-session` only modifies metadata (topics, files, status)
- No command to append markdown content (session narrative)
- Missing triggers prevent skill auto-loading
- AI agents fall back to manual file editing
- Bypasses YAML validation and atomic index updates

**Solution:**
- Extend `update-session` with `--append-content` capability
- Add comprehensive triggers for session workflows
- Document workflow mandates in AGENTS.md
- Optional: Add validation hooks to prevent manual edits

**Discovered During:** Archive script polishing session (2026-02-07)

**User Insight:** "We need to make it easy otherwise no-one will use it" - Real usage reveals UX friction points that prevent adoption.

---

## Critical Decision: Skill Naming Confusion

**Problem Identified:**
- Skill name: `context-query` 
- Actual scope: Query (read) + Mutation (write)
- User confusion: "Query" implies read-only, doesn't signal write capability

**Options:**

### Option A: Rename to `context-management`
**Pros:**
- Covers both query and mutation
- Clear scope (manage = read + write)
- One skill, easier to maintain

**Cons:**
- Generic name, less discoverable
- Triggers need work ("manage" is vague)

### Option B: Split into two skills
- `context-query` (read: query-plans, query-sessions, search-context)
- `context-mutation` (write: create-session, update-session, create-plan)

**Pros:**
- Clear separation of concerns
- Triggers more obvious (query vs create/update)
- Smaller, focused skills

**Cons:**
- Duplication in examples/docs
- User confusion: "Which skill do I need?"
- More maintenance overhead

### Option C: Rename to `context-workflow`
**Pros:**
- Implies both reading and writing
- Natural trigger words (workflow, context)
- Covers full lifecycle

**Cons:**
- Still somewhat vague
- "Workflow" might imply more than it provides

### Parallel Issue: `context7-usage` Skill

**Same naming pattern problem:**
- Current name: `context7-usage` (HOW it works - tech implementation)
- Actual purpose: Query framework/library documentation (WHAT it does)
- Problem: If you don't know what Context7 is, name is meaningless

**Better names:**
- `framework-docs-query` - Clear purpose
- `library-documentation` - Obvious use case
- `dependency-docs` - Matches user mental model

**Decision:** Address in same refactoring (Phase 0)

### Recommended: Option B (Split Skills)

**Why:**
1. Clear mental model: Query for reads, Mutation for writes
2. Trigger words natural: "query", "find" vs "create", "update"
3. Auto-loading more predictable
4. Follows single responsibility principle
5. Users can learn one at a time (query first, mutation later)

**Migration Path:**
1. Create `context-mutation.md` skill (extract mutation commands from context-query)
2. Keep `context-query.md` for read operations
3. Update AGENTS.md triggers to point to correct skill
4. Both skills cross-reference each other
5. Deprecation: None needed (rename, not removal)

---

## Requirements

### Functional Requirements
- Mutation commands handle both metadata AND narrative content
- Triggers auto-load context-query skill for any session-related work
- YAML frontmatter validation on all session mutations
- Atomic file + index updates (no partial states)
- Backward compatible with existing session files

### Non-Functional Requirements
- Commands easier than manual file editing
- Clear error messages for validation failures
- JSON output for AI agent consumption
- Performance <100ms for typical updates

---

## Architecture Changes

### Current State (v0.10.0)

**Mutation Commands:**
```bash
npx aiknowsys create-session --topics "topic1,topic2"  # ✅ Creates session
npx aiknowsys update-session --add-topic "topic3"      # ✅ Updates metadata
# ❌ No way to add markdown content
```

**AI Agent Workflow:**
```markdown
1. Agent wants to document completed work
2. No trigger for "document completion" → Skill not loaded
3. No --append-content option → Falls back to replace_string_in_file
4. Manual editing → Bypasses YAML validation
5. Manual editing → No atomic index update
```

### Proposed State (v0.11.0)

**Extended Mutation Commands:**
```bash
# Metadata (existing)
npx aiknowsys update-session --add-topic "topic" --set-status complete

# Content (NEW)
npx aiknowsys update-session --append-section "## Section Title" --content "Body text..."
npx aiknowsys update-session --append-file path/to/markdown-content.md
npx aiknowsys update-session --prepend-section "## Important Update"

# Combined (NEW)
npx aiknowsys update-session \
  --add-topic "polishing" \
  --set-status complete \
  --append-section "## Work Complete" \
  --content "Summary of changes..."
```

**Improved AI Agent Workflow:**
```markdown
1. Agent wants to document completed work
2. Trigger detected: "document completion" → context-query skill loaded
3. Skill guides: "Use update-session --append-section"
4. Command runs → YAML validated
5. Command runs → Atomic file + index update
6. ✅ Easier, safer, faster
```

---

## Implementation Steps

### Phase 1: Extend update-session Command (2 hours)

**Goal:** Add content manipulation to update-session

#### Step 1.1: Design Content Options (15 min)

**New Options:**
```typescript
interface UpdateSessionOptions {
  // Existing metadata options
  addTopic?: string;
  addFile?: string;
  setStatus?: string;
  
  // NEW content options
  appendSection?: string;      // Section title (## Title)
  prependSection?: string;     // Section title (## Title)  
  content?: string;            // Markdown content for section
  appendFile?: string;         // Path to markdown file to append
  insertAfter?: string;        // Insert after section matching this pattern
  insertBefore?: string;       // Insert before section matching this pattern
}
```

**Design Decisions:**
- Sections always start with `## ` (H2 headers)
- Content can be inline (`--content`) or file-based (`--append-file`)
- Default append to end (most common case)
- Pattern matching for surgical insertions

#### Step 1.2: Implement Content Manipulation (1 hour)

**File:** `lib/commands/update-session.ts`

**Action:**
1. Add new option parsing (appendSection, content, appendFile)
2. Create `appendSessionContent()` helper function
3. Parse existing session file into sections
4. Insert new content at appropriate location
5. Validate markdown structure (headers, formatting)
6. Write back with atomic file operation
7. Rebuild context index (existing autoIndexer)

**Tests to Write (TDD):**
- Append section to empty session
- Append section to existing session
- Append with inline content
- Append with file content
- Prepend section (reverse order)
- Insert after specific section
- Insert before specific section
- Validation: Invalid markdown
- Validation: Conflicting options (append + prepend)
- Index rebuild triggered

**Expected Test Count:** 15-20 tests

#### Step 1.3: Update Documentation (30 min)

**Files to Update:**
- `lib/commands/update-session.ts` - JSDoc comments
- `.github/skills/context-query/SKILL.md` - New examples
- `CODEBASE_ESSENTIALS.md` - Updated command reference
- `CODEBASE_CHANGELOG.md` - Implementation session entry

**Example Documentation:**
```bash
# Append simple section
npx aiknowsys update-session --append-section "## Work Complete" \
  --content "All polishing items finished, tests passing"

# Append from file (for large updates)
npx aiknowsys update-session --append-file path/to/update.md

# Combined metadata + content
npx aiknowsys update-session \
  --set-status complete \
  --add-topic "polishing" \
  --append-section "## Final Validation" \
  --content "959/959 tests passing"
```

#### Step 1.4: Validation & Testing (15 min)

**Validation:**
- Run new tests (15-20 tests)
- Run full test suite (ensure no regressions)
- Manual testing: Create session, append content, verify index
- Deliverables validation

---

### Phase 2: Expand Skill Triggers (30 min)

**Goal:** Auto-load context-query skill for session workflows

#### Step 2.1: Identify Missing Triggers (10 min)

**Current Triggers (AGENTS.md line 173):**
```markdown
| "query plans", "find sessions", "search context" | context-query | Query CLI
| "create plan", "create session", "update session" | context-query | Mutation commands
```

**Missing Coverage:**
- "document work" → Should load skill
- "record completion" → Should load skill  
- "add session entry" → Should load skill
- "update today's session" → Should load skill
- "append to session" → Should load skill
- "session notes" → Should load skill
- "log progress" → Should load skill

#### Step 2.2: Add Comprehensive Triggers (10 min)

**File:** `AGENTS.md`

**Action:** Update skills table:
```markdown
| "query plans", "find sessions", "search context", "what's the current plan" | context-query | Query CLI
| "create plan", "create session", "update session", "document work", "record completion", "add session entry", "session notes" | context-query | Mutation commands
```

#### Step 2.3: Update Skill Detection Logic (10 min)

**File:** `.github/skills/context-query/SKILL.md`

**Action:** Enhance "When to Use This Skill" section:
```markdown
## When to Use This Skill

Use when:
- User asks to "find", "query", "search" plans or sessions (READ operations)
- User asks to "create", "update", "document", "record" plans or sessions (WRITE operations)
- User mentions "what's in the plan", "show me sessions", "current plan"
- User says "update today's session", "document this work", "record completion"
- You need to add content to session files
- Trigger words: query, search, find, create, update, document, record, session, plan
```

---

### Phase 3: Document Workflow Mandates (45 min)

**Goal:** Make mutation commands the default, manual editing the exception

#### Step 3.1: Update AGENTS.md Workflow (20 min)

**File:** `AGENTS.md`

**Action:** Update "6️⃣ END: Save Session Context" section:

```markdown
### 6️⃣ END: Save Session Context & Confirm Completion

**Before ending your turn:**

1. **Update Session File (MANDATORY - Use mutation command):**
   ```bash
   # For metadata updates
   npx aiknowsys update-session --set-status complete --add-topic "topic-name"
   
   # For content updates (v0.11.0+)
   npx aiknowsys update-session \
     --append-section "## Work Complete" \
     --content "Summary: 959/959 tests passing, all issues resolved"
   
   # Combined (recommended)
   npx aiknowsys update-session \
     --set-status complete \
     --add-topic "archive-script-polishing" \
     --append-section "## Final Validation" \
     --content "All optional enhancements complete"
   ```

2. **When to use manual editing (RARE exceptions):**
   - Large narrative updates (>500 words) - use `--append-file`
   - Complex markdown with tables/code blocks - use `--append-file`
   - Restructuring existing sections - requires manual editing

3. **Benefits of mutation commands:**
   - ✅ YAML frontmatter validation (prevents schema violations)
   - ✅ Atomic file + index updates (no partial states)
   - ✅ Easier than finding insertion point manually
   - ✅ JSON output for automation
   - ✅ Consistent formatting

4. **Confirm to user:**
   - What you accomplished
   - What tests passed
   - Session file updated (show command used)
```

#### Step 3.2: Create Learned Skill (15 min)

**File:** `.aiknowsys/learned/session-update-workflow.md`

**Action:** Document the discovered pattern:

```markdown
---
skill: session-update-workflow
discovered: 2026-02-07
context: "Archive script polishing revealed AI agents bypass mutation commands"
pattern: "AI-assisted session documentation workflow"
---

# Session Update Workflow

## Problem Pattern

AI agents fall back to `replace_string_in_file` for session documentation when:
1. No trigger detection ("polish", "complete work" don't load skill)
2. Missing content manipulation (update-session is metadata-only in v0.10.0)
3. Manual editing seems "easier" than finding the right command

## Solution Pattern

**Always use mutation commands for session updates:**

```bash
# Check command availability
npx aiknowsys update-session --help

# Metadata only (v0.10.0)
npx aiknowsys update-session --add-topic "topic" --set-status complete

# With content (v0.11.0+)
npx aiknowsys update-session \
  --append-section "## Section Title" \
  --content "Markdown content here..."
```

## Why This Matters

**Manual file editing:**
- ❌ Bypasses YAML frontmatter validation
- ❌ No atomic index updates (file and index can desync)
- ❌ AI must find insertion point (error-prone)
- ❌ No structured output (debugging harder)

**Mutation commands:**
- ✅ YAML validation prevents schema violations
- ✅ Atomic operations (file + index together)
- ✅ Insertion point automatic (append/prepend/after/before)
- ✅ JSON output for automation

## Trigger Words

Load context-query skill when user says:
- "document work", "record completion", "update session"
- "add session entry", "session notes", "log progress"
- "append to session", "update today's work"
```

#### Step 3.3: Update Validation Checklist (10 min)

**File:** `AGENTS.md` - Quick Reference Checklist

**Action:** Add to validation matrix:

```markdown
**🚨 RULE: Use mutation commands for session updates!**

**Mutation commands preferred:**
- create-session, update-session, create-plan
- YAML-validated, atomic updates, easier than manual editing

**Manual editing allowed:**
- Large files (>500 words) - use --append-file instead
- Complex restructuring of existing sections
```

---

### Phase 4: UX Improvements (2 hours)

**Goal:** Make commands so easy that manual editing feels harder

**User Insight:** "I noticed the UX to use the commands is not that great either"

#### Step 4.1: Add Interactive Mode (45 min)

**Problem:** Too many flags to remember, syntax errors common

**File:** `lib/commands/update-session.ts`

**Action:** Add `--interactive` mode with prompts:

```bash
npx aiknowsys update-session --interactive

# Prompts:
? What would you like to update?
  ❯ Add content (append section)
    Update metadata (topics, status, files)
    Both content and metadata

? Section title: ‸
  (e.g., "Work Complete", "Validation Results")

? Content source:
  ❯ Type inline
    Read from file

? [If inline] Content:
  (Markdown supported, Ctrl+D when done)
  ‸

? Update metadata too? (y/N) ‸

# Final confirmation:
✓ Preview changes:
  
  ## Work Complete
  All polishing items finished
  
  Topics: +polishing
  Status: complete → complete (no change)
  
? Confirm update? (Y/n) ‸

✅ Session updated successfully
```

**Benefits:**
- Zero syntax memorization
- Preview before applying
- Guided workflow
- Catches errors before writing

**Tests:**
- Interactive prompts work correctly
- User can cancel (Ctrl+C)
- Preview shows changes accurately
- Invalid input re-prompts

#### Step 4.2: Add Smart Defaults & Shortcuts (30 min)

**File:** `lib/commands/update-session.ts`, `lib/commands/create-session.ts`

**Action:**

**Smart defaults:**
```bash
# If no options given, enter interactive mode
npx aiknowsys update-session
# → Same as: npx aiknowsys update-session --interactive

# Common shortcuts
npx aiknowsys update-session --done
# → Same as: npx aiknowsys update-session --set-status complete

npx aiknowsys update-session --wip
# → Same as: npx aiknowsys update-session --set-status in-progress

# Content shortcuts
npx aiknowsys update-session --append "Work complete"
# → Same as: npx aiknowsys update-session --append-section "Update" --content "Work complete"
```

**Auto-detection:**
```bash
# If content looks like a file path, read it
npx aiknowsys update-session --append ./notes.md
# → Reads file automatically (no --append-file flag needed)

# If content has newlines, treat as markdown
npx aiknowsys update-session --append "## Title\n\nContent here"
# → Parses as section + content
```

#### Step 4.3: Better Error Messages with Examples (20 min)

**Current errors:**
```
error: unknown option '--append-section'
```

**Improved errors:**
```
❌ Error: Unknown option '--append-section'

Did you mean one of these?
  --append <content>     Add content to session
  --status <status>      Set session status
  --topic <topic>        Add topic to session

💡 Tip: Run 'npx aiknowsys update-session --help' for all options
       or 'npx aiknowsys update-session' for interactive mode

Examples:
  npx aiknowsys update-session --done
  npx aiknowsys update-session --append "Work complete"
  npx aiknowsys update-session --interactive
```

**Implementation:**
- Custom error handler in Commander.js
- Levenshtein distance for "did you mean"
- Context-aware examples (show relevant ones)

#### Step 4.4: Command Aliases & Abbreviations (15 min)

**Make common commands shorter:**

```bash
# Session commands
npx aiknowsys session update --done        # Alias for update-session
npx aiknowsys session create               # Alias for create-session
npx aiknowsys session                      # Show today's session

# Plan commands
npx aiknowsys plan create --title "X"      # Alias for create-plan
npx aiknowsys plan                         # Show current plan

# Shortcuts
npx aiknowsys done                         # update-session --done
npx aiknowsys wip                          # update-session --wip
npx aiknowsys log "message"                # update-session --append "message"
```

**File:** `bin/cli.js`

**Action:**
- Register aliases via Commander.js `.alias()`
- Add help text explaining shortcuts
- Update docs with alias table

#### Step 4.5: Visual Output Improvements (10 min)

**Action:** Make output scannable and helpful

**Current:**
```
Session updated successfully
```

**Improved:**
```
✅ Session Updated

📝 Changes:
   • Section added: "Work Complete"
   • Status: in-progress → complete
   • Topics: +polishing

📂 File: .aiknowsys/sessions/2026-02-07-session.md
🔍 Index: Rebuilt automatically

💡 View: npx aiknowsys query-sessions --days 1
```

**Implementation:**
- Use chalk for colors/emoji
- Box for important info
- Clear sections (Changes, File, Next Steps)
- Helpful commands in footer

**Tests:**
- Silent mode (--silent) suppresses emoji/color
- JSON mode (--json) returns structured data
- Output meets accessibility standards

---

### Phase 5: Enforcement Hooks (1.5 hours) 🚨 HIGH PRIORITY

**Goal:** Make violation impossible, not just documented

**User Insight:** "What about using a pretooluse vscode hook when trying the directly file-editing 'session', 'plan' etc?"

**Why HIGH PRIORITY:** This is the forcing function that makes the entire system work. Without enforcement, agents will continue to use manual file editing.

#### Step 5.1: PreToolUse Hook - Active Blocking (45 min)

**File:** `.github/hooks/preToolUse.js` (NEW)

**Action:** Intercept file editing attempts on session/plan files

```javascript
// .github/hooks/preToolUse.js
module.exports = {
  name: "preToolUse",
  description: "Enforce mutation commands for session/plan files",
  
  async execute(context) {
    const { toolName, parameters } = context;
    
    // Intercept file editing attempts
    if (toolName === 'replace_string_in_file' || 
        toolName === 'multi_replace_string_in_file') {
      
      const filePath = parameters.filePath || 
                       parameters.replacements?.[0]?.filePath;
      
      // Check if editing session or plan file
      if (filePath?.match(/\.aiknowsys\/(sessions|PLAN_|plans\/)/)) {
        
        return {
          block: true,  // Prevent the file edit
          message: `
❌ Direct file editing blocked for: ${filePath}

🚫 Use mutation commands instead:

For session files:
  npx aiknowsys update-session --append "content"
  npx aiknowsys update-session --done
  npx aiknowsys update-session --interactive

For plan files:
  npx aiknowsys create-plan --title "..."
  (update-plan coming in Phase 1)

💡 Why? Mutation commands ensure:
   • YAML frontmatter validation
   • Automatic index updates
   • Consistent format enforcement
   • No manual errors

📚 Read the skill first:
   .github/skills/context-mutation/SKILL.md

⚠️  Emergency override (use sparingly):
   Add --force-manual-edit flag (requires justification)
          `,
          
          // Optional: Suggest conversion
          suggestedAction: "Read context-mutation skill for proper workflow"
        };
      }
    }
    
    // Allow other tool uses
    return { allow: true };
  }
};
```

**Benefits:**
- ✅ **Active Enforcement** - Blocks bad behavior at tool invocation level
- ✅ **Educational** - Shows correct command in error message
- ✅ **Immediate Feedback** - Agent knows BEFORE making mistake
- ✅ **No Bypassing** - Can't "forget" to use proper tooling
- ✅ **Configurable** - Emergency escape hatch available

**Tests:**
- Hook intercepts replace_string_in_file on session file → BLOCKED
- Hook intercepts multi_replace_string_in_file on plan file → BLOCKED
- Hook allows file edits on non-session/plan files → ALLOWED
- Hook shows helpful error message with examples
- Emergency override flag works (--force-manual-edit)

**Implementation Notes:**
- Integrates with existing VSCode hooks system (`.github/hooks/hooks.json`)
- Runs before tool execution (prevents the action)
- Message includes WHY (not just WHAT)
- Provides learning path (read the skill)

#### Step 5.2: Hook Registration (15 min)

**File:** `.github/hooks/hooks.json`

**Action:** Register preToolUse hook

```json
{
  "hooks": [
    {
      "type": "preToolUse",
      "script": "preToolUse.js",
      "enabled": true,
      "description": "Enforce mutation commands for knowledge system files"
    },
    // ... existing hooks ...
  ]
}
```

#### Step 5.3: Pre-commit YAML Validation (30 min)

**File:** `.github/hooks/pre-commit` (existing, extend)

**Action:** Bash script that:
1. Detects changes to `.aiknowsys/sessions/*.md`
2. Validates YAML frontmatter in modified sessions
3. Checks if context-index.json updated (atomic requirement)
4. Warns if manual edit detected (no index update)
5. Allows override with `git commit --no-verify`

**Not Blocking:** Warning only, not error (allows emergency edits)

---

## Risks & Mitigations

### Risk 1: Command Complexity
**Issue:** Too many options make command hard to use  
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:** 
- Provide clear examples in docs
- JSON output shows what happened
- --help text comprehensive
- Common case (append) is simplest

### Risk 2: Backward Compatibility
**Issue:** Existing session files might have non-standard structure  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Graceful fallback to append-to-end
- Validation warns but doesn't block
- Manual override always available
- Test against existing session files

### Risk 3: Index Desync
**Issue:** Append content but index not rebuilt  
**Likelihood:** Low (autoIndexer handles this)  
**Impact:** Medium  
**Mitigation:**
- Reuse existing autoIndexer.ensureFreshIndex()
- Add test: verify index rebuild after update
- Document: index auto-rebuilds on every query

### Risk 4: Learning Curve
**Issue:** AI agents need to learn new workflow  
**Likelihood:** High (initial)  
**Impact:** Low  
**Mitigation:**
- Comprehensive triggers auto-load skill
- Skill examples show exact commands
- AGENTS.md workflow mandate
- This plan itself serves as documentation

---

## Success Criteria

**Phase 0: Skill Naming**
- [ ] Decision made: Rename or split skill
- [ ] New skill(s) created with clear scope
- [ ] Cross-references added between skills
- [ ] AGENTS.md triggers updated with new names

**Phase 1: Core Functionality**
- [ ] `update-session --append-section` implemented and tested (15-20 tests)
- [ ] `update-session --append-file` implemented and tested
- [ ] Content manipulation works with existing metadata options
- [ ] YAML validation active for all mutations
- [ ] Atomic file + index updates verified

**Phase 2: Auto-Loading**
- [ ] Triggers expanded in AGENTS.md (8+ new phrases)
- [ ] Skill(s) updated with new examples
- [ ] Cross-skill navigation working

**Phase 3: Documentation**
- [ ] Workflow mandate documented in AGENTS.md
- [ ] Learned skill created (session-update-workflow.md)
- [ ] Documentation complete (ESSENTIALS, skill, AGENTS)

**Phase 4: UX Excellence**
- [ ] Interactive mode working (`--interactive`)
- [ ] Smart defaults implemented (no flags → interactive)
- [ ] Shortcuts working (`--done`, `--wip`, `--append`)
- [ ] Auto-detection working (file paths, markdown parsing)
- [ ] Error messages improved with examples
- [ ] Command aliases registered (`session`, `plan`, `done`, `wip`, `log`)
- [ ] Visual output improved (emoji, colors, helpful sections)
- [ ] Silent/JSON modes working
- [ ] UX tests passing (15+ tests)

**Phase 5: Enforcement Hooks** (HIGH PRIORITY 🚨)
- [ ] PreToolUse hook implemented (.github/hooks/preToolUse.js)
- [ ] Hook registered in hooks.json
- [ ] Hook intercepts file edits on session/plan files
- [ ] Error message shows correct mutation commands
- [ ] Emergency override flag (--force-manual-edit) working
- [ ] Hook tests passing (5+ scenarios)
- [ ] Pre-commit YAML validation active
- [ ] Pre-commit index sync check active
- [ ] Hook integration tested with real agent workflow

**Overall:**
- [ ] Full test suite passing (no regressions)
- [ ] Manual testing: All workflows verified
- [ ] User testing: "Easier than manual editing" confirmed
- [ ] **Enforcement testing:** PreToolUse hook blocks manual edits 100% of time
- [ ] **Adoption metric:** AI agents use commands >95% of time (hook enforces it)
- [ ] Emergency overrides documented and justified (<5% of cases)

---

## Testing Strategy

### Unit Tests (Phase 1)
- appendSection with inline content
- appendSection with file content
- prependSection
- insertAfter pattern matching
- insertBefore pattern matching
- Validation: Invalid markdown
- Validation: Missing required options
- Validation: Conflicting options
- YAML frontmatter preservation
- Index rebuild triggered

### Integration Tests
- Create session → Append section → Query sessions (verify in index)
- Update metadata + append content (combined operation)
- Large content (>10KB) append performance
- Special characters in content (escaping)

### Manual Testing
- Real session file update workflow
- Verify JSON output structure
- Confirm error messages helpful
- Test --help text clarity

---

- **UX is paramount: "Make it easy otherwise no-one will use it"**

**UX Principles (New):**
1. **Interactive by Default:** No flags should enter interactive mode
2. **Smart Shortcuts:** Common operations get 1-2 letter aliases
3. **Helpful Errors:** Show examples, not just "invalid option"
4. **Visual Feedback:** Clear what changed, where, and what's next
5. **Preview + Confirm:** Show changes before applying
6. **Auto-Detection:** Recognize file paths, markdown, common patterns
7. **Aliases Matter:** `done` is easier than `update-session --set-status complete`

**This plan was created from real usage pain points discovered during archive script polishing (2026-02-07 22:00-22:30).**

**Expanded (2026-02-07 23:00):** User feedback revealed UX friction and skill naming confusion preventing adoption.

**Expanded (2026-02-07 23:15):** Added preToolUse hook for active enforcement (user suggestion). Elevated Phase 5 to HIGH PRIORITY as forcing function.

---

## Timeline Estimate

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| Phase 0: Skill rename decision | 30 min | **MEDIUM** | None (decision point) |
| Phase 1: Extend update-session | 2 hours | **HIGH** | None |
| Phase 2: Expand triggers | 30 min | **MEDIUM** | Phase 0 (new skill names) |
| Phase 3: Document mandates | 45 min | **LOW** | None |
| Phase 4: UX improvements | 2 hours | **HIGH** | Phase 1 (commands exist) |
| Phase 5: Enforcement hooks | 1.5 hours | **HIGH** 🚨 | Phase 1 (commands exist) |
| **Total** | **7.25 hours** | Can be split across 2-3 sessions |

**Suggested Approach:**
- **Session 1 (3.5h):** Phase 0 + Phase 1 + Phase 2 (core functionality + naming)
- **Session 2 (3.5h):** Phase 4 + Phase 5 (UX + enforcement)
- **Session 3 (0.75h):** Phase 3 (documentation)

**Priority (Re-Evaluated):**
1. **HIGH 🚨:** Phase 1 (content mutations) - Solves the manual editing problem
2. **HIGH 🚨:** Phase 4 (UX) - Makes adoption easy ("otherwise no-one will use it")
3. **HIGH 🚨:** Phase 5 (enforcement hooks) - **FORCING FUNCTION** - Makes violation impossible
4. **MEDIUM:** Phase 0 (skill rename) - Improves clarity and discoverability
5. **MEDIUM:** Phase 2 (triggers) - Auto-loads correct skill
6. **LOW:** Phase 3 (docs) - Can be done anytime

**Key Insight:** Phase 5 elevated to HIGH because preToolUse hook is the enforcement mechanism that ensures Phases 1-4 actually get used. Without it, agents bypass the system.

---

**Plan Status:** 📋 PLANNED (Expanded with UX improvements + enforcement)  
**Ready to Implement:** Yes (no blockers)  
**Estimated Complexity:** Medium-High (extends existing + UX layer)  
**Risk Level:** Low (additive changes, backward compatible)

---

## User Feedback Integration

**Key Quotes:**
> "I noticed the UX to use the commands is not that great either"  
> "We need to make it easy otherwise no-one will use it"  
> "Argh we have another confusing skill name here no?"  
> "I saw you got confused with the context7 skill too no?"  
> "What about using a pretooluse vscode hook when trying the directly file-editing 'session', 'plan' etc?"

**Insights:**
1. Command UX is adoption blocker (not just capability gaps)
2. Skill naming confusion prevents discovery (context-query, context7-usage both confusing)
3. Real usage reveals friction that specs miss
4. "Easy" means: interactive, shortcuts, helpful errors, visual feedback
5. **Enforcement > Documentation** - preToolUse hook blocks violations actively

**Actions Taken:**
- ✅ Added Phase 0: Skill naming decision (rename or split context-query + address context7-usage)
- ✅ Added Phase 4: UX improvements (interactive mode, shortcuts, better errors)
- ✅ Added Phase 5: preToolUse hook (ACTIVE enforcement, not passive docs)
- ✅ Expanded success criteria with UX and enforcement metrics
- ✅ Re-prioritized: Phase 5 now HIGH priority (forcing function)
- ✅ Timeline: 4.25h → 7.25h (worthwhile investment for adoption)

---

## Notes for Implementation

**Key Insights from Discovery:**
1. Mutation commands ARE easier when they have full capability
2. Triggers are critical for auto-loading workflow guidance  
3. Metadata-only commands create workflow gaps
4. AI agents will use "easier" path (need to make commands easier)
5. Validation should guide, not block

**Pattern to Replicate:**
- Every workflow should have mutation command support
- Commands should handle both metadata AND content
- Triggers should be comprehensive (not minimal)
- Documentation should show exact commands
- Manual override always available (emergency escape hatch)

**This plan was created from real usage pain points discovered during archive script polishing (2026-02-07 22:00-22:30).**

---

## Related Work

**Depends On:** 
- Phase B Mini (mutation commands foundation) ✅ COMPLETE

**Blocks:**
- None (independent enhancement)

**Related Plans:**
- PLAN_milestone_changelog.md - Will benefit from improved session workflow
- PLAN_context_query_completion.md - Built on this foundation

**Future Enhancements:**
- `read-session` command (query single session details)
- `merge-sessions` command (combine multiple sessions)
- `archive-session` command (move to archived/)

---

**Plan Status:** 📋 PLANNED  
**Ready to Implement:** Yes (no blockers)  
**Estimated Complexity:** Medium (extends existing system)  
**Risk Level:** Low (additive changes, backward compatible)
