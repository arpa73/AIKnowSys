# Knowledge System Setup Guide

**Version:** 0.2.0  
**Purpose:** Step-by-step guide for customizing your knowledge system templates

---

## Quick Start

AI-native onboarding is now conversational. Ask your AI assistant to initialize AIKnowSys using `.github/onboarding-setup.md`.

After setup, you'll have workflow files including:
- `AGENTS.md` - AI workflow and MCP-first instructions
- `CODEBASE_CHANGELOG.md` - Session history (will grow over time)
- `.aiknowsys/` context files - plans, sessions, learned patterns

**Two approaches to fill templates:**

1. **AI-Assisted** (Recommended): Use your AI assistant with `.github/onboarding-setup.md`
2. **Manual**: Follow the customization steps below

---

## Understanding Placeholders

All templates use `{{PLACEHOLDER}}` syntax for values you need to fill in.

### Common Placeholders

| Placeholder | Example Value | Where Used |
|-------------|---------------|------------|
| `{{PROJECT_NAME}}` | my-awesome-app | All templates |
| `{{DATE}}` | January 25, 2026 | All templates |
| `{{LANGUAGE}}` | TypeScript, Python | ESSENTIALS |
| `{{FRAMEWORK}}` | Next.js 14, Django 5 | ESSENTIALS |
| `{{VERSION}}` | Node 20.11.0, Python 3.12 | ESSENTIALS |
| `{{TEST_FRAMEWORK}}` | Jest, pytest | ESSENTIALS |
| `{{BUILD_TOOL}}` | Vite, webpack | ESSENTIALS |
| `{{*_CMD}}` | npm test, pytest | ESSENTIALS |
| `{{*_DESCRIPTION}}` | Your explanation | ESSENTIALS |
| `{{*_EXAMPLE}}` | Real code snippets | ESSENTIALS |

### Placeholder Categories

- **`{{*_CMD}}`** - Actual commands to run (e.g., `{{TEST_CMD}}` → `npm test`)
- **`{{*_DESCRIPTION}}`** - Your explanations (e.g., `{{PATTERN_DESC}}` → "We use Repository pattern...")
- **`{{*_EXAMPLE}}`** - Real code examples (e.g., `{{CODE_EXAMPLE}}` → actual code from your project)
- **`{{*_STANDARD}}`** - Your conventions (e.g., `{{NAMING_STANDARD}}` → "camelCase for variables")

---

## ⚠️ CRITICAL RULES FOR CUSTOMIZATION

### ✅ DO:

1. **Replace placeholders with REAL values**
   ```markdown
   ❌ BAD:  {{TEST_CMD}} → "Run your tests"
   ✅ GOOD: {{TEST_CMD}} → npm test
   ```

2. **Use actual code from YOUR project**
   ```markdown
   ❌ BAD:  Generic example that could apply to any project
   ✅ GOOD: Actual function from src/utils/validator.ts with line numbers
   ```

3. **Keep section headings EXACTLY as written**
   ```markdown
   ❌ BAD:  "Testing Patterns" → "Testing Guidelines"
   ✅ GOOD: "Testing Patterns" stays "Testing Patterns"
   ```

4. **Make content specific to YOUR codebase**
   ```markdown
   ❌ BAD:  "Follow best practices for error handling"
   ✅ GOOD: "All API routes use try/catch → handleApiError(err, res)"
   ```

5. **Remove sections that don't apply**
   - If you don't have a database, remove Database section
   - If no deployment pipeline, remove Deployment section
   - Don't leave placeholder-filled sections

### ❌ DON'T:

1. **Change section headings** - AI agents rely on exact headings
2. **Replace placeholders with other placeholders** - Use real values
3. **Add generic content** - Everything should be project-specific
4. **Skip sections** - Fill them completely or remove them

---

## Template Customization Steps

### MCP + AGENTS.md Workflow Setup

Use this quick sequence after conversational onboarding completes:

**Step 1: Configure MCP Server**
- Follow [mcp-server/SETUP.md](mcp-server/SETUP.md)
- Point MCP at your project root
- Verify `mcp_aiknowsys_get_critical_invariants()` responds

**Step 2: Verify Runtime Guidance**
- Open `AGENTS.md`
- Confirm session start protocol references MCP tools, not legacy ESSENTIALS workflow
- Ensure team-specific trigger words and skills are up to date

**Step 3: Validate Deliverables**
Run:
```bash
npx aiknowsys validate-deliverables
```

This checks templates and non-template equivalents are in sync.

**Step 4: Validate Development Commands**
Use MCP validation matrix as source of truth:

```typescript
mcp_aiknowsys_get_validation_matrix()
```

Then run the required commands for your stack (typically `npm test` and `npm run lint`).

---

### AGENTS.md

**Step 1: Review Validation Matrix**

Use MCP as the source of truth for validation commands: `mcp_aiknowsys_get_validation_matrix()`.
Keep AGENTS concise and reference MCP calls instead of duplicating long command lists.

**Step 2: Remove Template Sections** (if present)

If you initialized from template, remove these sections:
- ✅ Pre-Commit Validation Checklist (with `{{VALIDATION_CMD_1}}` placeholders)
- 🔍 Troubleshooting Validation Failures (with `{{SINGLE_TEST_CMD}}` placeholders)
- 📝 Customization Instructions section

These are setup instructions, not runtime agent guidance. Once AGENTS.md points to MCP tools, it doesn't need placeholder-filled checklists.

**Step 3: Add Custom Skills to Trigger Words Table** (optional)

If you created custom skills in `.github/skills/`, add them to the skill mapping table.

**Replace `{{SKILL_MAPPING}}` with:**

```markdown
| Trigger Words | Skill to Read | Why |
|---------------|---------------|-----|
| "add command", "new feature", "implement" | `feature-implementation` | Proper command structure |
| "refactor", "clean up", "simplify" | `code-refactoring` | Test-driven refactoring |
| "update deps", "upgrade packages" | `dependency-updates` | Safe upgrade procedures |
| "update docs", "changelog" | `documentation-management` | AI-optimized docs |
| "create skill", "new skill" | `skill-creator` | Proper skill format |
| "write tests", "TDD", "test first" | `tdd-workflow` | Test-driven development |
| "test fail", "validation error", "build broken" | `validation-troubleshooting` | Debug validation failures |
```

Add your custom skills:
```markdown
| "deploy", "release" | `deployment-workflow` | Release procedure |
| "cache", "redis" | `redis-patterns` | Caching best practices |
```

**Step 4: Verify Best Practices Section**

Ensure the "General Best Practices" section matches your project culture:
```markdown
1. **Read first, code second** - Always load MCP critical invariants first
2. **Update proactively** - Don't wait for user to ask
3. **Be concise** - Keep summaries short
```

**What to keep:**
- ✅ Session Start Protocol (critical workflow)
- ✅ Quick Reference Checklist
- ✅ 6-step workflow
- ✅ TDD Self-Audit
- ✅ Continuous Learning protocol
- ✅ Skills Workflow section

**What to remove:**
- ❌ Any `{{PLACEHOLDER}}` syntax
- ❌ "Customization Instructions" section
- ❌ Pre-commit checklist with placeholders
- ❌ Troubleshooting section with placeholders

---

### CODEBASE_CHANGELOG.md

**No immediate customization needed!**

- This file grows organically as you work
- Add a new session entry after each coding session
- See template for entry format

---

## Template Size: Minimal vs Full

### Minimal Template (10 sections)
**Best for:**
- Learning projects
- Prototypes
- Simple CLI tools
- Solo developer projects
- Internal scripts

**Sections removed:**
- Security Considerations
- Performance Guidelines
- Accessibility Standards

**When to upgrade to full:**
- Project goes to production
- Handling sensitive data
- Performance becomes critical
- Building user-facing UI

### Full Template (13+ sections)
**Best for:**
- Production applications
- Team projects
- Web applications
- APIs handling user data
- Performance-critical systems

**Additional sections:**
- Security (auth, data protection, vulnerabilities)
- Performance (optimization, caching, monitoring)
- Accessibility (WCAG, screen readers, keyboard nav)

---

## Working with AI Assistants

### AI-Assisted Setup (Recommended)

After conversational onboarding, use a prompt like:

```
🤖 AI Assistant Prompt:
   Copy this prompt to your AI assistant to complete setup:
   
   "I just set up AIKnowSys for my project...
   [detailed instructions]"
```

**Copy and paste this entire prompt to:**
- GitHub Copilot Chat
- Claude Desktop
- ChatGPT
- Cursor
- Any AI coding assistant

The AI will:
1. Read your files
2. Scan your codebase
3. Fill in all placeholders with real values
4. Add project-specific examples

### Manual AI Assistance

If you prefer more control:

```
"I have an AGENTS.md workflow file. Please:
1. Read the file
2. Scan my package.json and tooling files and update workflow references for:
   - Runtime version
   - Framework and version
   - Build/test commands
3. Keep all section headings unchanged
4. Replace {{PLACEHOLDERS}} with actual values from my code"
```

---

## Validation

After customizing, verify:

1. **No placeholders remain** (search for `{{`)
   ```bash
   grep -n "{{" AGENTS.md
   # Should return nothing or only intentional examples
   ```

2. **Validation Matrix commands work**
   ```bash
   # Test each command from your matrix
   npm test
   npm run lint
   # etc.
   ```

3. **Section headings are unchanged**
   - AI agents rely on exact section names
   - "Testing Patterns" not "Testing Guidelines"

4. **All content is project-specific**
   - No generic advice like "follow best practices"
   - Every example references YOUR code

---

## Common Mistakes

### ❌ Mistake 1: Leaving Generic Placeholders
```markdown
BAD:  {{TEST_ORGANIZATION}} → "Tests should be organized properly"
GOOD: {{TEST_ORGANIZATION}} → "Tests mirror src/ structure: src/auth/login.ts → tests/auth/login.test.ts"
```

### ❌ Mistake 2: Changing Section Headings
```markdown
BAD:  ## Testing Patterns → ## Testing Guidelines
GOOD: ## Testing Patterns (keep exact heading)
```

### ❌ Mistake 3: Generic Content
```markdown
BAD:  "Use proper error handling"
GOOD: "All async functions use try/catch → handleError(err, { context: 'functionName' })"
```

### ❌ Mistake 4: Incomplete Examples
```markdown
BAD:  "See utils folder"
GOOD: "See [src/utils/validator.ts](src/utils/validator.ts#L45-L67) for Joi schema pattern"
```

---

## 🚀 First Implementation: What to Build Next

**You've finished setup! Now what?**

Here's the recommended order for your first implementation session:

### 1️⃣ Test Your Validation Matrix (5 minutes)

Before building anything, verify your validation commands work:

```bash
# Run each command from your Validation Matrix
npm test               # Should pass (even if no tests yet)
npm run lint          # Should pass
npm run type-check    # Should pass
npm run build         # Should succeed
```

**Why this matters:** Ensures you can validate your work before you start coding.

### 2️⃣ Set Up Your First Feature Branch (2 minutes)

```bash
git checkout -b feature/hello-world
```

**Why this matters:** Practice the workflow you'll use for all features.

### 3️⃣ Write Your First Test (10 minutes)

Pick the simplest possible feature (e.g., a "hello world" endpoint or utility function):

```bash
# Example for Node.js API
# test/api/health.test.js
test('GET /health returns 200', async () => {
  const response = await request(app).get('/health');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: 'ok' });
});
```

**Run it:** `npm test` → Should fail (RED phase) ✅

**Why this matters:** Validates your test setup works and practices TDD.

### 4️⃣ Implement the Feature (10 minutes)

Now write the minimal code to make the test pass:

```javascript
// src/routes/health.js
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

**Run it:** `npm test` → Should pass (GREEN phase) ✅

**Why this matters:** Completes the RED-GREEN cycle and proves the workflow works.

### 5️⃣ Run Full Validation (2 minutes)

```bash
npm test              # Tests pass
npm run lint         # Code style OK
npm run type-check   # Types OK (if applicable)
npm run build        # Build succeeds
```

**Why this matters:** Practice the validation ritual you'll use for every change.

### 6️⃣ Update Changelog (5 minutes)

Add your first session entry to CODEBASE_CHANGELOG.md:

```markdown
## Session: First Implementation (Jan 25, 2026)

**Goal**: Validate knowledge system workflow with simple feature

**Changes**:
- [test/api/health.test.js](test/api/health.test.js): Added health check test
- [src/routes/health.js](src/routes/health.js): Implemented /health endpoint

**Validation**:
- ✅ Tests: 1/1 passing
- ✅ Lint: No errors
- ✅ Build: Success

**Key Learning**: TDD workflow works! Writing test first revealed that Express wasn't configured yet.
```

**Why this matters:** Creates your first historical record and practices documentation.

### 7️⃣ Commit and Push (2 minutes)

```bash
git add .
git commit -m "feat: add health check endpoint

- Add GET /health endpoint returning {status: 'ok'}
- Add test for health endpoint
- Validates knowledge system workflow

Tests: 1/1 passing
Validation: All checks pass"

git push origin feature/hello-world
```

**Why this matters:** Establishes good commit message habits from day one.

---

## 🎯 What You've Accomplished

After completing these steps, you've:

✅ Validated your entire toolchain works  
✅ Practiced TDD (RED → GREEN workflow)  
✅ Ran the full validation matrix  
✅ Updated the changelog  
✅ Made your first proper commit  

**Most importantly:** You've proven the knowledge system workflow works end-to-end!

---

## 📚 Next Steps

Now you're ready to build real features:

1. **Check AGENTS.md** - Review the workflow for each session
2. **Read relevant skills** - Before implementing features, check `.github/skills/`
3. **Follow the process** - Load MCP invariants → Plan → Code → Test → Validate → Document
4. **Keep iterating** - Each session makes the knowledge system more valuable

### Keeping AGENTS Lean

**⚠️ Important:** Keep AGENTS concise and MCP-first.

**After customization:**
```bash
# Check project guidance quality
npx aiknowsys check

# If guidance is too verbose, analyze what can be extracted
npx aiknowsys compress-essentials --analyze

# Extract verbose sections to docs/patterns/
npx aiknowsys compress-essentials --auto
```

**Prevention tips:**
- Keep code examples under 15 lines
- Extract detailed guides to `docs/patterns/*.md`
- Link from AGENTS/docs instead of embedding large blocks
- Run `npx aiknowsys check` monthly to catch bloat early

**Why this matters:**
- Faster AI context loading
- Easier to navigate and maintain
- Better focus on core patterns vs implementation details

See [learned skill](.aiknowsys/learned/essentials-compression.md) for complete compression workflow.

---

## VSCode Hooks (Optional)

**What are VSCode hooks?**  
GitHub Copilot coding agent supports hooks that run automatically during session lifecycle. AIKnowSys installs hooks for automated session tracking.

**Installed hooks (`.github/hooks/`):**

**Session Management (Phase 1):**
- `session-start.js` - Auto-detect and load recent sessions
- `session-end.js` - Auto-create/update today's session file

**Quality Enforcement (Phases 2-3):**
- `validation-reminder.cjs` (Stop) - Prevent completion without tests
- `tdd-reminder.cjs` (PreToolUse) - Write tests FIRST reminder

**Skill Assistance (Phase 4):**
- `skill-detector.cjs` (UserPromptSubmitted) - Auto-suggest relevant skills
- `skill-prereq-check.cjs` (PreToolUse) - Verify skill prerequisites

**Health Monitoring (Phase 5):**
- `workspace-health.cjs` (SessionStart) - Disk space, permissions checks
- `quality-health.cjs` (SessionStart) - Lint, test, type errors detection

**Collaboration (Phase 6):**
- `collaboration-check.mjs` (SessionStart) - Detect concurrent work

**Performance & Dependencies (Phase 7):**
- `performance-monitor.cjs` (SessionEnd) - Track test performance, detect regressions

**Advanced Intelligence (Phase 8):**
- `migration-check.cjs` (SessionStart) - Version mismatch detection
- `doc-sync.cjs` (SessionStart) - Documentation staleness alerts

**Git Collaboration Hooks (For Multi-Developer Teams):**
- `learned-reminder.cjs` (pre-commit) - Remind to share valuable personal patterns
- `plan-reminder.cjs` (pre-commit) - Show teammates' active plans

**How they work:**
1. **Session Start**: Hooks load context, check workspace health, detect version mismatches, stale docs, and concurrent work
2. **User Prompt**: Skill detector suggests relevant guides based on your request
3. **Before Edits**: TDD reminder checks for tests, skill prereq check verifies requirements
4. **Session End**: Performance monitor tracks test metrics, session-end updates timestamp
5. **Before Completion**: Validation reminder ensures tests ran before claiming "done"
6. **Git Pre-Commit**: Learned-reminder prompts sharing valuable patterns, plan-reminder shows teammates' work

**Benefits:**
- Automatic session file management and context continuity
- Quality enforcement (validation, TDD workflow)
- Skill discovery (auto-suggest relevant guides)
- Health monitoring (workspace issues, code quality)
- Collaboration safety (detect concurrent work)
- Performance tracking (test regressions >20% slower)
- Intelligence (version mismatches, stale documentation)

**CI reinforcement (GitHub Actions):**
- `.github/workflows/tdd-compliance.yml` enforces TDD compliance by failing when `lib/` logic changes are introduced without corresponding `test/` changes (on PRs and pushes)
- `.github/workflows/ci.yml` includes `vitest-routing-guard`, which runs:
   - `npx vitest run test/vitest-project-routing.test.ts`
- This prevents regressions where tests importing `../../dist/lib/` drift out of `post-build-tests` or back into `source-tests`

**Example hook output:**

*Validation Reminder:*
```
⚠️  Validation Reminder
Code changes detected in implementation files, but no validation found.
Please run validation before claiming work is complete:
  npm test
  npm run test
  node --test test/your-test.test.js
Use mcp_aiknowsys_get_validation_matrix() for required checks.
```

*TDD Reminder:*
```
⚠️  TDD Reminder
About to edit: lib/commands/new-feature.js
Expected test: test/new-feature.test.js
Test file doesn't exist or hasn't been edited recently (10min window).
Remember: Write test FIRST (RED), then implement (GREEN), then refactor (REFACTOR).
See: .github/skills/tdd-workflow/SKILL.md for TDD patterns.
```

*Learned Reminder (pre-commit):*
```
📚 Learned Patterns Reminder
──────────────────────────────────────────────────

💡 You have 5 unshared personal patterns:
   • api-retry-pattern
   • vue-composable-best-practices
   • django-filter-optimization
   • sql-join-patterns
   • error-handling-conventions

⭐ High-value patterns worth sharing:
   • api-retry-pattern (used 8 times)
   • vue-composable-best-practices (used 6 times)

Share with team: npx aiknowsys share-pattern <name>
List patterns: npx aiknowsys list-patterns
```

*Plan Reminder (pre-commit):*
```
👥 Your Teammates Are Working On:
──────────────────────────────────────────────────
• alice-smith: Implementing OAuth authentication
• bob-jones: Refactoring user profile components
• carol-chen: Adding search functionality

Avoid duplicate work - coordinate before starting similar tasks!
```

**Limitations:**
- Only works with VSCode + GitHub Copilot coding agent
- Other AI assistants need manual session management
- Hooks create files, you still populate content
- Git hooks require manual setup: `git config core.hooksPath .github/hooks`

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| Hooks not running | Verify `.github/hooks/hooks.json` exists |
| "Command not found" | Check Node.js is installed |
| No session reminders | Check VSCode Output → GitHub Copilot |
| Hook timeout | Increase `timeoutSec` in hooks.json (current: 2-5s) |
| False validation warnings | Hook detects edits in `lib/`, `bin/`, `templates/` |
| TDD reminder too aggressive | Adjust 10-minute window in tdd-reminder.cjs |
| Performance regression false positives | Adjust threshold in performance-monitor.cjs |
| Stale doc warnings too aggressive | Adjust STALENESS_THRESHOLD_DAYS in doc-sync.cjs |
| Git hooks not running | Run `git config core.hooksPath .github/hooks` |
| Learned-reminder not showing | Check `.aiknowsys/personal/<username>/` exists |
| Plan-reminder not showing | Requires Phase 2 (multi-developer plans) |

**For detailed information:**  
See [VSCode Hooks Guide](docs/vscode-hooks-guide.md) for complete reference, examples, and customization.

---

### Context7 MCP Integration (Optional)

**What is Context7?**  
Context7 is an MCP (Model Context Protocol) server that provides up-to-date library and framework documentation to AI assistants, preventing outdated code and hallucinated APIs.

**Benefits with AIKnowSys:**
- ✅ Validates learned skills against current library versions
- ✅ Prevents deprecated patterns in scaffolding
- ✅ Version-specific documentation during planning
- ✅ Auto-detects API drift in learned patterns

**Quick Setup:**

1. **Install Context7 MCP** (for Claude Desktop/Cursor):
   ```bash
   npm install -g @context7/mcp-server
   ```

2. **Configure your AI client:**
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "npx",
         "args": ["-y", "@context7/mcp-server"]
       }
     }
   }
   ```

3. **Verify:**
   Ask your AI: "Use Context7 to check Next.js 15 documentation"

**Usage Examples:**

*Validating learned skills:*
```
Review .github/skills/nextjs-middleware/SKILL.md
Use Context7 to check if referenced APIs are still current.
```

*Planning with current docs:*
```
@Planner Plan authentication for Next.js 15
Use Context7 for current middleware and route handler patterns.
```

*Scaffolding verification:*
```
After onboarding a Next.js project
"Use Context7 to verify template uses current conventions"
```

**Installed Skills:**
- `context7-usage` - When and how to use Context7 with AIKnowSys
- `skill-validation` - Validate learned skills against current docs

**For complete guide:**  
See [Context7 Integration Guide](docs/context7-integration.md) for detailed setup, workflows, and best practices.

---

### Disabling Hooks

Delete or rename `.github/hooks/hooks.json`. Manual session management still works via AGENTS.md.
- Learns from conversation context (e.g., "continue refactoring" → code-refactoring)
- Tracks skill usage patterns in `.aiknowsys/skill-usage.json`

**How it works:**
1. **Proactive detection** (`userPromptSubmitted` hook): Analyzes your message for skill keywords
2. **Reactive enforcement** (`preToolUse` hook): Checks files you're editing for skill requirements
3. **Multi-strategy matching**: Exact keywords, fuzzy matching, conversation continuity

**Example output:**
```
[Skills] 📚 Auto-loaded: code-refactoring
[Skills] AI will follow these workflows automatically
[Skills]   - code-refactoring: Test-driven refactoring workflow
[Skills]     Path: .github/skills/code-refactoring/SKILL.md

[Skills] ⚠️ Skill required: dependency-updates
[Skills]   Reason: Editing package.json
[Skills]   Please confirm: @dependency-updates
```

**How to customize:**

Edit `.github/hooks/config.json` to add/modify skill triggers:

```json
{
  "skills": {
    "my-custom-skill": {
      "path": "my-custom-skill/SKILL.md",
      "description": "Deploy to production workflow",
      "triggers": {
        "keywords": ["deploy", "release", "production"],
        "files": ["Dockerfile", "*.yaml", "deploy.sh"]
      },
      "autoLoad": true,
      "priority": "high",
      "requiresConfirmation": false
    }
  },
  "skillDetection": {
    "enabled": true,
    "fuzzyMatchThreshold": 0.7,
    "contextWindowSize": 5
  }
}
```

**Configuration options:**
- `autoLoad`: Load skill automatically vs suggest with confirmation
- `priority`: `high`, `medium`, `low` (affects display order)
- `requiresConfirmation`: Show `@skill-name` tag for user to approve
- `fuzzyMatchThreshold`: 0.0-1.0, lower = more lenient matching
- `contextWindowSize`: How many messages to analyze for continuity

**Pre-configured skills:**
- `code-refactoring` → Keywords: refactor, clean up, simplify
- `dependency-updates` → Files: package.json, requirements.txt, Cargo.toml
- `feature-implementation` → Keywords: add feature, implement, new feature
- `tdd-workflow` → Keywords: write test, TDD, test first
- `validation-troubleshooting` → Keywords: test fail, validation error
- `documentation-management` → Keywords: update docs, changelog

**Analytics:**

Skill usage is tracked in `.aiknowsys/skill-usage.json`:
```json
{
  "code-refactoring": {
    "count": 12,
    "lastUsed": "2026-01-31T18:30:00Z",
    "autoLoaded": 8,
    "manuallyRequested": 4
  }
}
```

Use this data to:
- Identify frequently needed skills
- Optimize trigger keywords
- Share team patterns

**Disabling skill detection:**

Set `"enabled": false` in config.json, or remove the hooks:
```json
{
  "skillDetection": {
    "enabled": false
  }
}
```

**Disabling hooks:**  
Delete or rename `.github/hooks/hooks.json`. Manual session management still works via AGENTS.md.

**Manual installation (if skipped during onboarding):**
```bash
# Copy hook templates
cp -r node_modules/aiknowsys/templates/hooks/ .github/hooks/

# Or enable hooks feature
npx aiknowsys enable vscodeHooks
```

**See also:**
- [GitHub Copilot Hooks Documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)
- `.aiknowsys/sessions/README.md` - Session file format and usage

---

## Getting Help

- **Examples**: See [examples/filled-simple-api](examples/filled-simple-api) for a realistic filled template
- **Documentation**: Read [docs/customization-guide.md](docs/customization-guide.md)
- **Issues**: Report problems at https://github.com/arpa73/aiknowsys/issues

---

## Quick Reference

**After setup:**
```bash
# Verify no placeholders remain
grep -n "{{" AGENTS.md

# Test validation commands
npm test                    # (or your test command)

# Commit your customized templates
git add AGENTS.md CODEBASE_CHANGELOG.md
git commit -m "docs: Initialize knowledge system"
```

**During development:**
- Load MCP critical invariants at session start
- Update patterns when they change
- Add entries to CODEBASE_CHANGELOG.md after sessions
- Let AI agents guide you via AGENTS.md workflow

---

*This guide is part of aiknowsys. See [README](README.md) for full documentation.*
