---
id: "PLAN_bundle_mcp_server_with_main_package"
title: "Bundle MCP Server with Main Package"
status: "PLANNED"
author: "arno-paffen"
created: "2026-02-09"
topics: ["mcp", "bundling", "distribution", "npm"]
---

# Implementation Plan: Bundle MCP Server with Main Package

**Status:** 📋 PLANNED  
**Created:** 2026-02-09  
**Author:** arno-paffen

---


## Progress

## 🎯 Goal

Single npm install provides both aiknowsys CLI and MCP server

## Overview

Enable users to install both CLI and MCP server with one command:
```bash
npm install -g aiknowsys
# Gets: aiknowsys (CLI) + aiknowsys-mcp (MCP server)
```

**Current Pain Point:**
- MCP server requires full path in mcp.json: `"${workspaceFolder}/mcp-server/dist/mcp-server/src/index.js"`
- Users must manually build mcp-server separately
- Not portable across machines

**After Bundling:**
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
Clean, portable, works anywhere! ✅

## Requirements

**Must Have:**
- Single `npm install -g aiknowsys` installs everything
- `aiknowsys-mcp` command available globally
- All 737+ main tests still pass
- All 98 MCP tests still pass
- TypeScript compilation works for both
- Package size reasonable (<10MB)

**Should Have:**
- Single `npm run build` builds both
- Single `npm test` runs all tests
- Maintain separate source directories (lib/ and mcp-server/src/)
- No breaking changes to existing CLI

**Nice to Have:**
- Automatic mcp.json configuration helper
- Version alignment (both at v0.11.0?)

## Architecture Analysis

### Current Structure (Separate Packages)

```
aiknowsys/
├── package.json (v0.10.0)
├── tsconfig.json (rootDir: "./", outDir: "./dist")
├── lib/ → compiles to dist/lib/
├── bin/cli.js → uses dist/lib/
└── mcp-server/
    ├── package.json (v0.1.0)
    ├── tsconfig.json (rootDir: "..", outDir: "./dist")
    ├── src/ → compiles to mcp-server/dist/mcp-server/src/
    └── test/ → compiles to mcp-server/dist/test/
```

**Why nested dist?**
- MCP tsconfig has `"rootDir": ".."` (parent directory)
- Preserves full path structure in output
- Allows MCP server to import from `../lib/`

### Target Structure (Bundled)

```
aiknowsys/
├── package.json (v0.11.0)
│   ├── bin:
│   │   - aiknowsys → bin/cli.js
│   │   - aks → bin/cli.js
│   │   - aiknowsys-mcp → mcp-server/dist/mcp-server/src/index.js
│   ├── dependencies:
│   │   + @modelcontextprotocol/sdk ^1.26.0
│   │   + zod ^3.24.1
│   ├── files:
│   │   + mcp-server/dist/
│   └── scripts:
│       build: tsc && (cd mcp-server && tsc)
│       test: vitest run && (cd mcp-server && vitest run)
```

## Key Decisions

### Decision 1: Keep separate builds
- `tsc && cd mcp-server && tsc`
- Works with current tsconfig files
- No restructuring needed

### Decision 2: Separate test commands with test:all for CI
- `npm test`: Main tests (737+)
- `npm run test:mcp`: MCP tests (98)
- `npm run test:all`: Both (for CI)

## Implementation Steps

### Phase 1: Package Configuration (30 min)

**File:** package.json

**Changes:**
1. Add MCP bin entry:
   ```json
   "bin": {
     "aiknowsys": "./bin/cli.js",
     "aks": "./bin/cli.js",
     "aiknowsys-mcp": "./mcp-server/dist/mcp-server/src/index.js"
   }
   ```

2. Include MCP dist in files:
   ```json
   "files": [
     "bin/",
     "dist/",
     "mcp-server/dist/",
     "templates/",
     "scripts/",
     "SETUP_GUIDE.md",
     "README.md",
     "LICENSE"
   ]
   ```

3. Add MCP dependencies:
   ```json
   "dependencies": {
     "@modelcontextprotocol/sdk": "^1.26.0",
     "zod": "^3.24.1"
   }
   ```

**Validation:** `npm pack --dry-run | grep mcp-server`

### Phase 2: Build Process (20 min)

**File:** package.json

**Changes:**
```json
"scripts": {
  "build": "tsc && cd mcp-server && tsc",
  "build:main": "tsc",
  "build:mcp": "cd mcp-server && tsc"
}
```

**Validation:** `npm run build && ls mcp-server/dist/mcp-server/src/index.js`

### Phase 3: Testing Integration (15 min)

**File:** package.json

**Changes:**
```json
"scripts": {
  "test": "vitest run",
  "test:mcp": "cd mcp-server && vitest run",
  "test:all": "npm test && npm run test:mcp"
}
```

**Update prepublishOnly:**
```json
"prepublishOnly": "npm run build && npm run test:all && npm run lint && npm run test:cli && npm pack --dry-run"
```

**Validation:** `npm run test:all` (expect 835+ tests)

### Phase 4: Documentation (30 min)

**Files:** README.md, mcp-server/SETUP.md

**README.md - Add after Installation:**
```markdown
### Global Installation (Recommended)

\`\`\`bash
npm install -g aiknowsys
\`\`\`

This installs:
- \`aiknowsys\` CLI (all commands)
- \`aiknowsys-mcp\` MCP server (for AI agents)

### MCP Server Configuration

**VS Code + GitHub Copilot:**

Create/edit \`.vscode/mcp.json\`:
\`\`\`json
{
  "servers": {
    "aiknowsys": {
      "type": "stdio",
      "command": "aiknowsys-mcp"
    }
  }
}
\`\`\`
```

**mcp-server/SETUP.md - Prepend:**
```markdown
## Quick Start

### If You Installed via npm (Recommended)

\`\`\`bash
npm install -g aiknowsys
\`\`\`

Skip to **Step 2: Configure Your MCP Client** below.

---

### Development Setup (Local Build)

If you're developing the MCP server itself, continue below.
```

### Phase 5: Validation & Testing (45 min)

**Step 5.1: Local pack test**
```bash
npm run build
npm pack
tar -tzf aiknowsys-*.tgz | grep -E "(bin|mcp-server/dist)"
```

**Step 5.2: Global install test**
```bash
npm install -g ./aiknowsys-*.tgz
aiknowsys --version
which aiknowsys-mcp
aiknowsys-mcp 2>&1 | head -5
```

**Step 5.3: Integration test**
- Create test project with `.vscode/mcp.json`
- Configure: `"command": "aiknowsys-mcp"`
- Restart VS Code MCP server
- Ask Copilot: "What tools do you have?"
- Verify: 15 AIKnowSys tools listed

## Risks & Mitigations

**Risk 1: Package Size** (Low likelihood, Medium impact)
- Current estimate: ~2MB main + 500KB MCP
- Mitigation: Check with npm pack, exclude .map files if needed

**Risk 2: Path Resolution** (Low likelihood, High impact)
- Scenario: aiknowsys-mcp can't find project root
- Mitigation: ✅ Already fixed with findProjectRoot() (b77d0b9)

**Risk 3: TypeScript Build Failures** (Low likelihood, High impact)
- Use && to chain builds (fails fast)
- prepublishOnly validates before publish

**Risk 4: Breaking Changes** (Very low likelihood, Medium impact)
- This is fully backward compatible
- Old local paths still work
- New global command is additive only

## Success Criteria

- [ ] `npm pack` includes mcp-server/dist/
- [ ] `aiknowsys-mcp` command exists after global install
- [ ] All 737+ main tests pass
- [ ] All 98 MCP tests pass
- [ ] TypeScript builds both without errors
- [ ] mcp.json works with just `"command": "aiknowsys-mcp"`
- [ ] Package size < 25MB
- [ ] Documentation updated
- [ ] CHANGELOG.md entry added
- [ ] Manual integration test passes

## Timeline

| Phase | Time | Description |
|-------|------|-------------|
| Phase 1 | 30 min | Package configuration |
| Phase 2 | 20 min | Build process |
| Phase 3 | 15 min | Testing integration |
| Phase 4 | 30 min | Documentation |
| Phase 5 | 45 min | Validation |
| **Total** | **2h 20m** | + 1-2h polish = 3-4h total |

## Notes for Developer

**Before starting:**
- Read CODEBASE_ESSENTIALS.md
- Current: 98/98 MCP tests, 1014/1015 main tests passing

**Phase execution:**
1. Phase 1 → `npm pack --dry-run` validation
2. Phase 2 → `npm run build` validation
3. Phase 3 → `npm run test:all` validation
4. Phase 4 → docs review
5. Phase 5 → full integration test

## Open Questions

**Q1: Version bump?**
- Recommendation: v0.11.0 (feature release, backward compatible)

**Q2: Add .npmignore?**
- Exclude: mcp-server/package.json, test-*/ dirs
- Recommendation: Yes

**Q3: Add postinstall message?**
- Show "MCP server ready!" after install
- Recommendation: Optional, helpful


## 🎯 Goal

[Describe the objective of this plan]

## Requirements

[List functional and non-functional requirements]

## Implementation Steps

### Step 1: [Step Name]
**Time:** [Estimate]  
**Files:** [Files to modify/create]

**Action:** [What to do]

### Step 2: [Step Name]
**Time:** [Estimate]  
**Files:** [Files to modify/create]

**Action:** [What to do]

## Testing & Validation

[How to verify the work is complete]

## Risks

[Potential issues and mitigation strategies]
