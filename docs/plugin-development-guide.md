# Plugin Development Guide

**Build optional extensions for AIKnowSys CLI**

---

## Overview

AIKnowSys supports optional plugins that extend the CLI with new commands. Plugins are:

- **Opt-in**: Users explicitly install them
- **Zero coupling**: Core works without any plugins
- **Gracefully degradable**: Missing plugins don't break anything
- **NPM packages**: Standard Node.js distribution

---

## Quick Start

### Create a Plugin Package

```bash
# Initialize new package
mkdir aiknowsys-plugin-myplugin
cd aiknowsys-plugin-myplugin
npm init -y
```

### Configure package.json

```json
{
  "name": "aiknowsys-plugin-myplugin",
  "version": "0.1.0",
  "type": "module",
  "description": "My custom AIKnowSys plugin",
  "keywords": ["aiknowsys-plugin"],
  "main": "index.js",
  "peerDependencies": {
    "aiknowsys": "^0.8.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Key requirements:**
- `"type": "module"` - Plugins MUST use ES modules
- `"keywords": ["aiknowsys-plugin"]` - For discoverability
- `"aiknowsys-plugin-*"` naming - For auto-detection

### Create Plugin Entry Point

```javascript
// index.js
export default {
  // Plugin metadata
  name: 'myplugin',
  version: '0.1.0',
  description: 'My custom plugin',
  
  // Commands to register
  commands: [
    {
      name: 'my-command',
      description: 'My custom command',
      options: [
        { 
          flags: '-f, --flag <value>', 
          description: 'Custom flag' 
        }
      ],
      action: async (options) => {
        console.log('Hello from plugin!');
        console.log('Flag value:', options.flag);
      }
    }
  ],
  
  // Optional lifecycle hooks
  async onLoad() {
    console.log('Plugin loaded!');
  }
};
```

### Test Locally

```bash
# Link plugin locally
npm link

# In AIKnowSys project
cd /path/to/aiknowsys
npm link aiknowsys-plugin-myplugin

# Test command
aiknowsys my-command --flag test
# Output: Hello from plugin!
#         Flag value: test
```

---

## Plugin API Reference

### Plugin Object Structure

```javascript
export default {
  // REQUIRED: Plugin name (used in logs)
  name: string,
  
  // OPTIONAL: Plugin version
  version: string,
  
  // OPTIONAL: Plugin description
  description: string,
  
  // REQUIRED: Commands to register
  commands: Array<Command>,
  
  // OPTIONAL: Called when plugin loads
  async onLoad(): Promise<void>,
  
  // OPTIONAL: Called on CLI exit
  async onUnload(): Promise<void>
}
```

### Command Object Structure

```javascript
{
  // REQUIRED: Command name (e.g., "validate")
  name: string,
  
  // OPTIONAL: Command description (shown in --help)
  description: string,
  
  // OPTIONAL: Command options (Commander.js format)
  options: Array<{
    flags: string,           // e.g., "-f, --file <path>"
    description: string,     // Option description
    defaultValue?: any       // Default value if not provided
  }>,
  
  // OPTIONAL: Positional arguments
  arguments: Array<{
    name: string,            // e.g., "<target>"
    description: string,     // Argument description
    defaultValue?: any       // Default value if not provided
  }>,
  
  // REQUIRED: Command implementation
  async action(...args): Promise<void>
}
```

### Action Function Signatures

**With options only:**
```javascript
action: async (options) => {
  console.log('Options:', options);
}
```

**With arguments and options:**
```javascript
// Command: aiknowsys my-cmd <target> [source] -f --verbose
action: async (target, source, options) => {
  console.log('Target:', target);      // Required argument
  console.log('Source:', source);      // Optional argument
  console.log('Flags:', options.f);    // -f option
  console.log('Verbose:', options.verbose); // --verbose option
}
```

---

## Examples

### Example 1: Simple Command

```javascript
// aiknowsys-plugin-hello/index.js
export default {
  name: 'hello',
  version: '1.0.0',
  commands: [
    {
      name: 'greet',
      description: 'Greet the user',
      options: [
        { flags: '-n, --name <name>', description: 'User name', defaultValue: 'World' }
      ],
      action: async (options) => {
        console.log(`Hello, ${options.name}!`);
      }
    }
  ]
};
```

**Usage:**
```bash
aiknowsys greet
# Output: Hello, World!

aiknowsys greet --name Alice
# Output: Hello, Alice!
```

### Example 2: File Processing Command

```javascript
// aiknowsys-plugin-processor/index.js
import { readFile } from 'fs/promises';

export default {
  name: 'processor',
  version: '1.0.0',
  commands: [
    {
      name: 'process',
      description: 'Process a file',
      arguments: [
        { name: '<file>', description: 'File to process' }
      ],
      options: [
        { flags: '--output <path>', description: 'Output file path' }
      ],
      action: async (file, options) => {
        const content = await readFile(file, 'utf-8');
        console.log(`Processing ${file}...`);
        console.log(`Content length: ${content.length} bytes`);
        
        if (options.output) {
          // Write to output file
          await writeFile(options.output, processedContent);
        }
      }
    }
  ]
};
```

**Usage:**
```bash
aiknowsys process myfile.txt
aiknowsys process input.json --output output.json
```

### Example 3: Multiple Commands

```javascript
// aiknowsys-plugin-devtools/index.js
export default {
  name: 'devtools',
  version: '2.0.0',
  commands: [
    {
      name: 'serve',
      description: 'Start dev server',
      options: [
        { flags: '-p, --port <number>', description: 'Port number', defaultValue: '3000' }
      ],
      action: async (options) => {
        console.log(`Starting server on port ${options.port}...`);
        // Server logic here
      }
    },
    {
      name: 'build',
      description: 'Build for production',
      options: [
        { flags: '--minify', description: 'Minify output' }
      ],
      action: async (options) => {
        console.log('Building for production...');
        if (options.minify) {
          console.log('Minification enabled');
        }
      }
    }
  ]
};
```

**Usage:**
```bash
aiknowsys serve --port 8080
aiknowsys build --minify
```

---

## Advanced Features

### Lifecycle Hooks

```javascript
export default {
  name: 'advanced',
  
  // Called when plugin loads
  async onLoad() {
    // Check dependencies
    try {
      await import('some-required-package');
    } catch {
      console.error('Missing dependency: some-required-package');
      process.exit(1);
    }
    
    // Initialize resources
    this.connection = await connectToService();
  },
  
  // Called on CLI exit
  async onUnload() {
    // Cleanup resources
    if (this.connection) {
      await this.connection.close();
    }
  },
  
  commands: [/* ... */]
};
```

### Error Handling

```javascript
{
  name: 'validate',
  action: async (options) => {
    try {
      await validateSomething(options);
    } catch (error) {
      // User-friendly error message
      console.error(`Validation failed: ${error.message}`);
      
      // Exit with error code
      process.exit(1);
    }
  }
}
```

### Using AIKnowSys Utilities

```javascript
// aiknowsys-plugin-example/index.js
import { logger } from 'aiknowsys/lib/logger.js';
import { parseEssentials } from 'aiknowsys/lib/parse-essentials.js';

export default {
  name: 'example',
  commands: [
    {
      name: 'analyze',
      action: async (options) => {
        // Use AIKnowSys logger
        logger.info('Analyzing project...');
        
        // Parse ESSENTIALS file
        const essentials = await parseEssentials('./CODEBASE_ESSENTIALS.md');
        logger.success(`Found ${essentials.sections.length} sections`);
      }
    }
  ]
};
```

---

## Testing Plugins

### Unit Tests

```javascript
// aiknowsys-plugin-myplugin/test/plugin.test.js
import { describe, test } from 'node:test';
import assert from 'node:assert';
import plugin from '../index.js';

describe('MyPlugin', () => {
  test('exports required properties', () => {
    assert.ok(plugin.name);
    assert.ok(Array.isArray(plugin.commands));
  });
  
  test('command has action function', () => {
    const cmd = plugin.commands[0];
    assert.strictEqual(typeof cmd.action, 'function');
  });
});
```

### Integration Tests

```javascript
// Test with Commander.js
import { Command } from 'commander';
import plugin from '../index.js';

const program = new Command();

// Register plugin command
const cmd = plugin.commands[0];
program
  .command(cmd.name)
  .action(cmd.action);

// Parse test arguments
program.parse(['node', 'test', cmd.name, '--flag', 'value']);
```

---

## Publishing

### 1. Prepare for Publishing

```bash
# Run tests
npm test

# Build if needed (e.g., TypeScript compilation)
npm run build

# Test installation locally
npm pack
npm install -g ./aiknowsys-plugin-myplugin-0.1.0.tgz
aiknowsys my-command
```

### 2. Publish to npm

```bash
# Login to npm
npm login

# Publish (public package)
npm publish --access public

# Publish (scoped package)
npm publish
```

### 3. Versioning

```bash
# Patch version (0.1.0 → 0.1.1)
npm version patch

# Minor version (0.1.1 → 0.2.0)
npm version minor

# Major version (0.2.0 → 1.0.0)
npm version major

# Publish new version
npm publish
```

---

## Best Practices

### DO:
- ✅ Use descriptive command names
- ✅ Provide helpful descriptions for options
- ✅ Handle errors gracefully with clear messages
- ✅ Use `peerDependencies` for aiknowsys
- ✅ Test thoroughly before publishing
- ✅ Document commands in README
- ✅ Follow semantic versioning

### DON'T:
- ❌ Override core aiknowsys commands
- ❌ Modify global state without cleanup
- ❌ Use synchronous I/O in action functions
- ❌ Crash without helpful error messages
- ❌ Require aiknowsys as regular dependency
- ❌ Use CommonJS (must be ES modules)

---

## Plugin Discovery

**How users find your plugin:**

1. **npm search:**
   ```bash
   npm search aiknowsys-plugin
   ```

2. **GitHub topic:**
   Add `aiknowsys-plugin` topic to repository

3. **AIKnowSys docs:**
   Submit PR to add to plugin directory

4. **Social media:**
   Tag `#aiknowsys` when announcing

---

## Example: Context7 Plugin

Reference implementation showing MCP integration:

```javascript
// aiknowsys-plugin-context7/index.js
import { MCPClient } from '@modelcontextprotocol/sdk';

export default {
  name: 'context7',
  version: '0.1.0',
  description: 'Context7 MCP integration for documentation queries',
  
  commands: [
    {
      name: 'query-docs',
      description: 'Query framework documentation',
      options: [
        { flags: '-l, --library <id>', description: 'Library ID' },
        { flags: '-q, --query <text>', description: 'Query text' }
      ],
      action: async (options) => {
        const client = new MCPClient();
        const result = await client.query(options.library, options.query);
        console.log(result);
      }
    },
    {
      name: 'validate-deliverables',
      description: 'Automated deliverable review',
      options: [
        { flags: '-t, --type <type>', description: 'Type: skills|stacks|docs|all' }
      ],
      action: async (options) => {
        // Validation logic
      }
    }
  ],
  
  async onLoad() {
    console.log('Context7 plugin loaded');
    // Check MCP server availability
  }
};
```

---

## Troubleshooting

### Plugin Not Detected

**Symptom:** `aiknowsys plugins` doesn't list your plugin

**Solutions:**
- Ensure package name starts with `aiknowsys-plugin-`
- Check it's in `package.json` dependencies (not just installed globally)
- Verify package is actually installed: `npm ls aiknowsys-plugin-yourplugin`

### Import Errors

**Symptom:** `SyntaxError: Cannot use import statement outside a module`

**Solution:** Add `"type": "module"` to plugin's `package.json`

### Command Not Showing in Help

**Symptom:** Plugin loads but command doesn't appear

**Solutions:**
- Check `name` property is present in command object
- Verify `commands` is an array in plugin object
- Check console for warning messages during plugin load

---

## Resources

- **Architecture Spec:** [docs/plugin-architecture.md](./plugin-architecture.md)
- **Example Plugin:** aiknowsys-plugin-context7 (coming soon)
- **Commander.js Docs:** https://github.com/tj/commander.js
- **Node.js ES Modules:** https://nodejs.org/api/esm.html

---

*Part of AIKnowSys v0.8.0+ - Optional plugin system for CLI extensibility*
