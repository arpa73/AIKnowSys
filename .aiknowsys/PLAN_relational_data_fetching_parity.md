# Implementation Plan: Relational Data Fetching Parity

**Status:** 📋 PLANNED
**Author:** AIKnowSys Planner

## Goal
Eliminate trial-and-error behaviors and blind spots by providing complete relational graphs through the MCP query tools. Specifically: improving `get_plan` to return its relationships, fully exposing `plan` filtering for sessions, and adding dedicated access to reviews.

## Architecture Context
The core SQLite storage engine (`sqlite-storage.ts`) already has most of these capabilities (e.g. `queryReviews`, filtering sessions by `plan`). The flaw is that the MCP server boundary (`sqlite-query.ts` and `query-tools.ts`) drops these parameters or fails to use the joined methods.

## Proposed Changes

### Phase 1: Enrich `get_plan` with Relations
Currently, `get_plan` only returns the base SQLite row. Agents cannot see associated sessions, reviews, or events.

#### [NEW] `lib/context/sqlite-storage.ts` (Method Addition)
Add `getPlanWithRelations(planId)`:
- Query the plan row.
- Query sessions WHERE `plan_id = planId`.
- Query reviews WHERE `target_id = planId`.
- Query events WHERE `plan_id = planId`.

#### [MODIFY] `mcp-server/src/tools/sqlite-query.ts`
Update `getPlan({ planId, dbPath })` to call `storage.getPlanWithRelations()` instead of `storage.getPlanById()`.

### Phase 2: Expose `planId` on `query_sessions`
Currently, an agent cannot explicitly ask for "all sessions for this plan" via the MCP tools because the signature strips it.

#### [MODIFY] `lib/types/index.ts`
Add `planId?: string` to `QuerySessionsOptions`.

#### [MODIFY] `mcp-server/src/tools/sqlite-query.ts`
Update the wrapper `querySessions(params: { ... planId?: string ... })` to extract `planId` from `parsed` and pass it to `sessionOptions`.

#### [MODIFY] `mcp-server/src/dynamic-toolset/metadata/query-tools.ts`
Update the `query_sessions` Zod schema to explicitly accept `planId: z.string().optional()`.

### Phase 3: Expose `query_reviews` MCP Tool
Currently, reviews are "invisible" orphans unless they are attached to a `get_session` response.

#### [MODIFY] `mcp-server/src/tools/sqlite-query.ts`
Add `queryReviews(params: { targetId?: string; status?: string; dbPath?: string })`. Allow filtering by `targetId` (to see all reviews for a plan/session) and by `status`. (Uses existing `storage.queryReviews()`).

#### [MODIFY] `mcp-server/src/dynamic-toolset/metadata/query-tools.ts`
Register `query_reviews` tool with Zod schema.

#### [MODIFY] `mcp-server/src/server.ts`
Wire the `query_reviews` tool locally in the dynamic/fixed tool registration loop.

### Phase 4: Expose `query_events` MCP Tool
Agents log valuable workflow events (`log_work_event`), but cannot query the history to debug past problems or reconstruct timelines across the whole project.

#### [MODIFY] `mcp-server/src/tools/sqlite-query.ts`
Add `queryEvents(params: { eventType?: string | string[]; planId?: string; sessionId?: string; dbPath?: string })`. (Uses existing `storage.queryEvents()`).

#### [MODIFY] `mcp-server/src/dynamic-toolset/metadata/query-tools.ts`
Register `query_events` tool with Zod schema.

#### [MODIFY] `mcp-server/src/server.ts`
Wire the `query_events` tool.

## Verification Plan

### Automated Tests
- Run `npm run test` in `mcp-server/`.
- Verify `getPlan` returns a structured JSON graph with `.sessions`, `.reviews`, and `.events` arrays.
- Verify `query_sessions({ planId: "XYZ" })` returns the correct filtered set.
- Verify `query_reviews` and `query_events` function correctly on the mock DB.

### Success Criteria
- [ ] Diagram artifacts map correctly to reality.
- [ ] No more "trial and error" guesswork required for agents to find reviews on a plan, and agents can seamlessly retrieve event history to learn from past errors.
