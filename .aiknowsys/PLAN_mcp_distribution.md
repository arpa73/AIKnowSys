# Implementation Plan: MCP Server Distribution & Discovery

**Status:** 🎯 PLANNING  
**Created:** 2026-02-09  
**Updated:** 2026-02-10 (Added Phase 0: API Improvements)  
**Goal:** Make AIKnowSys MCP server discoverable and installable with one-click installation

**Prerequisites:** Fix discriminator usability bugs before public distribution (Phase 0)

## Overview

Enable users to discover and install the AIKnowSys MCP server through:
1. **GitHub MCP Registry** - Official registry at https://github.com/mcp
2. **VS Code Extensions View** - Search with `@mcp` to find and install
3. **NPM Package** - Standard npm distribution
4. **Documentation** - Installation guides and badges

## Current State

✅ **Completed:**
- MCP server built and working (15 tools, 89 tests passing)
- Modern SDK v1.26.0 with `registerTool()` API
- Local installation via `.vscode/mcp.json` verified
- SETUP.md with manual installation instructions

❌ **Not Yet Done:**
- GitHub MCP Registry submission
- NPM package publication
- One-click installation support
- Discovery badges/buttons

## Distribution Mechanisms

### 1. GitHub MCP Registry (Primary)

**What It Is:**
- Official registry at https://github.com/mcp
- Lists 500+ MCP servers with "Install" buttons
- Integrated into VS Code Extensions view
- Discoverable via `@mcp` search in VS Code

**How It Works:**
1. User searches `@mcp` in VS Code Extensions view
2. VS Code queries GitHub MCP registry
3. User clicks "Install" button
4. Server automatically added to `.vscode/mcp.json`

**What We Need:**
```json
{
  "name": "aiknowsys",
  "description": "AI knowledge system integration - plans, sessions, skills, validation",
  "publisher": "arpa73",
  "repository": "https://github.com/arpa73/AIKnowSys",
  "keywords": ["knowledge-management", "documentation", "tdd", "validation"],
  "license": "Apache-2.0",
  "entry_point": "mcp-server/dist/mcp-server/src/index.js"
}
```

### 2. NPM Package (Secondary)

**Package Name:** `@arpa73/aiknowsys-mcp-server` or `aiknowsys-mcp-server`

**Installation:**
```bash
npm install -g aiknowsys-mcp-server
```

**benefits:**
- Version management
- Dependency resolution
- Standard Node.js distribution
- Can be used with `npx`

### 3. VS Code Marketplace Extension (Future)

**Option:** Create full VS Code extension that:
- Contributes MCP server automatically
- Provides UI for configuration
- Handles updates
- Better discoverability

**Complexity:** Higher effort, but best user experience

### 4. Documentation & Badges

**Add to README.md:**
```markdown
[![MCP Server](https://img.shields.io/badge/MCP-Server-blue)](https://github.com/mcp)
[![Install](https://img.shields.io/badge/Install-VS%20Code-green)](https://smithery.ai/server/@arpa73/aiknowsys)
```

## Phase 0: API Improvements (Prerequisites)

**Goal:** Fix known usability issues before public distribution

**Why This Matters:**  
Public users will encounter these issues immediately. Better to fix before distribution than to deal with support requests and negative feedback.

### Known Issue: Discriminator Usability Bug

**Problem:**  
MCP mutation tools (`update_plan`, `update_session`, `create_plan`, `create_session`) use TypeScript discriminated unions with an `operation` field, but this requirement is not obvious from the tool name or initial documentation.

**User Experience:**
```typescript
// ❌ Natural attempt (causes MCP error -32602):
mcp_aiknowsys_update_plan({
  planId: "PLAN_something",
  status: "COMPLETE"
})

// Error: "Invalid discriminator value. Expected 'set-status' | 'append' | 'prepend'"

// ✅ Correct usage (not discoverable):
mcp_aiknowsys_update_plan({
  operation: "set-status",  // ← Required but non-obvious!
  planId: "PLAN_something",
  status: "COMPLETE"
})
```

**Root Cause:**
- Tool API uses discriminated unions (operation determines parameter shape)
- Field name "operation" is generic and doesn't explain what it discriminates
- Error message comes late (after failed call) rather than being self-documenting
- No inline examples in tool descriptions

### Solution: API Redesign

**Option 1: Split into Separate Tools** (RECOMMENDED)
```typescript
// Instead of one tool with discriminator:
mcp_aiknowsys_update_plan({ operation: "set-status", ... })

// Create specific tools:
mcp_aiknowsys_set_plan_status({ planId, status })
mcp_aiknowsys_append_to_plan({ planId, content })
mcp_aiknowsys_prepend_to_plan({ planId, content })

// Similarly for sessions:
mcp_aiknowsys_set_session_status({ date?, status })
mcp_aiknowsys_append_to_session({ section, content })
mcp_aiknowsys_prepend_to_session({ section, content })
mcp_aiknowsys_insert_after_section({ targetSection, newSection, content })
```

**Benefits:**
- ✅ Self-documenting API (tool name explains what it does)
- ✅ TypeScript autocomplete works perfectly
- ✅ No discriminator confusion
- ✅ Better tool discovery (15 → 21 tools, but clearer purpose)
- ✅ Simpler parameter validation

**Trade-offs:**
- ⚠️ More tools to maintain (15 → 21 tools, +6)
- ⚠️ Slightly larger tool list in MCP Inspector
- ⚠️ Need to update documentation in AGENTS.md, ESSENTIALS

**Implementation Effort:** ~3 hours
- 1h: Split update_plan and update_session into separate tools
- 1h: Update tests (unit + integration)
- 1h: Update documentation (AGENTS.md Section 5½, ESSENTIALS Section 10)

---

**Option 2: Better Documentation** (FALLBACK)
```typescript
// Add inline examples to tool descriptions:
{
  name: "update_plan",
  description: `Update a plan's status or content.
  
Examples:
  // Set status to COMPLETE:
  { operation: "set-status", planId: "PLAN_xyz", status: "COMPLETE" }
  
  // Append progress note:
  { operation: "append", planId: "PLAN_xyz", content: "Phase 1 done" }
  
  // Prepend critical update:
  { operation: "prepend", planId: "PLAN_xyz", content: "Blocker found" }
  `,
  inputSchema: z.object({ ... })
}
```

**Benefits:**
- ✅ Quick fix (30 minutes work)
- ✅ No breaking changes
- ✅ Examples visible in tool list

**Trade-offs:**
- ⚠️ Still requires reading documentation
- ⚠️ Discriminator pattern still non-obvious
- ⚠️ Doesn't fix TypeScript autocomplete issues

**Implementation Effort:** ~30 minutes
- Update tool descriptions in mcp-server/src/tools/mutations.ts
- Add examples to AGENTS.md Section 5½

---

**Option 3: Hybrid Approach** (BEST OF BOTH)
```typescript
// Keep discriminated tools for advanced users:
mcp_aiknowsys_update_plan({ operation, ... })

// Add convenience wrappers for common cases:
mcp_aiknowsys_complete_plan({ planId })  // Shortcut for set-status COMPLETE
mcp_aiknowsys_pause_plan({ planId })     // Shortcut for set-status PAUSED
mcp_aiknowsys_activate_plan({ planId })  // Shortcut for set-status ACTIVE

// Wrappers internally call update_plan with correct operation
```

**Benefits:**
- ✅ Backward compatible (existing tools still work)
- ✅ Easier for common operations (90% of use cases)
- ✅ Advanced users can still use full API

**Trade-offs:**
- ⚠️ More tools (15 → 18-20 tools)
- ⚠️ Two ways to do same thing (can confuse)

**Implementation Effort:** ~2 hours
- 1h: Create wrapper tools
- 30min: Update tests
- 30min: Update documentation

---

### Recommendation

**For public distribution: Option 1 (Split into Separate Tools)**

**Rationale:**
1. **First impressions matter** - Public users won't tolerate confusing APIs
2. **Self-documenting is critical** - Reduces support burden
3. **MCP tools should be simple** - Each tool does one thing well
4. **Long-term maintainability** - Clearer separation of concerns

**Timeline:**
- Phase 0 must complete BEFORE Phase 1 (registry submission)
- Estimated: 3 hours development + 1 hour testing/validation
- Can be done in one focused session

### Success Criteria for Phase 0

- [ ] All mutation tools use clear, single-purpose names
- [ ] No discriminator fields in public API
- [ ] TypeScript autocomplete works without documentation
- [ ] Error messages are actionable
- [ ] Documentation updated (AGENTS.md, ESSENTIALS)
- [ ] All 89+ tests still passing
- [ ] Integration tests verify new tool signatures

---

## Implementation Steps

### Phase 1: Prepare for Registry Submission

**Goal:** Package the MCP server for public distribution

#### Step 1: Update package.json

**File:** `mcp-server/package.json`

**Changes Needed:**
```json
{
  "name": "aiknowsys-mcp-server",
  "version": "0.1.0",
  "description": "MCP server for AIKnowSys - AI-powered knowledge base, session tracking, and TDD validation",
  "keywords": [
    "mcp",
    "model-context-protocol",
    "knowledge-management",
    "documentation",
    "tdd",
    "validation",
    "ai-tools"
  ],
  "homepage": "https://github.com/arpa73/AIKnowSys#readme",
  "bugs": {
    "url": "https://github.com/arpa73/AIKnowSys/issues"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/arpa73/AIKnowSys.git",
    "directory": "mcp-server"
  },
  "license": "Apache-2.0",
  "author": "arpa73",
  "main": "dist/mcp-server/src/index.js",
  "bin": {
    "aiknowsys-mcp": "dist/mcp-server/src/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Risk:** Low  
**Dependencies:** None

#### Step 2: Create mcp-server/README.md

**File:** `mcp-server/README.md`

**Content Structure:**
```markdown
# AIKnowSys MCP Server

AI-powered knowledge base integration for MCP clients (Claude Desktop, VS Code Copilot, Cursor).

## Quick Start

### Install via VS Code
1. Open VS Code
2. Search `@mcp` in Extensions view
3. Find "AIKnowSys"
4. Click Install

### Manual Installation
See [SETUP.md](SETUP.md) for detailed configuration

## Features

### 15 Powerful Tools

**Context Tools (2):**
- `get_critical_invariants()` - 8 mandatory development rules
- `get_validation_matrix()` - Validation command reference

**Query Tools (3):**
- `get_active_plans()` - Active implementation plans
- `get_recent_sessions(days?)` - Recent session history
- `find_skill_for_task(task)` - Natural language skill discovery

**Mutation Tools (4):**
- `create_session(goal, topics?, status?)` - Create session with YAML frontmatter
- `update_session(section, content, operation?)` - Append/prepend/insert sections
- `create_plan(id, goal, type?, priority?)` - Create implementation plan
- `update_plan(planId, operation, ...)` - Update plan status/content

**Validation Tools (3):**
- `validate_deliverables(fix?)` - Check template consistency
- `check_tdd_compliance(changedFiles[])` - Verify test coverage
- `validate_skill(skillPath)` - Validate skill format

**Enhanced Query Tools (3):**
- `search_context(query, type?)` - Full-text search across knowledge
- `find_pattern(keywords[], category?)` - Find learned patterns
- `get_skill_by_name(skillName)` - Get specific skill content

## Performance

- **95% token savings** (2000 → 50 tokens per query)
- **10-20x faster** than file reading (O(1) vs O(n))
- **Zero friction** - Built-in tool discovery

## License

Apache-2.0
```

**Risk:** Low  
**Dependencies:** None

#### Step 3: Add LICENSE file

**File:** `mcp-server/LICENSE`

**Action:** Copy Apache 2.0 license from root OR symlink

```bash
cd mcp-server
ln -s ../LICENSE LICENSE
```

**Risk:** Low  
**Dependencies:** None

### Phase 2: Publish to NPM

**Goal:** Make server available via npm/npx

#### Step 4: NPM Publishing Workflow

**Actions:**
```bash
cd mcp-server

# Build the server
npm run build

# Test locally
npx .

# Publish to npm (requires npm account)
npm publish --access public
```

**Verification:**
```bash
# Test installation
npx aiknowsys-mcp-server
```

**Risk:** Low  
**Dependencies:** npm account

### Phase 3: Submit to GitHub MCP Registry

**Goal:** Get listed on https://github.com/mcp

#### Step 5: Registry Submission Process

**Research Needed:**
- [ ] Find CONTRIBUTING.md in https://github.com/modelcontextprotocol/servers
- [ ] Identify submission process (PR? Form? API?)
- [ ] Check requirements for third-party servers

**Likely Process (based on other open-source registries):**
1. Fork https://github.com/modelcontextprotocol/servers
2. Add entry to README.md under "🌎 Community Servers"
3. Provide server metadata (name, description, repo link)
4. Create Pull Request
5. Wait for review and merge

**Entry Format (estimated):**
```markdown
• [AIKnowSys](https://github.com/arpa73/AIKnowSys) - AI-powered knowledge base with 15 tools for plans, sessions, skills, and TDD validation
```

**Risk:** Medium (depends on acceptance criteria)  
**Dependencies:** NPM publication, clean README

### Phase 4: Update Documentation

**Goal:** Guide users to discovery & installation

#### Step 6: Update Root README.md

**File:** `README.md`

**Add Section:**
```markdown
## 🚀 Quick Start with MCP

The AIKnowSys MCP server is available for:
- VS Code + GitHub Copilot
- Claude Desktop
- Cursor IDE

### Install via VS Code (Recommended)

1. Open VS Code
2. Search `@mcp` in Extensions view
3. Find **AIKnowSys**
4. Click **Install**

Or install manually: [mcp-server/SETUP.md](mcp-server/SETUP.md)

### Available via NPM

```bash
npx aiknowsys-mcp-server
```

**Badges:**
```markdown
[![MCP Server](https://img.shields.io/badge/MCP-Server-blue)](https://smithery.ai/server/@arpa73/aiknowsys)
[![NPM](https://img.shields.io/npm/v/aiknowsys-mcp-server)](https://www.npmjs.com/package/aiknowsys-mcp-server)
[![GitHub](https://img.shields.io/github/stars/arpa73/AIKnowSys)](https://github.com/arpa73/AIKnowSys)
```

**Risk:** Low  
**Dependencies:** NPM publication

#### Step 7: Update mcp-server/SETUP.md

**File:** `mcp-server/SETUP.md`

**Add Quick Install Section at Top:**
```markdown
## 🎯 Quick Install (Recommended)

### Option A: VS Code Extensions View

1. Open VS Code
2. Click Extensions icon (or `Ctrl+Shift+X`)
3. Search for `@mcp aiknowsys`
4. Click **Install**
5. Reload VS Code
6. Ask Copilot: "What tools do you have access to?"

You should see 15 AIKnowSys tools listed!

### Option B: NPM Global Install

```bash
npm install -g aiknowsys-mcp-server
```

Then configure in `.vscode/mcp.json`:
```json
{
  "servers": {
    "aiknowsys": {
      "type": "stdio",
      "command": "aiknowsys-mcp"
    }
  }
}
```

---

## Manual Installation (Advanced)

...existing manual setup docs...
```

**Risk:** Low  
**Dependencies:** Registry acceptance

## Success Criteria

- [ ] Server published to NPM
- [ ] Listed on GitHub MCP Registry
- [ ] Discoverable via `@mcp` search in VS Code
- [ ] One-click install works
- [ ] README updated with installation badges
- [ ] SETUP.md has quick-start section
- [ ] 10+ external users install successfully

## Risks & Mitigations

**Risk 1: Registry Rejection**
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:** 
  - Ensure high-quality README
  - Provide clear installation docs
  - Have 89 passing tests
  - Follow MCP standards

**Risk 2: NPM Package Name Conflict**
- **Likelihood:** Low
- **Impact:** Low
- **Mitigation:**
  - Use scoped package: `@arpa73/aiknowsys-mcp-server`
  - Check availability before setup

**Risk 3: VS Code Extension Marketplace Confusion**
- **Likelihood:** Low
- **Impact:** Low
- **Mitigation:**
  - Clearly document this is an MCP server, not a VS Code extension
  - Explain the difference in README

## Timeline Estimate

- **Phase 0 (API Redesign):** 4 hours (PREREQUISITE - must complete first)
  - Option 1: 3h development + 1h testing
  - Option 2: 30 minutes (fallback)
  - Option 3: 2h development + 30min testing
- **Phase 1 (Prep):** 2 hours
- **Phase 2 (NPM):** 1 hour
- **Phase 3 (Registry):** 2-4 weeks (review time)
- **Phase 4 (Docs):** 1 hour

**Total Active Work:** 8 hours (Phase 0 + Phases 1-4)  
**Total Calendar Time:** 2-4 weeks (waiting for registry approval)

## Next Steps

**PHASE 0 (MUST DO FIRST):**
1. **Immediate:** Choose API redesign approach (Option 1 recommended)
2. **Day 1:** Implement discriminator fix (split tools or add wrappers)
3. **Day 1:** Update tests and documentation
4. **Day 1:** Validate all tests passing

**PHASE 1-4 (AFTER PHASE 0):**
5. **Day 2:** Update package.json with registry metadata
6. **Day 2:** Create mcp-server/README.md
7. **Day 2:** Publish to NPM
8. **Day 3:** Research registry submission process
9. **Week 1:** Submit to GitHub MCP Registry
10. **Week 2-4:** Wait for approval
11. **Post-Approval:** Update all documentation

## Notes for Developer

**⚠️ CRITICAL: Complete Phase 0 Before Distribution**
- Discriminator usability bug will cause immediate user frustration
- Fix BEFORE NPM publication to avoid bad reviews
- Choose Option 1 (split tools) for best long-term outcome
- See Phase 0 section for detailed analysis

**NPM Publication:**
- Need npm account (create at npmjs.com)
- Run `npm login` before publishing
- Test `npm pack --dry-run` first

**Registry Submission:**
- May require GitHub account
- Review CONTRIBUTING guidelines carefully
- Provide high-quality description

**Badge Generation:**
- shields.io for badge creation
- Update after NPM publication
- Add to top of README
