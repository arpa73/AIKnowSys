---
title: "Natural Language Query API Design"
status: ACTIVE
priority: medium
created: 2026-02-13
author: Planner
topics: ["mcp-tools", "natural-language", "ai-ux", "api-design"]
---

# PLAN: Natural Language Query API

**Status:** 🎯 ACTIVE  
**Priority:** 🟡 MEDIUM (Part of MCP Tools AI UX Overhaul)  
**Created:** 2026-02-13  
**Goal:** Enable conversational queries like "Show me sessions from last week about MCP"

---

## 🎯 Problem Statement

**Current API (rigid):**
```typescript
query_sessions_sqlite({
  dateAfter: "2026-02-06",
  topic: "mcp-tools"
})
```

**Desired API (conversational):**
```typescript
query_sessions_natural({
  query: "Show me sessions from last week about MCP"
})

// OR even better - let the LLM format it directly:
query_sessions_sqlite({
  when: "last week",
  about: "MCP"
})
```

---

## 💡 Solution Design: Hybrid Approach

**Key Insight:** We have a **LIMITED domain** (dates, topics, status) so NL parsing is tractable.

### Option 1: Simple Pattern Matching (Fast)

**Time expressions → Date conversions:**

```typescript
const TIME_PATTERNS = {
  // Relative dates
  'yesterday': () => new Date(Date.now() - 86400000),
  'today': () => new Date(),
  'last week': () => new Date(Date.now() - 7 * 86400000),
  'last month': () => new Date(Date.now() - 30 * 86400000),
  'this week': () => getStartOfWeek(),
  'this month': () => getStartOfMonth(),
  
  // N days/weeks/months ago
  /(\d+) days? ago/: (match) => new Date(Date.now() - parseInt(match[1]) * 86400000),
  /(\d+) weeks? ago/: (match) => new Date(Date.now() - parseInt(match[1]) * 7 * 86400000),
  /(\d+) months? ago/: (match) => new Date(Date.now() - parseInt(match[1]) * 30 * 86400000),
};

function parseTimeExpression(query: string): { dateAfter?: string, dateBefore?: string } {
  const lowerQuery = query.toLowerCase();
  
  for (const [pattern, handler] of Object.entries(TIME_PATTERNS)) {
    if (typeof pattern === 'string' && lowerQuery.includes(pattern)) {
      const date = handler();
      return { dateAfter: formatDate(date) };
    }
    
    if (pattern instanceof RegExp) {
      const match = lowerQuery.match(pattern);
      if (match) {
        const date = handler(match);
        return { dateAfter: formatDate(date) };
      }
    }
  }
  
  return {};
}
```

**Topic/keyword extraction:**

```typescript
function extractTopics(query: string): string[] {
  // Remove common words
  const stopWords = ['show', 'me', 'get', 'find', 'about', 'on', 'from', 'the', 'a', 'an'];
  
  // Extract meaningful words
  const words = query
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => !stopWords.includes(word))
    .filter(word => word.length > 2);
  
  return words;
}
```

**Parse full query:**

```typescript
function parseNaturalQuery(query: string): QueryParams {
  const params: QueryParams = {};
  
  // 1. Extract time range
  Object.assign(params, parseTimeExpression(query));
  
  // 2. Extract topics/keywords
  const topics = extractTopics(query);
  if (topics.length > 0) {
    params.topic = topics[0]; // Or join with spaces
  }
  
  // 3. Extract status if mentioned
  if (query.toLowerCase().includes('active')) {
    params.status = 'ACTIVE';
  } else if (query.toLowerCase().includes('complete')) {
    params.status = 'COMPLETE';
  }
  
  return params;
}
```

**Example:**
```typescript
parseNaturalQuery("Show me sessions from last week about MCP testing")
// Returns: { dateAfter: "2026-02-06", topic: "mcp" }

parseNaturalQuery("Find active plans from 3 days ago")
// Returns: { dateAfter: "2026-02-10", status: "ACTIVE" }
```

---

### Option 2: LLM-Assisted Parsing (Flexible)

**Key Insight:** The LLM calling the tool CAN format its own query!

**Instead of parsing strings, accept human-friendly parameters:**

```typescript
// Tool schema with flexible parameters
this.server.registerTool('query_sessions', {
  description: `Query sessions with natural language.
  
Examples:
- when: "last week", about: "MCP testing"
- when: "yesterday", status: "complete"
- when: "3 days ago", about: "SQLite optimization"

Or use structured params:
- dateAfter: "2026-02-06", topic: "mcp-tools"
`,
  inputSchema: z.object({
    // Natural language (flexible)
    when: z.string().optional(),
    about: z.string().optional(),
    
    // Structured (precise)
    dateAfter: z.string().optional(),
    dateBefore: z.string().optional(),
    topic: z.string().optional(),
    status: z.string().optional(),
  }),
  handler: async (params) => {
    // Parse natural language if provided
    if (params.when) {
      Object.assign(params, parseTimeExpression(params.when));
    }
    
    if (params.about) {
      params.topic = params.about;
    }
    
    // Now use structured params
    return querySessionsSqlite(params);
  }
})
```

**How it works:**

1. **LLM reads the description** with examples
2. **LLM formats its intent** into `when` and `about` fields
3. **Server parses** natural language → structured
4. **Query executes** with structured params

**Example conversation:**

```
User: "Show me sessions from last week about MCP"

LLM sees tool: query_sessions
LLM calls tool with: { when: "last week", about: "MCP" }

Server parses:
  when: "last week" → dateAfter: "2026-02-06"
  about: "MCP" → topic: "mcp"
  
Query executes: query_sessions_sqlite({ dateAfter: "2026-02-06", topic: "mcp" })
```

---

### Option 3: Structured Query Builder (Best UX!)

**Inspired by MongoDB query language:**

```typescript
// Tool accepts query builder syntax
this.server.registerTool('query_sessions', {
  inputSchema: z.object({
    filters: z.object({
      date: z.union([
        z.string(),                    // "2026-02-13"
        z.object({
          after: z.string(),           // { after: "2026-02-06" }
          before: z.string().optional()
        }),
        z.object({
          last: z.number(),            // { last: 7 } = last 7 days
          unit: z.enum(['days', 'weeks', 'months'])
        })
      ]).optional(),
      
      topics: z.union([
        z.string(),                    // "mcp-tools"
        z.array(z.string()),           // ["mcp-tools", "sqlite"]
        z.object({
          any: z.array(z.string()),    // Match any of these
          all: z.array(z.string())     // Match all of these
        })
      ]).optional(),
      
      status: z.enum(['in-progress', 'complete', 'abandoned']).optional()
    }).optional(),
    
    // Token efficiency
    mode: z.enum(['metadata', 'section', 'full']).optional().default('metadata'),
    section: z.string().optional(),
    
    // Pagination
    limit: z.number().optional(),
    offset: z.number().optional()
  }),
  handler: async (params) => {
    // Convert query builder to SQL filters
    const sqlParams = buildSqlParams(params.filters);
    return querySessionsSqlite({ ...sqlParams, ...params });
  }
})
```

**Examples:**

```typescript
// Simple: Last week
query_sessions({ 
  filters: { 
    date: { last: 7, unit: 'days' } 
  } 
})

// Complex: Last month + multiple topics
query_sessions({
  filters: {
    date: { last: 1, unit: 'months' },
    topics: { any: ['mcp-tools', 'sqlite', 'testing'] }
  },
  mode: 'metadata'
})

// Section-based: Specific day + specific section
query_sessions({
  filters: {
    date: "2026-02-13"
  },
  mode: 'section',
  section: 'Day 10'
})
```

---

## 📋 Recommended Implementation: Hybrid

**Combine all three approaches:**

### Tool Schema (Flexible + Powerful)

```typescript
this.server.registerTool('query_sessions', {
  description: `Query sessions with maximum flexibility.

**Three ways to query:**

1. Natural language (easiest):
   { when: "last week", about: "MCP testing" }

2. Relative dates (precise):
   { last: 7, unit: "days", topics: ["mcp-tools", "sqlite"] }

3. Absolute dates (exact):
   { dateAfter: "2026-02-06", topic: "mcp-tools" }

All support token optimization:
  - mode: "metadata" (default, 95% savings)
  - mode: "section", section: "Day 10" (90% savings)
  - mode: "full" (complete content)
`,
  inputSchema: z.object({
    // --- NATURAL LANGUAGE ---
    when: z.string().optional(),
    about: z.string().optional(),
    
    // --- RELATIVE DATES ---
    last: z.number().optional(),
    unit: z.enum(['days', 'weeks', 'months']).optional(),
    
    // --- ABSOLUTE DATES ---
    date: z.string().optional(),
    dateAfter: z.string().optional(),
    dateBefore: z.string().optional(),
    
    // --- TOPICS ---
    topic: z.string().optional(),
    topics: z.array(z.string()).optional(),
    
    // --- STATUS ---
    status: z.enum(['in-progress', 'complete', 'abandoned']).optional(),
    
    // --- TOKEN OPTIMIZATION ---
    mode: z.enum(['metadata', 'section', 'full']).optional().default('metadata'),
    section: z.string().optional(),
    
    // --- PAGINATION ---
    limit: z.number().optional(),
    offset: z.number().optional(),
    
    // --- SMART DEFAULT ---
    dbPath: z.string().optional() // Auto-detected if omitted
  }),
  
  handler: async (params) => {
    const parsed = parseQueryParams(params);
    return querySessionsSqlite(parsed);
  }
})
```

### Parser Implementation

```typescript
function parseQueryParams(params: any): SqliteQueryParams {
  const result: SqliteQueryParams = {
    dbPath: params.dbPath || getDefaultDbPath(),
    mode: params.mode || 'metadata',
    section: params.section
  };
  
  // 1. Parse time expressions
  if (params.when) {
    // "last week" → { dateAfter: "2026-02-06" }
    Object.assign(result, parseTimeExpression(params.when));
  } else if (params.last && params.unit) {
    // { last: 7, unit: "days" } → { dateAfter: "2026-02-06" }
    const millisPerUnit = {
      days: 86400000,
      weeks: 7 * 86400000,
      months: 30 * 86400000
    };
    const date = new Date(Date.now() - params.last * millisPerUnit[params.unit]);
    result.dateAfter = formatDate(date);
  } else if (params.date) {
    // Exact date
    result.dateAfter = params.date;
    result.dateBefore = params.date;
  } else {
    // Absolute dates
    if (params.dateAfter) result.dateAfter = params.dateAfter;
    if (params.dateBefore) result.dateBefore = params.dateBefore;
  }
  
  // 2. Parse topics
  if (params.about) {
    result.topic = params.about;
  } else if (params.topic) {
    result.topic = params.topic;
  } else if (params.topics && params.topics.length > 0) {
    result.topic = params.topics[0]; // Or implement multi-topic support
  }
  
  // 3. Parse status
  if (params.status) {
    result.status = params.status;
  }
  
  // 4. Pagination
  if (params.limit) result.limit = params.limit;
  if (params.offset) result.offset = params.offset;
  
  return result;
}
```

---

## 🎯 Benefits of This Design

**1. Progressive Enhancement**

Agents can start simple and get more precise:

```typescript
// Level 1: Natural language (easiest)
{ when: "last week", about: "MCP" }

// Level 2: Relative dates (clearer)
{ last: 7, unit: "days", topics: ["mcp-tools"] }

// Level 3: Absolute (precise)
{ dateAfter: "2026-02-06", topic: "mcp-tools" }
```

**2. Self-Documenting**

The tool description has examples → LLM learns the API instantly

**3. Backward Compatible**

Old structured queries still work → No breaking changes

**4. Token Efficient**

All queries default to metadata mode → 95% savings by default

**5. Composable**

Mix and match approaches:
```typescript
{
  when: "last week",           // Natural
  topics: ["mcp", "sqlite"],   // Structured
  mode: "section",             // Token optimization
  section: "Day 10"            // Conversational
}
```

---

## 📋 Implementation Steps

### Step 1: Time Expression Parser (30 min)

```typescript
// lib/core/natural-language-parser.ts

export function parseTimeExpression(expr: string): DateFilter {
  const now = Date.now();
  const expr_lower = expr.toLowerCase().trim();
  
  // Absolute references
  if (expr_lower === 'today') {
    return { dateAfter: formatDate(new Date(now)) };
  }
  if (expr_lower === 'yesterday') {
    return { dateAfter: formatDate(new Date(now - 86400000)) };
  }
  if (expr_lower === 'last week' || expr_lower === 'past week') {
    return { dateAfter: formatDate(new Date(now - 7 * 86400000)) };
  }
  if (expr_lower === 'last month' || expr_lower === 'past month') {
    return { dateAfter: formatDate(new Date(now - 30 * 86400000)) };
  }
  if (expr_lower === 'this week') {
    return { dateAfter: formatDate(getStartOfWeek()) };
  }
  if (expr_lower === 'this month') {
    return { dateAfter: formatDate(getStartOfMonth()) };
  }
  
  // Relative numeric (e.g., "3 days ago", "2 weeks ago")
  const relativeMatch = expr_lower.match(/(\d+)\s+(days?|weeks?|months?)\s+ago/);
  if (relativeMatch) {
    const count = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].replace(/s$/, ''); // Remove plural 's'
    const millisPerUnit = {
      day: 86400000,
      week: 7 * 86400000,
      month: 30 * 86400000
    };
    const date = new Date(now - count * millisPerUnit[unit]);
    return { dateAfter: formatDate(date) };
  }
  
  // Couldn't parse - return empty
  return {};
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(now.setDate(diff));
}

function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
```

### Step 2: Update Tool Schemas (1 hour)

Add flexible parameters to all query tools:
- `query_sessions_sqlite`
- `query_plans_sqlite`
- `query_learned_patterns_sqlite`

### Step 3: Update Handlers (30 min)

Wire up parsing in each handler:

```typescript
async (params) => {
  const parsed = parseQueryParams(params);
  return querySessionsSqlite(parsed);
}
```

### Step 4: Test Conversational Queries (30 min)

```typescript
// Test natural language
query_sessions({ when: "last week", about: "MCP" })

// Test relative dates
query_sessions({ last: 7, unit: "days", topics: ["mcp-tools"] })

// Test absolute
query_sessions({ dateAfter: "2026-02-06", topic: "mcp-tools" })

// Test mixed
query_sessions({ 
  when: "last month", 
  topics: ["testing", "sqlite"],
  mode: "metadata"
})
```

---

## ⏱️ Timeline

| Step | Time | Status |
|------|------|--------|
| Step 1: Time parser | 30m | 📋 PLANNED |
| Step 2: Update schemas | 1h | 📋 PLANNED |
| Step 3: Update handlers | 30m | 📋 PLANNED |
| Step 4: Test queries | 30m | 📋 PLANNED |
| **Total** | **2.5h** | **📋 PLANNED** |

---

## 🎯 Success Criteria

- [ ] Natural language works: `{ when: "last week", about: "MCP" }`
- [ ] Relative dates work: `{ last: 7, unit: "days" }`
- [ ] Absolute dates work: `{ dateAfter: "2026-02-06" }`
- [ ] Mixed queries work: Natural + structured + token optimization
- [ ] Backward compatible: Old structured queries still work
- [ ] Self-documenting: Tool descriptions teach the API

---

## 📝 Example Conversations

**Conversation 1:**
```
User: "Show me sessions from last week"

LLM calls: query_sessions({ when: "last week" })

Server parses: { dateAfter: "2026-02-06", mode: "metadata" }

Response: 4 sessions, 500 tokens (metadata only)
```

**Conversation 2:**
```
User: "Show me the Day 10 testing section from Feb 13"

LLM calls: query_sessions({ 
  date: "2026-02-13", 
  mode: "section", 
  section: "Day 10" 
})

Server parses: { 
  dateAfter: "2026-02-13", 
  dateBefore: "2026-02-13",
  mode: "section",
  section: "Day 10"
}

Response: 1 session with Day 10 section only, 1.2K tokens
```

**Conversation 3:**
```
User: "Find active plans about optimization from the past month"

LLM calls: query_plans({ 
  when: "last month", 
  about: "optimization",
  status: "ACTIVE"
})

Server parses: { 
  dateAfter: "2026-01-13",
  topic: "optimization",
  status: "ACTIVE",
  mode: "metadata"
}

Response: 2 plans, 250 tokens (metadata)
```

---

## 🔄 Future Enhancements

**Phase 2:**
- Support date ranges: `{ from: "2026-01-01", to: "2026-02-01" }`
- Support advanced topic queries: `{ topics: { all: ["mcp", "testing"] } }`
- Support negation: `{ when: "last week", not: { topics: ["testing"] } }`
- Support sorting: `{ orderBy: "date", direction: "desc" }`

**Phase 3:**
- Full-text conversational queries: `"Find sessions where we fixed the bug about schema.sql"`
- Semantic search: Use embeddings for fuzzy topic matching
- Query suggestions: "Did you mean...?" for typos

---

*Part of PLAN_mcp_tools_ai_ux_overhaul.md. Enables conversational AI UX for all query tools.*
