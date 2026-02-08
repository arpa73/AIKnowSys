# VSCode MCP Server Configuration

This directory contains the MCP (Model Context Protocol) server for AIKnowSys.

## What is this?

The MCP server provides AI agents with instant, token-efficient access to:
- Critical project invariants (8 mandatory rules)
- Validation requirements (commands to run after changes)
- Active implementation plans
- Recent session history  
- Skill workflows (test-driven development, refactoring, etc.)

Instead of reading 2000+ tokens from CODEBASE_ESSENTIALS.md, AI agents can call structured tools that return exactly what they need in ~50 tokens.

## Setup for VS Code + GitHub Copilot

### 1. Build the MCP server

```bash
cd mcp-server
npm install
npm run build
```

### 2. Add to your VS Code settings

Add this to `.vscode/settings.json` in your project:

```json
{
  "github.copilot.chat.mcpServers": {
    "aiknowsys": {
      "command": "node",
      "args": [
        "${workspaceFolder}/mcp-server/dist/mcp-server/src/index.js"
      ],
      "env": {}
    }
  }
}
```

**Note:** The path includes `mcp-server/dist/mcp-server/src/` because TypeScript compiles from the parent directory (`rootDir: ".."`). This allows the MCP server to import from `../lib/` in the main project.

### 3. Restart VS Code

After adding the configuration, restart VS Code to load the MCP server.

### 4. Verify it's working

In GitHub Copilot chat, the AI should now have access to these tools:
- `get_critical_invariants()` - Get the 8 mandatory rules
- `get_validation_matrix()` - Get validation commands
- `get_active_plans()` - Find active implementation plans
- `get_recent_sessions(days)` - Get recent session history
- `find_skill_for_task(task)` - Find relevant skill for a task

The AI will use these automatically when needed - you don't need to explicitly call them.

## Development

### Run in development mode

```bash
npm run dev
```

This uses `tsx watch` for hot-reloading during development.

### Update after changes

If you modify the MCP server code:

```bash
npm run build
```

Then restart VS Code to reload the MCP server with your changes.

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts          # Entry point
│   ├── server.ts         # MCP server implementation
│   └── tools/
│       ├── context.ts    # Critical context tools
│       ├── query.ts      # Query tools (plans, sessions)
│       └── skills.ts     # Skills discovery tool
├── dist/                 # Compiled JavaScript (gitignored)
└── package.json
```

## What gets built?

The TypeScript compiler reads from:
- `mcp-server/src/**/*` (MCP server code)
- `lib/**/*` (parent project's lib directory)

And outputs to:
- `mcp-server/dist/` (compiled code with source maps)

This is why the path in VS Code settings includes `dist/mcp-server/src/` - it mirrors the source structure.

## Troubleshooting

### MCP server not showing up in Copilot

1. Check VS Code Output panel (View → Output → GitHub Copilot Chat)
2. Look for MCP server startup messages
3. Verify the path in settings.json points to compiled index.js
4. Try: `Ctrl/Cmd+Shift+P` → "Reload Window"

### Changes not taking effect

1. Run `npm run build` in mcp-server/
2. Restart VS Code (not just reload window)
3. Check Output panel for errors

### Import errors

If you see module resolution errors:
- Verify `npm install` completed successfully
- Check `package.json` has `"type": "module"`
- Ensure `tsconfig.json` has `rootDir: ".."`

## Why MCP instead of CLI?

**Problem:** Built 35+ CLI commands, AI agents used 0 of them.

**Why:**
- CLI requires terminal spawn → JSON parsing → extraction (too much friction)
- Passive docs/skills don't work (AI defaults to read_file)
- No built-in discovery mechanism

**MCP Solution:**
- Direct function calls (zero friction)
- Built-in discovery via `list_tools()`
- 95% token reduction (50 vs 2000 tokens)
- 10-20x speed improvement (O(1) vs O(n) file scans)

## License

Same as parent project (MIT)
