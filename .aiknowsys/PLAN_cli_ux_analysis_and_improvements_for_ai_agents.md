---
id: "PLAN_mcp_pivot_for_ai_agents"
title: "MCP Pivot: Make Knowledge Actually Usable by AI Agents"
status: "ACTIVE"
author: "arno-paffen"
created: "2026-02-08"
started: "2026-02-08"
updated: "2026-02-08 20:00"
---

# Implementation Plan: MCP Pivot for AI Agents

**Status:** 🎯 ACTIVE  
**Created:** 2026-02-08  
**Author:** arno-paffen

---

## 🎯 Goal

**Pivot from file-based system to MCP (Model Context Protocol) server to make knowledge genuinely accessible and used by AI agents.**

**User's original insight (1 week ago):** "Should we implement MCP server instead of reading md files?"  
**My response then:** "No, CLI commands are better" ❌  
**Reality check:** I built CLI commands and skills, then never used them. User was right.

**What we're fixing:**
1. **Files → Tools:** Stop asking AI to read markdown, give it MCP tools
2. **Discovery:** Built-in (`list_tools()`) vs hoping AI reads docs
3. **Usage:** Make learned knowledge/skills actually retrievable and useful

## Evidence: Why File-Based System Failed

### What I Actually Did (Real Session Behavior)
- ✅ `read_file("CODEBASE_ESSENTIALS.md")` - Always
- ✅ `grep_search(pattern, ".aiknowsys/**")` - Frequently  
- ✅ `semantic_search("TDD workflow")` - Often
- ❌ `npx aiknowsys query-plans` - **NEVER** (0 executions found)
- ❌ `npx aiknowsys query-sessions` - **NEVER**
- ❌ `npx aiknowsys search-context` - **NEVER**

### Why CLI Commands Failed
1. **Friction:** Spawn terminal → parse JSON → extract data
2. **Memory:** Must remember commands exist (passive docs)
3. **Unfamiliar:** read_file is universal, CLI is project-specific
4. **Steps:** CLI adds layers, doesn't remove them

### Why Skills Failed
1. **Passive activation:** Wait for trigger words (unreliable)
2. **Multi-step:** Read ESSENTIALS → detect trigger → load skill → follow
3. **Not discoverable:** AI defaults to known tools, not skill system

### What Actually Works
- **read_file:** Direct, fast, structured (line ranges)
- **Tools:** Native function calls (MCP protocol)
- **Discovery:** `list_tools()` shows what's available
- **Zero friction:** No docs required, self-describing

---

## The MCP Solution

### What Changes (Architecture)

**Before (File-Based):**
```
AI needs context
  ↓
Read CODEBASE_ESSENTIALS.md (2000 tokens)
  ↓
Maybe detect skill trigger?
  ↓
Maybe run CLI command?
  ↓
Parse markdown/JSON
  ↓
Extract what you need
```

**After (MCP-Based):**
```
AI needs context
  ↓
mcp_aiknowsys_get_invariants()
  ↓
Returns structured data (50 tokens)
```

### What Stays (All the Hard Work)

✅ **Keep:**
- Storage adapter layer (lib/context/)
- Context indexing (context-index.json)
- All learned patterns (.aiknowsys/learned/)
- All session/plan data
- Validation logic
- CLI commands (for bash scripts, CI/CD)

✅ **Leverage:**
- Existing lib/ functions
- JSON storage implementation
- Index query logic
- Pattern extraction

### What We Build (MCP Layer)

**New:**
```
aiknowsys/
├── mcp-server/              # New MCP server
│   ├── src/
│   │   ├── index.ts         # MCP server entry
│   │   ├── server.ts        # Server implementation
│   │   └── tools/           # MCP tool implementations
│   │       ├── context.ts   # Critical invariants, validation matrix
│   │       ├── query.ts     # Plans, sessions, patterns
│   │       ├── skills.ts    # Load/search skills
│   │       └── mutation.ts  # Create/update sessions/plans
│   ├── package.json
│   └── tsconfig.json
└── .mcp-config.json         # VSCode configuration (template)
```

---

## MCP Tools Design

### Category 1: Critical Context (Always Needed)

**`get_critical_invariants()`**
```typescript
Returns: {
  invariants: Array<{
    number: number,
    title: string,
    description: string,
    examples?: string[]
  }>,
  count: number
}
// Replaces: read_file("ESSENTIALS.md", 100, 150)
// Tokens: 50 vs 2000
```

**`get_validation_matrix()`**
```typescript
Returns: {
  commands: Array<{
    command: string,
    purpose: string,
    expected: string
  }>
}
// Replaces: Manually parsing validation table
```

**`get_project_structure()`**
```typescript
Returns: {
  directories: Array<{
    path: string,
    purpose: string,
    keyFiles: string[]
  }>
}
// Replaces: Read ESSENTIALS project structure section
```

### Category 2: Query & Discovery

**`get_active_plans()`**
```typescript
Returns: {
  plans: Array<{
    id: string,
    title: string,
    status: string,
    author: string,
    created: string,
    filePath: string
  }>,
  count: number
}
// Replaces: npx aiknowsys query-plans --status ACTIVE --json
// Faster: No process spawn, direct function call
```

**`search_patterns(query: string, scope?: 'learned' | 'personal' | 'all')`**
```typescript
Returns: {
  patterns: Array<{
    name: string,
    category: string,
    description: string,
    filePath: string,
    relevance: number
  }>,
  count: number
}
// Replaces: grep_search + manual filtering
```

**`get_recent_sessions(days?: number)`**
```typescript
Returns: {
  sessions: Array<{
    date: string,
    topics: string[],
    author: string,
    status: string,
    filePath: string
  }>,
  count: number
}
// Replaces: list_dir + read each file
```

**`search_context(query: string, scope?: 'plans' | 'sessions' | 'learned' | 'all')`**
```typescript
Returns: {
  results: Array<{
    type: 'plan' | 'session' | 'pattern',
    title: string,
    snippet: string,
    filePath: string,
    relevance: number
  }>,
  count: number
}
// Replaces: semantic_search + grep_search
// Faster: Uses context-index.json
```

### Category 3: Skills & Workflows

**`find_skill_for_task(task: string)`**
```typescript
Returns: {
  skill: {
    name: string,
    description: string,
    triggers: string[],
    workflow: string,  // Full skill content
    filePath: string
  } | null,
  confidence: number
}
// NEW: AI describes task, gets relevant skill
// Replaces: Hope trigger words match
```

**`list_skills(category?: string)`**
```typescript
Returns: {
  skills: Array<{
    name: string,
    description: string,
    triggers: string[],
    category: string
  }>,
  count: number
}
// Replaces: Read ESSENTIALS skill index
```

**`get_skill_content(name: string)`**
```typescript
Returns: {
  skill: {
    name: string,
    content: string,  // Full SKILL.md
    metadata: object
  }
}
// Replaces: read_file(".github/skills/X/SKILL.md")
```

### Category 4: Mutations

**`create_session(topics: string[], goal?: string)`**
```typescript
Returns: {
  sessionFile: string,
  topics: string[],
  created: string
}
// Replaces: npx aiknowsys create-session --topics X
```

**`update_session(content: string, section?: string, mode?: 'append' | 'prepend')`**
```typescript
Returns: {
  sessionFile: string,
  updated: string
}
// Replaces: npx aiknowsys update-session --appendSection
```

**`create_plan(title: string, goal?: string)`**
```typescript
Returns: {
  planFile: string,
  planId: string,
  created: string
}
// Replaces: npx aiknowsys create-plan --title
```

### Category 5: Validation

**`validate_deliverables()`**
```typescript
Returns: {
  passed: Array<{ check: string, message: string }>,
  failed: Array<{ check: string, error: string }>,
  exitCode: number
}
// Replaces: npx aiknowsys validate-deliverables
```

**`run_tests(scope?: 'all' | 'changed')`**
```typescript
Returns: {
  passed: number,
  failed: number,
  skipped: number,
  duration: string,
  failedTests: Array<{ name: string, error: string }>
}
// Replaces: npm test
```

---

## Implementation Plan

### Phase 1: MCP Server Foundation (4-6 hours)

**Goal:** Working MCP server with 5 core tools (prove concept)

**Step 1.1: Project Setup (1 hour)**
```bash
mkdir -p mcp-server/src/tools
npm init -y  # In mcp-server/
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node tsx
```

**Files:**
- mcp-server/package.json
- mcp-server/tsconfig.json
- mcp-server/src/index.ts (MCP server entry)
- mcp-server/src/server.ts (Server implementation)

**Step 1.2: Core Tools (2 hours)**

Implement 5 MVP tools:
```typescript
// mcp-server/src/tools/context.ts
1. get_critical_invariants()
2. get_validation_matrix()

// mcp-server/src/tools/query.ts  
3. get_active_plans()
4. get_recent_sessions(days)

// mcp-server/src/tools/skills.ts
5. find_skill_for_task(task)
```

**Implementation:** Wrap existing lib/ functions
- See if usage increases after documentation changes

**Implementation:** Wrap existing lib/ functions
```typescript
// Example: get_active_plans() wraps queryPlans()
import { queryPlans } from '../../dist/lib/commands/query-plans.js';

export async function get_active_plans() {
  const result = await queryPlans({
    status: 'ACTIVE',
    dir: process.cwd(),
    json: true,
    _silent: true
  });
  return JSON.parse(result.stdout);
}
```

**Step 1.3: VSCode Configuration (30 min)**
```json
// .vscode/settings.json (template)
{
  "mcpServers": {
    "aiknowsys": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

**Step 1.4: Test & Validate (30 min)**
- Connect MCP server in VSCode
- Call `list_tools()` (should show 5 tools)
- Call `get_critical_invariants()` (verify returns data)
- Measure: Faster than read_file?

**Validation:**
- [ ] MCP server starts without errors
- [ ] 5 tools listed in list_tools()
- [ ] Each tool returns structured data
- [ ] Faster than equivalent file reading

---

### Phase 2: Essential Tools (4-6 hours)

**Goal:** Add 10 more tools covering most common use cases

**Step 2.1: Query Tools (2 hours)**
```typescript
// mcp-server/src/tools/query.ts
- search_patterns(query, scope)
- search_context(query, scope)
- get_recent_sessions(days)
```

**Step 2.2: Skills Tools (1 hour)**
```typescript
// mcp-server/src/tools/skills.ts
- list_skills(category)
- get_skill_content(name)
```

**Step 2.3: Mutation Tools (2 hours)**
```typescript
// mcp-server/src/tools/mutation.ts
- create_session(topics, goal)
- update_session(content, section, mode)
- create_plan(title, goal)
- mark_plan_complete(planId)
```

**Step 2.4: Validation Tools (1 hour)**
```typescript
// mcp-server/src/tools/validation.ts
- validate_deliverables()
- run_tests(scope)
```

**Validation:**
- [ ] All 15 tools working
- [ ] Test each tool manually
- [ ] Compare performance vs file reading
- [ ] Document in tool descriptions

---

### Phase 3: AI Agent Testing (2-3 hours)

**Goal:** Validate AI agents actually use MCP tools

**Step 3.1: Real-World Scenarios (1 hour)**

Test these tasks WITHOUT instructions:
1. "What are the critical invariants?"
2. "What's the current active plan?"
3. "Find sessions from last week"
4. "Is there a TDD workflow skill?"
5. "Validate deliverables"

**Expected:** AI calls MCP tools, not read_file

**Step 3.2: Comparison Testing (1 hour)**

Measure:
- **Token usage:** MCP vs file reading
- **Time:** Tool call vs file operations
- **Success rate:** Gets correct answer?

**Step 3.3: Documentation (30 min)**

If tools are actually used:
- Update AGENTS.md: "MCP tools are available"
- Update CODEBASE_ESSENTIALS.md: Add MCP section
- Keep skills for reference (but tools come first)

If tools are NOT used:
- Investigate: Why didn't AI discover tools?
- Fix: Improve tool descriptions? Add examples?
- Iterate: Make tools more discoverable

---

### Phase 4: Polish & Distribution (2-3 hours)

**Goal:** Package MCP server for easy installation

**Step 4.1: Installation Script (1 hour)**
```bash
# scripts/install-mcp-server.js
- Build mcp-server/ with esbuild
- Copy .vscode/settings.json template
- Add to .gitignore
- Instructions for user
```

**Step 4.2: Template Integration (1 hour)**
- Add mcp-server/ to templates/
- Include in `aiknowsys init`
- Update SETUP_GUIDE.md

**Step 4.3: Migration Guide (1 hour)**
- Document: CLI commands still work
- Explain: MCP is additive, not replacement
- Show: Before/after examples
- Guide: How to enable MCP in existing projects

---

## Success Criteria

### Must Have (Phase 1-2)
- [ ] MCP server starts and connects to VSCode
- [ ] 15 core tools implemented and working
- [ ] Tools return structured data (not files)
- [ ] Faster than equivalent file operations

### Should Have (Phase 3)
- [ ] AI agents discover tools via list_tools()
- [ ] AI agents use MCP tools instead of read_file
- [ ] 80%+ token reduction for context queries
- [ ] Real-world tasks complete successfully

### Nice to Have (Phase 4)
- [ ] Easy installation for new projects
- [ ] Migration guide for existing projects
- [ ] MCP included in templates/
- [ ] Documentation complete

---

## Performance Targets

**Token Efficiency:**
- Current: read_file("ESSENTIALS.md") = ~2000 tokens
- Target: get_critical_invariants() = ~50 tokens
- **Goal: 95%+ reduction**

**Speed:**
- Current: Read 100 session files = ~5-10 seconds
- Target: search_context() = <500ms (index query)
- **Goal: 10-20x faster**

**Discovery:**
- Current: 0% query command usage
- Target: 80%+ MCP tool usage for common tasks
- **Goal: Default to tools, not files**

---

## Risks & Mitigations

**Risk:** MCP server doesn't start in VSCode
**Mitigation:** Test with minimal example first, add error handling

**Risk:** Tools too complex, AI still uses read_file
**Mitigation:** Simple tool signatures, excellent descriptions, examples

**Risk:** Breaking changes for existing users
**Mitigation:** MCP is additive (CLI still works), optional feature

**Risk:** Maintenance burden (2 systems - CLI + MCP)
**Mitigation:** MCP wraps CLI initially, evaluate long-term

**Risk:** AI agents don't discover tools
**Mitigation:** Explicit documentation "MCP tools available", test discovery

---

## Migration Path (Existing Projects)

**Option 1: Keep CLI-only**
- No changes required
- CLI commands still work
- Files readable as before

**Option 2: Add MCP (Recommended)**
```bash
# In existing AIKnowSys project:
npm run build  # Build latest
node scripts/install-mcp-server.js  # Install MCP
# Restart VSCode
# MCP tools now available
```

**Option 3: MCP-only (Future)**
- Deprecate CLI commands eventually?
- Only if MCP proves universally better
- Major version bump (v2.0?)

---

## Long-Term Vision

**v0.13.0: MCP Foundation**
- Phase 1-2 complete (15 core tools)
- Optional feature alongside CLI

**v0.14.0: MCP Enhancement**
- Phase 3 validation complete
- AI-optimized tools (find_skill_for_task, etc.)
- Performance metrics

**v1.0.0: MCP-First** (if successful)
- MCP as primary interface
- CLI for bash scripts/CI only
- Full token efficiency realized
- AIKnowSys = "AI Context Server"

---

## What This Means for Users

**Before (File-Based):**
```markdown
AI reads CODEBASE_ESSENTIALS.md
AI hopes skills trigger on right words
AI falls back to grep/semantic search
AI wastes tokens, time, and gets partial context
```

**After (MCP-Based):**
```typescript
AI calls list_tools() → sees what's available
AI calls get_critical_invariants() → instant context
AI calls find_skill_for_task("refactoring") → gets workflow
AI works efficiently with full context
```

**Value proposition:**
- ✅ Knowledge is actually used (not just documented)
- ✅ 95% token reduction for context queries
- ✅ 10-20x faster than file operations
- ✅ AI agents work naturally (tools > files)
- ✅ Learned patterns become genuinely accessible

---

## Next Steps

1. **User approval:** Does MCP pivot make sense?
2. **Phase 1:** Build MCP foundation (4-6 hours)
3. **Test:** Does AI actually use tools?
4. **Decide:** Continue to Phase 2 or iterate?

**This is the unlock AIKnowSys needs to actually work as intended.**

---

## Notes

**Why I was wrong before:**
- Designed for humans (CLI, markdown, docs)
- Didn't test with real AI agent behavior
- Theory (skills should work) vs reality (tools win)

**Why this will work:**
- Designed for AI agents (tools, structured data, discovery)
- Validated with real usage patterns (my behavior)
- MCP protocol is AI-native

[How to verify the work is complete]

## Risks

[Potential issues and mitigation strategies]
