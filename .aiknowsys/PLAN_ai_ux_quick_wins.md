---
title: "AI UX Quick Wins - High Impact, Low Effort Improvements"
status: "PLANNED"
priority: "high"
created: "2026-02-14"
author: "Planner"
topics: ["ai-ux", "error-handling", "progressive-detail", "self-improving"]
depends_on: ["PLAN_mcp_query_token_optimization"]
---

# PLAN: AI UX Quick Wins

**Status:** 📋 PLANNED  
**Priority:** 🔴 HIGH (AI-first UX improvements)  
**Created:** 2026-02-14  
**Estimated:** 3-5 days total  
**Goal:** Three high-impact, low-effort AI UX improvements

---

## 🎯 Three Quick Wins

1. **Conversational Error Messages** - Help agents learn from mistakes
2. **Response Previews (Progressive Detail)** - Ultra-lightweight summaries
3. **Usage Hints in Responses** - Self-improving system

---

## 💡 Feature 1: Conversational Error Messages

### Problem

**Current (developer-focused):**
```
Error: Command failed: npx aiknowsys update-session --appendSection
error: unknown option '--appendSection'
```

Agents see this and:
- ❌ Don't understand what went wrong
- ❌ Don't know how to fix it
- ❌ Retry with random variations
- ❌ Waste tokens on trial-and-error

### Solution

**AI-friendly structured errors:**
```typescript
{
  "success": false,
  "error": {
    "type": "InvalidParameter",
    "message": "Invalid parameter 'appendSection'",
    "parameter": "appendSection",
    "suggestion": "Did you mean 'append-section'? (Commander.js uses dash-case for CLI options)",
    "correct_usage": [
      {
        "description": "Using MCP tool directly",
        "example": "append_to_session({ section: '## Notes', content: '...' })"
      },
      {
        "description": "CLI equivalent",
        "example": "npx aiknowsys update-session --append-section '## Notes' --content '...'"
      }
    ],
    "docs_url": "https://github.com/arpa73/AIKnowSys#mutation-tools",
    "similar_errors": [
      "Did you mean: --prepend-section, --insert-after, --insert-before?"
    ]
  }
}
```

### Implementation

**Step 1.1: Create Error Response Schema (30 min)**

```typescript
// lib/types/index.ts
export interface AIFriendlyError {
  success: false;
  error: {
    type: 'InvalidParameter' | 'ToolNotFound' | 'ValidationFailed' | 'MissingRequired';
    message: string;
    parameter?: string;
    suggestion?: string;
    correct_usage?: Array<{
      description: string;
      example: string;
    }>;
    docs_url?: string;
    similar_errors?: string[];
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export type MCPResponse<T> = SuccessResponse<T> | AIFriendlyError;
```

**Step 1.2: Error Builder Utility (1 hour)**

```typescript
// lib/utils/error-builder.ts
export class AIFriendlyErrorBuilder {
  static invalidParameter(
    param: string,
    suggestion?: string,
    examples?: string[]
  ): AIFriendlyError {
    return {
      success: false,
      error: {
        type: 'InvalidParameter',
        message: `Invalid parameter '${param}'`,
        parameter: param,
        suggestion,
        correct_usage: examples?.map(ex => ({
          description: 'Correct usage',
          example: ex
        })),
        docs_url: 'https://github.com/arpa73/AIKnowSys#tools'
      }
    };
  }
  
  static toolNotFound(toolName: string, similar?: string[]): AIFriendlyError {
    return {
      success: false,
      error: {
        type: 'ToolNotFound',
        message: `Tool '${toolName}' not found`,
        suggestion: similar?.length 
          ? `Did you mean: ${similar.join(', ')}?`
          : 'Run list_tools() to see available tools',
        similar_errors: similar,
        docs_url: 'https://github.com/arpa73/AIKnowSys#available-tools'
      }
    };
  }
  
  static validationFailed(
    field: string,
    reason: string,
    example?: string
  ): AIFriendlyError {
    return {
      success: false,
      error: {
        type: 'ValidationFailed',
        message: `Validation failed for '${field}': ${reason}`,
        parameter: field,
        suggestion: example ? `Try: ${example}` : undefined,
        docs_url: 'https://github.com/arpa73/AIKnowSys#validation'
      }
    };
  }
}
```

**Step 1.3: Update MCP Tool Handlers (2 hours)**

```typescript
// Example: mcp-server/src/tools/split-mutations.ts
export async function appendToSession(args: any) {
  try {
    // Validate parameters
    if (!args.content) {
      return AIFriendlyErrorBuilder.validationFailed(
        'content',
        'Content is required',
        "append_to_session({ section: '## Notes', content: 'Your content here' })"
      );
    }
    
    // Execute command
    const result = await executeCommand('update-session', args);
    
    return {
      success: true,
      data: result,
      meta: {
        hint: "💡 Session updated. Changes saved to .aiknowsys/sessions/"
      }
    };
    
  } catch (error) {
    // Parse CLI errors into friendly format
    if (error.message.includes('unknown option')) {
      const param = extractParameterName(error.message);
      return AIFriendlyErrorBuilder.invalidParameter(
        param,
        `CLI options use dash-case: --${toDashCase(param)}`,
        [`${toolName}({ ${param}: 'value' })`]
      );
    }
    
    throw error; // Unknown errors pass through
  }
}
```

**Step 1.4: Add Error Learning (1 hour)**

Track common errors to improve suggestions:

```typescript
// lib/utils/error-tracker.ts
const errorPatterns = new Map<string, number>();

export function trackError(errorType: string, context: string): void {
  const key = `${errorType}:${context}`;
  errorPatterns.set(key, (errorPatterns.get(key) || 0) + 1);
}

export function getSimilarErrors(errorType: string, limit = 3): string[] {
  // Return most common similar errors
  return Array.from(errorPatterns.entries())
    .filter(([key]) => key.startsWith(errorType))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key.split(':')[1]);
}
```

---

## 💡 Feature 2: Response Previews (Progressive Detail)

### Problem

Agents waste tokens fetching full data when they only need counts/summaries.

**Current:**
```typescript
query_sessions({ topic: "mcp" })
// Returns: 500 tokens (metadata) or 22K tokens (full content)
// Agent wanted: "How many sessions? What dates?"
```

### Solution

**Four levels of detail:**

```typescript
// Level 0: Preview (150 tokens) - NEW!
query_sessions({ topic: "mcp", mode: "preview" })
→ { total: 4, date_range: "2026-02-10 to 2026-02-14", topics: ["mcp-tools", "sqlite"] }

// Level 1: Metadata (500 tokens) - Current default
query_sessions({ topic: "mcp", mode: "metadata" })
→ [{ id, date, title, topics, status }, ...]

// Level 2: Section (1.2K tokens)
query_sessions({ id: "X", section: "Day 10" })
→ { id, date, sections: [{ title: "Day 10", content: "..." }] }

// Level 3: Full (22K tokens)
query_sessions({ id: "X", mode: "full" })
→ { id, date, title, content: "...", ... }
```

### Implementation

**Step 2.1: Add Preview Mode (1 hour)**

```typescript
// lib/core/sqlite-query.ts
export async function querySessionsSqlite(options: QuerySessionsOptions) {
  const { mode = 'metadata', topic, dateAfter, dateBefore } = options;
  
  if (mode === 'preview') {
    // Ultra-lightweight summary query
    const stats = storage.getSessionStats({ topic, dateAfter, dateBefore });
    
    return {
      total: stats.count,
      date_range: `${stats.earliest} to ${stats.latest}`,
      topics: stats.uniqueTopics.slice(0, 10), // Top 10 topics
      statuses: stats.statusCounts,
      sessions: stats.sessions.map(s => ({
        id: s.id,
        date: s.date,
        title: s.title,
        topics_count: s.topics.length
      }))
    };
  }
  
  // Existing metadata/section/full logic...
}
```

**Step 2.2: Add Stats Query to SqliteStorage (1.5 hours)**

```typescript
// lib/context/sqlite-storage.ts
export class SqliteStorage {
  getSessionStats(filters: SessionFilters): SessionStats {
    const query = `
      SELECT 
        COUNT(*) as total,
        MIN(date) as earliest,
        MAX(date) as latest,
        GROUP_CONCAT(DISTINCT topics) as all_topics,
        status,
        COUNT(*) as status_count
      FROM sessions
      WHERE ${buildWhereClause(filters)}
      GROUP BY status
    `;
    
    const rows = this.db.prepare(query).all();
    
    return {
      count: rows.reduce((sum, r) => sum + r.total, 0),
      earliest: rows[0]?.earliest,
      latest: rows[0]?.latest,
      uniqueTopics: extractUniqueTopics(rows),
      statusCounts: rows.map(r => ({ status: r.status, count: r.status_count })),
      sessions: this.getSessionsMetadata(filters) // Reuse existing
    };
  }
}
```

**Step 2.3: Update MCP Tool Schema (30 min)**

```typescript
// mcp-server/src/server.ts
this.server.registerTool('query_sessions_sqlite', {
  description: `Query sessions with four levels of detail:
  
- preview: Ultra-light summary (~150 tokens)
- metadata: Full metadata, no content (~500 tokens) [DEFAULT]
- section: Specific section (~1.2K tokens)
- full: Everything (~22K tokens)

Examples:
  { topic: "mcp", mode: "preview" } // Just counts and dates
  { topic: "mcp" } // Metadata only (default)
  { id: "session-1", section: "Day 10" } // Targeted
  { id: "session-1", mode: "full" } // Complete session
`,
  inputSchema: z.object({
    mode: z.enum(['preview', 'metadata', 'section', 'full']).optional().default('metadata'),
    // ... existing params
  })
});
```

---

## 💡 Feature 3: Usage Hints in Responses

### Problem

Agents don't know when they're using tools inefficiently.

### Solution

**Every response includes optimization hints:**

```typescript
query_sessions({ topic: "mcp", mode: "full" })

// Returns:
{
  success: true,
  data: [...], // Full sessions (22K tokens)
  meta: {
    tokens_used: 22000,
    hint: "💡 You fetched full content for 4 sessions. Consider mode: 'preview' (150 tokens, 99% savings) or mode: 'metadata' (500 tokens, 98% savings) for browsing.",
    alternative: {
      query: "query_sessions({ topic: 'mcp', mode: 'preview' })",
      savings: "99.3% (22K → 150 tokens)"
    },
    cache_status: "miss (cached for 5min)"
  }
}
```

### Implementation

**Step 3.1: Response Meta Builder (1 hour)**

```typescript
// lib/utils/response-meta.ts
export class ResponseMetaBuilder {
  static build<T>(
    data: T,
    options: {
      queryType: string;
      tokensUsed: number;
      mode?: string;
      cached?: boolean;
    }
  ): SuccessResponse<T> {
    const meta: ResponseMeta = {
      tokens_used: options.tokensUsed,
      cache_status: options.cached ? 'hit (saved 0 tokens)' : 'miss (cached for 5min)'
    };
    
    // Add optimization hints
    const hint = this.getOptimizationHint(options);
    if (hint) {
      meta.hint = hint.message;
      meta.alternative = hint.alternative;
    }
    
    return {
      success: true,
      data,
      meta
    };
  }
  
  private static getOptimizationHint(options: any) {
    // Full mode with large result
    if (options.mode === 'full' && options.tokensUsed > 10000) {
      return {
        message: `💡 Large response (${options.tokensUsed} tokens). Consider mode: 'preview' or 'metadata' for browsing.`,
        alternative: {
          query: `${options.queryType}({ ..., mode: 'preview' })`,
          savings: `99% (${options.tokensUsed} → ~150 tokens)`
        }
      };
    }
    
    // Metadata mode - suggest preview for large result sets
    if (options.mode === 'metadata' && options.tokensUsed > 2000) {
      return {
        message: `💡 Browsing many sessions (${options.tokensUsed} tokens). mode: 'preview' gives counts/dates for 99% less.`,
        alternative: {
          query: `${options.queryType}({ ..., mode: 'preview' })`,
          savings: `95% (${options.tokensUsed} → ~150 tokens)`
        }
      };
    }
    
    return null;
  }
}
```

**Step 3.2: Integrate into All Query Tools (2 hours)**

```typescript
// Example: lib/core/sqlite-query.ts
export async function querySessionsSqlite(options: QuerySessionsOptions) {
  const result = await storage.querySessions(options);
  const tokensUsed = estimateTokens(result);
  
  return ResponseMetaBuilder.build(result, {
    queryType: 'query_sessions',
    tokensUsed,
    mode: options.mode || 'metadata',
    cached: false // Will be true when caching implemented
  });
}
```

---

## 📋 Implementation Order

**Phase 1: Conversational Errors (2 days)**
1. Error response schema
2. Error builder utility
3. Update all tool handlers
4. Error tracking (learning)

**Phase 2: Response Previews (1.5 days)**
1. Add preview mode to query tools
2. Implement stats queries in SqliteStorage
3. Update MCP tool schemas

**Phase 3: Usage Hints (1.5 days)**
1. Response meta builder
2. Token estimation
3. Integrate into all query tools
4. Test hint accuracy

---

## 🎯 Success Criteria

- [ ] **Errors teach, not frustrate** - Agents see suggestions and examples
- [ ] **Preview mode works** - 150 tokens for summary (99% savings vs full)
- [ ] **Hints appear** - Every response includes optimization suggestions
- [ ] **Agents improve** - Observe agents using better queries over time
- [ ] **Tests pass** - All 1249+ tests still passing

---

## 📊 Expected Impact

**Token Savings (compounding existing 95% optimization):**

| Scenario | Before | After Quick Wins | Combined Savings |
|----------|---------|------------------|------------------|
| Browse sessions | 22K tokens | 150 tokens (preview) | 99.3% |
| Learn from error | 500 tokens (retry) | 0 tokens (fixed first time) | 100% |
| Inefficient query | 22K tokens | 500 tokens (hint → metadata) | 97.7% |

**AI Behavior Improvements:**
- Fewer retry attempts (errors explain how to fix)
- Better query choices (hints teach optimization)
- Progressive exploration (preview → metadata → section → full)

---

## 🧪 Testing Strategy

**Error Messages:**
```typescript
test('invalid parameter returns friendly error', async () => {
  const result = await appendToSession({ appendSection: 'Notes' }); // Wrong case
  
  expect(result.success).toBe(false);
  expect(result.error.suggestion).toContain('append-section');
  expect(result.error.correct_usage).toBeDefined();
});
```

**Preview Mode:**
```typescript
test('preview mode returns ultra-light summary', async () => {
  const result = await querySessions({ mode: 'preview', topic: 'mcp' });
  
  expect(result.data.total).toBe(4);
  expect(result.data.date_range).toBeDefined();
  expect(estimateTokens(result)).toBeLessThan(200);
});
```

**Usage Hints:**
```typescript
test('full mode suggests preview for large results', async () => {
  const result = await querySessions({ mode: 'full', topic: 'mcp' });
  
  expect(result.meta.hint).toContain('Consider mode: \'preview\'');
  expect(result.meta.alternative.savings).toMatch(/99%/);
});
```

---

## 🔄 Future Enhancements

After these quick wins, consider:
- Learning from hint effectiveness (which hints agents follow)
- Personalized hints (agent-specific patterns)
- Error prediction (warn before errors happen)

---

*Quick wins that make the AI UX dramatically better. Ship these first!*
