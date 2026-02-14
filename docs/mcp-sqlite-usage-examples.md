# MCP SQLite Tools - Usage Examples

> **Status:** Phase 1 - Experimental  
> **Performance:** 10-100x faster than file-based queries  
> **Requirements:** `.aiknowsys/knowledge.db` (created via `migrate-to-sqlite`)

---

## Prerequisites

**1. Create SQLite database:**
```bash
npx aiknowsys migrate-to-sqlite
```

**2. Verify MCP server is running:**
- MCP-compatible client (Claude Desktop, VS Code with MCP, etc.)
- AIKnowSys MCP server configured
- See [mcp-server/SETUP.md](../mcp-server/SETUP.md) for setup instructions

---

## Common Workflows

### 1. Get Project Overview

**Query database statistics:**
```typescript
const stats = await mcp_aiknowsys_get_db_stats_sqlite({
  dbPath: ".aiknowsys/knowledge.db"
});

console.log(`Sessions: ${stats.sessions}`);
console.log(`Plans: ${stats.plans}`);
console.log(`Learned Patterns: ${stats.learnedPatterns}`);
console.log(`Database Size: ${stats.databaseSizeMB} MB`);
console.log(`Last Updated: ${stats.lastUpdated}`);
```

**Performance:** ~9ms  
**Use Case:** Session start context check, health monitoring

---

### 2. Find Recent Work

**Query sessions from last 7 days:**
```typescript
const sessions = await mcp_aiknowsys_query_sessions_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  dateAfter: "2026-02-06",  // 7 days ago
  dateBefore: "2026-02-13"  // today
});

sessions.forEach(session => {
  console.log(`${session.date}: ${session.topic}`);
  console.log(`Status: ${session.status}`);
  console.log(`Topics: ${session.topics.join(", ")}`);
});
```

**Performance:** ~3.6ms  
**Use Case:** Resume work, session continuity, progress tracking

---

### 3. Check Active Plans

**Find all active plans:**
```typescript
const activePlans = await mcp_aiknowsys_query_plans_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  status: "ACTIVE"
});

console.log(`Found ${activePlans.length} active plans:`);
activePlans.forEach(plan => {
  console.log(`- ${plan.title} (by ${plan.author})`);
  console.log(`  Topics: ${plan.topics.join(", ")}`);
  console.log(`  Priority: ${plan.priority || "N/A"}`);
});
```

**Performance:** ~7ms  
**Use Case:** Multi-developer coordination, work prioritization

---

### 4. Find Plans by Developer

**Query all plans by specific author:**
```typescript
const myPlans = await mcp_aiknowsys_query_plans_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  author: "arno-paffen"  // replace with your username
});

// Filter by status
const active = myPlans.filter(p => p.status === "ACTIVE");
const paused = myPlans.filter(p => p.status === "PAUSED");
const complete = myPlans.filter(p => p.status === "COMPLETE");

console.log(`Active: ${active.length}, Paused: ${paused.length}, Complete: ${complete.length}`);
```

**Performance:** ~7ms  
**Use Case:** Personal work tracking, plan handoff

---

### 5. Search Across All Content

**Full-text search for specific term:**
```typescript
const results = await mcp_aiknowsys_search_context_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  query: "SQLite migration",
  limit: 5
});

console.log(`Found ${results.length} results:`);
results.forEach(result => {
  console.log(`[${result.type}] ${result.title}`);
  console.log(`Score: ${result.rank}`);
  console.log(`Snippet: ${result.snippet}`);
});
```

**Performance:** ~18ms  
**Use Case:** Finding related work, discovering context, debugging issues

---

### 6. Find Learned Patterns by Category

**Query patterns for specific category:**
```typescript
const errorPatterns = await mcp_aiknowsys_query_learned_patterns_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  category: "error_resolution"
});

console.log(`Found ${errorPatterns.length} error resolution patterns:`);
errorPatterns.forEach(pattern => {
  console.log(`- ${pattern.title}`);
  console.log(`  Keywords: ${pattern.keywords.join(", ")}`);
});
```

**Performance:** ~18ms  
**Use Case:** Finding solutions to recurring problems, pattern reuse

---

### 7. Multi-Topic Session Search

**Find sessions covering specific topic:**
```typescript
const mcpSessions = await mcp_aiknowsys_query_sessions_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  topic: "mcp-tools"
});

console.log(`Found ${mcpSessions.length} sessions about MCP tools`);
mcpSessions.forEach(session => {
  console.log(`${session.date}: ${session.topic}`);
  // session.content contains full markdown
});
```

**Performance:** ~3.6ms  
**Use Case:** Topic-focused research, understanding feature evolution

---

### 8. Combine Queries (Multi-Step Workflow)

**Example: Find active plan, then search related sessions:**
```typescript
// Step 1: Get active migration plan
const migrationPlans = await mcp_aiknowsys_query_plans_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  topic: "migration",
  status: "ACTIVE"
});

if (migrationPlans.length > 0) {
  const plan = migrationPlans[0];
  console.log(`Active plan: ${plan.title}`);
  
  // Step 2: Search sessions mentioning this plan
  const relatedSessions = await mcp_aiknowsys_query_sessions_sqlite({
    dbPath: ".aiknowsys/knowledge.db",
    topic: "migration"
  });
  
  console.log(`Found ${relatedSessions.length} related sessions`);
}
```

**Performance:** ~10.6ms total (3.6ms + 7ms)  
**Use Case:** Context reconstruction, plan progress tracking

---

### 9. Error Pattern Lookup

**Find patterns matching specific keywords:**
```typescript
const yamlPatterns = await mcp_aiknowsys_query_learned_patterns_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  keywords: "yaml,parsing"  // comma-separated
});

if (yamlPatterns.length > 0) {
  console.log(`Found ${yamlPatterns.length} YAML parsing patterns:`);
  yamlPatterns.forEach(pattern => {
    console.log(pattern.content);  // Full pattern with solution
  });
} else {
  console.log("No patterns found - new issue to document!");
}
```

**Performance:** ~18ms  
**Use Case:** Debugging, learning from past solutions

---

## Performance Comparison

**Scenario: Query 100 sessions**

| Method | Time | Notes |
|--------|------|-------|
| **SQLite MCP Tool** | 3.6ms | Database query (indexed) |
| File-based MCP Tool | 50-100ms | Index lookup + file reads |
| CLI Command | 200-500ms | Process spawn + parsing |
| Direct File Reading | 500-2000ms | Scan directory + parse YAML x100 |

**Winner:** SQLite MCP tools are **100x faster** than file reading

---

## Best Practices

### 1. Database Up-to-Date
```bash
# Re-run migration after creating new files
npx aiknowsys migrate-to-sqlite
```

### 2. Use Absolute Paths
```typescript
// ✅ Good - absolute path
const stats = await mcp_aiknowsys_get_db_stats_sqlite({
  dbPath: "/full/path/to/.aiknowsys/knowledge.db"
});

// ⚠️ Works but relative to cwd
const stats = await mcp_aiknowsys_get_db_stats_sqlite({
  dbPath: ".aiknowsys/knowledge.db"
});
```

### 3. Handle Missing Database
```typescript
try {
  const sessions = await mcp_aiknowsys_query_sessions_sqlite({
    dbPath: ".aiknowsys/knowledge.db"
  });
} catch (error) {
  if (error.message.includes("ENOENT")) {
    console.log("Database not found. Run: npx aiknowsys migrate-to-sqlite");
  }
}
```

### 4. Combine Filters for Precision
```typescript
// Narrow down results with multiple filters
const precisePlans = await mcp_aiknowsys_query_plans_sqlite({
  dbPath: ".aiknowsys/knowledge.db",
  status: "ACTIVE",
  author: "arno-paffen",
  topic: "mcp-tools"
});
```

---

## Troubleshooting

**Issue:** "Database not found"  
**Solution:** Run `npx aiknowsys migrate-to-sqlite` first

**Issue:** "No results returned"  
**Solution:** Check if files have valid YAML frontmatter (migration filters invalid YAML)

**Issue:** "Old sessions not appearing"  
**Solution:** Re-run migration after creating new session files

**Issue:** "Slow queries (>100ms)"  
**Solution:** 
- Check database size (should be <10MB for typical project)
- Verify SQLite indexes exist (run sanity check)
- Consider vacuuming database: `sqlite3 .aiknowsys/knowledge.db "VACUUM;"`

---

## Next Steps

**Phase 2 (Future):**
- Incremental updates (no full re-scan needed)
- Real-time file watching
- Dedicated learned patterns table
- Advanced full-text search (ranking improvements)

**See:** [ROADMAP.md](../ROADMAP.md) for planned features

---

**Part of aiknowsys. See [README.md](../README.md) and [CODEBASE_ESSENTIALS.md](../CODEBASE_ESSENTIALS.md) for full documentation.**
