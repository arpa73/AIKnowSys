---
title: MCP SDK v2 Patterns (Context7 Validated)
source: Context7 /modelcontextprotocol/typescript-sdk
validated: 2026-02-08
pattern_type: framework_api
project: aiknowsys-mcp-server
---

# MCP TypeScript SDK v2 Patterns

**Source:** Context7 `/modelcontextprotocol/typescript-sdk` (Feb 8, 2026)  
**SDK Version:** v2.x  
**Benchmark Score:** 78.7 (High source reputation, 223 code snippets)

## Current API Patterns (Recommended)

### Tool Registration (High-Level API)

**Pattern:** Use `server.registerTool()` for automatic request handling

```typescript
import { McpServer } from '@modelcontextprotocol/server';
import type { CallToolResult } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

const server = new McpServer({ 
  name: 'my-server', 
  version: '1.0.0' 
});

// Register tool with Zod schema validation
server.registerTool(
  'tool-name',
  {
    title: 'Human-Readable Title',
    description: 'What this tool does',
    inputSchema: z.object({
      param1: z.string().describe('Parameter description'),
      param2: z.number().min(1).max(100).optional().default(10)
    }),
    outputSchema: z.object({
      result: z.string()
    })
  },
  async ({ param1, param2 }): Promise<CallToolResult> => {
    // Tool implementation
    return {
      content: [{ type: 'text', text: 'Result text' }],
      structuredContent: { result: 'data' }  // Optional typed output
    };
  }
);
```

**Benefits:**
- Automatic `ListToolsRequest` handling (SDK lists registered tools)
- Automatic Zod validation (errors handled by SDK)
- Better type safety (parameters auto-typed from schema)
- Less boilerplate (no manual tool array management)

---

### Zod Schema Requirements

**CRITICAL:** Must wrap with `z.object()` (v2 requirement)

```typescript
// ❌ WRONG (v1 pattern - no longer supported):
server.registerTool('greet', {
  inputSchema: { name: z.string() }  // Raw shape not allowed
}, callback);

// ✅ CORRECT (v2 pattern):
server.registerTool('greet', {
  inputSchema: z.object({ name: z.string() })  // Must use z.object()
}, callback);

// ✅ For tools with no parameters:
server.registerTool('ping', {
  inputSchema: z.object({})  // Empty object schema
}, async () => ({ content: [{ type: 'text', text: 'pong' }] }));
```

---

### Server Initialization

```typescript
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server';

const server = new McpServer(
  {
    name: 'server-name',
    version: '1.0.0',
    websiteUrl: 'https://example.com'  // Optional
  },
  {
    capabilities: { 
      logging: {},  // Optional: enable logging capability
      tools: {}     // Automatically set when using registerTool()
    }
  }
);

// Register tools, resources, prompts...
server.registerTool(...);

// Connect to transport (stdio for local, HTTP for remote)
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Current Implementation Gap (Phase 1)

**Our Implementation:** Low-level API with manual request handlers

```typescript
// Phase 1 implementation (still valid, but not modern pattern):
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getTools()  // Manually maintained array
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const schema = getSchemaForTool(request.params.name);
  const args = schema.parse(request.params.arguments);  // Manual Zod validation
  // ... manual tool invocation
});
```

**Gap Analysis:**
- ✅ **Correct:** Functionally works, tests pass, follows protocol
- ⚠️ **Not Optimal:** Uses low-level API instead of high-level convenience methods
- 📋 **Migration:** Can be refactored to `registerTool()` in Phase 2

---

## Migration Strategy (Future)

**When to migrate:** Phase 2 or Phase 3 (after Phase 1 is stable)

**Benefits of migration:**
- Reduce 50+ lines of boilerplate (tool list management)
- Automatic validation error handling
- Better TypeScript inference
- Easier to add new tools (one `registerTool()` call)

**Migration steps:**
1. Replace `getTools()` array with individual `registerTool()` calls
2. Remove manual `ListToolsRequestSchema` handler (SDK handles it)
3. Remove manual `CallToolRequestSchema` handler (SDK calls tool functions)
4. Simplify Zod validation (move to `inputSchema`)
5. Update tests to verify new pattern

**Risk:** Low (existing tests validate contract, refactor with green tests)

---

## Import Patterns (SDK v2)

```typescript
// Server (Node.js environments)
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';

// Client
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client';

// Zod (v4 required)
import * as z from 'zod/v4';
```

**Note:** Imports changed in v2 (previously `@modelcontextprotocol/sdk/...`)

---

## Error Handling

```typescript
import { ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/server';

try {
  // Tool implementation
} catch (error) {
  if (error instanceof ProtocolError) {
    switch (error.code) {
      case ProtocolErrorCode.InvalidParams:
        // Handle invalid parameters
        break;
      case ProtocolErrorCode.InternalError:
        // Handle server error
        break;
    }
  }
  throw error;  // Re-throw for SDK to handle
}
```

---

## Validation Rules

**Trigger words:** "MCP server", "tool registration", "Model Context Protocol", "SDK v2"

**When to use this pattern:**
- Building new MCP tools (use `registerTool()`)
- Migrating from low-level API
- Updating existing MCP servers to modern patterns

**When NOT to use:**
- Phase 1 is stable and working (don't refactor working code prematurely)
- Complex tool logic requiring low-level control
- Performance-critical scenarios (high-level API has minimal overhead)

---

## Phase 1 Status (Current)

✅ **Production-ready** with low-level API  
✅ **43 tests passing** (100% tool coverage)  
✅ **Protocol-compliant** (manual but correct)  
📋 **Future improvement**: Migrate to high-level API in Phase 2

**Decision:** Keep Phase 1 as-is (working, tested). Migrate in Phase 2 when adding 10 new tools.

---

## References

- Context7 Library: `/modelcontextprotocol/typescript-sdk`
- Source Reputation: High
- Code Snippets: 223
- Benchmark Score: 78.7
- Validation Date: 2026-02-08
- Validated By: Context7 MCP query during architect review follow-up

**Related Files:**
- [mcp-server/src/server.ts](../../mcp-server/src/server.ts) - Current implementation
- [mcp-server/src/tools/*.ts](../../mcp-server/src/tools/) - Tool definitions
- [mcp-server/test/](../../mcp-server/test/) - Test suite
