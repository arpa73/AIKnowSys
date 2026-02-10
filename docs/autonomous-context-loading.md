# Making AI Agents Autonomously Use AIKnowSys Memories

**Problem:** AI agents don't automatically load session history, active plans, or learned patterns.

**Root Cause:** Memory systems are passive - agents must actively read them. Default behavior is "start fresh" unless explicitly instructed otherwise.

---

## ✅ Solution 1: MCP Tools (Best - Cross-Client)

**Status:** Already available in your system  
**Works with:** Claude Desktop, VS Code Copilot, Cursor

### Setup

1. **Ensure MCP server is running** (see `mcp-server/SETUP.md`)
2. **Copy custom instructions from template:**

**See [custom-instructions-template.md](custom-instructions-template.md) for:**
- ✅ Claude Desktop custom instructions (copy-paste ready)
- ✅ VS Code settings.json configuration
- ✅ Cursor `.cursorrules` template
- ✅ Windsurf `.windsurfrules` template
- ✅ Testing and troubleshooting guide

**Quick version for Claude Desktop:**

Go to Settings → Custom Instructions and add:

```markdown
### AIKnowSys Projects

When working in projects with `.aiknowsys/` directory:

**1. Session Start (MANDATORY - EVERY conversation):**
- Call `mcp_aiknowsys_get_active_plans()`
- Call `mcp_aiknowsys_get_recent_sessions({days:7})`
- Call `mcp_aiknowsys_get_critical_invariants()`
- Read @AGENTS.md for complete workflow
- Acknowledge: "✅ Context loaded: [brief summary]"

**2. TDD is mandatory:**
- RED: Write failing test FIRST
- GREEN: Implement minimal code
- REFACTOR: Clean up while tests green

**3. Prefer MCP tools over file reading** (10-100x faster)
```

### Benefits
- ✅ Works across all MCP clients
- ✅ 10-100x faster than file reading
- ✅ Structured data (no parsing needed)
- ✅ Cross-project portable

### Limitations
- ❌ Requires manual setup (custom instructions)
- ❌ Agents can still ignore instructions
- ✅ But combined with hooks (below), very effective

---

## ✅ Solution 2: VSCode Hooks (Auto-Injection)

**Status:** ⚠️ **Infrastructure ready but runtime blocked** (VSCode Copilot doesn't execute hooks yet)  
**Works with:** N/A - Waiting on VSCode/Copilot support

### Current Situation

Shell wrapper hooks are implemented in `.github/hooks/` and configured in `hooks.json`, but:
- ❌ VSCode Copilot doesn't actually execute them (as of Feb 2026)
- ❌ No runtime support for hook lifecycle events
- ✅ Infrastructure is ready for when support arrives
- ✅ Manual testing works: `node .github/hooks/auto-load-context.js`

### When Hooks Work (Future)

Once VSCode Copilot enables hook execution, context will auto-inject:

1. **No configuration needed** (already in `hooks.json`)
2. **Fully autonomous** (no manual prompting)
3. **Guaranteed context** every session start

### Current Workaround

**Use Solution 1 instead** (MCP tools + explicit instructions) - that works today.

### Testing Hook Infrastructure

While hooks don't auto-execute, you can verify they're working:

```bash
# Manual test
node .github/hooks/auto-load-context.js
# Should output: Active plan + recent session content
```

This confirms when VSCode enables hooks, your infrastructure is ready.

---

## ✅ Solution 3: Enhanced AGENTS.md Instructions

**Status:** Already in your AGENTS.md (can be strengthened)  
**Works with:** Any AI agent

### Current Protocol

Your AGENTS.md already says:

> **0️⃣ SESSION START: Check Context Continuity (FIRST!)**
> 
> 1. Check `.aiknowsys/plans/active-<username>.md`
> 2. Check `.aiknowsys/sessions/` for recent session files
> 3. If recent session exists, continue from where previous session ended

### Enhancement: Make It Mandatory Not Optional

Strengthen the language in AGENTS.md from "should" to "MUST":

```diff
- Before reading ESSENTIALS, check for active plan
+ 🚨 MANDATORY: Before ANY response, load active context:
+ 1. Read .aiknowsys/plans/active-<username>.md (REQUIRED)
+ 2. Read most recent session in .aiknowsys/sessions/ (REQUIRED)
+ 3. Acknowledge: "Loaded context from [date]: [brief summary]"
+ 4. If no active context: "No active plan or recent session found"
```

### Benefits
- ✅ Works with any AI agent
- ✅ Self-documenting workflow
- ✅ Clear accountability

### Limitations
- ❌ Relies on agent compliance
- ❌ Agents can still "forget" to check
- ✅ But combined with MCP tools, more effective

---

## ✅ Solution 4: Claude Projects (Claude-Specific)

**Status:** External to AIKnowSys  
**Works with:** Claude Desktop only

### Setup

1. Create a **Claude Project** for this repository
2. Add these files to Project Knowledge:
   - `.aiknowsys/CODEBASE_ESSENTIALS.md`
   - `.aiknowsys/plans/active-<username>.md`
   - Most recent `.aiknowsys/sessions/*.md` file

3. Add Project Instructions:
```markdown
This is an AIKnowSys-managed project. Before responding:
1. Check Project Knowledge for active plan
2. Review most recent session file
3. Follow rules in CODEBASE_ESSENTIALS.md
```

4. **Update Project Knowledge** manually after each session

### Benefits
- ✅ Native Claude feature (reliable)
- ✅ Context persists across conversations
- ✅ No code/config needed

### Limitations
- ❌ Manual updates required
- ❌ Claude Desktop only
- ❌ Not version-controlled
- ❌ Knowledge can get stale

---

## 🎯 Recommended Approach

**Use Solution 1 (MCP Tools) - only working solution currently:**

1. **Primary:** MCP Tools + Custom Instructions (Solution 1)
   - ✅ Works everywhere NOW
   - ✅ Fast and reliable
   - ✅ One-time setup
   - **Action:** Add to Claude/Copilot custom instructions

2. **Future:** VSCode Hooks (Solution 2)
   - ⚠️ Infrastructure ready, waiting on VSCode support
   - Will be fully autonomous when available
   - No action needed - already configured

3. **Fallback:** Enhanced AGENTS.md (Solution 3)
   - ✅ Works for agents without MCP
   - Already updated with explicit MCP instructions

**Testing Your Setup:**

```bash
# Test MCP tools work
# In Claude/Copilot chat:
"Call mcp_aiknowsys_get_recent_sessions({days:7}) and show me what you find"

# Test hooks infrastructure (manual - auto-execution doesn't work yet)
node .github/hooks/auto-load-context.js
# Should output: Active plan + recent session content
```

---

## 📊 Effectiveness Comparison

| Solution | Autonomy | Reliability | Setup Effort | Works Today? |
|----------|----------|-------------|--------------|--------------|
| MCP + Instructions | Medium | High | Low | ✅ **Yes** |
| VSCode Hooks | N/A | N/A | N/A | ❌ **Future** (infrastructure ready) |
| Enhanced AGENTS.md | Low | Medium | Low | ✅ **Yes** |
| Claude Projects | Medium | Medium | High | ✅ **Yes** (Claude only) |

**Bottom line:** Use MCP tools until VSCode Copilot enables hook execution.

---

## 🔍 Debugging: "Why isn't context loading?"

1. **Check MCP server status:**
   ```bash
   # Ask Claude: "What tools do you have access to?"
   # Should list mcp_aiknowsys_* tools
   ```

2. **Check hooks configuration:**
   ```bash
   cat .github/hooks/hooks.json
   # Should have sessionStart entry
   ```

3. **Check file permissions:**
   ```bash
   ls -la .github/hooks/auto-load-context.sh
   # Should be executable (rwxr-xr-x)
   ```

4. **Test hook manually:**
   ```bash
   node .github/hooks/auto-load-context.js
   # Should output context
   ```

5. **Check custom instructions:**
   - Claude Desktop: Settings → Custom Instructions
   - VS Code: Check settings.json for copilot.chat.context

---

**Result:** With these solutions, your AI agents will autonomously load session context at startup instead of starting from zero every time.
