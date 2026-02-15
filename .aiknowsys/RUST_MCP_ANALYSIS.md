# Rust MCP Server Rewrite - Feasibility Analysis

**Date:** February 15, 2026  
**Status:** 📊 ANALYSIS COMPLETE  
**Decision:** RECOMMEND AGAINST (for now)

---

## Executive Summary

**The "fun" factor? YES!** Rust rewrites are always intellectually engaging.  
**The business value? NO.** TypeScript MCP server already achieves MCP's core benefit (10-100x speedup).

**Recommendation:** Stay with TypeScript until pmcp ecosystem matures OR performance becomes measurable bottleneck.

---

## Current State Analysis

### AIKnowSys MCP Server (TypeScript)

**Scope:**
- 19 TypeScript files
- ~4,500 lines of code
- 30+ registered tools (query, mutation, validation)
- Direct imports to core functions (no subprocess overhead)

**Architecture:**
```
MCP Tool Handler (TypeScript)
    ↓
Direct import: lib/context/query.js
    ↓
Returns structured data (JSON)
    ↓
10-100x faster than CLI subprocess
```

**Tools implemented:**
- **Context:** get_critical_invariants, get_validation_matrix
- **Query:** get_active_plans, get_recent_sessions, query_sessions_sqlite, search_context_sqlite
- **Mutation:** create_session, append_to_session, set_plan_status, archive_plans
- **Validation:** validate_deliverables, check_tdd_compliance, validate_skill
- **Enhanced:** search_context, find_pattern, get_skill_by_name
- **Dynamic:** tool_search_tool_regex (Speakeasy 3-tool pattern - planned)

**Integration:**
- VS Code GitHub Copilot (`settings.json` → MCP server)
- Already optimized (Phase 2: Direct imports, <1ms response time)
- Tested and working in production

---

## pmcp Rust Crate Analysis

**What is pmcp?**  
Rust library for building Model Context Protocol servers (https://crates.io/crates/pmcp)

**Pros:**
- ✅ Lightweight (Rust's small binary size)
- ✅ Fast startup (compiled binary vs Node.js runtime)
- ✅ Memory efficient (Rust's zero-cost abstractions)
- ✅ Type safety (Rust's ownership system)

**Cons:**
- ❌ **Immature ecosystem** (crate is new, MCP SDK still evolving)
- ❌ **No TypeScript interop** (can't import lib/context/*.ts directly)
- ❌ **Rewrite ALL 30+ tool handlers** (4,500 lines → Rust equivalents)
- ❌ **FFI overhead** (Rust → TypeScript core functions = complexity)
- ❌ **Two-language maintenance** (MCP in Rust, core logic in TypeScript)

---

## Trade-Off Analysis

### Performance Comparison

**Claim:** Rust is faster than TypeScript  
**Reality:** Not meaningful here

| Stage | TypeScript MCP | Rust MCP (estimated) |
|-------|----------------|----------------------|
| **Startup** | ~100ms (Node.js) | ~10ms (binary) | ⚡ Rust wins |
| **Tool call** | <1ms (direct import) | <1ms (FFI call) | 🤝 Tie |
| **Response** | <1ms (JSON stringify) | <1ms (serde) | 🤝 Tie |
| **Total** | ~102ms first call | ~12ms first call | 🎯 90ms savings |

**BUT:**
- MCP server is long-running (startup happens ONCE per VS Code session)
- Tool calls are already <1ms (Phase 2 optimization complete)
- 90ms startup savings = **unnoticeable to user** (< human perception threshold)

**Verdict:** Performance gain is real but insignificant for this use case.

### Development Velocity

| Task | TypeScript | Rust |
|------|-----------|------|
| **Add new tool** | 10 min | 30 min (FFI boilerplate) |
| **Update core function** | 5 min | 15 min (update FFI bindings) |
| **Debug tool issue** | Built-in (console.log) | Harder (FFI boundary) |
| **Onboard contributor** | Easy (JavaScript familiarity) | Hard (Rust learning curve) |

**Verdict:** TypeScript maintains faster iteration speed.

### Code Reuse

**TypeScript MCP:**
```typescript
// Direct import - zero boilerplate
import { queryPlansCore } from '../../lib/context/query.js';

export async function getActivePlans() {
  return queryPlansCore({ status: 'ACTIVE' });
}
```

**Rust MCP (would require):**
```rust
// FFI to call TypeScript core functions
use neon::prelude::*;

fn get_active_plans(mut cx: FunctionContext) -> JsResult<JsValue> {
  // 1. Setup Node.js runtime
  // 2. Load TypeScript module
  // 3. Call queryPlansCore
  // 4. Marshal JSON across FFI boundary
  // 5. Error handling for both Rust and JS errors
  // ~50 lines of boilerplate PER TOOL
}
```

**Alternative:** Rewrite core functions in Rust  
**Cost:** ~15,000 lines of TypeScript → Rust (lib/context/, lib/commands/, lib/scan/)

**Verdict:** Code reuse becomes nightmare; full rewrite is massive effort.

### Maintenance Burden

**Current (TypeScript only):**
- ✅ Single language (JavaScript/TypeScript)
- ✅ Single package.json
- ✅ Single test framework (Vitest)
- ✅ Contributors need JavaScript knowledge

**Rust MCP (hybrid):**
- ⚠️ Two languages (Rust + TypeScript)
- ⚠️ Two build systems (Cargo + npm)
- ⚠️ Two test frameworks (Rust tests + Vitest)
- ⚠️ Contributors need Rust + JavaScript + FFI knowledge

**Rust MCP (full rewrite):**
- ⚠️ Rewrite 15,000+ lines of core logic
- ⚠️ Port 500+ tests
- ⚠️ Migrate SQLite, file I/O, markdown parsing to Rust
- ⚠️ Estimated: 6-8 weeks full-time work

**Verdict:** Maintenance complexity increases significantly.

---

## Integration Challenges

### 1. VS Code MCP Configuration

**Current:**
```json
{
  "github.copilot.chat.mcpServers": {
    "aiknowsys": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server/dist/index.js"]
    }
  }
}
```

**Rust version:**
```json
{
  "github.copilot.chat.mcpServers": {
    "aiknowsys": {
      "command": "${workspaceFolder}/mcp-server/target/release/aiknowsys-mcp",
      "args": []
    }
  }
}
```

**Issues:**
- Cross-platform builds (Linux, macOS, Windows binaries)
- Distribution (ship binaries vs compile on install)
- Updates (npm install vs recompile)

### 2. Core Function Access

**TypeScript → TypeScript (current):**
- Direct import
- Same type system
- Zero marshaling

**Rust → TypeScript (hybrid):**
- FFI (neon, node-bindgen, or spawn subprocess)
- Type conversion at boundary
- Error handling complexity

**Rust → Rust (full rewrite):**
- Direct calls (clean!)
- But requires rewriting entire codebase

---

## Risk Assessment

### TypeScript Path (stay current)

**Risks:**
- 🟢 Low: MCP SDK changes (update npm package)
- 🟢 Low: Performance issues (already optimized)
- 🟢 Low: Contributor friction (JavaScript is common)

**Mitigation:** Continue Phase 2 optimizations (dynamic toolsets, event sourcing)

### Rust Hybrid Path (pmcp + FFI)

**Risks:**
- 🔴 High: FFI complexity (two-language debugging)
- 🟡 Medium: pmcp ecosystem maturity (breaking changes likely)
- 🟡 Medium: Contributor onboarding (Rust learning curve)
- 🔴 High: Limited value (performance gain negligible)

**Mitigation:** Not recommended unless MCP SDK drops Node.js support

### Rust Full Rewrite Path

**Risks:**
- 🔴 Critical: 6-8 week project (massive opportunity cost)
- 🔴 Critical: Port 15,000 lines + 500 tests
- 🔴 High: Feature parity gaps during transition
- 🟡 Medium: SQL/filesystem/markdown parsing in Rust

**Mitigation:** Only if TypeScript becomes bottleneck (not observed)

---

## Decision Matrix

| Criteria | Weight | TypeScript | Rust Hybrid | Rust Full |
|----------|--------|------------|-------------|-----------|
| **Performance** | 10% | 8/10 (fast enough) | 9/10 (faster startup) | 10/10 (native speed) |
| **Dev Velocity** | 30% | 10/10 (direct import) | 4/10 (FFI overhead) | 3/10 (large rewrite) |
| **Maintenance** | 25% | 10/10 (single lang) | 5/10 (two langs) | 7/10 (Rust only) |
| **Integration** | 20% | 10/10 (working now) | 6/10 (cross-platform) | 6/10 (distribution) |
| **Risk** | 15% | 9/10 (low risk) | 5/10 (FFI complexity) | 3/10 (huge project) |

**Weighted Scores:**
- TypeScript: **9.65/10** (BEST)
- Rust Hybrid: **5.40/10** (NOT RECOMMENDED)
- Rust Full: **5.05/10** (NOT RECOMMENDED)

---

## Recommendation

### Short-Term (Next 6 Months): Stay with TypeScript

**Reasoning:**
1. ✅ **No performance bottleneck** - <1ms tool response already achieved
2. ✅ **High velocity** - Direct imports, no FFI complexity
3. ✅ **Low maintenance** - Single language, single build system
4. ✅ **Working integration** - VS Code MCP already tested

**Next steps:**
- Complete Speakeasy dynamic toolsets (planned)
- Implement event-sourced storage (planned)
- Monitor MCP SDK evolution

### Long-Term (12+ Months): Revisit IF

**Condition 1:** pmcp ecosystem matures  
- Stable API (v1.0+)
- Well-documented
- Community adoption

**Condition 2:** Performance becomes measurable issue  
- Tool calls exceed 10ms
- Memory usage exceeds 500MB
- Startup time impacts UX

**Condition 3:** MCP SDK drops Node.js support  
- Forces Rust/Go/Python choice
- Community migrates away from TypeScript

**None of these are true today.**

---

## Alternative: Keep TypeScript, Optimize Differently

**Better investments than Rust rewrite:**

### 1. Dynamic Toolsets (Speakeasy Pattern)
- **Impact:** 90%+ token reduction (29K → <3K)
- **Effort:** 1-2 weeks
- **Status:** Already planned (PLAN_mcp_dynamic_toolsets.md)

### 2. Event-Sourced Storage
- **Impact:** 98% token savings (80KB markdown → 2KB events)
- **Effort:** 3 weeks (hybrid migration)
- **Status:** Already planned (PLAN_event_sourced_storage.md)

### 3. Embeddings for Semantic Search
- **Impact:** Find relevant context without keywords
- **Effort:** 1 week (integrate all-MiniLM-L6-v2)
- **Status:** Planned (Phase 4 of dynamic toolsets)

**Total effort: 5-6 weeks**  
**Total value: Transformational UX improvements**

**vs**

**Rust rewrite:**  
**Effort: 6-8 weeks**  
**Value: 90ms faster startup (unnoticeable)**

---

## Conclusion

**The "fun" question:** Yes, Rust rewrites are intellectually satisfying!  
**The "should we" question:** No, not until pragmatic benefits justify cost.

**Current state:**
- TypeScript MCP server achieves MCP's core benefit (10-100x speedup)
- Performance is not a bottleneck
- Development velocity is high
- Integration works reliably

**Recommended path:**
1. ✅ **Continue with TypeScript** (optimal for current needs)
2. ✅ **Invest in architectural wins** (dynamic toolsets, event sourcing)
3. 📊 **Monitor pmcp ecosystem** (revisit in 12 months)
4. 🎯 **Measure before optimizing** (no performance issue observed)

**When to revisit Rust:**
- pmcp reaches v1.0+ (stable API)
- Performance becomes measurable UX issue (>10ms tool calls)
- MCP SDK drops Node.js support (ecosystem shift)

**Famous quote applies:**  
> "Premature optimization is the root of all evil." - Donald Knuth

**Better version:**  
> "Fun projects that don't solve real problems create technical debt."  
> **Invest in problems that impact users, not engineering aesthetics.**

---

## Appendix: pmcp Ecosystem Status

**As of February 2026:**

| Aspect | Status |
|--------|--------|
| **Crate maturity** | Early (no v1.0 yet) |
| **Documentation** | Basic examples only |
| **Community** | Small (MCP SDK is new) |
| **Production use** | Unknown |
| **Breaking changes** | Likely (pre-1.0) |

**Comparison to @modelcontextprotocol/sdk (TypeScript):**
- Official SDK from Anthropic
- Active development and support
- Well-documented
- Used in production (VS Code, Claude Desktop)

**Verdict:** TypeScript SDK is safer bet for now.

---

## Appendix: Future Vision - Document Governance System

**Context:** User shared vision for future Rust project using AIKnowSys as foundation.

**Use case:**
- Document management + AI classification
- GDPR compliance (dynamic rule-based)
- PDF documents → scale to 100M docs
- Local AI models (governance/semi-governance)
- Self-hosted (mini-PC → private cloud)
- Single organization

**Why this validates AIKnowSys:**
1. ✅ **Universal skills work** - TDD, refactoring, dependency management apply to Rust
2. ✅ **Rust example exists** - examples/rust-actix/ as starting point
3. ✅ **Event-sourced storage fits** - GDPR audit trails need atomic facts, not markdown
4. ✅ **Knowledge system adapts** - Same workflow, different stack
5. ✅ **Privacy-first architecture** - Local models, self-hosted aligns with AIKnowSys values

**How to start (when ready):**
```bash
# Fork Rust example as foundation
cp -r examples/rust-actix/ ../document-governance-system/
cd ../document-governance-system/

# AIKnowSys structure already there:
# - .aiknowsys/ for sessions/plans
# - CODEBASE_ESSENTIALS.md for Rust patterns
# - Skills for workflows
# - Validation matrix (cargo test, clippy, audit)

# Customize for document governance:
# - Add pdf-extract crate
# - Add rust-bert for embeddings
# - Build GDPR rules engine
# - Track progress with AIKnowSys
```

**Stack for governance system:**
- Rust + Actix Web (security, performance)
- PostgreSQL + pgvector (metadata + embeddings)
- Local AI models (all-MiniLM-L6-v2 for embeddings, custom GDPR classifier)
- MinIO (S3-compatible document storage)
- Docker (self-hosted deployment)

**This is exactly the kind of project AIKnowSys was designed to support.**

---

**Next Steps:**

1. ✅ Document this analysis
2. ✅ Update session file with decision
3. ✅ Capture future vision (document governance system)
4. ⏸️ Pause Rust MCP rewrite until ecosystem matures
5. 🎯 Focus on dynamic toolsets + event sourcing (higher ROI for AIKnowSys itself)
6. 💡 Vision validated: AIKnowSys adapts to Rust projects perfectly

---

*Analysis complete. Future vision documented. Ready to focus on AIKnowSys core improvements.*
