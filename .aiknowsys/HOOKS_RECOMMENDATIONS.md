# VSCode Hooks Recommendations for AIKnowSys

**Date:** January 31, 2026  
**Status:** Research Complete - Ready for Planning

---

## Executive Summary

After analyzing VSCode/GitHub Copilot hooks API and the aiknowsys workflow, **5 additional hooks** would significantly enhance the system. Currently implemented: `sessionStart` and `sessionEnd`. Recommended additions focus on validation enforcement, pattern learning, and workflow automation.

---

## Available VSCode Hook Types

Based on everything-claude-code analysis and VSCode/GitHub Copilot documentation:

| Hook Type | Trigger | Primary Use Case |
|-----------|---------|------------------|
| **SessionStart** ✅ | New session begins | Load context, detect environment |
| **SessionEnd** ✅ | Session closes | Save state, persist learnings |
| **Stop** | AI finishes responding | Validation, audit checks |
| **PreToolUse** | Before tool executes | Validation, blocking, reminders |
| **PostToolUse** | After tool completes | Auto-format, checks, feedback |
| **PreCompact** | Before context compression | Save state, preserve critical info |
| **UserPromptSubmit** | User sends message | Context injection, reminders |
| **Notification** | Permission requests | Auto-approve trusted tools |
| **SubagentStop** | Subagent completes | Aggregate results, handoff |

---

## Recommendations by Priority

### 🔥 HIGH PRIORITY (Immediate Value)

#### 1. **Stop Hook - Validation Enforcement**

**Purpose:** Ensure validation matrix is run BEFORE claiming work complete

**Current Problem:**
- Critical Invariant #3: "VALIDATE BEFORE DONE"
- Agents sometimes skip validation
- No automated enforcement of "never claim complete without validation"

**Implementation:**
```json
{
  "Stop": [{
    "matcher": "*",
    "hooks": [{
      "type": "command",
      "command": "node .github/hooks/validation-reminder.js"
    }]
  }]
}
```

**validation-reminder.js Logic:**
```javascript
// Check if validation commands appear in recent conversation
// If code was changed but no validation run → warn AI
// Parse CODEBASE_ESSENTIALS.md validation matrix
// Suggest specific commands based on what changed
```

**Benefits:**
- Enforces Critical Invariant #3 automatically
- Catches validation gaps BEFORE handoff to Architect
- Reduces "looks good but breaks on run" situations
- Aligns with TDD workflow (tests MUST be run)

**Example Output:**
```
[Hook] ⚠️  Validation check:
[Hook] Code changes detected but no npm test found in recent commands
[Hook] Required: npm test (from validation matrix)
[Hook] Please run validation before claiming work complete
```

---

#### 2. **PreToolUse Hook - TDD Enforcement**

**Purpose:** Remind/block when implementation happens before test

**Current Problem:**
- Critical Invariant #7: Test-driven development required
- Easy to skip RED phase (write test first)
- Manual enforcement relies on agent discipline

**Implementation:**
```json
{
  "PreToolUse": [{
    "matcher": "tool == \"Edit\" && tool_input.file_path matches \"(lib|bin|templates)/.*\\\\.js$\" && !(tool_input.file_path matches \"test/\")",
    "hooks": [{
      "type": "command",
      "command": "node .github/hooks/tdd-reminder.js"
    }]
  }]
}
```

**tdd-reminder.js Logic:**
```javascript
// Check if corresponding test file exists
// If new feature → check if test was edited recently
// If no test activity → warn about TDD
// Link to .github/skills/tdd-workflow/SKILL.md
```

**Benefits:**
- Reinforces TDD discipline
- Prevents "code first, test later" anti-pattern
- Links to skill for proper workflow
- Non-blocking (reminder, not blocker)

**Example Output:**
```
[Hook] 🧪 TDD Reminder: Implementing lib/commands/audit.js
[Hook] Did you write the test FIRST? (RED phase)
[Hook] Expected test: test/audit.test.js
[Hook] See: .github/skills/tdd-workflow/SKILL.md for guidance
```

---

#### 3. **PostToolUse Hook - Documentation Sync**

**Purpose:** Auto-update CODEBASE_CHANGELOG.md after significant changes

**Current Problem:**
- Changelog updates often forgotten
- "When to update" guidance exists but requires manual action
- Session workflow says "update proactively" but no enforcement

**Implementation:**
```json
{
  "PostToolUse": [{
    "matcher": "(tool == \"Edit\" || tool == \"Write\") && tool_input.file_path matches \"(lib/|bin/|templates/)\"",
    "hooks": [{
      "type": "command",
      "command": "node .github/hooks/changelog-reminder.js"
    }]
  }]
}
```

**changelog-reminder.js Logic:**
```javascript
// Count edits to core files in session
// After N significant edits → suggest changelog update
// Check if CHANGELOG was recently modified
// If not → remind to document changes
```

**Benefits:**
- Proactive changelog maintenance
- Reduces forgotten documentation
- Session-aware (not spammy)
- Supports "Document: Update Changelog" workflow step

**Example Output:**
```
[Hook] 📝 Changelog reminder: 5 core files modified this session
[Hook] Last changelog update: 2 days ago
[Hook] Consider updating CODEBASE_CHANGELOG.md with session summary
[Hook] See: AGENTS.md Section 5 (Document workflow)
```

---

### 🟡 MEDIUM PRIORITY (Quality of Life)

#### 4. **PreCompact Hook - State Preservation**

**Purpose:** Save critical context before VSCode/Copilot compacts conversation

**Current Problem:**
- Long sessions lose context when compacted
- Important decisions/rationale disappear
- No way to recover reasoning from compacted sessions

**Implementation:**
```json
{
  "PreCompact": [{
    "matcher": "*",
    "hooks": [{
      "type": "command",
      "command": "node .github/hooks/pre-compact.js"
    }]
  }]
}
```

**pre-compact.js Logic:**
```javascript
// Extract key decisions from recent conversation
// Save to .aiknowsys/sessions/compaction-backup.md
// Append to today's session file
// Preserve TODO lists, architectural decisions
```

**Benefits:**
- Prevents context loss
- Preserves architectural reasoning
- Enables session continuity across compactions
- Supports long-running feature development

**Example Output:**
```
[Hook] 💾 Pre-compaction backup created
[Hook] Saved to: .aiknowsys/sessions/2026-01-31-compaction-backup.md
[Hook] Key decisions preserved for session continuity
```

---

#### 5. **SubagentStop Hook - Multi-Agent Handoff**

**Purpose:** Smooth handoffs between Developer → Architect → Developer workflow

**Current Problem:**
- Custom agents (@Developer, @Architect) exist but hooks don't track handoffs
- Session file updates are manual
- No automated "review pending" markers

**Implementation:**
```json
{
  "SubagentStop": [{
    "matcher": "subagent_name == \"Architect\"",
    "hooks": [{
      "type": "command",
      "command": "node .github/hooks/architect-review-complete.js"
    }]
  }]
}
```

**architect-review-complete.js Logic:**
```javascript
// Detect Architect completion
// Update session file with review timestamp
// Create PENDING_REVIEW.md if issues found
// Notify Developer of review status
```

**Benefits:**
- Automated multi-agent workflow tracking
- Session file stays current
- Reduces manual status updates
- Supports custom agent system

**Example Output:**
```
[Hook] 🏗️  Architect review complete
[Hook] Status: 2 issues found
[Hook] Review document: .aiknowsys/PENDING_REVIEW.md
[Hook] Session file updated with review marker
```

---

### 🟢 LOW PRIORITY (Nice to Have)

#### 6. **UserPromptSubmit Hook - Skill Suggestion**

**Purpose:** Suggest relevant skills based on user's request keywords

**Why Low Priority:**
- Current skill mapping works well
- AGENTS.md trigger words already documented
- Would add latency to every message
- Risk of being annoying/spammy

**Potential Use:**
```
User: "I need to refactor this code"
[Hook] 💡 Detected: refactor
[Hook] Relevant skill: .github/skills/code-refactoring/SKILL.md
```

---

## Implementation Strategy

### Phase 1: Validation & TDD (High Priority #1-2)
**Goal:** Enforce critical invariants automatically  
**Files to create:**
- `templates/hooks/validation-reminder.js`
- `templates/hooks/tdd-reminder.js`
- Update `templates/hooks/hooks.json` with Stop and PreToolUse hooks

**Estimated effort:** 2-3 hours (including tests)

### Phase 2: Documentation Sync (High Priority #3)
**Goal:** Proactive changelog maintenance  
**Files to create:**
- `templates/hooks/changelog-reminder.js`
- Update hooks.json with PostToolUse hook

**Estimated effort:** 1-2 hours

### Phase 3: State Preservation (Medium Priority #4)
**Goal:** Prevent context loss in long sessions  
**Files to create:**
- `templates/hooks/pre-compact.js`
- Update hooks.json with PreCompact hook

**Estimated effort:** 2 hours

### Phase 4: Multi-Agent Support (Medium Priority #5)
**Goal:** Smooth agent handoffs  
**Files to create:**
- `templates/hooks/architect-review-complete.js`
- Update hooks.json with SubagentStop hook

**Estimated effort:** 1-2 hours (depends on subagent API)

---

## Testing Requirements

All new hooks MUST follow existing test pattern:

```javascript
// test/hooks.test.js additions
describe('Validation Reminder Hook', () => {
  it('should detect missing validation commands', () => {
    // Test logic
  });
  
  it('should parse validation matrix from ESSENTIALS', () => {
    // Test logic
  });
});
```

**TDD approach:**
1. Write tests for hook behavior FIRST
2. Implement hook to pass tests
3. Run full test suite (315+ tests)
4. Manual validation via hook execution

---

## Rollout Plan

### Immediate (v0.9.0)
- ✅ Document recommendations (this file)
- Create implementation plan (@Planner)
- Implement Phase 1 (Validation + TDD hooks)
- Release with hooks as default in `aiknowsys init`

### Short-term (v0.10.0)
- Implement Phase 2 (Changelog reminder)
- Gather user feedback on hook utility
- Refine hook logic based on real usage

### Medium-term (v0.11.0)
- Implement Phase 3 (PreCompact state preservation)
- Consider Phase 4 (SubagentStop) based on custom agent adoption

---

## Configuration & Customization

**Enable/disable hooks:**
Users can modify `.github/hooks/hooks.json` to:
- Disable specific hooks (remove from config)
- Adjust matchers (change trigger conditions)
- Add custom hooks (project-specific needs)

**Example: Disable TDD reminder for legacy code:**
```json
{
  "PreToolUse": [
    // Remove or comment out TDD reminder hook
  ]
}
```

**Timeout configuration:**
Current hooks use `timeoutSec: 5`. New hooks should maintain this or lower (2-3s) to avoid blocking user workflow.

---

## References

- **Current Implementation:** `templates/hooks/` (sessionStart, sessionEnd)
- **Everything Claude Code:** `/home/arno/development/everything-claude-code/hooks/hooks.json` (comprehensive examples)
- **VSCode Hooks Docs:** https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks
- **Critical Invariants:** CODEBASE_ESSENTIALS.md Section 6
- **Agent Workflow:** AGENTS.md Section "📋 SESSION WORKFLOW"

---

## Next Steps

1. **User Decision:** Review priorities and approve implementation phases
2. **Create Plan:** @Planner creates detailed implementation plan for Phase 1
3. **TDD Implementation:** Write tests first, then implement hooks
4. **Documentation:** Update SETUP_GUIDE.md with new hooks documentation
5. **Release:** Include in next version as opt-in or default feature

---

*Part of aiknowsys continuous improvement. Research completed January 31, 2026.*
