# lib/core - Pure Business Logic

**Purpose:** Pure, reusable business logic functions for AI agents.

**Pattern:** Functions in this directory are:
- ✅ **Pure** - No console.log, process.exit, or other side effects
- ✅ **Type-safe** - Full TypeScript types with interfaces
- ✅ **Testable** - Easy to mock and unit test
- ✅ **Structured returns** - Return typed objects, not strings
- ✅ **Error handling** - Throw errors, don't log them

**Architecture:**

```
lib/core/                  # Pure business logic (this directory)
  ├── create-session.ts    # Pure session creation
  ├── create-plan.ts       # Pure plan creation
  └── ...

lib/commands/              # CLI wrappers (human-facing)
  ├── create-session.ts    # Wraps lib/core, adds logging
  └── ...                  # (Deprecated - Phase 3 removal)

mcp-server/src/tools/      # MCP wrappers (AI-facing)
  ├── mutations.ts         # Imports lib/core directly
  └── ...                  # Fast, type-safe, no subprocess
```

**Migration Status:**
- ⏳ Phase 2 POC: create-session, create-plan, rebuild-index
- 🎯 Phase 2 Full: All ~35 commands migrated
- 🗑️ Phase 3: Delete lib/commands/ and bin/cli.js

**Performance:**
- **Before:** execFileAsync('npx', [...]) - 200ms overhead
- **After:** Direct import - ~10ms - **10-50x faster**
