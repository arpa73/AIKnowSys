---
title: "MCP Code Execution Optimization (Anthropic Article Integration)"
status: "ACTIVE"
priority: "medium"
created: "2026-02-14"
author: "Planner"
topics: ["mcp-tools", "optimization", "code-execution", "token-efficiency", "architecture"]
---

# PLAN: MCP Code Execution Optimization

**Status:** 🎯 PLANNED  
**Priority:** 🟡 MEDIUM (efficiency improvement, not blocking)  
**Created:** 2026-02-14  
**Research Source:** [Anthropic MCP Code Execution Article](https://www.anthropic.com/engineering/code-execution-with-mcp)  
**Estimated:** 2-3 weeks (phased approach)

---

## 📚 Context: What the Article Teaches

**Article Summary:**
Anthropic's engineering team published best practices for using MCP with code execution environments. Key insights:

1. **Problem: Tool Definition Bloat**
   - Loading all MCP tool definitions upfront wastes tokens
   - 31 tools × ~500 tokens each = 15,500 tokens before processing request
   - Example: Salesforce MCP with 1000s of tools = 150K+ tokens just for definitions

2. **Problem: Intermediate Results Bloat**
   - Direct tool calls pass ALL data through model context
   - Example: Fetching 10,000-row spreadsheet → filter 5 rows = 10K tokens wasted
   - Large documents may exceed context limits entirely

3. **Solution: Code Execution with MCP**
   - Present tools as **code APIs** (TypeScript files) instead of direct tool calls
   - Agents **explore filesystem** to discover tools on-demand
   - Agents **write code** that filters/transforms data BEFORE returning to context
   - Data stays in execution environment, only summaries enter context

4. **Benefits:**
   - **98.7% token reduction** (150K → 2K tokens in their example)
   - **Progressive disclosure** - Load only tools needed for task
   - **Context-efficient results** - Filter/aggregate data in code
   - **Control flow** - Loops, conditionals, error handling in code (not chaining tools)
   - **Privacy** - Sensitive data never enters model context
   - **Skills persistence** - Agents save working code as reusable functions

---

## 🎯 Applicability to AIKnowSys

### Current Architecture

**AIKnowSys MCP Server:**
- 31 tools registered via `server.registerTool()` (all exposed upfront)
- Tools cover: context query, mutations, validation, SQLite queries
- Used by Claude via direct tool calls: `mcp_aiknowsys_get_critical_invariants()`

**Estimated Token Cost (Current):**
- 31 tools × ~400 tokens per definition ≈ **12,400 tokens**
- Every Claude request loads all tool definitions (even if using only 1-2 tools)
- Large query results (e.g., `query_sessions_sqlite` returns full session content) bloat context

**Where Code Execution Helps:**

✅ **High Impact:**
1. **Query result filtering** - `query_sessions_sqlite` returns 22K tokens for 4 sessions (agent only needs metadata)
2. **Composite operations** - Agents combine multiple queries and filter results before returning
3. **Tool discovery** - Load only 2-3 relevant tools instead of all 31

❌ **Limited Impact:**
- AIKnowSys already has focused, domain-specific tools (not 1000s of generic tools)
- Most operations are already atomic and context-efficient by design

**Key Decision Point:**
This optimization is **only valuable for users with code execution environments** (Claude Code, Jupyter, etc.). Standard Claude chat cannot use code execution.

---

## 🏗️ Proposed Architecture

### Hybrid Approach: Support Both Modes

**Mode 1: Direct Tools (Current - Keep for compatibility)**
- Works with: Standard Claude, Claude chat, any MCP client
- How: Direct tool calls via `mcp_aiknowsys_*` prefix
- Token cost: 12,400 tokens upfront (acceptable for 31 tools)
- Use case: Simple queries, single-tool operations

**Mode 2: Code Execution APIs (New - Opt-in)**
- Works with: Claude Code, Jupyter, agents with code execution
- How: Present tools as TypeScript modules agents can import
- Token cost: ~500 tokens (only load tools needed)
- Use case: Complex workflows, data filtering, composite operations

**Implementation Strategy:**

```typescript
// Directory structure exposed to code execution agents:
mcp-apis/
├── aiknowsys/
│   ├── query/
│   │   ├── get_critical_invariants.ts
│   │   ├── get_validation_matrix.ts
│   │   ├── query_sessions_sqlite.ts
│   │   ├── query_plans_sqlite.ts
│   │   └── search_context_sqlite.ts
│   ├── mutation/
│   │   ├── create_session.ts
│   │   ├── append_to_session.ts
│   │   ├── create_plan.ts
│   │   └── set_plan_status.ts
│   ├── validation/
│   │   ├── validate_deliverables.ts
│   │   ├── check_tdd_compliance.ts
│   │   └── validate_skill.ts
│   └── index.ts  // Discovery entry point
└── README.md  // How to use code APIs
```

**Example Agent Code:**

```typescript
// Mode 1: Direct tool call (current)
const sessions = await mcp_aiknowsys_query_sessions_sqlite({ 
  topic: "mcp-tools" 
});
// Returns: Full session content (~22K tokens for 4 sessions)

// Mode 2: Code execution (optimized)
import { querySessionsSqlite } from './mcp-apis/aiknowsys/query';

const allSessions = await querySessionsSqlite({ 
  topic: "mcp-tools" 
});

// Filter in code (before returning to context)
const recentWork = allSessions
  .filter(s => new Date(s.date) > new Date('2026-02-01'))
  .map(s => ({ 
    title: s.title, 
    topics: s.topics, 
    status: s.status 
  }));

console.log(`Found ${recentWork.length} recent sessions`);
console.log(recentWork); // Only ~500 tokens vs 22K
```

---

## 📋 Implementation Plan

### Phase 1: Research & Design (1-2 days)

**Goal:** Validate approach and create detailed design

**Step 1.1: Research Code Execution in Claude**
- **Action:** Read Claude Code documentation for code execution capabilities
- **Why:** Understand execution environment constraints (filesystem access, imports, etc.)
- **Risk:** Low - documentation research only
- **Output:** Document findings in session file

**Step 1.2: Design File Tree Structure**
- **Action:** Design `mcp-apis/aiknowsys/` directory structure
- **Why:** Agents need logical, explorable structure
- **Considerations:** 
  - Group by capability (query, mutation, validation)
  - Flat vs nested organization
  - Discovery mechanisms (index.ts vs filesystem listing)
- **Risk:** Low - design phase only

**Step 1.3: Prototype Single Tool as Code API**
- **Action:** Create `mcp-apis/aiknowsys/query/get_critical_invariants.ts`
- **Why:** Validate approach before implementing all 31 tools
- **Implementation:**
  ```typescript
  // mcp-apis/aiknowsys/query/get_critical_invariants.ts
  import { callMCPTool } from '../../../client.js';
  
  interface Invariant {
    rule: string;
    rationale: string;
  }
  
  /** Returns 8 critical invariants for the project */
  export async function getCriticalInvariants(): Promise<Invariant[]> {
    return callMCPTool('mcp_aiknowsys_get_critical_invariants', {});
  }
  ```
- **Risk:** Low - isolated prototype
- **Validation:** Test with Claude Code to confirm imports work

**Step 1.4: User Feedback Loop**
- **Action:** Ask maintainer (@arpa73) if code execution optimization is valuable
- **Why:** Only proceed if users have code execution environments
- **Questions:**
  - Do you use Claude Code or other code execution environments?
  - Would 98% token reduction for complex queries justify added complexity?
  - Is hybrid approach (keep direct tools + add code APIs) acceptable?
- **Risk:** Medium - might decide not to proceed (that's OK!)

---

### Phase 2: Implement Code API Layer (3-5 days)

**Goal:** Create code-callable wrappers for all 31 MCP tools

**Prerequisites:**
- ✅ Phase 1 complete
- ✅ User confirmed code execution is valuable
- ✅ Prototype validated with Claude Code

**Step 2.1: Create MCP Client Helper**
- **Action:** Implement `mcp-apis/client.ts` with `callMCPTool()` function
- **Why:** Centralize MCP tool invocation for all wrapper files
- **Implementation:**
  ```typescript
  // mcp-apis/client.ts
  export async function callMCPTool<T>(
    toolName: string, 
    args: Record<string, any>
  ): Promise<T> {
    // Connect to MCP server (stdio transport)
    // Invoke tool with args
    // Return typed result
  }
  ```
- **Risk:** Medium - MCP client initialization in code execution environment
- **Dependencies:** None
- **TDD:** Write tests for client connection and tool invocation

**Step 2.2: Generate Wrapper Files for Query Tools**
- **Action:** Create TypeScript wrappers for 15 query tools
- **Files:**
  - `mcp-apis/aiknowsys/query/get_critical_invariants.ts`
  - `mcp-apis/aiknowsys/query/get_validation_matrix.ts`
  - `mcp-apis/aiknowsys/query/get_active_plans.ts`
  - `mcp-apis/aiknowsys/query/get_recent_sessions.ts`
  - `mcp-apis/aiknowsys/query/query_plans_sqlite.ts`
  - `mcp-apis/aiknowsys/query/query_sessions_sqlite.ts`
  - ... (all query tools)
- **Why:** Enable progressive disclosure - load only query tools when needed
- **Pattern:**
  ```typescript
  /** [Tool description from MCP schema] */
  export async function toolName(input: InputType): Promise<OutputType> {
    return callMCPTool<OutputType>('mcp_aiknowsys_tool_name', input);
  }
  ```
- **Risk:** Low - code generation, follow prototype pattern
- **TDD:** Integration tests for each wrapper

**Step 2.3: Generate Wrapper Files for Mutation Tools**
- **Action:** Create TypeScript wrappers for 10 mutation tools
- **Files:** `mcp-apis/aiknowsys/mutation/*.ts`
- **Why:** Separate concerns (query vs mutation)
- **Risk:** Low - same pattern as query tools

**Step 2.4: Generate Wrapper Files for Validation Tools**
- **Action:** Create TypeScript wrappers for 6 validation tools
- **Files:** `mcp-apis/aiknowsys/validation/*.ts`
- **Why:** Complete API coverage
- **Risk:** Low - same pattern

**Step 2.5: Create Index Files for Discovery**
- **Action:** Create `index.ts` files for each subdirectory
- **Files:**
  - `mcp-apis/aiknowsys/query/index.ts` - Re-exports all query functions
  - `mcp-apis/aiknowsys/mutation/index.ts` - Re-exports all mutation functions
  - `mcp-apis/aiknowsys/validation/index.ts` - Re-exports all validation functions
  - `mcp-apis/aiknowsys/index.ts` - Top-level discovery
- **Why:** Enable `import * as query from './query'` for organized usage
- **Risk:** Low - TypeScript export organization

---

### Phase 3: Documentation & Examples (1-2 days)

**Goal:** Help agents and users understand when/how to use code APIs

**Step 3.1: Create Code API README**
- **Action:** Write `mcp-apis/README.md` with:
  - When to use code APIs vs direct tools
  - Import examples
  - Data filtering patterns
  - Composite operation examples
- **Why:** Clear docs enable adoption
- **Risk:** Low - documentation only

**Step 3.2: Update AGENTS.md with Code Execution Guidance**
- **Action:** Add section "Code Execution with MCP" to AGENTS.md
- **Content:**
  ```markdown
  ## Code Execution with MCP (Optional - Claude Code Only)
  
  **If you have code execution capabilities:**
  - Import tools: `import * as aiknowsys from './mcp-apis/aiknowsys'`
  - Filter large results in code before returning to context
  - Combine multiple queries for complex workflows
  - 98% token reduction for data-heavy operations
  
  **If using standard Claude:**
  - Use direct tool calls: `mcp_aiknowsys_*`
  - Still efficient for 31 tools (~12K tokens upfront)
  ```
- **Why:** Guide agents to choose appropriate mode
- **Risk:** Low - documentation update

**Step 3.3: Create Example Workflows**
- **Action:** Add example code to `mcp-apis/examples/`:
  - `session_filtering.ts` - Query and filter sessions
  - `composite_query.ts` - Combine plans + sessions + patterns
  - `data_aggregation.ts` - Aggregate metrics across many records
- **Why:** Show real-world patterns
- **Risk:** Low - educational examples

---

### Phase 4: Testing & Validation (2-3 days)

**Goal:** Ensure code APIs work correctly in execution environments

**Step 4.1: Integration Tests with Code Execution**
- **Action:** Create test suite that:
  - Imports wrapper functions
  - Calls MCP server via client
  - Validates responses match direct tool calls
- **Files:** `test/integration/code-execution-apis.test.ts`
- **Why:** Verify code APIs produce identical results to direct tools
- **Risk:** Medium - requires test harness for code execution environment
- **TDD:** Write tests first, implement fixes

**Step 4.2: Performance Benchmarks**
- **Action:** Measure token savings for common workflows:
  - Direct tool call: `query_sessions_sqlite({ topic: "X" })` → measure output tokens
  - Code API + filter: `querySessionsSqlite().filter()` → measure output tokens
  - Calculate reduction percentage
- **Files:** `test/benchmarks/code-execution-token-savings.test.ts`
- **Why:** Quantify benefit (should match Anthropic's 98% for data-heavy ops)
- **Risk:** Low - measurement only

**Step 4.3: Validate with Real Claude Code Session**
- **Action:** Test with actual Claude Code agent:
  - Ask: "Query all sessions from Feb 2026 and show only titles"
  - Observe whether agent uses code APIs
  - Measure token usage
- **Why:** Real-world validation
- **Risk:** Low - observational testing
- **Output:** Document findings in session file

---

### Phase 5: Deployment & Migration (1 day)

**Goal:** Ship code execution APIs alongside existing direct tools

**Step 5.1: Update MCP Server Configuration**
- **Action:** Document how to expose `mcp-apis/` directory to code execution environments
- **Files:** `mcp-server/README.md`, `SETUP_GUIDE.md`
- **Why:** Users need to know how to enable code APIs
- **Risk:** Low - documentation only

**Step 5.2: Version Bump & Release Notes**
- **Action:** Bump to v0.11.0 (minor version - new feature, backwards compatible)
- **Files:**
  - `package.json` - version bump
  - `CODEBASE_CHANGELOG.md` - add entry
  - `RELEASE_NOTES_v0.11.0.md` - create detailed notes
- **Why:** Track milestone achievement
- **Risk:** Low - standard release process

**Step 5.3: Update Critical Invariants (if applicable)**
- **Action:** Review if code execution adds new invariants
- **Potential new invariant:** "When using code execution, filter large datasets in code before logging results"
- **Files:** `CODEBASE_ESSENTIALS.md`
- **Why:** Maintain consistency in approach
- **Risk:** Low - rules clarification

---

## 🎯 Success Criteria

- [ ] **Backwards Compatible** - Direct tool calls still work (no breaking changes)
- [ ] **Progressive Disclosure** - Agents can list and load tools on-demand
- [ ] **Token Reduction** - 90%+ reduction for data-heavy operations (benchmarks prove it)
- [ ] **Documentation** - Clear guidance on when to use each mode
- [ ] **Tests Passing** - All integration tests + benchmarks pass
- [ ] **Real-world Validation** - Tested with Claude Code in actual session

---

## ⚠️ Risks & Mitigations

### Risk 1: Code Execution Not Available
- **Likelihood:** Medium (not all users have Claude Code)
- **Impact:** Low (optimization is optional, direct tools still work)
- **Mitigation:** Hybrid approach - offer both modes, document trade-offs

### Risk 2: MCP Client Connection in Code Execution Complex
- **Likelihood:** Medium (stdio transport might be tricky in code execution environment)
- **Impact:** High (blocks entire feature if can't connect)
- **Mitigation:** 
  - Research early in Phase 1 (prototype)
  - Fallback: Generate static TypeScript types instead of runtime wrappers

### Risk 3: Added Complexity for Minimal Gain
- **Likelihood:** Low (Anthropic proved 98% savings)
- **Impact:** Medium (maintenance burden)
- **Mitigation:**
  - User feedback loop in Phase 1 (step 1.4)
  - Only proceed if clear value proposition
  - Keep implementation simple (code generation, not hand-written)

### Risk 4: Skills Already Cover This Pattern
- **Likelihood:** Medium (AIKnowSys skills might already guide this behavior)
- **Impact:** Low (code APIs still valuable for progressive disclosure)
- **Mitigation:**
  - Review existing skills for redundancy
  - Update skills to reference code APIs where applicable

---

## 🧠 Notes for Developer

**Key Design Decisions:**

1. **Hybrid Approach (Not Either/Or)**
   - Keep direct tools for compatibility
   - Add code APIs as opt-in enhancement
   - Document when to use each

2. **Code Generation Over Hand-written**
   - Wrappers follow mechanical pattern
   - Consider generating from MCP tool definitions
   - DRY: Don't duplicate logic, just wrap

3. **Progressive Disclosure is Key Benefit**
   - Loading 31 tools upfront ≈ 12K tokens
   - Loading 2-3 tools on-demand ≈ 500 tokens
   - 96% reduction even without data filtering

4. **Data Filtering is Secondary Benefit**
   - Already optimized SQLite query tools
   - Main win: Filter results AFTER query in code
   - Example: Query 100 sessions, show only 5 metadata objects

**Testing Strategy:**

```typescript
// Integration test pattern:
test('code API matches direct tool call', async () => {
  // Direct tool call (current)
  const direct = await mcp_aiknowsys_get_critical_invariants();
  
  // Code API wrapper (new)
  const codeApi = await getCriticalInvariants();
  
  // Should be identical
  expect(codeApi).toEqual(direct);
});
```

**Performance Benchmark Pattern:**

```typescript
// Measure token reduction:
test('code execution reduces tokens by 90%+', async () => {
  // Baseline: Direct tool call
  const fullSessions = await querySessionsSqlite({ topic: "mcp" });
  const baselineTokens = estimateTokens(JSON.stringify(fullSessions));
  
  // Optimized: Code execution with filtering
  const filtered = fullSessions
    .filter(s => new Date(s.date) > new Date('2026-02-01'))
    .map(s => ({ title: s.title, status: s.status }));
  const optimizedTokens = estimateTokens(JSON.stringify(filtered));
  
  const reduction = ((baselineTokens - optimizedTokens) / baselineTokens) * 100;
  expect(reduction).toBeGreaterThan(90); // 90%+ reduction
});
```

---

## 🔄 Future Enhancements (Out of Scope)

**If this proves valuable:**
1. **Skills as Executable Code** - Convert `.github/skills/` to importable TypeScript modules
2. **Auto-generated Wrappers** - Script that reads MCP tool definitions and generates wrapper files
3. **Search Tools API** - Add `searchTools(query: string)` for natural language tool discovery
4. **Privacy-preserving Tokenization** - Intercept PII before it reaches model context
5. **State Persistence** - Enable agents to save workspace files across sessions

---

## 📖 References

- **Source Article:** [Anthropic - Code execution with MCP: Building more efficient agents](https://www.anthropic.com/engineering/code-execution-with-mcp)
- **MCP Documentation:** [Model Context Protocol](https://modelcontextprotocol.io/)
- **Related:** Cloudflare's "Code Mode" approach (similar findings)

---

*Part of AIKnowSys optimization roadmap. Created in response to Anthropic's MCP best practices research.*
