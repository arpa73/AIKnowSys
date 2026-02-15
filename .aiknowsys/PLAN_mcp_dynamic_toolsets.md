---
title: "MCP Dynamic Toolsets - Speakeasy 3-Tool Pattern"
status: "PLANNED"
priority: "high"
created: "2026-02-15"
author: "Planner"
topics: ["mcp-tools", "token-optimization", "speakeasy-pattern", "infrastructure"]
depends_on: []
evolution_of: ["static tool registration"]
---

# PLAN: MCP Dynamic Toolsets (Speakeasy Pattern)

**Status:** 📋 PLANNED  
**Priority:** 🔴 HIGH  
**Created:** 2026-02-15  
**Estimated:** 1-2 weeks  
**Goal:** Reduce MCP tool definition tokens by 90%+ using Speakeasy's 3-tool pattern

---

## 🎯 Problem Statement

**Current Architecture (Static Toolsets):**
- 36+ tools registered directly in MCP server
- Each tool exposes full schema to LLM on every request
- Tool definitions consume 29.4% of context window
- Token usage grows linearly with tool count

**Impact:**
```
Current: 36 tools × ~800 tokens/tool = ~29K tokens (29.4% of context)
Problem: Adding more tools = less room for conversation
```

**User Experience:**
- Agent must know exact tool names, parameters, types
- Documentation overhead (reading schemas)
- Error-prone (wrong parameters, typos)

---

## 🎯 Solution: Speakeasy Dynamic Toolsets

**New Architecture (Dynamic Toolsets):**
Replace 36 static tools with **3 dynamic tools**:

1. **`aiknowsys_search_tools`** - Find relevant tools via semantic search
2. **`aiknowsys_describe_tools`** - Lazy-load schemas only when needed
3. **`aiknowsys_execute_tool`** - Execute discovered tools

**Expected Results (from Speakeasy benchmarks):**
- ✅ 96% input token reduction
- ✅ 90%+ total token reduction
- ✅ Constant token usage (36 tools or 360 tools)
- ✅ 100% success rate maintained
- ⚠️ Trade-off: 2-3x more tool calls, ~50% slower

**Token Impact:**
```
Before: 36 tools × 800 tokens = 28,800 tokens
After:  3 tools × 600 tokens =  1,800 tokens
Savings: 27,000 tokens (93.75% reduction)
```

---

## 📋 Overview

This plan implements the Speakeasy dynamic toolsets pattern as **infrastructure optimization**. It complements (not replaces) the conversational mediator plan.

**Relationship to existing optimizations:**
1. ✅ **Metadata-only queries** (Feb 14) - Reduced response tokens 97%
2. 🎯 **Dynamic toolsets** (This plan) - Reduce tool definition tokens 90%
3. 🔜 **Conversational mediator** (Later) - Improve UX using this infrastructure

**Key Insight:** The mediator will USE this pattern, not replace it.

---

## 🏗️ Architecture Changes

### Before (Static Registration)

```typescript
// server.ts - Current approach
this.server.registerTool('get_critical_invariants', { ... });
this.server.registerTool('get_validation_matrix', { ... });
this.server.registerTool('get_active_plans', { ... });
this.server.registerTool('query_sessions_sqlite', { ... });
// ... 32+ more tools
```

**Result:** Every tool schema sent to LLM on every request.

### After (Dynamic Registration)

```typescript
// server.ts - New approach
this.server.registerTool('aiknowsys_search_tools', { ... });
this.server.registerTool('aiknowsys_describe_tools', { ... });
this.server.registerTool('aiknowsys_execute_tool', { ... });

// Internal registry (not exposed to LLM upfront)
private toolRegistry = new ToolRegistry([
  { name: 'get_critical_invariants', ... },
  { name: 'query_sessions_sqlite', ... },
  // ... all existing tools moved here
]);
```

**Result:** Only 3 tool schemas sent upfront. Others loaded on-demand.

---

## 📐 Implementation Steps

### Phase 1: Core Infrastructure (3-5 days)

**Goal:** Build the ToolRegistry and search mechanism without breaking existing tools.

#### Step 1.1: Create ToolRegistry Class (TDD)

**File:** `mcp-server/src/dynamic-toolset/tool-registry.ts` (NEW)

**Action:** Create internal tool metadata store
- **TDD Approach:**
  - 🔴 RED: Write tests for tool registration, search, retrieval
  - 🟢 GREEN: Implement ToolRegistry with basic operations
  - 🔵 REFACTOR: Optimize search performance

**Tests to write first:**
```typescript
// test/mcp-server/dynamic-toolset/tool-registry.test.ts
describe('ToolRegistry', () => {
  it('should register tools with metadata');
  it('should search tools by keywords');
  it('should retrieve tool by exact name');
  it('should return tool categories overview');
  it('should handle missing tools gracefully');
});
```

**Implementation:**
```typescript
export interface ToolMetadata {
  name: string;
  description: string;
  category: string;
  tags: string[];
  inputSchema: z.ZodObject<any>;
  handler: (args: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, ToolMetadata>;
  private categoryIndex: Map<string, string[]>;
  
  register(tool: ToolMetadata): void;
  search(query: string, tags?: string[]): ToolMetadata[];
  get(name: string): ToolMetadata | undefined;
  getCategoriesOverview(): string;
}
```

**Dependencies:** None  
**Risk:** Low - isolated new class  
**Estimated:** 1 day

---

#### Step 1.2: Add Tool Categories & Tags

**File:** `mcp-server/src/dynamic-toolset/tool-metadata.ts` (NEW)

**Action:** Categorize all 36 existing tools
- **Why:** Enables categorical search ("find session query tools")
- **Categories:**
  - `context` - Critical invariants, validation matrix
  - `query` - Session/plan queries, search, filters
  - `mutation` - Create/update sessions and plans
  - `validation` - Deliverables, TDD compliance, skill validation
  - `sqlite` - Database queries and stats

**Implementation:**
```typescript
export const TOOL_CATEGORIES = {
  context: 'Core project context (invariants, validation, patterns)',
  query: 'Query sessions, plans, and learned patterns',
  mutation: 'Create and modify sessions and plans',
  validation: 'Validate deliverables, TDD, and skills',
  sqlite: 'High-performance database queries',
} as const;

export const TOOL_METADATA: ToolMetadata[] = [
  {
    name: 'get_critical_invariants',
    category: 'context',
    tags: ['rules', 'invariants', 'essentials'],
    description: 'Returns 8 critical invariants...',
    inputSchema: z.object({}),
    handler: getCriticalInvariants,
  },
  // ... all 36 tools
];
```

**Dependencies:** Step 1.1 (ToolRegistry)  
**Risk:** Low - data structuring  
**TDD:** Non-applicable (data definition)  
**Estimated:** 0.5 days

---

#### Step 1.3: Implement Pattern-Based Search (MVP)

**File:** `mcp-server/src/dynamic-toolset/tool-search.ts` (NEW)

**Action:** Create simple pattern-based search (defer embeddings to Phase 2)
- **Why:** Pattern matching works for 80% of queries, simpler to implement
- **TDD Approach:**
  - 🔴 RED: Write tests for common search patterns
  - 🟢 GREEN: Implement regex-based search
  - 🔵 REFACTOR: Optimize pattern matching

**Tests to write first:**
```typescript
// test/mcp-server/dynamic-toolset/tool-search.test.ts
describe('ToolSearch', () => {
  it('should find tools by category filter');
  it('should find tools by keyword in description');
  it('should rank results by relevance');
  it('should handle natural language queries');
  it('should return empty array for no matches');
});
```

**Implementation:**
```typescript
export class ToolSearch {
  constructor(private registry: ToolRegistry) {}
  
  search(query: string, filters?: { tags?: string[] }): SearchResult[] {
    // 1. Check for category filters ("source:query")
    const categoryMatch = query.match(/category:(\w+)/);
    
    // 2. Keyword matching in name/description
    const keywords = query.toLowerCase().split(/\s+/);
    
    // 3. Score and rank results
    return this.rankResults(matches);
  }
  
  private rankResults(tools: ToolMetadata[]): SearchResult[] {
    // Simple scoring: exact match > tag match > description match
  }
}
```

**Dependencies:** Step 1.1, 1.2  
**Risk:** Low - deterministic search  
**Estimated:** 1 day

---

### Phase 2: Expose 3 Dynamic Tools (2-3 days)

**Goal:** Register the 3 dynamic tools in MCP server.

#### Step 2.1: Implement `aiknowsys_search_tools`

**File:** `mcp-server/src/dynamic-toolset/handlers.ts` (NEW)

**Action:** Create search tool handler
- **TDD Approach:**
  - 🔴 RED: Write tests for search scenarios
  - 🟢 GREEN: Implement handler
  - 🔵 REFACTOR: Optimize response format

**Tests to write first:**
```typescript
// test/mcp-server/dynamic-toolset/handlers.test.ts
describe('searchToolsHandler', () => {
  it('should return tools matching query');
  it('should include categories overview in response');
  it('should handle tag filters');
  it('should limit results to top 5 by default');
});
```

**Implementation:**
```typescript
export async function searchToolsHandler(args: {
  query: string;
  tags?: string[];
  limit?: number;
}): Promise<SearchToolsResponse> {
  const search = new ToolSearch(globalRegistry);
  const results = search.search(args.query, { tags: args.tags });
  
  return {
    tools: results.slice(0, args.limit ?? 5).map(r => ({
      name: r.name,
      description: r.description,
      category: r.category,
      relevance_score: r.score,
    })),
    categories_overview: globalRegistry.getCategoriesOverview(),
    total_found: results.length,
  };
}
```

**Register in server.ts:**
```typescript
this.server.registerTool(
  'aiknowsys_search_tools',
  {
    description: `Search for relevant AIKnowSys tools using natural language.

Categories: ${Object.keys(TOOL_CATEGORIES).join(', ')}

Examples:
  query: "find session query tools"
  query: "create plan", tags: ["mutation"]
  query: "validation commands"

Returns top 5 matching tools with relevance scores.`,
    inputSchema: z.object({
      query: z.string(),
      tags: z.array(z.string()).optional(),
      limit: z.number().optional().default(5),
    }),
  },
  async (args) => searchToolsHandler(args)
);
```

**Dependencies:** Phase 1 complete  
**Risk:** Low - uses completed registry  
**Estimated:** 1 day

---

#### Step 2.2: Implement `aiknowsys_describe_tools`

**File:** Same as 2.1 (`handlers.ts`)

**Action:** Create describe tool handler (lazy schema loading)
- **TDD Approach:**
  - 🔴 RED: Write tests for schema retrieval
  - 🟢 GREEN: Implement handler
  - 🔵 REFACTOR: Optimize schema serialization

**Tests to write first:**
```typescript
describe('describeToolsHandler', () => {
  it('should return schemas for requested tools');
  it('should include parameter descriptions');
  it('should handle missing tools gracefully');
  it('should return multiple tools in one call');
});
```

**Implementation:**
```typescript
export async function describeToolsHandler(args: {
  tools: string[];
}): Promise<DescribeToolsResponse> {
  const schemas = args.tools.map(name => {
    const tool = globalRegistry.get(name);
    if (!tool) {
      return { name, error: 'Tool not found' };
    }
    
    return {
      name: tool.name,
      description: tool.description,
      category: tool.category,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    };
  });
  
  return { tools: schemas };
}
```

**Register in server.ts:**
```typescript
this.server.registerTool(
  'aiknowsys_describe_tools',
  {
    description: `Get detailed schemas for specific tools. Only loads schemas you need.

Example:
  tools: ["query_sessions_sqlite", "create_session"]

Returns full parameter schemas for each tool.`,
    inputSchema: z.object({
      tools: z.array(z.string()),
    }),
  },
  async (args) => describeToolsHandler(args)
);
```

**Dependencies:** Phase 1, Step 2.1  
**Risk:** Low  
**Estimated:** 0.5 days

---

#### Step 2.3: Implement `aiknowsys_execute_tool`

**File:** Same as 2.1 (`handlers.ts`)

**Action:** Create execution handler (routes to actual tool implementations)
- **TDD Approach:**
  - 🔴 RED: Write tests for tool execution, error handling
  - 🟢 GREEN: Implement handler
  - 🔵 REFACTOR: Add validation, error wrapping

**Tests to write first:**
```typescript
describe('executeToolHandler', () => {
  it('should execute tool with correct arguments');
  it('should validate arguments against schema');
  it('should handle missing tools');
  it('should handle execution errors gracefully');
  it('should pass through successful results');
});
```

**Implementation:**
```typescript
export async function executeToolHandler(args: {
  tool: string;
  arguments: Record<string, any>;
}): Promise<ExecuteToolResponse> {
  const tool = globalRegistry.get(args.tool);
  
  if (!tool) {
    return { error: `Tool '${args.tool}' not found` };
  }
  
  // Validate arguments against schema
  const validation = tool.inputSchema.safeParse(args.arguments);
  if (!validation.success) {
    return { 
      error: 'Invalid arguments',
      details: validation.error.format(),
    };
  }
  
  // Execute the tool
  try {
    const result = await tool.handler(validation.data);
    return { success: true, result };
  } catch (error) {
    return { 
      success: false,
      error: error.message,
    };
  }
}
```

**Register in server.ts:**
```typescript
this.server.registerTool(
  'aiknowsys_execute_tool',
  {
    description: `Execute a discovered tool with specified arguments.

Example:
  tool: "query_sessions_sqlite"
  arguments: { dateAfter: "2026-02-01", topic: "mcp" }

Returns the tool's result or error details.`,
    inputSchema: z.object({
      tool: z.string(),
      arguments: z.record(z.any()),
    }),
  },
  async (args) => executeToolHandler(args)
);
```

**Dependencies:** Phase 1, Step 2.1, 2.2  
**Risk:** Medium - Core execution path  
**Estimated:** 1 day

---

### Phase 3: Migration & Testing (2-3 days)

**Goal:** Remove static tool registrations, validate dynamic pattern works.

#### Step 3.1: Move All Tools to Registry

**File:** `mcp-server/src/server.ts`

**Action:** Remove all `registerTool` calls except the 3 dynamic ones
- **Why:** Forces all tool access through dynamic pattern
- **TDD:** Existing tests should still pass (tools work via execute_tool)

**Before:**
```typescript
// 36+ registerTool calls
this.server.registerTool('get_critical_invariants', ...);
this.server.registerTool('get_validation_matrix', ...);
// ... etc
```

**After:**
```typescript
// Only 3 dynamic tools registered
this.server.registerTool('aiknowsys_search_tools', ...);
this.server.registerTool('aiknowsys_describe_tools', ...);
this.server.registerTool('aiknowsys_execute_tool', ...);

// All tools moved to registry (loaded at startup)
private initializeToolRegistry() {
  this.registry = new ToolRegistry();
  TOOL_METADATA.forEach(tool => this.registry.register(tool));
}
```

**Dependencies:** Phase 2 complete  
**Risk:** High - Breaking change for agents  
**Mitigation:** Keep old tools commented out initially, test dynamic pattern first  
**Estimated:** 0.5 days

---

#### Step 3.2: Create Integration Tests

**File:** `test/mcp-server/integration/dynamic-toolset.test.ts` (NEW)

**Action:** Test full workflow (search → describe → execute)
- **TDD:** Write tests BEFORE migration
- **Test realistic agent workflows**

**Tests:**
```typescript
describe('Dynamic Toolset Integration', () => {
  it('should complete workflow: search -> describe -> execute', async () => {
    // 1. Search for tools
    const search = await searchToolsHandler({ 
      query: 'query recent sessions' 
    });
    expect(search.tools).toContainEqual(
      expect.objectContaining({ name: 'query_sessions_sqlite' })
    );
    
    // 2. Describe the tool
    const describe = await describeToolsHandler({ 
      tools: ['query_sessions_sqlite'] 
    });
    expect(describe.tools[0].inputSchema).toBeDefined();
    
    // 3. Execute the tool
    const execute = await executeToolHandler({
      tool: 'query_sessions_sqlite',
      arguments: { dateAfter: '2026-02-01' },
    });
    expect(execute.success).toBe(true);
  });
  
  it('should handle tool not found gracefully');
  it('should validate invalid arguments');
  it('should maintain 100% success rate for valid queries');
});
```

**Dependencies:** Phase 2 complete  
**Risk:** Low - validation before migration  
**Estimated:** 1 day

---

#### Step 3.3: Update AGENTS.md & Documentation

**Files:**
- `AGENTS.md` - Update MCP tools reference
- `mcp-server/README.md` - Document new 3-tool pattern
- `docs/mcp-sqlite-usage-examples.md` - Add dynamic toolset examples

**Action:** Document the new workflow for agents
- **Agent instructions:**
  ```markdown
  ## Using Dynamic Toolsets (v0.11.0+)
  
  **Instead of calling tools directly:**
  1. Search: `aiknowsys_search_tools({ query: "session queries" })`
  2. Describe: `aiknowsys_describe_tools({ tools: ["query_sessions_sqlite"] })`
  3. Execute: `aiknowsys_execute_tool({ tool: "query_sessions_sqlite", arguments: {...} })`
  
  **Benefits:**
  - 90% token reduction in tool definitions
  - Natural language tool discovery
  - Conversation history caches schemas (no re-describing)
  ```

**Dependencies:** Phase 3.1 complete  
**Risk:** Low - documentation  
**Estimated:** 0.5 days

---

### Phase 4: Optimization & Embeddings (Future - Optional)

**Goal:** Add semantic search with embeddings (deferred to later).

**Why defer:**
- Pattern matching works for 80% of queries
- Embeddings add complexity (model loading, vector storage)
- Can be added later without breaking changes

**Future implementation:**
```typescript
// mcp-server/src/dynamic-toolset/embeddings.ts
export class EmbeddingSearch extends ToolSearch {
  private embeddings: Map<string, number[]>;
  
  async search(query: string): Promise<SearchResult[]> {
    const queryEmbedding = await this.embed(query);
    const scores = this.cosineSimilarity(queryEmbedding, this.embeddings);
    return this.rankResults(scores);
  }
}
```

**Estimated:** 2-3 days (when needed)

---

## 🧪 Testing Strategy

### TDD Approach (Mandatory)

**For all new features:**
1. 🔴 **RED:** Write failing test FIRST
2. 🟢 **GREEN:** Implement minimal code to pass
3. 🔵 **REFACTOR:** Clean up while keeping tests green

### Test Coverage

**Unit Tests:** (40+ tests)
- ToolRegistry operations (5 tests)
- ToolSearch pattern matching (8 tests)
- Search handler (6 tests)
- Describe handler (4 tests)
- Execute handler (8 tests)
- Error handling (9 tests)

**Integration Tests:** (10+ tests)
- Full workflow: search → describe → execute
- Multi-tool operations
- Error recovery
- Token counting validation

**Manual Validation:**
- Compare token usage before/after (expect 90%+ reduction)
- Test with real agent workflows
- Verify conversation history caching works

---

## 📊 Success Criteria

**Functional:**
- [ ] All 36 existing tools accessible via dynamic pattern
- [ ] Search finds correct tools (>90% accuracy)
- [ ] Describe returns valid schemas
- [ ] Execute maintains 100% success rate for valid calls
- [ ] All existing tests pass (tool behavior unchanged)

**Performance:**
- [ ] Tool definition tokens reduced by 90%+ (29K → <3K)
- [ ] Search completes in <100ms
- [ ] Total workflow time <2 seconds (search + describe + execute)

**Quality:**
- [ ] 100% test coverage on new code
- [ ] No breaking changes to tool functionality
- [ ] Documentation complete
- [ ] AGENTS.md updated with new workflow

---

## ⚠️ Risks & Mitigations

### Risk 1: Higher Latency
**Likelihood:** High  
**Impact:** Medium  
**Mitigation:**
- Optimize search algorithm (pattern matching first)
- Cache tool descriptions in conversation history
- Defer embeddings to Phase 4 (keep it simple initially)

### Risk 2: Search Quality
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Start with category filters (high precision)
- Use keyword matching for MVP
- Add embeddings in Phase 4 if needed

### Risk 3: Breaking Existing Agents
**Likelihood:** High  
**Impact:** High  
**Mitigation:**
- Keep Phase 3.1 as separate step (test first)
- Comment out old tools initially (don't delete)
- Test integration before full migration
- Update AGENTS.md with clear migration guide

### Risk 4: Complexity Overhead
**Likelihood:** Low  
**Impact:** Low  
**Mitigation:**
- Keep Phase 1-3 simple (pattern matching only)
- Defer embeddings to future
- Maintain clean separation of concerns (registry, search, handlers)

---

## 📝 Notes for Developer

**Key Architectural Decisions:**

1. **Pattern matching BEFORE embeddings:** Simpler, works for 80% of cases, can upgrade later
2. **Category-based organization:** Makes search more precise, easier to maintain
3. **Separate registry from handlers:** Clean separation of concerns, easier to test
4. **Zod schema reuse:** Existing tool schemas move to registry, no duplication

**Gotchas:**

- **Don't delete old tool registrations yet!** Keep them commented out in Phase 3.1 for easy rollback
- **Test token counts manually:** Use MCP inspector or logging to verify 90% reduction
- **Conversation history caching:** Once a tool is described, LLM can reuse schema from history (free optimization!)

**Extension Points:**

- **Phase 4 (embeddings):** Drop-in replacement for ToolSearch class
- **Conversational mediator:** Will use these 3 tools as infrastructure
- **Custom search filters:** Add more tags/categories as needed

**Dependencies:**

- **None!** This is self-contained optimization
- **Complements:** Metadata-only queries (already implemented)
- **Foundation for:** Conversational mediator (future plan)

---

## 🔗 Related Plans

- ✅ **Metadata-only optimization** (Feb 14) - Query response token reduction
- 🔜 **Conversational mediator** (PLAN_conversational_mediator.md) - UX layer on top of this
- 🔜 **MCP HTTP transport** (PLAN_conversational_mediator.md) - Centralized server deployment

---

## 📚 References

- [Speakeasy: 100x token reduction with dynamic toolsets](https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Current MCP server implementation](../../mcp-server/src/server.ts)

---

*Part of AIKnowSys token/i optimization strategy. Complements metadata-only queries and enables future AI UX improvements.*
