---
title: "Remote MCP Server with HTTP Transport"
status: "PLANNED"
priority: "low"
created: "2026-02-14"
author: "Planner"
topics: ["mcp-server", "remote", "http", "docker", "deployment", "infrastructure"]
depends_on: ["PLAN_mcp_code_execution_optimization"]
---

# PLAN: Remote MCP Server with HTTP Transport

**Status:** 📋 PLANNED  
**Priority:** 🟢 LOW (Infrastructure - after AI UX complete)  
**Created:** 2026-02-14  
**Depends On:** Code execution optimization (transport layer abstraction)  
**Goal:** Enable remote MCP server deployment for team collaboration and scalability

---

## 🎯 Vision

**Current (stdio transport):**
```
Developer Machine:
  ├─ Claude Code (MCP client)
  ├─ mcp-apis/client.ts (code execution client)
  └─ AIKnowSys MCP Server (local Node.js process)
      └─ .aiknowsys/knowledge.db (local SQLite)
```

**Future (HTTP/SSE transport):**
```
Remote Server (Docker):
  ├─ AIKnowSys MCP Server (HTTP endpoint)
  ├─ .aiknowsys/knowledge.db (shared)
  └─ Port 3000 exposed

Developer Machine A:
  ├─ Claude Code → ws://remote-server:3000/mcp
  └─ mcp-apis/client.ts → http://remote-server:3000/mcp

Developer Machine B:
  ├─ Claude Code → ws://remote-server:3000/mcp
  └─ Same shared knowledge base!

CI/CD Pipeline:
  └─ Automated queries → http://remote-server:3000/mcp
```

---

## 💡 Benefits

**Team Collaboration:**
- ✅ Shared knowledge base (one source of truth)
- ✅ Multi-user access (everyone sees same sessions/plans)
- ✅ Centralized learning (patterns benefit whole team)

**Scalability:**
- ✅ Offload computation from developer machines
- ✅ Dedicated server resources
- ✅ Handle more concurrent requests

**Deployment Flexibility:**
- ✅ Docker container (deploy anywhere)
- ✅ Cloud hosting (AWS, GCP, Azure)
- ✅ On-premise servers
- ✅ Local network access

**Resilience:**
- ✅ Server stays running (no restart per session)
- ✅ Persistent connections
- ✅ Centralized backups

---

## 🏗️ Architecture

### Transport Layer Abstraction

**Key Insight:** Same MCP server code, different transport layer

```typescript
// Current: stdio transport
const server = new AIKnowSysServer({
  transport: 'stdio'
});

// Future: HTTP/SSE transport
const server = new AIKnowSysServer({
  transport: 'http',
  port: 3000,
  cors: ['http://localhost:*']
});
```

### MCP Protocol Support

**MCP Specification already supports:**
- stdio transport (current)
- HTTP with Server-Sent Events (SSE)
- WebSockets

**Reference:** [MCP Transport Specification](https://modelcontextprotocol.io/)
- TODO: Research HTTP transport implementation details
- TODO: Research SSE vs WebSocket trade-offs
- TODO: Research authentication strategies

---

## 📋 Implementation Plan (DRAFT)

**Note:** This is a placeholder. User will research and refine details.

### Phase 1: Research (TBD)

**User will research:**
- MCP HTTP transport examples
- Authentication/authorization patterns (API keys, OAuth, etc.)
- Multi-tenancy considerations (if needed)
- Docker best practices for MCP servers
- Network security (TLS, rate limiting)
- Session management strategies

**Questions to answer:**
- How does MCP HTTP transport work exactly?
- Does MCP SDK provide HTTP server out of the box?
- How to handle auth without breaking MCP protocol?
- How to handle concurrent client connections?
- How to manage SQLite locking with multiple writers?

---

### Phase 2: HTTP Transport Layer (TBD)

**Goal:** Enable HTTP/SSE transport alongside stdio

**Possible Steps:**
1. Add HTTP transport option to MCP server
2. Implement SSE endpoint for tool streaming
3. Add CORS configuration
4. Test with remote client connection

**Challenges to solve:**
- SQLite concurrent writes (may need connection pooling or write queue)
- Session persistence (stateless HTTP vs stateful stdio)
- Error handling for network failures
- Reconnection logic in clients

---

### Phase 3: Docker Deployment (TBD)

**Goal:** Package MCP server as portable container

**Possible Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy server files
COPY mcp-server/ ./mcp-server/
COPY .aiknowsys/ ./.aiknowsys/

# Expose MCP HTTP port
EXPOSE 3000

CMD ["node", "mcp-server/src/index.js", "--transport=http", "--port=3000"]
```

**Volume mounts:**
- `.aiknowsys/knowledge.db` - Persist knowledge base
- `.aiknowsys/sessions/` - Persist sessions
- `.aiknowsys/plans/` - Persist plans

---

### Phase 4: Client Updates (TBD)

**Goal:** Update clients to support remote MCP server

**mcp-apis/client.ts changes:**
```typescript
// Support both local and remote:
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'local';

if (MCP_SERVER_URL === 'local') {
  // Current: stdio transport
  const serverParams: StdioServerParameters = { ... };
} else {
  // Remote: HTTP transport
  const httpParams: HttpServerParameters = {
    url: MCP_SERVER_URL // e.g., "http://mcp-server:3000"
  };
}
```

**IDE MCP client configs:**
```json
// .vscode/mcp.json
{
  "aiknowsys": {
    "type": "http",
    "url": "http://remote-server:3000",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
}
```

---

### Phase 5: Security & Auth (TBD)

**Challenges:**
- MCP protocol may not have built-in auth
- Need to add auth layer without breaking protocol
- Consider API keys, JWT tokens, OAuth

**Research needed:**
- Does MCP support auth headers?
- How do other MCP servers handle auth?
- Multi-user access control (who can read/write what?)

---

### Phase 6: Testing & Deployment (TBD)

**Test scenarios:**
- Multiple clients connecting simultaneously
- Network interruption recovery
- Concurrent writes to SQLite
- Large file uploads (session content)
- Rate limiting behavior

**Deployment targets:**
- Local Docker (development)
- Docker Compose (team setup)
- Cloud hosting (production)

---

## ⚠️ Risks & Challenges

### Risk 1: SQLite Concurrent Writes
- **Problem:** SQLite has write locks, multiple clients may conflict
- **Mitigations:** 
  - Write queue (serialize writes)
  - WAL mode (Write-Ahead Logging)
  - Connection pooling
  - Consider PostgreSQL for high concurrency

### Risk 2: MCP Protocol Limitations
- **Problem:** MCP may not fully specify HTTP transport details
- **Mitigations:**
  - Research existing implementations
  - Follow community best practices
  - Contribute back to MCP spec if gaps found

### Risk 3: Security Complexity
- **Problem:** Opening server to network introduces security concerns
- **Mitigations:**
  - TLS/SSL certifications
  - API key authentication
  - Rate limiting
  - Network isolation (VPN, private network)

### Risk 4: Increased Operational Burden
- **Problem:** Server needs monitoring, backups, updates
- **Mitigations:**
  - Docker Compose for easy updates
  - Automated backups (SQLite snapshots)
  - Health check endpoints
  - Logging and observability

---

## 🎯 Success Criteria

- [ ] MCP server runs in Docker container
- [ ] HTTP/SSE transport working
- [ ] Multiple clients can connect simultaneously
- [ ] Knowledge base persisted across restarts
- [ ] Authentication prevents unauthorized access
- [ ] Performance matches local stdio transport
- [ ] Deployment documented (Docker Compose, cloud)

---

## 📚 Research TODO

**User will investigate:**
- [ ] MCP HTTP transport official docs
- [ ] Example HTTP MCP servers (GitHub)
- [ ] SQLite concurrency best practices (WAL mode, busy timeout)
- [ ] Docker deployment patterns for MCP servers
- [ ] Authentication strategies for MCP (community examples)
- [ ] Network security considerations (TLS, CORS, rate limiting)
- [ ] Multi-tenancy patterns (if needed)

**Update this plan after research with:**
- Concrete HTTP transport implementation
- Authentication strategy
- SQLite concurrency solution
- Deployment architecture
- Security configuration

---

## 🔄 Integration with Existing Plans

**Depends On:**
- ✅ PLAN_mcp_code_execution_optimization - Client abstraction layer ready
- ✅ PLAN_mcp_query_token_optimization - Efficient queries reduce network load

**Enables:**
- Team collaboration features
- CI/CD integration (automated queries)
- Cloud-hosted knowledge systems
- Cross-machine consistency

**Does NOT Block:**
- AI UX improvements (can proceed with local server)
- Natural language API (transport-agnostic)
- Code execution wrappers (work with both transports)

---

## 💡 Alternative: Hybrid Approach

**Keep local + add remote option:**

```typescript
// .env configuration
MCP_MODE=local          # Current behavior (stdio)
MCP_MODE=remote         # Connect to remote server
MCP_REMOTE_URL=http://... # Remote server URL

// Client detects mode automatically:
const client = new AIKnowSysMCPClient({
  mode: process.env.MCP_MODE || 'local',
  remoteUrl: process.env.MCP_REMOTE_URL
});
```

**Benefits:**
- Developers can choose local vs remote
- Best of both worlds (offline work + team sync)
- Gradual migration path

---

## 🚀 When to Implement

**Now:** Focus on AI UX (natural language API, code execution)  
**Later:** Implement remote server when:
- ✅ Team needs shared knowledge base
- ✅ Local server becomes bottleneck
- ✅ Need CI/CD integration
- ✅ Want cloud deployment

**Estimated effort:** 2-4 weeks (after research complete)

---

*This plan will be refined after user research on MCP HTTP transport, Docker deployment, and security patterns.*

**Next:** User researches MCP remote server patterns, then we design concrete implementation.
