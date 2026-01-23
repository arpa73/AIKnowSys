# aiknowsys - Codebase Essentials

> **Last Updated:** January 23, 2026  
> **Purpose:** AI-Powered Development Workflow Template  
> **Maintainer:** arpa73

---

## 1. Technology Snapshot

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | JavaScript (ES Modules) |
| CLI Framework | Commander.js 14.x |
| User Prompts | Inquirer.js 13.x |
| Terminal UI | Chalk 5.x, Ora 9.x |
| Package Manager | npm |
| Distribution | npm registry |

---

## 2. Validation Matrix

| Command | Purpose | Expected |
|---------|---------|----------|
| `node bin/cli.js --help` | CLI works | Shows help without errors |
| `node bin/cli.js scan --dir .` | Scan command | Generates draft ESSENTIALS |
| `npm pack --dry-run` | Package contents | Lists correct files |

---

## 3. Project Structure

```
aiknowsys/
├── bin/
│   └── cli.js              # CLI entry point
├── lib/
│   ├── commands/           # Command implementations
│   │   ├── init.js         # New project setup
│   │   ├── scan.js         # Codebase scanner
│   │   ├── migrate.js      # Migration workflow
│   │   ├── install-agents.js
│   │   └── install-skills.js
│   └── utils.js            # Shared utilities
├── templates/
│   ├── agents/             # Agent templates
│   └── skills/             # Skill templates
├── scripts/                # Bash alternatives (legacy)
├── examples/               # Stack-specific examples
├── docs/                   # Documentation
├── AGENTS.template.md      # Template for users
├── CODEBASE_ESSENTIALS.template.md
├── CODEBASE_CHANGELOG.template.md
└── package.json
```

---

## 4. Core Patterns

### CLI Command Structure
```javascript
// All commands follow this pattern:
export async function commandName(options) {
  const targetDir = path.resolve(options.dir);
  
  // 1. Display header
  console.log(chalk.cyan.bold('🎯 Command Title'));
  
  // 2. Interactive prompts (if needed)
  const answers = await inquirer.prompt([...]);
  
  // 3. Spinner for long operations
  const spinner = ora('Doing work...').start();
  
  // 4. Execute logic
  try {
    // ... work
    spinner.succeed('Done');
  } catch (error) {
    spinner.fail('Failed');
    process.exit(1);
  }
  
  // 5. Display next steps
  console.log(chalk.cyan('📖 Next steps:'));
}
```

### Template Variable Replacement
```javascript
// Use {{VARIABLE}} syntax in templates
copyTemplate(source, dest, {
  '{{PROJECT_NAME}}': answers.projectName,
  '{{DATE}}': new Date().toLocaleDateString(...)
});
```

### Silent Mode for Nested Calls
```javascript
// Commands accept _silent option for programmatic use
export async function installAgents(options) {
  const silent = options._silent || false;
  if (!silent) {
    console.log(...);
  }
}
```

---

## 5. Critical Invariants

1. **ES Modules Only**
   - All files use `import`/`export`, never `require()`
   - package.json has `"type": "module"`

2. **Absolute Paths Required**
   - Always use `path.resolve()` for user-provided paths
   - Use `getPackageDir()` for template paths

3. **Graceful Failures**
   - All commands must handle missing files/directories
   - Show helpful error messages, not stack traces

4. **Template Preservation**
   - Never modify files in `templates/` - they're the source of truth
   - User customization happens in generated files

5. **Backwards Compatibility**
   - Bash scripts in `scripts/` must remain functional
   - npm CLI is additive, not replacement

---

## 6. Common Gotchas

1. **ESM `__dirname` Not Available**
   - Use `fileURLToPath(import.meta.url)` instead
   - See `lib/utils.js` for `getPackageDir()`

2. **Chalk 5.x is ESM-only**
   - Cannot use `require('chalk')` - must import

3. **Template Variables in Markdown**
   - Double curly braces `{{VAR}}` can conflict with templating engines
   - Use regex escaping when replacing

4. **Path Separators**
   - Always use `path.join()`, never string concatenation
   - Works across Windows/Unix

---

## 7. Adding New Commands

1. Create `lib/commands/new-command.js`
2. Export async function with `options` parameter
3. Register in `bin/cli.js`:
   ```javascript
   import { newCommand } from '../lib/commands/new-command.js';
   
   program
     .command('new-command')
     .description('Description here')
     .option('-d, --dir <directory>', 'Target directory', '.')
     .action(newCommand);
   ```
4. Update README.md command table

---

## 8. Adding New Skills

1. Create `templates/skills/skill-name/SKILL.md`
2. Follow structure from existing skills
3. Add to `AVAILABLE_SKILLS` array in `lib/commands/install-skills.js`
4. Document in README

---

## 9. Release Checklist

- [ ] Update version in `package.json`
- [ ] Test all commands locally
- [ ] Run `npm pack --dry-run` to verify package contents
- [ ] Update CODEBASE_CHANGELOG.md
- [ ] `npm publish`

---

*This file is the single source of truth for AI assistants working on aiknowsys.*
