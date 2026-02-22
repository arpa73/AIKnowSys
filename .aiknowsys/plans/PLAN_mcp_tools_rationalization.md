---
id: mcp_tools_rationalization
title: "MCP Tools Rationalization"
created_at: "2026-02-22T01:25:00.000Z"
updated_at: "2026-02-22T01:25:00.000Z"
author: arno-paffen
status: COMPLETE
priority: high
type: refactor
topics: ["mcp", "sqlite", "performance", "refactoring"]
---

# MCP Tools Rationalization

I have successfully refactored and consolidated the AIKnowSys MCP tools to eliminate duplication, improve performance, and standardize on SQLite-backed functionality.

## Changes Made

### 1. Query Tool Consolidation
- **Deleted Legacy Tools**: Removed `mcp-server/src/tools/query.ts` completely. Legacy `get_*` wrappers are gone.
- **Standardized Naming**: Re-registered SQLite tools in `mcp-server/src/server.ts` to drop the `_sqlite` suffix. The fast, direct-DB tools are now the standard baseline:
  - `query_plans_sqlite` → `query_plans`
  - `query_sessions_sqlite` → `query_sessions`
  - `query_learned_patterns_sqlite` → `query_learned_patterns`
  - `search_context_sqlite` → `search_context`
- **Internal Cleanups**: Renamed internal implementation functions in `sqlite-query.ts` to remove `Sqlite` suffixes for cleaner code organization. Updated `mcp-test.ts` to consume the unified tool names.

### 2. Mutation Tool Refinements
- **Eliminated CLI Subprocess Calls**: Removed `execFileAsync` subprocess usage in `split-mutations.ts` for tools like `updatePlanMetadata` and `prependToPlan`.
- **Core Library Enhancements**: Extensively enhanced `lib/core/update-plan.ts` to natively support arbitrary frontmatter updates (`updates?: Record<string, any>`) and appending content before the first section heading (`prepend?: string`).
- **Direct Imports**: Mutation tools now interact with `updatePlanCore` directly, significantly improving latency by avoiding the overhead of spawning npx processes.

### 3. Test Reliability Fixes
- **Adapter Toggles**: Fixed serious test isolation failures in `query-plans.test.ts` and `query-sessions.test.ts` by introducing an `adapter: 'json' | 'sqlite'` override option to `QueryPlansOptions`.
- **Database Resolution**: Resolved an issue where unit tests (like `context.test.ts`) were unintentionally resolving relative `DatabaseLocator` lookups against a rogue testing `.aiknowsys` subdirectory.

## Outcome
The `aiknowsys` MCP server interface is now much more unified, highly performant, and has no legacy baggage or redundant query abstractions.
