# AIKnowSys MCP Server Setup Guide

**Quick Start:** Get AI agents using your knowledge system in 5 minutes.

---

## Prerequisites

1. **Node.js 20+** installed
2. **MCP-compatible client** (Claude Desktop, VS Code with Copilot, or Cursor)
3. **This repository** cloned locally

---

## Step 1: Build the MCP Server

```bash
cd mcp-server
npm install
npm run build
```

**Verify build succeeded:**
```bash
ls -la dist/mcp-server/src/index.js  # Should exist
```

---

## Step 2: Configure Your MCP Client

Choose your client below:

### Option A: Claude Desktop (Recommended)

**1. Find your Claude Desktop config file:**

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**2. Add the AIKnowSys server:**

```json
{
  "mcpServers": {
    "aiknowsys": {
      "command": "node",
      "args": [
        "/absolute/path/to/knowledge-system-template/mcp-server/dist/mcp-server/src/index.js"
      ],
      "env": {}
    }
  }
}
```

**⚠️ Important:** Replace `/absolute/path/to/` with your actual path!

**3. Restart Claude Desktop**

Close and reopen Claude Desktop completely.

**4. Verify it works:**

In a new conversation, ask: *"What tools do you have access to?"*

Claude should list 15 AIKnowSys tools.

---

### Option B: VS Code + GitHub Copilot

**1. Create/edit `.vscode/mcp.json` in your project:**

```json
{
  "servers": {
    "aiknowsys": {
      "type": "stdio",
      "command": "node",
      "args": [
        "${workspaceFolder}/mcp-server/dist/mcp-server/src/index.js"
      ]
    }
  }
}
```

**2. Restart the MCP server**

Open Chat view → Click refresh icon next to MCP SERVERS heading, or run:
`Ctrl/Cmd + Shift + P` → "MCP: List Servers" → Select aiknowsys → "Start Server"

**3. Trust the server when prompted**

VS Code will ask you to trust the MCP server on first start.

**4. Verify it works:**

Open Copilot Chat (Agent mode) → Click Tools button → You should see aiknowsys with 15 tools

---

### Option C: Cursor IDE

**1. Open Cursor Settings:**
- `Ctrl/Cmd + ,` → Search "MCP"

**2. Add MCP Server:**

In Cursor's MCP configuration:

```json
{
  "mcpServers": {
    "aiknowsys": {
      "command": "node",
      "args": [
        "${workspaceFolder}/mcp-server/dist/mcp-server/src/index.js"
      ]
    }
  }
}
```

**3. Restart Cursor**

---

## Step 3: Test the Tools

### SQLite Query Tools (Phase 1 Week 2 - NEW! ⚡)

**Status:** ✅ **Production-Ready** (35 tests passing, avg 11.19ms latency)

These tools query a SQLite database instead of reading files, providing **10-100x faster** context access.

#### Setup SQLite Database (One-Time)

Before using SQLite tools, migrate your `.aiknowsys/` files to SQLite:

```bash
# From project root
npm run build

# Copy required files (build system limitation - see ESSENTIALS)
mkdir -p dist/scripts
cp scripts/migrate-learned-patterns.js dist/scripts/
cp package.json dist/
cp lib/context/schema.sql dist/lib/context/

# Migrate to SQLite
node bin/cli.js migrate-to-sqlite --dir .
```

This creates `.aiknowsys/knowledge.db` with all your sessions, plans, and learned patterns.

#### Available SQLite Tools

**`get_db_stats_sqlite()`**
```typescript
// Returns: Database statistics
{
  sessions: number,
  plans: number,
  learned: number,
  total: number,
  dbSize: number  // bytes
}
```
**Performance:** ~9ms | **Use:** Quick knowledge system overview

---

**`query_sessions_sqlite({ dateAfter?, dateBefore?, topic?, status? })`**
```typescript
// Filters (all optional):
{
  dateAfter: "2026-02-01",     // ISO date string
  dateBefore: "2026-02-13",    // ISO date string
  topic: "mcp-tools",          // Exact match
  status: "in-progress"        // in-progress | complete | abandoned
}
```
**Performance:** ~4ms | **Use:** Find recent work, filter by topic/status

---

**`query_plans_sqlite({ status?, author?, topic?, priority? })`**
```typescript
// Filters (all optional):
{
  status: "ACTIVE",               // ACTIVE | PAUSED | COMPLETE | CANCELLED
  author: "arno-paffen",          // Exact match
  topic: "mcp",                   // Exact match
  priority: "high"                // high | medium | low
}
```
**Performance:** ~7ms | **Use:** Find active plans, filter by status

---

**`query_learned_patterns_sqlite({ category?, keywords? })`**
```typescript
// Filters (all optional):
{
  category: "error_resolution",   // Exact match
  keywords: "typescript,build"    // Comma-separated
}
```
**Performance:** ~4ms ⚡ (fastest!) | **Use:** Discover project patterns

---

**`search_context_sqlite({ query, limit? })`**
```typescript
// Full-text search across all content
{
  query: "SQLite migration",    // Search terms
  limit: 10                      // Optional, default 10
}
// Returns ranked results with snippets
```
**Performance:** ~18ms | **Use:** Find anything across all knowledge

---

#### Performance Benchmarks

From Phase 1 Week 2 real-world validation:

| Tool | Avg Time | vs File Reading |
|------|----------|-----------------|
| queryLearnedPatternsSqlite | 3.62ms | **100x faster** |
| queryPlansSqlite | 6.95ms | **50x faster** |
| getDbStats | 9.16ms | **30x faster** |
| searchContextSqlite | 17.93ms | **10x faster** |

**Overall average:** 11.19ms per query

---

### Legacy Tools (Pre-SQLite)

**⚠️ Current Status (Feb 2026):** 5/15 tools verified working. Several tools have CLI flag bugs. See [.aiknowsys/sessions/2026-02-09-session.md] for bug details.

**Note:** These tools use CLI commands or file reading. Consider using SQLite tools above for better performance.

### Working Tools (Verified ✅)

**Test 1: Critical Invariants**

Natural language query: *"What are the critical invariants I must follow?"*

Or call directly (for testing):
```typescript
mcp_aiknowsys_get_critical_invariants()
```

**Expected:** Returns 8 mandatory rules (ES Modules, Absolute Paths, TDD, etc.)

---

**Test 2: Validation Commands**

Natural language query: *"What validation commands should I run after changes?"*

Or call directly:
```typescript
mcp_aiknowsys_get_validation_matrix()
```

**Expected:** Returns validation commands by category (Required on Every Change, Template Changes, etc.)

---

**Test 3: Recent Sessions**

Natural language query: *"Show me recent session work from the last 7 days"*

Or call directly:
```typescript
mcp_aiknowsys_get_recent_sessions({ days: 7 })
```

**Expected:** Returns sessions with dates, topics, plans, file paths

---

**Test 4: Get Skill by Name**

Natural language query: *"Show me the TDD workflow skill"*

Or call directly:
```typescript
mcp_aiknowsys_get_skill_by_name({ skillName: "tdd-workflow" })
```

**Expected:** Returns full skill file content (400+ lines)

---

### Known Bugs (10 tools have issues)

**Search context - Fixed but disabled:**
- `search_context()` - CLI flag bug fixed, but still disabled in some environments

**Mutation tools - CLI flag bugs:**
- `create_session()` - Uses `--goal` instead of `--title`
- Other mutation tools may have similar issues

**Validation tools - Parameter issues:**
- `check_tdd_compliance()` - Expects `changedFiles` array
- `validate_skill()` - Expects `skillPath` not `skillName`

**Other disabled tools:**
- `get_active_plans()`, `find_skill_for_task()`, `find_pattern()`, `validate_deliverables()`

**Fix Plan:** See `.aiknowsys/PLAN_mcp_bugfix_skill_lookup.md` for systematic audit plan.

---

## Available Tools (15 Total)

### Context Tools (2)
- `get_critical_invariants()` - 8 mandatory rules
- `get_validation_matrix()` - Validation commands reference

### Query Tools (3)
- `get_active_plans()` - Active implementation plans
- `get_recent_sessions(days?)` - Recent session history
- `find_skill_for_task(task)` - Find relevant skill workflow

### Mutation Tools (4)
- `create_session(goal, topics?, status?)` - Create new session
- `update_session(section, content, operation?)` - Update session
- `create_plan(id, goal, type?, priority?)` - Create implementation plan
- `update_plan(planId, operation, ...)` - Update plan status/content

### Validation Tools (3)
- `validate_deliverables(fix?)` - Check template consistency
- `check_tdd_compliance(changedFiles[])` - Verify test coverage
- `validate_skill(skillPath)` - Check skill format

### Enhanced Query Tools (3)
- `search_context(query, type?)` - Full-text search across knowledge
- `find_pattern(keywords[], category?)` - Find learned patterns
- `get_skill_by_name(skillName)` - Get specific skill content

---

## Troubleshooting

### "MCP server not found" or "Connection failed"

**Check build:**
```bash
cd mcp-server
ls dist/mcp-server/src/index.js  # Should exist
```

**If missing:**
```bash
npm run build
```

**Check path:**
- Absolute path? Use full path (not relative)
- Contains spaces? Wrap in quotes
- Correct separator? Use `/` on macOS/Linux, `\` on Windows

### "No tools showing up"

**VS Code users:**
1. Check Output panel: `View → Output → GitHub Copilot Chat`
2. Look for MCP server startup logs
3. Try: `Ctrl/Cmd + Shift + P` → "Reload Window"

**Claude Desktop users:**
1. Check config file syntax (valid JSON?)
2. Completely quit and restart Claude Desktop
3. Try asking: *"List all available tools"*

### "Import errors" or "Module not found"

**Check dependencies:**
```bash
cd mcp-server
npm install  # Reinstall dependencies
npm run build  # Rebuild
```

**Check Node version:**
```bash
node --version  # Should be 20+
```

### "Tools work, but return errors"

**Verify workspace location:**

The MCP server expects to find `.aiknowsys/` directory in the **parent** of `mcp-server/`.

**Correct structure:**
```
knowledge-system-template/
├── .aiknowsys/          ← Server reads from here
│   ├── sessions/
│   ├── plans/
│   └── learned/
├── lib/                 ← Server uses these functions
└── mcp-server/          ← Server runs from here
    └── dist/
```

**If using from a different location, set working directory:**

```json
{
  "mcpServers": {
    "aiknowsys": {
      "command": "node",
      "args": ["path/to/index.js"],
      "cwd": "/absolute/path/to/knowledge-system-template"  ← Add this
    }
  }
}
```

---

## Performance Expectations

**Token Efficiency:**
- Before MCP: 2000+ tokens (reading CODEBASE_ESSENTIALS.md)
- After MCP: ~50 tokens (structured tool response)
- **Savings: 95%**

**Speed:**
- Before: O(n) file scans (grep, semantic search)
- After: O(1) direct queries (indexed data)
- **Improvement: 10-20x faster**

**Usage:**
- No need to remember CLI commands
- No need to parse JSON output
- Built-in discovery (agent calls `list_tools()`)

---

## Development Workflow

### Making changes to the server

1. **Edit source:**
   ```bash
   # Edit files in mcp-server/src/
   vim src/tools/my-new-tool.ts
   ```

2. **Add tests:**
   ```bash
   # Add tests in mcp-server/test/
   npm test
   ```

3. **Rebuild:**
   ```bash
   npm run build
   ```

4. **Restart client:**
   - VS Code: Reload Window
   - Claude Desktop: Quit and reopen
   - Cursor: Restart IDE

### Hot-reload during development

```bash
npm run dev  # Uses tsx watch for auto-rebuild
```

Then restart client when ready to test.

---

## Next Steps

### ✅ Basic Setup Complete

1. Build server ✓
2. Configure client ✓
3. Test connection ✓

### 🚀 Advanced Usage

1. **Customize tools** - Add project-specific tools in `src/tools/`
2. **Add resources** - MCP supports resources (read-only data)
3. **Add prompts** - MCP supports prompt templates
4. **Connect multiple projects** - Run one server per project

### 📚 Learn More

- [MCP Documentation](https://modelcontextprotocol.io/introduction)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [VS Code MCP Guide](https://code.visualstudio.com/docs/copilot/copilot-mcp-architecture)

---

## FAQ

**Q: Do I need to rebuild after every change?**  
A: Yes. TypeScript → JavaScript requires compilation. Use `npm run dev` for watch mode.

**Q: Can multiple AI agents use the same server?**  
A: Yes! Each client spawns its own server instance.

**Q: Does this work offline?**  
A: Yes. MCP server runs locally, no internet needed.

**Q: Can I use this in CI/CD?**  
A: Not directly. MCP is for interactive AI agents. For CI/CD, use the CLI commands (`npx aiknowsys ...`).

**Q: How do I add custom tools?**  
A: See `mcp-server/src/tools/` for examples. Follow the `registerTool()` pattern.

**Q: What if my project has a different structure?**  
A: Set `cwd` in the MCP config to point to your project root.

---

**Ready to go?** Your AI agent now has instant access to your project knowledge! 🎉
