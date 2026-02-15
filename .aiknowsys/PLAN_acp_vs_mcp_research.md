---
title: "Protocol Research: MCP vs ACP vs A2A - Knowledge Keeper Architecture"
status: "PLANNED"
priority: "low"
created: "2026-02-15"
author: "Planner"
topics: ["research", "poc", "acp", "mcp", "a2a", "protocol-comparison"]
depends_on: []
blocks: ["PLAN_conversational_mediator"]
research: true
---

# PLAN: Protocol Research - MCP vs ACP vs A2A

**Status:** 📋 PLANNED (Research Phase)  
**Priority:** 🔵 LOW (Exploration - no urgency)  
**Created:** 2026-02-15  
**Updated:** 2026-02-15 (Added A2A)  
**Estimated:** 2-3 weeks (research + POCs)  
**Type:** Research & Decision Document  
**Goal:** Determine optimal protocol for knowledge keeper architecture

---

## 🤔 The Question

**Should AIKnowSys knowledge keeper use:**
- **MCP** (Model Context Protocol) - current choice, good IDE support
- **ACP** (Agent Client Protocol) - designed for service providers
- **A2A** (Agent-to-Agent) - Google's agent interoperability protocol

**All three can implement the same architecture:**
```
Agent → Natural language query → Knowledge Keeper → Storage → Response
```

**Question:** Does protocol choice matter, or is it just wire format?

---

## 🎯 Research Goals

**Primary:**
1. **Performance comparison** - Is one protocol measurably faster/lighter?
2. **Integration effort** - Which is easier to integrate with AI agents (Claude, GPT-4, Copilot)?
3. **Ecosystem maturity** - SDK quality, documentation, community support
4. **Future-proofing** - Which protocol has better long-term outlook?

**Secondary:**
5. **Migration cost** - If we switch later, how painful is it?
6. **Hybrid feasibility** - Can we support both protocols simultaneously?

---

## 📊 Success Criteria

**We have enough data to decide when:**

- [ ] Both protocols implemented in POC (working conversational query)
- [ ] Performance benchmarked (latency, throughput, overhead)
- [ ] Integration tested with 3+ AI agents (Claude, GPT-4, Copilot)
- [ ] Code complexity compared (LoC, maintainability)
- [ ] Ecosystem evaluated (SDK maturity, docs quality, community)
- [ ] Migration path documented (switching cost, hybrid options)

**Decision criteria:**
- If ACP is **significantly better** (>2x performance or 10x easier integration) → Switch
- If ACP is **marginally better** (<20% improvement) → Stay with MCP (avoid migration cost)
- If **equivalent** → Stay with MCP (already working, IDE support)
- If ACP has **unknown risks** → Defer decision until ecosystem matures

---

## 🔬 Research Phase 1: Protocol Analysis (3-4 days)

**Goal:** Understand all three protocols at architectural level

### Step 1.1: MCP Deep Dive

**Read:**
- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Current AIKnowSys MCP implementation

**Document:**
- Protocol overhead (JSON-RPC 2.0 structure)
- Transport options (stdio, HTTP/SSE, WebSocket)
- Authentication mechanisms
- Tool schema validation approach
- Streaming support
- Error handling patterns

**Answer:**
- What's the theoretical minimum request/response size?
- Can MCP support "conversational" tools with dynamic responses?
- How does MCP handle intent parsing (can tools call LLMs)?
- What's the IDE integration story (VS Code, Cursor, Claude Desktop)?

**Deliverable:** `research/mcp-analysis.md`

---

### Step 1.2: ACP Deep Dive

**Read:**
- [ACP Architecture](https://agentclientprotocol.com/get-started/architecture)
- [IBM on ACP](https://www.ibm.com/think/topics/agent-communication-protocol)
- [ACP TypeScript SDK](https://github.com/agentclientprotocol/typescript-sdk)
- Sample ACP server implementations (GitHub search)
- IBM watsonx integration examples (if available)

**Document:**
- Protocol overhead (message structure)
- Transport options
- Authentication mechanisms
- Dynamic capability negotiation
- Streaming support
- Error handling patterns

**Answer:**
- What's the theoretical minimum request/response size?
- Is ACP designed for conversational services?
- How does ACP model intent interpretation?
- What's the AI agent integration story?
- SDK maturity - production ready or experimental?
- IBM's commitment level - marketing or core product integration?
- IBM watsonx integration - native ACP support?
- Enterprise features - auth, audit logging, etc.?

**Key questions:**
- Is IBM using ACP in production (watsonx, etc.)?
- What's IBM's roadmap for ACP?
- Community vs IBM control - who drives direction?

**Deliverable:** `research/acp-analysis.md`

---

### Step 1.3: A2A Deep Dive

**Read:**
- [A2A Announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [A2A GitHub Repository](https://github.com/a2aproject/A2A)
- A2A specification documents
- Sample implementations

**Document:**
- Protocol design (agent-to-agent communication)
- Message structure and overhead
- Transport layer
- Interoperability features
- Authentication/authorization
- Streaming capabilities
- Error handling

**Answer:**
- Is A2A designed for agent-to-service communication (our use case)?
- How does A2A differ from MCP/ACP architecturally?
- What's Google's vision for A2A adoption?
- SDK availability (TypeScript, Python, etc.)
- Production readiness
- Integration with existing AI frameworks (LangChain, etc.)

**Key questions:**
- Does "agent-to-agent" mean peer-to-peer, or does it support agent-to-service?
- Is AIKnowSys a "service" or another "agent" in A2A's model?
- Can A2A handle conversational knowledge keeper pattern?

**Deliverable:** `research/a2a-analysis.md`

---

### Step 1.4: Comparison Matrix

**Create comparison table:**

| Aspect | MCP | ACP | A2A | Winner |
|--------|-----|-----|-----|--------|
| **Protocol overhead** | JSON-RPC 2.0 | ? | ? | ? |
| **Transport options** | stdio, HTTP/SSE, WS | ? | ? | ? |
| **SDK maturity** | Production (Anthropic) | ? | ? | ? |
| **Documentation** | Comprehensive | ? | ? | ? |
| **Community support** | Growing | ? | ? | ? |
| **IDE integration** | VS Code ✅, Cursor ✅ | ? | ? | ? |
| **AI agent support** | Claude ✅, Copilot ✅ | ? | ? | ? |
| **Conversational design** | Tool-focused | Service-focused? | Agent interop? | ? |
| **Streaming** | Supported | ? | ? | ? |
| **Auth built-in** | No (manual) | ? | ? | ? |
| **Learning curve** | Moderate | ? | ? | ? |
| **Use case fit** | Tools/context | Services | Agent-to-agent | ? |
| **Backed by** | Anthropic | IBM | Google | ? |
| **Enterprise focus** | IDE integration | Enterprise agents? | Consumer AI? | ? |
| **Interoperability** | MCP-specific | ? | High (Google's goal) | ? |

**Additional considerations:**
- **Agent vs Service model:** Does A2A treat AIKnowSys as peer agent or backend service?
- **Google ecosystem:** Integration with Vertex AI, Gemini, etc.?
- **Open source commitment:** How open is A2A really? (Google has history of sunset)

**Deliverable:** `research/protocol-comparison.md`

---

## 🛠️ Research Phase 2: POC Implementation (7-10 days)

**Goal:** Build working conversational query in all three protocols

### Step 2.1: MCP Conversational POC

**Implement:**
```
poc/mcp-conversational/
├── src/
│   ├── server.ts              # MCP server setup
│   ├── tools/
│   │   └── conversational-query.ts  # Single conversational tool
│   ├── mediator/
│   │   ├── intent-parser.ts   # AI intent parsing
│   │   └── response-formatter.ts  # Conversational responses
│   └── storage/
│       └── mock-storage.ts    # Simplified storage (for POC)
├── test/
│   ├── integration.test.ts    # End-to-end tests
│   └── benchmarks.test.ts     # Performance tests
└── package.json
```

**Features:**
- Natural language queries: "What did we work on this week?"
- Intent parsing (use GPT-4 Mini API or local LLM)
- Conversational responses with suggestions
- Mock storage (sessions, plans - in-memory)

**Measure:**
- Request/response latency
- Token overhead (protocol metadata)
- Lines of code
- Integration complexity (VS Code config)

**Deliverable:** Working POC + metrics

---

### Step 2.2: ACP Knowledge Keeper POC

**Implement:**
```
poc/acp-keeper/
├── src/
│   ├── server.ts              # ACP server setup
│   ├── keeper/
│   │   ├── intent-parser.ts   # AI intent parsing
│   │   └── response-formatter.ts  # Conversational responses
│   └── storage/
│       └── mock-storage.ts    # Same mock data as MCP POC
├── test/
│   ├── integration.test.ts    # Same test cases as MCP
│   └── benchmarks.test.ts     # Same benchmarks
└── package.json
```

**Features:**
- Same natural language queries as MCP POC
- Same intent parsing logic
- Same mock storage (apples-to-apples comparison)

**Measure:**
- Same metrics as MCP POC
- Compare directly

**Deliverable:** Working POC + comparative metrics

---

### Step 2.3: A2A Knowledge Keeper POC

**Implement:**
```
poc/a2a-keeper/
├── src/
│   ├── server.ts              # A2A server setup
│   ├── agent/                 # AIKnowSys as A2A "agent"
│   │   ├── intent-parser.ts   # AI intent parsing
│   │   └── response-formatter.ts  # Conversational responses
│   └── storage/
│       └── mock-storage.ts    # Same mock data as other POCs
├── test/
│   ├── integration.test.ts    # Same test cases as others
│   └── benchmarks.test.ts     # Same benchmarks
└── package.json
```

**Features:**
- Same natural language queries as other POCs
- Same intent parsing logic
- Same mock storage (consistent comparison)
- Explore: Does A2A agent model fit knowledge keeper?

**Measure:**
- Same metrics as other POCs
- Protocol-specific: Agent discovery, capability negotiation
- Interoperability: Can A2A agent talk to MCP client?

**Deliverable:** Working POC + comparative metrics

---

### Step 2.4: Agent Integration Testing

**Test all three POCs with:**

1. **Claude (VS Code + MCP Client)**
   - Can Claude use MCP conversational tool?
   - Can Claude use ACP keeper service?
   - Which feels more natural?

2. **GitHub Copilot (VS Code)**
   - Same questions as above

3. **GPT-4 (via API - custom client)**
   - Build minimal client for all three protocols
   - Compare integration code complexity

4. **Google Gemini (if A2A is targeted at it)**
   - Test native A2A support
   - Compare with MCP/ACP integration

**Measure:**
- Integration code (LoC for each agent × protocol)
- Configuration complexity
- Response quality (do agents use it correctly?)
- Error handling (what happens when agent sends malformed requests?)
- Interoperability: Can MCP client talk to A2A server via adapter?

**Deliverable:** `research/agent-integration-results.md`

---

## 📈 Research Phase 3: Analysis & Decision (1-2 days)

**Goal:** Make informed protocol choice

### Step 3.1: Benchmark Comparison

**Create performance table:**

| Metric | MCP | ACP | Difference |
|--------|-----|-----|------------|
| **Avg latency (local)** | ? ms | ? ms | ? |
| **Avg latency (HTTP)** | ? ms | ? ms | ? |
| **Protocol overhead** | ? bytes | ? bytes | ? |
| **Throughput (req/sec)** | ? | ? | ? |
| **Memory usage** | ? MB | ? MB | ? |

**Verdict:** Performance winner = ?

---

### Step 3.2: Developer Experience Comparison

**Compare:**

| Aspect | MCP | ACP | A2A | Winner |
|--------|-----|-----|-----|--------|
| **Server LoC** | ? | ? | ? | ? |
| **Client integration LoC** | ? | ? | ? | ? |
| **Config complexity** | ? | ? | ? | ? |
| **Error messages** | ? | ? | ? | ? |
| **Debugging tools** | ? | ? | ? | ? |
| **Documentation quality** | ? | ? | ? | ? |
| **Conceptual clarity** | ? | ? | ? | ? |

**Verdict:** DX winner = ?

---

### Step 3.3: Ecosystem & Future

**Evaluate:**

| Factor | MCP | ACP | A2A | Notes |
|--------|-----|-----|-----|-------|
| **Current adoption** | High (Anthropic, VS Code) | ? | ? (new) | ? |
| **Active development** | ✅ (frequent releases) | ? | ? | ? |
| **Community size** | Growing | ? | ? (early) | ? |
| **Production usage** | Yes (Claude Desktop) | ? | ? | ? |
| **Breaking changes risk** | ? | ? | ? (v1.0?) | ? |
| **Long-term support** | Anthropic committed | ? | Google (🤔 sunset risk?) | ? |
| **Backed by** | Anthropic | IBM | Google | ? |
| **Open source commitment** | Yes | Yes | Yes (but Google...) | ? |
| **Interoperability vision** | MCP ecosystem | Enterprise agents? | Multi-protocol (ambitious) | ? |
| **Enterprise adoption** | Growing | IBM watsonx? | Unknown | ? |

**Corporate backing assessment:**
- **Anthropic (MCP):** AI-first company, MCP is core to product (Claude Desktop)
- **IBM (ACP):** Enterprise giant, focus on watsonx/AI agents, stable but slow to pivot
- **Google (A2A):** Consumer AI, history of killing projects (Reader, Wave, Polymer, Stadia...)

**Additional considerations:**
- **Google sunset risk:** Track record suggests high abandonment risk
- **IBM enterprise focus:** Slower iteration but better long-term support?
- **A2A maturity:** How new is it? Is it production-ready or research prototype?
- **Interoperability promise:** Can A2A bridge MCP/ACP, or is it yet another standard (XKCD 927)?

**Verdict:** Future-proofing winner = ?

---

### Step 3.4: Make Decision

**Decision tree:**

```
Are any alternatives (ACP/A2A) production-ready?
├─ NO → Stay with MCP (proven, working now)
└─ YES → Continue...
    │
    Is one protocol >2x better (performance/DX)?
    ├─ YES → Switch to that protocol (clear winner)
    └─ NO (all roughly equivalent) → Continue...
        │
        Does A2A offer unique interoperability?
        ├─ YES → Consider A2A (bridge protocols)
        ├─ NO → Continue...
        │
        Is migration risk acceptable?
        ├─ NO → Stay with MCP (working now)
        └─ YES → Continue...
            │
            Can we support multiple protocols?
            ├─ YES → Hybrid (let agents choose)
            └─ NO → Stay with MCP (simplicity)
```

**Key insights to document:**
1. **Best for current use case:** Which protocol fits "knowledge keeper" model best?
2. **Best for ecosystem:** Which has momentum, community, longevity?
3. **Best for future:** Which enables features we want (interop, scaling, etc.)?
4. **Pragmatic choice:** Considering migration cost, is switch worth it?

**Deliverable:** `research/DECISION.md` with clear recommendation

---

## 🎯 Potential Outcomes

### Outcome 1: Choose MCP (Stay Course)

**Rationale:**
- Mature ecosystem, production-ready SDK
- Already integrated with VS Code, Claude Desktop
- ACP advantages too small to justify migration cost

**Next steps:**
- Proceed with [PLAN_conversational_mediator.md](PLAN_conversational_mediator.md) using MCP
- One conversational tool, 31 direct tools (backward compatible)
- Deploy to mini PC with HTTP/SSE transport

---

### Outcome 2: Choose ACP (Switch)

**Rationale:**
- Significantly better performance/DX
- Designed for knowledge keeper use case
- Worth migration cost for long-term benefits

**Next steps:**
- Create [PLAN_acp_migration.md](PLAN_acp_migration.md)
- Phase 1: Build ACP server alongside MCP (hybrid)
- Phase 2: Migrate agents to ACP
- Phase 3: Deprecate MCP (12+ month timeline)

---

### Outcome 3: Hybrid (Support Multiple Protocols)

**Rationale:**
- Each protocol has strengths for different use cases
- Let agents choose based on their capabilities
- A2A might enable cross-protocol interoperability
- Shared storage layer makes this feasible

**Architecture:**
```
┌──────────────────────────────────────────────────────────┐
│  Agent Clients                                           │
│  ├─ MCP clients (VS Code, Claude Desktop)               │
│  ├─ ACP clients (Custom tools, future agents)           │
│  └─ A2A clients (Google ecosystem, interop layer)       │
└──────────────┬───────────────────────────────────────────┘
               │
┌──────────────┴───────────────────────────────────────────┐
│  Protocol Adapters (run on mini PC)                     │
│  ├─ MCP Server (HTTP/SSE, port 3100)                    │
│  ├─ ACP Server (port 3101)                              │
│  └─ A2A Server (port 3102, with interop bridge)         │
└──────────────┬───────────────────────────────────────────┘
               │
┌──────────────┴───────────────────────────────────────────┐
│  Shared Knowledge Keeper                                 │
│  ├─ Intent parser (protocol-agnostic)                    │
│  ├─ Query engine (protocol-agnostic)                     │
│  └─ Response formatter (adapts to protocol)              │
└──────────────┬───────────────────────────────────────────┘
               │
┌──────────────┴───────────────────────────────────────────┐
│  Storage Layer                                           │
│  ├─ SQLite (sessions, plans, patterns)                  │
│  ├─ Vector DB (semantic search)                          │
│  └─ Markdown (backups)                                   │
└──────────────────────────────────────────────────────────┘
```

**Potential interoperability:**
- If A2A delivers on promise, it might bridge MCP ↔ ACP
- AIKnowSys could be "universal knowledge keeper" for any agent
- Protocol becomes implementation detail, not user concern

**Next steps:**
- Create [PLAN_multi_protocol_support.md](PLAN_multi_protocol_support.md)
- Abstract protocol layer completely from business logic
- Implement adapters sharing same keeper core
- Test cross-protocol scenarios (MCP agent via A2A bridge?)

---

### Outcome 4: Defer Decision

**Rationale:**
- Alternative protocols (ACP/A2A) too immature
- Not enough real-world usage data
- Wait 6-12 months for ecosystem to develop
- Google's commitment to A2A unclear

**Next steps:**
- Proceed with MCP (proven technology, working now)
- Revisit alternatives in Q3-Q4 2026
- Monitor ACP/A2A adoption in the wild
- Keep architecture protocol-agnostic (easy future switch)
- Watch for: A2A production deploys, ACP ecosystem growth, protocol convergence

---

## 🚧 Risks & Mitigations

**Risk 1: ACP SDK is experimental**
- **Impact:** Breaking changes, bugs, lack of support
- **Mitigation:** Test thoroughly in POC, check GitHub issues, ask community

**Risk 2: Time investment doesn't yield clear answer**
- **Impact:** 1-2 weeks spent, no better than coin flip
- **Mitigation:** Set decision deadline, "when in doubt, stay with MCP"

**Risk 3: Both protocols have major limitations**
- **Impact:** Neither is good fit for knowledge keeper
- **Mitigation:** Fall back to custom HTTP API (no protocol)

**Risk 4: Hybrid approach triples maintenance**
- **Impact:** Three protocol codebases to maintain, test, document
- **Mitigation:** Abstract protocol layer completely, shared business logic, automated testing

**Risk 5: A2A is vaporware or gets sunset**
- **Impact:** Time invested in dead protocol, Google kills it after 2 years
- **Mitigation:** Assess Google's commitment, look for production usage, keep abstraction layer

---

## 📚 Resources

**MCP:**
- Spec: https://modelcontextprotocol.io/
- SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Examples: https://github.com/modelcontextprotocol/servers

**ACP:**
- Homepage: https://agentclientprotocol.com/
- IBM Overview: https://www.ibm.com/think/topics/agent-communication-protocol
- Architecture: https://agentclientprotocol.com/get-started/architecture
- TypeScript SDK: https://github.com/agentclientprotocol/typescript-sdk
- IBM watsonx docs (search for ACP integration)

**A2A:**
- Announcement: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- GitHub: https://github.com/a2aproject/A2A
- Specification: (explore repo for docs)
- Examples: (search repo for sample implementations)

**Comparison articles:**
- (Search for "MCP vs ACP vs A2A comparison" when ready)
- Community discussions (HackerNews, Reddit, Discord)
- Google I/O talks on A2A (if available)

---

## 🎯 When to Execute This Research

**Trigger conditions:**

- ✅ **Quick wins** complete (conversational errors, previews, hints)
- ✅ **Smart tools** complete (smart query, cross-refs, batch ops)
- ✅ **Ready to build** conversational mediator/keeper
- ✅ **1-2 weeks** available for research (no urgent features)
- ✅ **Curiosity satisfied** - is ACP actually better?

**Don't start until:**
- ❌ Quick wins and smart tools are done
- ❌ Current work has clear path forward
- ❌ You have uninterrupted focus time

**This research is optional!** MCP works fine. Only do this if:
- You're genuinely curious about ACP
- You have time to spare (not urgent work)
- You want to make an informed protocol choice

**If in doubt:** Skip research, build with MCP, revisit later.

---

## 🎉 Success Looks Like

**At the end of this research:**

1. ✅ Clear understanding of both protocols
2. ✅ Working POC for each approach
3. ✅ Quantitative comparison (performance, DX, ecosystem)
4. ✅ Informed decision with documented rationale
5. ✅ Migration plan (if switching) or confidence in MCP (if staying)
6. ✅ No regrets - we explored the options!

**Outcome:** Make the right protocol choice for AIKnowSys knowledge keeper, based on data not hype.

---

*This is a research plan, not an implementation plan. Execute only when curious and ready to explore!*

*Part of AIKnowSys planning documentation. See [PLAN_conversational_mediator.md](PLAN_conversational_mediator.md) for the architecture being protocoled.*
