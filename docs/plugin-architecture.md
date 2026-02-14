# AIKnowSys Plugin Architecture

**Status:** Design Spec (Implementation Pending)  
**Created:** 2026-02-01  
**Purpose:** Generic plugin system for optional CLI command extensions

---

## Design Principles

1. **Zero Hard Dependencies:** Core aiknowsys MUST work without any plugins installed
2. **Opt-in Installation:** Plugins are npm packages users explicitly install
3. **Graceful Degradation:** Missing plugins don't break core functionality
4. **Command Extension:** Plugins register new CLI commands (not hook into existing ones)
5. **Minimal API Surface:** Simple plugin interface (register, execute, validate)

---

## Plugin System Overview

### Architecture Layers

```
┌─────────────────────────────────────────────┐
│         User Executes CLI Command           │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  bin/cli.js (Commander.js main entry)       │
│  - Loads core commands (lib/commands/)      │
│  - Calls plugin loader                      │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  lib/plugins/loader.js (Plugin Discovery)   │
│  - Scans package.json dependencies          │
│  - Detects "aiknowsys-plugin-*" packages    │
│  - Dynamically imports plugin modules       │
│  - Registers commands with Commander        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Plugin Package (e.g., aiknowsys-plugin-    │
│  context7)                                   │
│  - Exports { name, version, commands }      │
│  - Each command: { name, description, action│
│    , options }                               │
└──────────────────────────────────────────────┘
```

### Plugin Discovery Flow

```javascript
// In bin/cli.js (after core commands loaded)

import { loadPlugins } from '../lib/plugins/loader.js';

// Load core commands first
program
  .command('init')
  .action(/* ... */);

// Load plugins (adds additional commands)
await loadPlugins(program);

program.parse();
```

### Plugin Package Structure

```
aiknowsys-plugin-context7/
├── package.json
│   {
│     "name": "aiknowsys-plugin-context7",
│     "version": "0.1.0",
│     "keywords": ["aiknowsys-plugin"],
│     "peerDependencies": {
│       "aiknowsys": "^0.8.0"
│     },
│     "dependencies": {
│       "@modelcontextprotocol/sdk": "^1.0.0"
│     }
│   }
├── index.js (plugin entry point)
├── lib/
│   ├── mcp-client.js
│   ├── validate-deliverables.js
│   └── utils.js
└── test/
    └── plugin.test.js
```

---

## Plugin API Specification

### Plugin Entry Point (index.js)

Every plugin MUST export this structure:

```javascript
// aiknowsys-plugin-context7/index.js

export default {
  // Plugin metadata
  name: 'context7',
  version: '0.1.0',
  description: 'Context7 MCP integration for documentation queries',
  
  // Commands to register
  commands: [
    {
      name: 'validate-deliverables',
      description: 'Validate skills/stacks/docs against current framework docs',
      options: [
        { flags: '-t, --type <type>', description: 'Type: skills|stacks|docs|all' },
        { flags: '--report', description: 'Generate review report' }
      ],
      action: async (options, program) => {
        // Command implementation
        const { validateDeliverables } = await import('./lib/validate-deliverables.js');
        await validateDeliverables(options);
      }
    },
    {
      name: 'query-docs',
      description: 'Query framework documentation via Context7 MCP',
      options: [
        { flags: '-l, --library <id>', description: 'Library ID (e.g., /vercel/next.js)' },
        { flags: '-q, --query <text>', description: 'Documentation query' }
      ],
      action: async (options, program) => {
        const { queryDocs } = await import('./lib/mcp-client.js');
        await queryDocs(options.library, options.query);
      }
    }
  ],
  
  // Optional: Lifecycle hooks
  async onLoad() {
    // Called when plugin loads (check dependencies, config, etc.)
    console.log('Context7 plugin loaded');
  },
  
  async onUnload() {
    // Called on CLI exit (cleanup resources)
  }
};
```

### Plugin Loader (lib/plugins/loader.js)

Core aiknowsys loader implementation:

```javascript
// lib/plugins/loader.js

import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Discover and load aiknowsys plugins
 * @param {import('commander').Command} program - Commander program instance
 * @returns {Promise<Array>} Loaded plugins
 */
export async function loadPlugins(program) {
  const plugins = [];
  
  try {
    // Read package.json to find plugin dependencies
    const pkgPath = join(__dirname, '../../package.json');
    const pkgContent = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    
    // Find all dependencies matching "aiknowsys-plugin-*"
    const allDeps = {
      ...pkg.dependencies || {},
      ...pkg.devDependencies || {},
      ...pkg.optionalDependencies || {}
    };
    
    const pluginNames = Object.keys(allDeps).filter(name => 
      name.startsWith('aiknowsys-plugin-')
    );
    
    if (pluginNames.length === 0) {
      // No plugins installed - this is OK!
      return plugins;
    }
    
    // Load each plugin
    for (const pluginName of pluginNames) {
      try {
        const plugin = await loadPlugin(pluginName, program);
        if (plugin) {
          plugins.push(plugin);
        }
      } catch (error) {
        // Plugin failed to load - warn but don't crash
        console.warn(`Warning: Failed to load plugin "${pluginName}": ${error.message}`);
      }
    }
    
    return plugins;
    
  } catch (error) {
    // Failed to read package.json or discover plugins
    // This is non-fatal - just means no plugins available
    console.warn(`Plugin discovery failed: ${error.message}`);
    return plugins;
  }
}

/**
 * Load a single plugin by name
 * @param {string} pluginName - NPM package name
 * @param {import('commander').Command} program - Commander program
 * @returns {Promise<Object|null>} Plugin object or null if failed
 */
async function loadPlugin(pluginName, program) {
  try {
    // Dynamically import the plugin module
    const pluginModule = await import(pluginName);
    const plugin = pluginModule.default;
    
    // Validate plugin structure
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin must export default object');
    }
    
    if (!plugin.name || !plugin.commands) {
      throw new Error('Plugin must have "name" and "commands" properties');
    }
    
    // Call onLoad hook if provided
    if (typeof plugin.onLoad === 'function') {
      await plugin.onLoad();
    }
    
    // Register each command with Commander
    for (const cmd of plugin.commands) {
      const command = program.command(cmd.name);
      
      if (cmd.description) {
        command.description(cmd.description);
      }
      
      // Add options
      if (cmd.options && Array.isArray(cmd.options)) {
        for (const opt of cmd.options) {
          command.option(opt.flags, opt.description, opt.defaultValue);
        }
      }
      
      // Set action handler
      if (typeof cmd.action === 'function') {
        command.action(async (options) => {
          try {
            await cmd.action(options, program);
          } catch (error) {
            console.error(`Error executing ${cmd.name}:`, error.message);
            process.exit(1);
          }
        });
      }
    }
    
    console.log(`Loaded plugin: ${plugin.name} v${plugin.version || 'unknown'}`);
    return plugin;
    
  } catch (error) {
    throw new Error(`Failed to load plugin "${pluginName}": ${error.message}`);
  }
}

/**
 * Get list of installed plugins (for diagnostics)
 * @returns {Promise<Array<string>>} Plugin names
 */
export async function listInstalledPlugins() {
  try {
    const pkgPath = join(__dirname, '../../package.json');
    const pkgContent = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    
    const allDeps = {
      ...pkg.dependencies || {},
      ...pkg.devDependencies || {},
      ...pkg.optionalDependencies || {}
    };
    
    return Object.keys(allDeps).filter(name => 
      name.startsWith('aiknowsys-plugin-')
    );
  } catch {
    return [];
  }
}
```

---

## Plugin Installation & Usage

### For Users

**Install a plugin:**

```bash
# Install plugin as optional dependency
npm install --save-optional aiknowsys-plugin-context7

# Or install globally if aiknowsys is global
npm install -g aiknowsys-plugin-context7
```

**Use plugin commands:**

```bash
# Plugin commands work like core commands
aiknowsys validate-deliverables --type skills

# Core commands still work without plugins
aiknowsys init my-project
```

**Check installed plugins:**

```bash
# Could add diagnostic command to core
aiknowsys plugins ls
# Output:
# Installed plugins:
#  - context7 v0.1.0 (aiknowsys-plugin-context7)
```

### For Plugin Developers

**Create a new plugin:**

```bash
# Initialize plugin package
npm init -y
mv package.json package.json.bak
cat > package.json << 'EOF'
{
  "name": "aiknowsys-plugin-myplugin",
  "version": "0.1.0",
  "type": "module",
  "keywords": ["aiknowsys-plugin"],
  "peerDependencies": {
    "aiknowsys": "^0.8.0"
  }
}
EOF

# Create plugin entry point
cat > index.js << 'EOF'
export default {
  name: 'myplugin',
  version: '0.1.0',
  commands: [
    {
      name: 'my-command',
      description: 'My custom command',
      action: async (options) => {
        console.log('Hello from plugin!');
      }
    }
  ]
};
EOF

# Test locally
npm link
cd /path/to/aiknowsys
npm link aiknowsys-plugin-myplugin
aiknowsys my-command
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (4-6 hours)

**Files to create:**
- `lib/plugins/loader.js` - Plugin discovery and loading
- `lib/plugins/validator.js` - Plugin structure validation
- `test/plugins.test.js` - Core plugin system tests

**Integration points:**
- Modify `bin/cli.js` to call `loadPlugins(program)` after core commands
- Add `plugins ls` command to list installed plugins

**Validation:**
- Test with no plugins installed (should work normally)
- Test with mock plugin (should load and register command)
- Test with malformed plugin (should warn and continue)

### Phase 2: Context7 Plugin (8-10 hours)

**Create separate package: `aiknowsys-plugin-context7`**

Files:
- `package.json` - Plugin metadata, MCP SDK dependency
- `index.js` - Plugin entry point
- `lib/mcp-client.js` - Context7 MCP communication
- `lib/validate-deliverables.js` - Automated validation logic
- `test/plugin.test.js` - Plugin-specific tests

Commands:
- `aiknowsys validate-deliverables` - Automated review
- `aiknowsys query-docs` - Ad-hoc documentation queries

### Phase 3: Documentation (2-4 hours)

**Files to create/update:**
- `docs/plugin-development-guide.md` - How to create plugins
- `docs/plugin-api-reference.md` - API specification
- `README.md` - Add plugins section
- `.github/skills/deliverable-review/SKILL.md` - Note automation available

---

## Security & Safety

### Plugin Validation

**Core loader MUST validate:**
- Plugin exports default object
- Required properties present (name, commands)
- Commands have valid structure
- No circular dependencies

**Core loader MUST NOT:**
- Execute arbitrary code during discovery
- Allow plugins to override core commands
- Give plugins access to internal state

### Error Handling

**Plugin failures MUST NOT crash core:**
- Plugin load errors → warn and continue
- Plugin command errors → display error, exit gracefully
- Missing dependencies → suggest installation

### User Control

**Users control plugins:**
- Plugins are explicit npm installs (not auto-discovered from node_modules)
- Users can remove plugins by uninstalling package
- Core functionality never depends on plugins

---

## Testing Strategy

### Core Plugin System Tests

```javascript
// test/plugins.test.js

describe('Plugin System', () => {
  test('Works without plugins', async () => {
    // Should load successfully with no plugins
  });
  
  test('Discovers plugin packages', async () => {
    // Mock package.json with plugin dependency
    // Verify plugin is discovered
  });
  
  test('Loads valid plugin', async () => {
    // Mock valid plugin module
    // Verify command registered
  });
  
  test('Handles malformed plugin gracefully', async () => {
    // Mock plugin missing required properties
    // Should warn, not crash
  });
  
  test('Plugin commands execute correctly', async () => {
    // Register mock plugin command
    // Execute and verify output
  });
});
```

### Context7 Plugin Tests

```javascript
// aiknowsys-plugin-context7/test/plugin.test.js

describe('Context7 Plugin', () => {
  test('validate-deliverables command exists', () => {
    // Verify command registered
  });
  
  test('MCP client can query documentation', async () => {
    // Mock MCP server
    // Verify query returns results
  });
  
  test('Validation logic detects outdated patterns', async () => {
    // Mock skill with outdated API
    // Mock Context7 response with current API
    // Verify outdated pattern flagged
  });
});
```

---

## Future Enhancements

### Plugin Ecosystem (Future)

**Potential plugins:**
- `aiknowsys-plugin-github` - GitHub integration (issues, PRs, CI)
- `aiknowsys-plugin-jira` - Jira ticket integration
- `aiknowsys-plugin-slack` - Slack notifications
- `aiknowsys-plugin-analytics` - Codebase analytics and insights

### Plugin Discovery Improvements

**Future features:**
- Plugin registry (npm package search)
- Recommended plugins list
- Version compatibility checking
- Auto-update notifications

### Plugin Capabilities

**Future APIs:**
- Hooks into core commands (before/after hooks)
- Custom validation checkers
- Template generators
- Report formatters

---

## Success Criteria

**Core plugin system:**
- ✅ Core works without any plugins installed
- ✅ Plugins install via standard npm install
- ✅ Plugin failures don't crash core
- ✅ Clear API for plugin developers
- ✅ Minimal complexity (~200 lines for loader)

**Context7 plugin:**
- ✅ Automated deliverable validation
- ✅ Context7 MCP integration working
- ✅ Useful reports generated
- ✅ Saves time vs manual workflow (2-3x faster)

---

## Related Documents

- [Context7 Review Checklist](../docs/context7-review-checklist.md) - Manual workflow this automates
- [Deliverable Review Skill](../.github/skills/deliverable-review/SKILL.md) - AI prompts for manual reviews
- [PLAN_context7_future.md](../.aiknowsys/PLAN_context7_future.md) - Original feature planning

---

**Next Steps:**
1. Implement `lib/plugins/loader.js`
2. Add loader call to `bin/cli.js`
3. Write tests for plugin system
4. Create `aiknowsys-plugin-context7` package
5. Test with real Context7 MCP server

---

*Part of AIKnowSys v0.8.0+ - Optional plugin architecture for extensibility*
