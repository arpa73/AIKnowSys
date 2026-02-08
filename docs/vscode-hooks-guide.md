# VSCode Hooks Guide

**Complete reference for AIKnowSys VSCode hooks**

---

## Overview

VSCode hooks are scripts that run automatically during GitHub Copilot coding agent sessions. AIKnowSys includes 14 intelligent hooks that automate session management, enforce quality standards, and provide real-time assistance.

### What Are Hooks?

Hooks are JavaScript files that execute at specific lifecycle events:
- **sessionStart** - When you start a conversation with Copilot
- **sessionEnd** - When you end a conversation
- **userPromptSubmitted** - After you send a message
- **preToolUse** - Before Copilot executes a tool (read/write file, run command)
- **stop** - When the conversation ends (final opportunity to validate)

### Why Use Hooks?

**Benefits:**
- ✅ **Never forget** - Auto-reminders for tests, validation, and best practices
- ✅ **Catch issues early** - Health checks at session start
- ✅ **Context continuity** - Auto-load previous session state
- ✅ **Quality enforcement** - Prevents claiming "done" without validation
- ✅ **Performance tracking** - Detect test regressions automatically
- ✅ **Skill discovery** - Auto-suggest relevant guides
- ✅ **Collaboration safety** - Detect concurrent work on same files

### Requirements

- VS Code with GitHub Copilot extension
- GitHub Copilot coding agent (chat mode)
- AIKnowSys installed via `npx aiknowsys init`

Hooks are **optional**. If not using VSCode or Copilot, the knowledge system works via manual workflows in AGENTS.md.

---

## Hook Lifecycle Events

### 1. userPromptSubmitted

**When:** After you send a message to Copilot  
**Purpose:** Analyze intent before Copilot responds  
**Use case:** Skill detection, context analysis

**Hooks:**
- `skill-detector.cjs` - Suggests relevant skills based on your prompt

### 2. preToolUse

**When:** Before Copilot executes a tool (file edit, terminal command)  
**Purpose:** Validation and prerequisite checks  
**Use case:** TDD reminders, skill prerequisite verification

**Hooks:**
- `tdd-reminder.cjs` - Reminds to write tests FIRST when editing implementation
- `skill-prereq-check.cjs` - Verifies skill prerequisites before execution

### 3. sessionStart

**When:** At the beginning of a Copilot session  
**Purpose:** Load context, run health checks, detect issues  
**Use case:** Session continuity, workspace validation, concurrent work detection

**Hooks:**
- `session-start.js` - Detects and loads recent session files
- `migration-check.cjs` - Checks for version mismatches
- `doc-sync.cjs` - Detects stale documentation
- `collaboration-check.mjs` - Detects concurrent work on same files
- `workspace-health.cjs` - Checks disk space, permissions
- `quality-health.cjs` - Detects lint/type/test errors

### 4. sessionEnd

**When:** When Copilot session ends  
**Purpose:** Save state, track metrics  
**Use case:** Session persistence, performance monitoring

**Hooks:**
- `performance-monitor.cjs` - Records test performance, detects regressions
- `session-end.js` - Auto-creates/updates today's session file

### 5. stop

**When:** Final event before conversation ends  
**Purpose:** Last-chance validation  
**Use case:** Prevent claiming work complete without tests

**Hooks:**
- `validation-reminder.cjs` - Warns if code changed but no validation ran

---

## All Hooks Reference

| Hook | Lifecycle | Phase | Purpose |
|------|-----------|-------|---------|
| session-start.js | sessionStart | 1 | Load recent session context |
| session-end.js | sessionEnd | 1 | Save session timestamp |
| validation-reminder.cjs | stop | 2 | Enforce validation before completion |
| tdd-reminder.cjs | preToolUse | 3 | Remind to write tests first |
| skill-detector.cjs | userPromptSubmitted | 4 | Suggest relevant skills |
| skill-prereq-check.cjs | preToolUse | 4 | Verify skill prerequisites |
| workspace-health.cjs | sessionStart | 5 | Check disk/permissions |
| quality-health.cjs | sessionStart | 5 | Check lint/type/test errors |
| collaboration-check.mjs | sessionStart | 6 | Detect concurrent work |
| performance-monitor.cjs | sessionEnd | 7 | Track test performance |
| migration-check.cjs | sessionStart | 8 | Version mismatch detection |
| doc-sync.cjs | sessionStart | 8 | Documentation staleness |

---

## Phase-by-Phase Breakdown

### Phase 1: Session Management

**Purpose:** Maintain context continuity across sessions

#### session-start.js

**When it runs:** sessionStart (beginning of conversation)

**What it does:**
- Checks for recent session files (< 7 days old) in `.aiknowsys/sessions/`
- Notifies AI to read previous session for context
- Provides continuation from where you left off

**Example output:**
```
📋 Recent Session Found
Last session: .aiknowsys/sessions/2026-01-31-session.md (1 day ago)
Suggestion: Read this session file to continue previous work.
```

**Configuration:** None (always runs)

#### session-end.js

**When it runs:** sessionEnd (end of conversation)

**What it does:**
- Creates or updates today's session file
- Adds current timestamp
- Provides structure for AI to populate

**Example output:**
```
✅ Session file created/updated: .aiknowsys/sessions/2026-01-31-session.md
Timestamp: 14:32
AI should populate content before ending session.
```

**Configuration:** None (always runs)

---

### Phase 2-3: Validation & TDD Enforcement

**Purpose:** Prevent incomplete work and enforce test-first development

#### validation-reminder.cjs

**When it runs:** stop (final event before conversation ends)

**What it does:**
- Checks if files in `lib/`, `bin/`, `templates/` were edited
- Searches conversation for validation commands (`npm test`, `node --test`, etc.)
- Warns if code changed but no validation ran

**Example output:**
```
⚠️  Validation Reminder
Code changes detected in implementation files, but no validation found.
Please run validation before claiming work is complete:
  npm test
  npm run test
  node --test test/your-test.test.js
See validation matrix in CODEBASE_ESSENTIALS.md for required checks.
```

**Configuration:** Edit patterns in validation-reminder.cjs to match your project

**False positives:** May trigger if you run tests outside terminal (VS Code test runner)

#### tdd-reminder.cjs

**When it runs:** preToolUse (before file edits)

**What it does:**
- Detects edits to implementation files (lib/, src/)
- Checks if corresponding test file exists
- Checks if test file was edited recently (10-minute window)
- Reminds to write test FIRST if test missing or old

**Example output:**
```
⚠️  TDD Reminder
About to edit: lib/commands/new-feature.js
Expected test: test/new-feature.test.js
Test file doesn't exist or hasn't been edited recently (10min window).
Remember: Write test FIRST (RED), then implement (GREEN), then refactor (REFACTOR).
See: .github/skills/tdd-workflow/SKILL.md for TDD patterns.
```

**Configuration:** Adjust time window and paths in tdd-reminder.cjs

**Skip TDD:** Edit non-feature files (docs, config) or explicitly acknowledge in conversation

---

### Phase 4: Skill Detection

**Purpose:** Auto-suggest relevant guides based on user intent

#### skill-detector.cjs

**When it runs:** userPromptSubmitted (after you send a message)

**What it does:**
- Analyzes your prompt for trigger words
- Matches keywords to skills in `.github/skills/`
- Suggests relevant skills before Copilot responds

**Example output:**
```
💡 Skill Suggestion
Detected keywords: "refactor", "clean up code"
Relevant skill: code-refactoring
Location: .github/skills/code-refactoring/SKILL.md
Description: Safe code refactoring workflow with test-driven approach
```

**Configuration:** Skills define their own trigger words in frontmatter

**Customization:** Add skills to `.github/skills/`, detector picks them up automatically

#### skill-prereq-check.cjs

**When it runs:** preToolUse (before file edits/commands)

**What it does:**
- Checks if a skill is being used
- Verifies prerequisites are met
- Warns if required files/tools missing

**Example output:**
```
⚠️  Skill Prerequisite Check
Using skill: dependency-updates
Missing prerequisite: package.json not found
Recommendation: Ensure you're in the project root directory
```

**Configuration:** Skills define prerequisites in their SKILL.md file

---

### Phase 5: Workspace Health

**Purpose:** Catch environment issues early

#### workspace-health.cjs

**When it runs:** sessionStart (beginning of conversation)

**What it does:**
- Checks available disk space (warns < 1GB)
- Verifies directory permissions
- Checks for common workspace issues

**Example output:**
```
⚠️  Workspace Health Check
Disk space: 512 MB remaining (warning threshold: 1 GB)
Recommendation: Free up disk space before making large changes
```

**Configuration:** Edit thresholds in workspace-health.cjs

**Common warnings:**
- Low disk space
- Permission denied errors
- Missing critical directories

#### quality-health.cjs

**When it runs:** sessionStart (beginning of conversation)

**What it does:**
- Runs quick lint check (if configured)
- Runs type check (if TypeScript/typed project)
- Detects existing test failures
- Reports summary of issues

**Example output:**
```
⚠️  Quality Health Check
Lint errors: 3 files with issues
Type errors: 5 errors in src/components/
Test status: 2 failing tests
Recommendation: Fix existing issues before starting new work
```

**Configuration:** Edit commands in quality-health.cjs to match your project

**Performance:** Uses fast checks only (no full test suite)

---

### Phase 6: Collaboration Detection

**Purpose:** Prevent conflicts when multiple people work on same codebase

#### collaboration-check.mjs

**When it runs:** sessionStart (beginning of conversation)

**What it does:**
- Checks for uncommitted changes
- Detects if files were modified outside current session
- Warns about potential conflicts
- Suggests git pull/stash

**Example output:**
```
⚠️  Collaboration Check
Uncommitted changes detected in 3 files:
  - lib/commands/init.js (modified 2 hours ago)
  - test/init.test.js (modified 2 hours ago)
  - CODEBASE_CHANGELOG.md (modified 2 hours ago)
These files may have been edited by another developer or previous session.
Recommendation: Review changes with 'git status' and 'git diff'
```

**Configuration:** Uses git to detect changes

**False positives:** Triggers if you left uncommitted work from previous session

---

### Phase 7: Performance & Dependencies

**Purpose:** Track performance over time, monitor dependency security

#### performance-monitor.cjs

**When it runs:** sessionEnd (end of conversation)

**What it does:**
- Extracts test duration from conversation
- Records to `.aiknowsys/performance-history.json`
- Calculates 7-day rolling average
- Warns if current run >20% slower than average

**Example output:**
```
⚠️  Performance Regression Detected
Current test duration: 24.5s
7-day average: 18.2s
Regression: 34% slower than average
Recommendation: Investigate performance bottlenecks
```

**Configuration:** 
- Adjust `REGRESSION_THRESHOLD` (default: 1.2 = 20%)
- Adjust `MAX_HISTORY_ENTRIES` (default: 100)

**Data location:** `.aiknowsys/performance-history.json` (gitignored)

**Related command:** `npx aiknowsys deps-health` (check dependencies manually)

---

### Phase 8: Advanced Intelligence

**Purpose:** Proactive alerts for common issues

#### migration-check.cjs

**When it runs:** sessionStart (beginning of conversation)

**What it does:**
- Reads installed aiknowsys version from package.json
- Reads project initialization version from CODEBASE_ESSENTIALS.md
- Compares versions (major.minor.patch)
- Warns on major/minor version differences
- Suggests migration command

**Example output:**
```
⚠️  Version Mismatch Detected
Installed aiknowsys: v0.9.0
Project initialized with: v0.7.0
Version difference: MINOR (features added, non-breaking)
Recommendation: Run migration to get new features:
  node bin/cli.js migrate --from 0.7.0
```

**Configuration:** None (reads from project files)

**When to migrate:** Major or minor version differences (not patch)

#### doc-sync.cjs

**When it runs:** sessionStart (beginning of conversation)

**What it does:**
- Maps code files to related documentation files
- Checks last modified time for both
- Detects stale docs (>30 days without update)
- Detects code-doc drift (code changed recently, doc didn't)
- Limits warnings to 5 per session

**Example output:**
```
⚠️  Documentation Sync
Stale documentation detected (>30 days old):
  - docs/customization-guide.md (42 days old, relates to lib/commands/scan.js)
Code-doc drift detected:
  - lib/commands/init.js changed 2 days ago, but README.md last updated 14 days ago
Recommendation: Update documentation to reflect recent code changes
```

**Configuration:** Edit `CODE_TO_DOC` mapping in doc-sync.cjs

**Customization:** Add your own code-to-doc relationships

---

## Configuration Guide

### hooks.json Structure

All hooks are registered in `.github/hooks/hooks.json`:

```json
{
  "version": 1,
  "hooks": {
    "userPromptSubmitted": [
      {
        "type": "command",
        "bash": "node .github/hooks/skill-detector.cjs",
        "powershell": "node .github/hooks/skill-detector.cjs",
        "cwd": ".",
        "timeoutSec": 2
      }
    ],
    "preToolUse": [
      {
        "type": "command",
        "bash": "node .github/hooks/skill-prereq-check.cjs",
        "powershell": "node .github/hooks/skill-prereq-check.cjs",
        "cwd": ".",
        "timeoutSec": 2
      },
      {
        "type": "command",
        "bash": "node .github/hooks/tdd-reminder.cjs",
        "powershell": "node .github/hooks/tdd-reminder.cjs",
        "cwd": ".",
        "timeoutSec": 2
      }
    ],
    "sessionStart": [
      {
        "type": "command",
        "bash": "node .github/hooks/session-start.js",
        "powershell": "node .github/hooks/session-start.js",
        "cwd": ".",
        "timeoutSec": 5
      },
      {
        "type": "command",
        "bash": "node .github/hooks/migration-check.cjs",
        "powershell": "node .github/hooks/migration-check.cjs",
        "cwd": ".",
        "timeoutSec": 2
      },
      {
        "type": "command",
        "bash": "node .github/hooks/doc-sync.cjs",
        "powershell": "node .github/hooks/doc-sync.cjs",
        "cwd": ".",
        "timeoutSec": 2
      },
      {
        "type": "command",
        "bash": "node .github/hooks/collaboration-check.mjs",
        "powershell": "node .github/hooks/collaboration-check.mjs",
        "cwd": ".",
        "timeoutSec": 3
      },
      {
        "type": "command",
        "bash": "node .github/hooks/workspace-health.cjs",
        "powershell": "node .github/hooks/workspace-health.cjs",
        "cwd": ".",
        "timeoutSec": 2
      },
      {
        "type": "command",
        "bash": "node .github/hooks/quality-health.cjs",
        "powershell": "node .github/hooks/quality-health.cjs",
        "cwd": ".",
        "timeoutSec": 3
      }
    ],
    "sessionEnd": [
      {
        "type": "command",
        "bash": "node .github/hooks/performance-monitor.cjs",
        "powershell": "node .github/hooks/performance-monitor.cjs",
        "cwd": ".",
        "timeoutSec": 2
      },
      {
        "type": "command",
        "bash": "node .github/hooks/session-end.js",
        "powershell": "node .github/hooks/session-end.js",
        "cwd": ".",
        "timeoutSec": 5
      }
    ],
    "stop": [
      {
        "type": "command",
        "bash": "node .github/hooks/validation-reminder.cjs",
        "powershell": "node .github/hooks/validation-reminder.cjs",
        "cwd": ".",
        "timeoutSec": 2
      }
    ]
  }
}
```

### Configuration Properties

| Property | Description | Values |
|----------|-------------|--------|
| `type` | Hook type | `"command"` (only option currently) |
| `bash` | Command for bash/zsh | Shell command string |
| `powershell` | Command for PowerShell | PowerShell command string |
| `cwd` | Working directory | `.` for project root |
| `timeoutSec` | Max execution time | 2-5 seconds (adjust per hook) |

### Customization Examples

#### Disable a Specific Hook

Remove the hook from hooks.json:

```json
"sessionStart": [
  // Remove collaboration-check.mjs if you work solo
  // {
  //   "type": "command",
  //   "bash": "node .github/hooks/collaboration-check.mjs",
  //   ...
  // }
]
```

#### Adjust Timeouts

Increase timeout for slow operations:

```json
{
  "type": "command",
  "bash": "node .github/hooks/quality-health.cjs",
  "powershell": "node .github/hooks/quality-health.cjs",
  "cwd": ".",
  "timeoutSec": 5  // Increased from 3 for large codebases
}
```

#### Add Custom Hook

Create your hook file and register it:

```javascript
// .github/hooks/custom-check.cjs
const data = JSON.parse(process.argv[2] || '{}');
console.log('[Custom Check] Running custom validation...');
// Your logic here
```

Register in hooks.json:

```json
"sessionStart": [
  {
    "type": "command",
    "bash": "node .github/hooks/custom-check.cjs",
    "powershell": "node .github/hooks/custom-check.cjs",
    "cwd": ".",
    "timeoutSec": 2
  }
]
```

---

## Troubleshooting

### Hooks Not Running

**Symptom:** No hook output in Copilot chat

**Possible causes:**

**⚠️ #1: Environment Requirements Not Met (MOST COMMON)**

Hooks ONLY execute in this specific environment:
- ✅ **Visual Studio Code** (desktop application)
- ✅ **GitHub Copilot extension** installed and active
- ✅ **Copilot coding agent** mode (not regular chat)

**Not supported:**
- ❌ Claude Code/Chat
- ❌ Cursor IDE  
- ❌ Web-based AI assistants
- ❌ GitHub Copilot web interface
- ❌ GitHub Copilot regular chat mode

**How to verify:**
1. Check if you're using VSCode desktop app
2. Check extensions: Is GitHub Copilot installed?
3. Open Output panel (`Cmd/Ctrl + Shift + U`)
4. Select "GitHub Copilot" from dropdown
5. Look for hook execution logs

**Solution:** If not using VSCode + Copilot coding agent, follow manual workflows in [AGENTS.md](../AGENTS.md)

**Other possible causes:**

2. ✅ **Check hooks.json exists:** `.github/hooks/hooks.json`
3. ✅ **Verify Node.js installed:** Run `node --version`
4. ✅ **Check hook permissions:** Run `chmod +x .github/hooks/*.{js,cjs,mjs}`
5. ✅ **View VSCode Output:** Open "Output" panel, select "GitHub Copilot"
6. ✅ **Verify paths:** Hooks should reference `.github/hooks/` not `templates/hooks/`

**Solution:**
```bash
# Verify hooks.json exists
ls -la .github/hooks/hooks.json

# Check hook files exist
ls -la .github/hooks/*.{js,cjs,mjs}

# Test hook manually
node .github/hooks/session-start.js '{}'
```

### Hook Timeout Errors

**Symptom:** Hook runs but times out

**Possible causes:**
- Hook doing slow operations (network, large file I/O)
- Timeout too short for operation

**Solution:**
```json
// Increase timeoutSec in hooks.json
{
  "type": "command",
  "bash": "node .github/hooks/slow-hook.cjs",
  "timeoutSec": 10  // Increased from 2
}
```

### False Positive Warnings

#### validation-reminder.cjs

**Issue:** Warns about missing validation when tests actually ran

**Cause:** Tests run outside terminal (VS Code test runner, IDE integration)

**Solution:** Mention validation in chat or run once in terminal:
```
"I ran tests in VS Code test runner - all passed"
```

#### tdd-reminder.cjs

**Issue:** Warns about missing test when you're refactoring, not adding features

**Cause:** Hook can't distinguish refactoring from new features

**Solution:** Acknowledge in chat:
```
"Refactoring existing code, tests already exist"
```

#### collaboration-check.mjs

**Issue:** Warns about uncommitted changes from your own previous session

**Cause:** You left work uncommitted

**Solution:** Review changes and commit or stash:
```bash
git status
git diff
git commit -am "Work from previous session"
# or
git stash
```

### Hook Not Detecting Changes

#### performance-monitor.cjs

**Issue:** Not recording performance data

**Cause:** Can't find test duration in conversation

**Solution:** Ensure test output includes duration:
```bash
# Good: Shows duration
npm test
# tests 460
# duration_ms 19869.675409

# Bad: No duration shown
npm test --silent
```

#### doc-sync.cjs

**Issue:** Not detecting stale docs

**Cause:** CODE_TO_DOC mapping doesn't include your files

**Solution:** Edit doc-sync.cjs and add mapping:
```javascript
const CODE_TO_DOC = {
  'lib/commands/your-file.js': ['docs/your-doc.md'],
  // ... existing mappings
};
```

### Hooks Running on Wrong Files

**Issue:** Hook triggers for files it shouldn't

**Solution:** Edit the hook's file pattern matching:

Example in tdd-reminder.cjs:
```javascript
// Customize implementation file patterns
const IMPL_PATTERNS = [
  /^lib\//,        // lib/ directory
  /^src\//,        // src/ directory  
  /^bin\//,        // bin/ directory
  // Add your patterns here
];

// Customize test file patterns
const TEST_PATTERNS = [
  /^test\//,       // test/ directory
  /\.test\.js$/,   // *.test.js files
  /\.spec\.js$/,   // *.spec.js files
  // Add your patterns here
];
```

---

## FAQ

### Can I use hooks without GitHub Copilot?

**No**, hooks require GitHub Copilot coding agent in VS Code. However, the knowledge system works perfectly without hooks - you just follow manual workflows in AGENTS.md.

### Do hooks slow down Copilot?

**Minimal impact.** Most hooks run in <100ms. Total overhead at session start: ~500ms. At session end: ~200ms. This is negligible compared to Copilot's response time.

### Can hooks edit files automatically?

**No**, hooks are read-only. They can only:
- Read files
- Print warnings/suggestions
- Track metrics

They cannot modify code or run destructive commands. This is by design for safety.

### What happens if a hook crashes?

**Silent failure.** Hooks are wrapped in try/catch and never interrupt your workflow. If a hook crashes:
1. Error is logged to VSCode Output panel
2. Hook exits gracefully
3. Conversation continues normally
4. Other hooks still run

### Can I share hooks across team?

**Yes!** Hooks are in `.github/hooks/` and committed to git. When team members run `npx aiknowsys init` or `migrate`, they get the hooks automatically.

**Customization:** Each developer can edit their local `.github/hooks/hooks.json` to enable/disable specific hooks.

### How do I update hooks to latest version?

**Run update command:**
```bash
npx aiknowsys update
```

This updates:
- Hook files in `.github/hooks/`
- Documentation
- Skills
- Agents

Your customizations to `hooks.json` are preserved.

### Can hooks access sensitive data?

**Yes, hooks run with your permissions.** They can read any file in your project. This is why:
1. Hooks should never be copy-pasted from untrusted sources
2. AIKnowSys hooks are open source and auditable
3. Review hook code before running `npx aiknowsys init`

**Security:** Hooks cannot:
- Make network requests (no internet access)
- Access files outside workspace
- Modify git history
- Run arbitrary shell commands (only what's in the hook file)

### What data do hooks collect?

**Local only, nothing sent externally:**

| Hook | Data Collected | Location |
|------|----------------|----------|
| performance-monitor.cjs | Test duration, pass/fail count | `.aiknowsys/performance-history.json` |
| session-start.js | Session file timestamps | `.aiknowsys/sessions/` (read-only) |
| session-end.js | Session file timestamps | `.aiknowsys/sessions/` (write) |
| All others | None | N/A |

All data stays on your machine. Nothing is sent to AIKnowSys servers (there are no servers).

### Can I write hooks in Python/Ruby/etc?

**Yes**, hooks can be any executable. Just change the command in hooks.json:

```json
{
  "type": "command",
  "bash": "python3 .github/hooks/my-hook.py",
  "powershell": "python .github/hooks/my-hook.py",
  "cwd": ".",
  "timeoutSec": 2
}
```

**Input:** Hooks receive JSON data as first argument:
```python
import sys
import json

data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
print(f"[My Hook] Processing: {data}")
```

### How do I debug a hook?

**Method 1: Run manually**
```bash
node .github/hooks/your-hook.cjs '{}'
```

**Method 2: Add logging**
```javascript
// Add to your hook
console.error('[DEBUG] Data received:', JSON.stringify(data, null, 2));
console.error('[DEBUG] Current directory:', process.cwd());
```

**Method 3: Check VSCode Output**
1. Open "Output" panel (`Cmd/Ctrl + Shift + U`)
2. Select "GitHub Copilot" from dropdown
3. Look for hook execution logs

---

## Best Practices

### Hook Development

1. **Keep hooks fast** - Target <100ms execution time
2. **Fail silently** - Wrap in try/catch, never throw
3. **Provide actionable output** - Tell user what to do, not just what's wrong
4. **Test manually** - Run with sample data before deploying
5. **Document clearly** - Explain what the hook does and when it runs

### Hook Customization

1. **Start conservative** - Disable hooks you don't need
2. **Adjust thresholds** - Tune warnings to your team's workflow
3. **Add project-specific logic** - Customize for your stack
4. **Version control** - Commit hooks.json for team consistency
5. **Update regularly** - Run `npx aiknowsys update` monthly

### Hook Management

1. **Review hook output** - Don't ignore warnings
2. **Adjust timeouts** - Increase for large codebases
3. **Monitor performance** - Watch hook execution time in Output panel
4. **Prune unused hooks** - Remove hooks that don't add value
5. **Share learnings** - Document custom hooks for team

---

## Related Documentation

- [SETUP_GUIDE.md](../SETUP_GUIDE.md#vscode-hooks-optional) - Initial setup
- [AGENTS.md](../AGENTS.md) - Manual workflow (hooks-free)
- [CODEBASE_ESSENTIALS.md](../CODEBASE_ESSENTIALS.md) - Project patterns
- [.github/skills/README.md](../.github/skills/README.md) - Available skills

---

## Summary

VSCode hooks provide **automated intelligence** for your development workflow:

**14 hooks** across **5 lifecycle events** provide:
- ✅ Session continuity (auto-load context)
- ✅ Quality enforcement (validation, TDD)
- ✅ Skill discovery (auto-suggest guides)
- ✅ Health monitoring (workspace, code quality)
- ✅ Collaboration safety (detect concurrent work)
- ✅ Performance tracking (detect regressions)
- ✅ Intelligence (migrations, doc sync)

**All hooks are optional** - disable any you don't need.  
**All data stays local** - no external services.  
**All code is auditable** - open source, transparent.

**Get started:** Hooks are installed automatically with `npx aiknowsys init`. Customize via `.github/hooks/hooks.json`.

---

*Part of AIKnowSys knowledge management system. See [README](../README.md) for full documentation.*
