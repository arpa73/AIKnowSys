---
title: "AI UX Smart Tools - Intelligent Query & Discovery Features"
status: "PLANNED"
priority: "medium"
created: "2026-02-14"
author: "Planner"
topics: ["ai-ux", "smart-query", "knowledge-graph", "batch-operations", "discovery"]
depends_on: ["PLAN_natural_language_query_api", "PLAN_ai_ux_quick_wins"]
---

# PLAN: AI UX Smart Tools

**Status:** 📋 PLANNED  
**Priority:** 🟡 MEDIUM (Build on natural language API)  
**Created:** 2026-02-14  
**Estimated:** 1-2 weeks  
**Goal:** Intelligent tools that understand intent and discover connections

---

## 🎯 Three Smart Features

1. **Smart Query Tool** - Interpret vague requests, teach proper syntax
2. **Cross-Reference Discovery** - Find connections between documents
3. **Batch Operations with Dry-Run** - Safe multi-step mutations

---

## 💡 Feature 1: Smart Query Tool

### Vision

**Agent says:** "Show me what we did with MCP recently"

**Instead of agent guessing:**
- ❌ `query_sessions({ dateAfter: ??? })`  (What's "recently"?)
- ❌ `query_sessions({ topic: "mcp" })` (Missing time filter)
- ❌ Multiple retry attempts

**Smart query interprets:**
```typescript
smart_query({ 
  intent: "Show me what we did with MCP recently" 
})

// Server interprets and executes:
{
  "interpretation": {
    "when": "recently → last 7 days (2026-02-06 to 2026-02-14)",
    "about": "MCP → topics: ['mcp-tools', 'mcp']",
    "mode": "metadata (default efficient)",
    "confidence": 0.92
  },
  "query_executed": "query_sessions({ dateAfter: '2026-02-06', topic: 'mcp', mode: 'metadata' })",
  "results": [...],
  "meta": {
    "hint": "💡 Next time you can use: query_sessions({ when: 'last week', about: 'MCP' })",
    "learned": true
  }
}
```

**Agent learns proper syntax from the response!**

### Implementation

**Step 1.1: Intent Parser (2 days)**

```typescript
// lib/utils/intent-parser.ts
export interface QueryIntent {
  when?: {
    original: string;
    interpreted: { dateAfter?: string; dateBefore?: string };
    confidence: number;
  };
  about?: {
    original: string;
    topics: string[];
    confidence: number;
  };
  what?: {
    type: 'sessions' | 'plans' | 'patterns';
    filters?: Record<string, any>;
  };
  how?: {
    mode: 'preview' | 'metadata' | 'section' | 'full';
    section?: string;
  };
}

export class IntentParser {
  /**
   * Parse natural language intent into structured query
   */
  static parse(intent: string): QueryIntent {
    const result: QueryIntent = {};
    
    // Parse time expressions
    result.when = this.parseTimeExpression(intent);
    
    // Extract topics
    result.about = this.extractTopics(intent);
    
    // Detect query type
    result.what = this.detectQueryType(intent);
    
    // Infer detail level
    result.how = this.inferDetailLevel(intent);
    
    return result;
  }
  
  private static parseTimeExpression(text: string): QueryIntent['when'] {
    const lower = text.toLowerCase();
    const patterns = [
      {
        regex: /\b(recently|lately)\b/,
        interpret: () => ({ dateAfter: getDaysAgo(7) }),
        confidence: 0.9
      },
      {
        regex: /\blast\s+week\b/,
        interpret: () => ({ dateAfter: getDaysAgo(7) }),
        confidence: 0.95
      },
      {
        regex: /\blast\s+month\b/,
        interpret: () => ({ dateAfter: getDaysAgo(30) }),
        confidence: 0.95
      },
      {
        regex: /\byesterday\b/,
        interpret: () => ({ 
          dateAfter: getDaysAgo(1),
          dateBefore: getDaysAgo(0)
        }),
        confidence: 0.98
      },
      {
        regex: /\b(\d+)\s+days?\s+ago\b/,
        interpret: (match) => ({ dateAfter: getDaysAgo(parseInt(match[1])) }),
        confidence: 0.95
      },
      {
        regex: /\bthis\s+week\b/,
        interpret: () => ({ dateAfter: getStartOfWeek() }),
        confidence: 0.95
      }
    ];
    
    for (const pattern of patterns) {
      const match = lower.match(pattern.regex);
      if (match) {
        return {
          original: match[0],
          interpreted: pattern.interpret(match),
          confidence: pattern.confidence
        };
      }
    }
    
    return undefined;
  }
  
  private static extractTopics(text: string): QueryIntent['about'] {
    // Remove stop words
    const stopWords = ['show', 'me', 'what', 'we', 'did', 'with', 'about', 'on', 'the', 'a', 'an'];
    
    // Extract meaningful words
    const words = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(w => !stopWords.includes(w) && w.length > 2);
    
    // Match against known topics (from database)
    const knownTopics = this.getKnownTopics(); // Query DB for existing topics
    const matchedTopics = words.filter(w => knownTopics.includes(w));
    
    if (matchedTopics.length > 0) {
      return {
        original: matchedTopics.join(' '),
        topics: matchedTopics,
        confidence: matchedTopics.length / words.length
      };
    }
    
    // Fallback: use meaningful words as-is
    return {
      original: words.join(' '),
      topics: words,
      confidence: 0.6
    };
  }
  
  private static detectQueryType(text: string): QueryIntent['what'] {
    const lower = text.toLowerCase();
    
    if (/\b(session|work|did|done)\b/.test(lower)) {
      return { type: 'sessions' };
    }
    if (/\b(plan|planning|roadmap)\b/.test(lower)) {
      return { type: 'plans' };
    }
    if (/\b(pattern|learned|solution)\b/.test(lower)) {
      return { type: 'patterns' };
    }
    
    // Default: sessions
    return { type: 'sessions' };
  }
  
  private static inferDetailLevel(text: string): QueryIntent['how'] {
    const lower = text.toLowerCase();
    
    if (/\b(how many|count|total)\b/.test(lower)) {
      return { mode: 'preview' };
    }
    if (/\b(full|complete|everything|all)\b/.test(lower)) {
      return { mode: 'full' };
    }
    if (/\b(section|part|day \d+)\b/.test(lower)) {
      const match = lower.match(/\bday (\d+)\b/);
      return { 
        mode: 'section',
        section: match ? `Day ${match[1]}` : undefined
      };
    }
    
    // Default: metadata (efficient)
    return { mode: 'metadata' };
  }
}
```

**Step 1.2: Smart Query Tool (1 day)**

```typescript
// mcp-server/src/tools/smart-query.ts
export async function smartQuery(args: { intent: string }) {
  const parsed = IntentParser.parse(args.intent);
  
  // Build structured query
  const query: any = {};
  
  if (parsed.when) {
    Object.assign(query, parsed.when.interpreted);
  }
  
  if (parsed.about && parsed.about.topics.length > 0) {
    query.topic = parsed.about.topics[0]; // Or join with spaces
  }
  
  if (parsed.how) {
    query.mode = parsed.how.mode;
    if (parsed.how.section) {
      query.section = parsed.how.section;
    }
  }
  
  // Execute appropriate query
  let results;
  switch (parsed.what.type) {
    case 'sessions':
      results = await querySessionsSqlite(query);
      break;
    case 'plans':
      results = await queryPlansSqlite(query);
      break;
    case 'patterns':
      results = await queryLearnedPatternsSqlite(query);
      break;
  }
  
  // Return with interpretation
  return {
    success: true,
    interpretation: {
      when: parsed.when?.original,
      about: parsed.about?.original,
      confidence: calculateConfidence(parsed),
      query_type: parsed.what.type,
      detail_level: parsed.how.mode
    },
    query_executed: JSON.stringify(query),
    results: results.data,
    meta: {
      hint: `💡 You can also use: query_${parsed.what.type}(${formatQuery(query)})`,
      learned: true
    }
  };
}

// Register tool
this.server.registerTool('smart_query', {
  description: `Interpret natural language queries and execute appropriate tool.
  
Examples:
  "Show me what we did with MCP recently"
  "Find plans about optimization from last month"
  "How many sessions about testing yesterday?"
  
Returns parsed interpretation + results + proper syntax for next time.`,
  inputSchema: z.object({
    intent: z.string().min(5)
  }),
  handler: smartQuery
});
```

---

## 💡 Feature 2: Cross-Reference Discovery

### Vision

**Help agents discover connections in the knowledge graph:**

```typescript
find_related({
  to: "PLAN_mcp_code_execution_optimization",
  type: "all"  // or "mentions", "depends_on", "related_topics"
})

// Returns:
{
  "mentions": [
    {
      "document": "2026-02-14-session.md",
      "count": 3,
      "contexts": [
        "Created PLAN_mcp_code_execution_optimization based on Anthropic research",
        "Added caching layer to code execution plan",
        "Updated with concrete MCP client implementation"
      ]
    }
  ],
  "depends_on": [
    {
      "document": "PLAN_mcp_query_token_optimization.md",
      "relationship": "foundation",
      "status": "COMPLETE"
    }
  ],
  "depended_by": [
    {
      "document": "PLAN_mcp_remote_server.md",
      "relationship": "requires transport abstraction"
    }
  ],
  "related_topics": [
    { topic: "token-efficiency", documents: 8, relevance: 0.95 },
    { topic: "anthropic-research", documents: 2, relevance: 0.87 },
    { topic: "code-execution", documents: 4, relevance: 0.82 }
  ],
  "timeline": [
    { date: "2026-02-14", event: "Plan created", document: "2026-02-14-session.md" },
    { date: "2026-02-14", event: "Caching added", document: "2026-02-14-session.md" },
    { date: "2026-02-14", event: "Client implemented", document: "2026-02-14-session.md" }
  ]
}
```

### Implementation

**Step 2.1: Document Graph Builder (2 days)**

```typescript
// lib/utils/document-graph.ts
export interface DocumentNode {
  id: string;
  type: 'session' | 'plan' | 'pattern' | 'skill';
  path: string;
  topics: string[];
  created: string;
  updated: string;
}

export interface DocumentEdge {
  from: string;
  to: string;
  type: 'mentions' | 'depends_on' | 'related_topic' | 'references';
  weight: number;
  context?: string;
}

export class DocumentGraph {
  private nodes: Map<string, DocumentNode>;
  private edges: DocumentEdge[];
  
  /**
   * Build graph from all documents
   */
  static async build(storage: SqliteStorage): Promise<DocumentGraph> {
    const graph = new DocumentGraph();
    
    // Add nodes (all documents)
    const sessions = await storage.getAllSessions();
    const plans = await storage.getAllPlans();
    const patterns = await storage.getAllPatterns();
    
    for (const session of sessions) {
      graph.addNode({
        id: session.id,
        type: 'session',
        path: session.path,
        topics: session.topics,
        created: session.date,
        updated: session.updated_at
      });
    }
    
    // Similar for plans, patterns...
    
    // Extract edges (relationships)
    graph.extractMentions();
    graph.extractDependencies();
    graph.extractTopicRelationships();
    
    return graph;
  }
  
  private extractMentions(): void {
    // Parse all documents for references to other documents
    for (const node of this.nodes.values()) {
      const content = fs.readFileSync(node.path, 'utf-8');
      
      // Find mentions (e.g., "PLAN_mcp_code_execution_optimization")
      const mentionRegex = /(PLAN_\w+|SESSION_[\d-]+|PATTERN_\w+)/g;
      const matches = content.matchAll(mentionRegex);
      
      for (const match of matches) {
        const referenced = match[1];
        if (this.nodes.has(referenced)) {
          this.edges.push({
            from: node.id,
            to: referenced,
            type: 'mentions',
            weight: 1.0,
            context: extractContext(content, match.index)
          });
        }
      }
    }
  }
  
  private extractDependencies(): void {
    // Parse YAML frontmatter for depends_on
    for (const node of this.nodes.values()) {
      if (node.type === 'plan') {
        const frontmatter = parseFrontmatter(node.path);
        if (frontmatter.depends_on) {
          for (const dep of frontmatter.depends_on) {
            this.edges.push({
              from: node.id,
              to: dep,
              type: 'depends_on',
              weight: 2.0 // Dependencies are strong relationships
            });
          }
        }
      }
    }
  }
  
  private extractTopicRelationships(): void {
    // Connect documents with shared topics
    const topicIndex = new Map<string, string[]>();
    
    for (const node of this.nodes.values()) {
      for (const topic of node.topics) {
        if (!topicIndex.has(topic)) {
          topicIndex.set(topic, []);
        }
        topicIndex.get(topic).push(node.id);
      }
    }
    
    // Create edges for documents with common topics
    for (const [topic, nodeIds] of topicIndex.entries()) {
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          this.edges.push({
            from: nodeIds[i],
            to: nodeIds[j],
            type: 'related_topic',
            weight: 0.5,
            context: `Shared topic: ${topic}`
          });
        }
      }
    }
  }
  
  /**
   * Find all documents related to target
   */
  findRelated(targetId: string, type?: string): DocumentEdge[] {
    return this.edges.filter(edge => {
      const isRelated = edge.from === targetId || edge.to === targetId;
      const matchesType = !type || edge.type === type;
      return isRelated && matchesType;
    });
  }
}
```

**Step 2.2: Find Related Tool (1 day)**

```typescript
// mcp-server/src/tools/discovery.ts
export async function findRelated(args: { 
  to: string; 
  type?: 'mentions' | 'depends_on' | 'related_topics' | 'all' 
}) {
  const graph = await DocumentGraph.build(storage);
  const edges = graph.findRelated(args.to, args.type === 'all' ? undefined : args.type);
  
  // Group by type
  const mentions = edges.filter(e => e.type === 'mentions')
    .map(e => ({
      document: e.from,
      context: e.context
    }));
  
  const depends_on = edges.filter(e => e.type === 'depends_on' && e.from === args.to)
    .map(e => graph.nodes.get(e.to));
  
  const depended_by = edges.filter(e => e.type === 'depends_on' && e.to === args.to)
    .map(e => graph.nodes.get(e.from));
  
  const related_topics = extractTopicSummary(edges, graph);
  
  return {
    success: true,
    data: {
      target: args.to,
      mentions: groupMentions(mentions),
      depends_on,
      depended_by,
      related_topics,
      timeline: buildTimeline(args.to, graph)
    }
  };
}
```

---

## 💡 Feature 3: Batch Operations with Dry-Run

### Vision

**Safe multi-step mutations:**

```typescript
batch_transaction({
  operations: [
    { tool: "create_session", args: { title: "Test Session" } },
    { tool: "append_to_session", args: { content: "Initial notes" } },
    { tool: "set_plan_status", args: { planId: "PLAN_X", status: "ACTIVE" } }
  ],
  dry_run: true  // Preview before committing
})

// Returns preview:
{
  "will_execute": 3,
  "estimated_impact": {
    "create": ["SESSION_2026-02-14"],
    "update": ["PLAN_X"],
    "files_changed": 2
  },
  "conflicts": [],  // None detected
  "validation": {
    "all_valid": true,
    "warnings": []
  },
  "to_commit": "batch_transaction({ operations: [...], commit: true })"
}

// Agent reviews, then commits:
batch_transaction({ operations: [...], commit: true })
→ { success: true, executed: 3, results: [...] }
```

### Implementation

**Step 3.1: Transaction Manager (2 days)**

```typescript
// lib/utils/transaction-manager.ts
export interface Operation {
  tool: string;
  args: Record<string, any>;
  rollback?: () => Promise<void>;
}

export class TransactionManager {
  private operations: Operation[];
  private executed: Operation[];
  private backups: Map<string, string>;
  
  /**
   * Dry-run: Simulate operations without committing
   */
  async dryRun(operations: Operation[]): Promise<DryRunResult> {
    const result: DryRunResult = {
      will_execute: operations.length,
      estimated_impact: { create: [], update: [], delete: [] },
      conflicts: [],
      validation: { all_valid: true, warnings: [] }
    };
    
    for (const op of operations) {
      // Validate operation
      const validation = await this.validateOperation(op);
      if (!validation.valid) {
        result.validation.all_valid = false;
        result.validation.warnings.push(validation.error);
        continue;
      }
      
      // Predict impact
      const impact = await this.predictImpact(op);
      result.estimated_impact.create.push(...impact.create);
      result.estimated_impact.update.push(...impact.update);
      result.estimated_impact.delete.push(...impact.delete);
      
      // Check for conflicts
      const conflicts = await this.detectConflicts(op, operations);
      result.conflicts.push(...conflicts);
    }
    
    return result;
  }
  
  /**
   * Execute operations with rollback support
   */
  async execute(operations: Operation[]): Promise<TransactionResult> {
    this.operations = operations;
    this.executed = [];
    this.backups = new Map();
    
    try {
      const results = [];
      
      for (const op of operations) {
        // Backup state before operation
        await this.backup(op);
        
        // Execute operation
        const result = await this.executeOperation(op);
        results.push(result);
        this.executed.push(op);
        
        // Validate result
        if (!result.success) {
          throw new Error(`Operation failed: ${result.error}`);
        }
      }
      
      return {
        success: true,
        executed: results.length,
        results
      };
      
    } catch (error) {
      // Rollback all executed operations
      await this.rollback();
      throw error;
    }
  }
  
  private async rollback(): Promise<void> {
    console.log(`Rolling back ${this.executed.length} operations...`);
    
    // Restore backups in reverse order
    for (let i = this.executed.length - 1; i >= 0; i--) {
      const op = this.executed[i];
      if (op.rollback) {
        await op.rollback();
      } else {
        await this.restoreBackup(op);
      }
    }
    
    console.log('Rollback complete');
  }
}
```

**Step 3.2: Batch Transaction Tool (1 day)**

```typescript
// mcp-server/src/tools/batch.ts
export async function batchTransaction(args: {
  operations: Operation[];
  dry_run?: boolean;
  commit?: boolean;
}) {
  const manager = new TransactionManager();
  
  // Dry-run mode
  if (args.dry_run || !args.commit) {
    const preview = await manager.dryRun(args.operations);
    
    return {
      success: true,
      mode: 'dry_run',
      ...preview,
      to_commit: `batch_transaction({ operations: [...], commit: true })`
    };
  }
  
  // Commit mode
  const result = await manager.execute(args.operations);
  
  return {
    success: true,
    mode: 'committed',
    ...result
  };
}
```

---

## 📋 Implementation Order

**Phase 1: Smart Query (3-4 days)**
1. Intent parser with time/topic extraction
2. Smart query tool implementation
3. Integration with existing query tools
4. Testing with various natural language inputs

**Phase 2: Cross-Reference Discovery (3-4 days)**
1. Document graph builder
2. Relationship extraction (mentions, dependencies, topics)
3. Find related tool
4. Timeline/connection visualization

**Phase 3: Batch Operations (3-4 days)**
1. Transaction manager with dry-run
2. Rollback mechanism
3. Conflict detection
4. Batch transaction tool

---

## 🎯 Success Criteria

- [ ] **Smart query works** - Interprets vague requests correctly (>80% accuracy)
- [ ] **Cross-refs discovered** - Finds all document relationships
- [ ] **Dry-run prevents errors** - Failed operations rolled back
- [ ] **Agents learn** - Smart query teaches proper syntax
- [ ] **Tests pass** - All integration tests passing

---

## 📊 Expected Benefits

**Smart Query:**
- Fewer retry attempts (agents understand on first try)
- Learning pathway (responses teach proper syntax)
- Better agent UX (natural language accepted)

**Cross-Reference Discovery:**
- Context awareness (agents see connections)
- Knowledge graph navigation
- Historical tracking (when was X mentioned?)

**Batch Operations:**
- Safe mutations (dry-run before commit)
- Atomic operations (all or nothing)
- Faster workflows (one call, many ops)

---

*Build on natural language API to create truly intelligent tools.*
