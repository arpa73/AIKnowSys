# Custom Instructions Template

**Purpose:** Environment-specific instructions that complement AGENTS.md

Copy the appropriate section below into your AI client's custom instructions.

---

## Claude Desktop Custom Instructions

```markdown
### AIKnowSys Projects

When working in projects with `.aiknowsys/` directory:

**1. Session Start Protocol (MANDATORY - EVERY conversation):**
- Call `mcp_aiknowsys_get_active_plans()`
- Call `mcp_aiknowsys_get_recent_sessions({days:7})`
- Call `mcp_aiknowsys_get_critical_invariants()`
- Acknowledge: "✅ Context loaded: [brief summary]"

**2. Read AGENTS.md for complete workflow:**
- Full workflow protocol in @AGENTS.md
- Read it at session start after loading context
- Follow all steps: Read → Plan → Implement → Validate → Document

**3. TDD is mandatory:**
- RED: Write failing test FIRST
- GREEN: Implement minimal code
- REFACTOR: Clean up while tests green
- Never skip validation before claiming done

**4. MCP Tools Performance:**
- Prefer `mcp_aiknowsys_*` tools over file reading (10-100x faster)
- Use for all queries of plans, sessions, skills
- Fall back to file reading only if MCP unavailable
```

### How to Set Up (Claude Desktop)

1. Open Claude Desktop
2. Click Settings (gear icon)
3. Go to "Custom Instructions"
4. Paste the markdown above
5. Save

---

## VS Code Settings (GitHub Copilot)

Add to your User Settings (`settings.json`):

```json
{
  "github.copilot.chat.systemPrompt": "For projects with .aiknowsys/ directory:\n\n1. MANDATORY Session Start:\n   - Call mcp_aiknowsys_get_active_plans()\n   - Call mcp_aiknowsys_get_recent_sessions({days:7})\n   - Call mcp_aiknowsys_get_critical_invariants()\n   - Read @AGENTS.md for complete workflow\n\n2. TDD Required:\n   - RED: Write test FIRST\n   - GREEN: Implement\n   - REFACTOR: Clean up\n   - Validate before claiming done\n\n3. Prefer MCP tools over file reading (10-100x faster)"
}
```

**Note:** VS Code custom instructions are more limited than Claude Desktop. The main benefit is the session start reminder.

### How to Set Up (VS Code)

1. `Cmd/Ctrl + Shift + P`
2. Search "Preferences: Open User Settings (JSON)"
3. Add the JSON above
4. Save file

---

## Cursor IDE

Add to your `.cursorrules` file in project root:

```markdown
# AIKnowSys Workflow

## Session Start (MANDATORY)
1. Call mcp_aiknowsys_get_active_plans()
2. Call mcp_aiknowsys_get_recent_sessions({days:7})
3. Call mcp_aiknowsys_get_critical_invariants()
4. Read @AGENTS.md for complete workflow

## TDD Required
- RED: Write test FIRST
- GREEN: Implement minimal code
- REFACTOR: Clean while green
- Validate before claiming done

## Performance
Prefer mcp_aiknowsys_* tools over file reading (10-100x faster)
```

### How to Set Up (Cursor)

1. Create `.cursorrules` in project root (already gitignored)
2. Paste the markdown above
3. Cursor auto-loads it per-project

---

## Windsurf IDE

Add to your `.windsurfrules` file in project root:

```markdown
# AIKnowSys Workflow

## Session Start (MANDATORY)
1. Call mcp_aiknowsys_get_active_plans()
2. Call mcp_aiknowsys_get_recent_sessions({days:7})
3. Call mcp_aiknowsys_get_critical_invariants()
4. Read @AGENTS.md for complete workflow

## TDD Required
- RED: Write test FIRST
- GREEN: Implement
- REFACTOR: Clean up
- Validate before done

## Performance
Prefer mcp_aiknowsys_* tools over file reading (10-100x faster)
```

### How to Set Up (Windsurf)

1. Create `.windsurfrules` in project root (already gitignored)
2. Paste the markdown above
3. Windsurf auto-loads it per-project

---

## OpenCode

**Good news:** OpenCode reads `AGENTS.md` by default! When you run `/init`, it creates one automatically.

**For AIKnowSys projects:**

OpenCode already loads your `AGENTS.md`, but you can add **supplementary instructions** via `opencode.json`:

### Option 1: Project-Level Config (Recommended)

Create `opencode.json` in your project root:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "AGENTS.md",
    "docs/session-start-protocol.md"
  ]
}
```

### Option 2: Create Supplementary Instructions File

Create `docs/session-start-protocol.md`:

```markdown
# Session Start Protocol for OpenCode

## MANDATORY - Every Session

Before starting ANY implementation:

1. **Load Context:**
   - Check `.aiknowsys/plans/active-<username>.md` for active plan
   - Read most recent `.aiknowsys/sessions/*.md` file
   - Review critical invariants from CODEBASE_ESSENTIALS.md

2. **Acknowledge Context:**
   - "✅ Context loaded: [active plan name]"
   - "Recent session from [date]: [brief summary]"

3. **TDD Required:**
   - RED: Write failing test FIRST
   - GREEN: Implement minimal code
   - REFACTOR: Clean up while tests green
   - Never skip validation before claiming done

4. **Then proceed** with user's request
```

Then reference it in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["docs/session-start-protocol.md"]
}
```

### Option 3: Global Config (All Projects)

Edit `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "~/.config/opencode/aiknowsys-session-start.md"
  ]
}
```

### Why OpenCode is Different

✅ **Already reads AGENTS.md** - No duplicate setup needed  
✅ **Supports MCP tools natively** - Can call `mcp_aiknowsys_*` tools  
✅ **Config-based instructions** - Cleaner than embedding in AGENTS.md  
✅ **Glob patterns** - `"packages/*/AGENTS.md"` for monorepos

**Note:** OpenCode's `/init` command already creates AGENTS.md. For AIKnowSys, your existing AGENTS.md is already loaded. The supplementary instructions are for session-start automation that can't be in AGENTS.md (since agents might not read it immediately).

---

## Codeium

Add to your `.codeium/config.json` or workspace settings:

```json
{
  "chat": {
    "systemPrompt": "For projects with .aiknowsys/ directory:\n\n1. MANDATORY Session Start:\n   - Call mcp_aiknowsys_get_active_plans()\n   - Call mcp_aiknowsys_get_recent_sessions({days:7})\n   - Call mcp_aiknowsys_get_critical_invariants()\n   - Read @AGENTS.md for complete workflow\n\n2. TDD Required:\n   - RED: Write test FIRST\n   - GREEN: Implement\n   - REFACTOR: Clean up\n\n3. Prefer MCP tools over file reading (10-100x faster)"
  }
}
```

**Note:** Codeium's custom instruction support varies by IDE. Check Codeium settings in your editor.

---

## Continue.dev

Add to your `~/.continue/config.json`:

```json
{
  "systemMessage": "For projects with .aiknowsys/ directory:\n\n1. MANDATORY Session Start:\n   - Call mcp_aiknowsys_get_active_plans()\n   - Call mcp_aiknowsys_get_recent_sessions({days:7})\n   - Call mcp_aiknowsys_get_critical_invariants()\n   - Read @AGENTS.md for complete workflow\n\n2. TDD Required:\n   - RED: Write test FIRST\n   - GREEN: Implement minimal code\n   - REFACTOR: Clean up while tests green\n\n3. Prefer MCP tools over file reading (10-100x faster)"
}
```

### How to Set Up (Continue.dev)

1. Open Continue settings (`Cmd/Ctrl + Shift + P` → "Continue: Open Config")
2. Add `systemMessage` field as shown above
3. Save and reload

---

## Sourcegraph Cody

Add to workspace `.vscode/settings.json`:

```json
{
  "cody.customConfiguration": {
    "customHeaders": {
      "systemPrompt": "For projects with .aiknowsys/ directory:\n\n1. Session Start (MANDATORY):\n   - Call mcp_aiknowsys_get_active_plans()\n   - Call mcp_aiknowsys_get_recent_sessions({days:7})\n   - Call mcp_aiknowsys_get_critical_invariants()\n   - Read @AGENTS.md\n\n2. TDD Required: RED → GREEN → REFACTOR\n\n3. Prefer MCP tools (10-100x faster)"
    }
  }
}
```

**Note:** Cody's custom instructions are configured per-workspace, not globally.

---

## Tabnine

Tabnine doesn't support global custom instructions, but you can:

1. Add project-level documentation in `.tabnine/config.json`:

```json
{
  "project_context": {
    "files": [
      "AGENTS.md",
      ".aiknowsys/CODEBASE_ESSENTIALS.md"
    ]
  }
}
```

2. Tabnine will index these files automatically for context-aware suggestions

---

## Aider

For Aider CLI tool, add to your shell profile or `.aider.conf.yml`:

```yaml
# .aider.conf.yml
system-prompt: |
  For projects with .aiknowsys/ directory:
  
  1. MANDATORY Session Start:
     - Call mcp_aiknowsys_get_active_plans()
     - Call mcp_aiknowsys_get_recent_sessions({days:7})
     - Call mcp_aiknowsys_get_critical_invariants()
     - Read @AGENTS.md for complete workflow
  
  2. TDD Required:
     - RED: Write test FIRST
     - GREEN: Implement minimal code
     - REFACTOR: Clean up while tests green
  
  3. Prefer MCP tools over file reading (10-100x faster)
```

Or pass via command line:
```bash
aider --system "For projects with .aiknowsys/: [instructions]"
```

---

## Why Both AGENTS.md and Custom Instructions?

**Custom Instructions:** Quick reminders for high-frequency actions
- Session start MCP calls (most important!)
- TDD enforcement
- Performance hints (use MCP over file reading)

**AGENTS.md:** Complete workflow reference
- Full protocol (Read → Plan → Implement → Validate → Document)
- Detailed skills integration
- Emergency protocols
- Multi-agent handoffs
- All edge cases and patterns

**Workflow:**
1. Custom instructions ensure MCP context loads at start
2. AGENTS.md provides complete workflow after context loaded
3. Custom instructions keep session start fast (~30 seconds vs 5 minutes)

---

## Testing Your Setup

After adding custom instructions, test with a new conversation:

**Test prompt:**
```
What context have you loaded?
```

**Expected response:**
```
✅ Context loaded:
- Active plan: [Plan name] (status: ACTIVE)
- Recent sessions: Found 2 sessions from last 7 days
- Critical invariants: Loaded 8 invariants
- AGENTS.md: Read workflow protocol

Ready to proceed. What would you like to work on?
```

If agent doesn't call MCP tools, your custom instructions may need adjustment or MCP server isn't configured.

---

## Troubleshooting

### "Agent didn't load context"

**Cause:** Custom instructions ignored or MCP not available

**Solutions:**
1. Check MCP server is running: "What tools do you have?"
2. Should list `mcp_aiknowsys_*` tools
3. If missing, check MCP setup: `mcp-server/SETUP.md`
4. Manually prompt: "Follow session start protocol from custom instructions"

### "MCP calls fail"

**Cause:** MCP server not started

**Solutions:**
1. Claude Desktop: Restart app (reloads MCP config)
2. VS Code: Reload window (`Cmd/Ctrl + Shift + P` → "Reload Window")
3. Check `mcp-server/SETUP.md` for configuration

### "Too verbose at session start"

**Cause:** Agent explaining every MCP call

**Solutions:**
Add to custom instructions:
```
Be concise at session start - just load context and confirm ready.
```

---

## Maintenance

**When to update custom instructions:**
- ✅ New mandatory MCP tools added
- ✅ Critical workflow changes (e.g., validation matrix updated)
- ✅ Performance optimization discovered

**What stays in AGENTS.md:**
- ❌ Detailed step-by-step workflows
- ❌ Skills integration
- ❌ Edge cases and troubleshooting
- ❌ Multi-agent protocols

Keep custom instructions **short and high-impact** - full details go in AGENTS.md.
