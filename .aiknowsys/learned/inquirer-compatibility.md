# Learned Skill: Inquirer VS Code Terminal Compatibility

**Pattern Type:** workarounds  
**Created:** January 29, 2026  
**Discovered During:** Sprint 1 Task 1.2 - FileTracker integration  
**Trigger Words:** "inquirer", "prompts", "rawlist", "list", "VS Code terminal", "arrow keys", "interactive prompts"

## When to Use

Use this pattern when:
- Creating interactive prompts with Inquirer.js
- Users might run commands in VS Code integrated terminal
- Need selection lists (not just text input)
- Want universal terminal compatibility

## Problem

VS Code integrated terminal doesn't support arrow key navigation in Inquirer's `'list'` prompt type. Users see broken prompts that don't respond to arrow keys.

## Solution

Use `'rawlist'` instead of `'list'` - it shows numbered options that users can type.

### ✅ CORRECT Pattern (Works Everywhere)

```javascript
import inquirer from 'inquirer';

const answers = await inquirer.prompt([{
  type: 'rawlist',      // Shows numbered list, user types number
  name: 'choice',
  message: 'Select option:',
  choices: [
    'Option 1',
    'Option 2',
    'Option 3'
  ],
  default: 1            // Use number for default (1 = first option)
}]);
```

**Output in terminal:**
```
? Select option:
  1) Option 1
  2) Option 2
  3) Option 3
  Answer: _
```

User types `1` or `2` or `3` to select.

### ❌ BROKEN Pattern (Fails in VS Code)

```javascript
// DON'T DO THIS - Broken in VS Code terminal!
const answers = await inquirer.prompt([{
  type: 'list',         // Requires arrow keys - doesn't work in VS Code
  name: 'choice',
  message: 'Select option:',
  choices: [
    'Option 1',
    'Option 2',
    'Option 3'
  ]
}]);
```

**What happens:**
- Works fine in iTerm, Terminal.app, WSL terminal
- **Breaks** in VS Code integrated terminal (arrow keys don't work)
- User sees prompt but can't navigate or select

## Prompt Types Compatibility

| Prompt Type | VS Code Compatible | Use Case |
|-------------|-------------------|----------|
| `'rawlist'` | ✅ YES | Single selection (numbered) |
| `'input'` | ✅ YES | Text input |
| `'confirm'` | ✅ YES | Yes/no questions |
| `'checkbox'` | ✅ YES | Multi-select (space key) |
| `'password'` | ✅ YES | Hidden input |
| `'list'` | ❌ NO | Single selection (arrow keys) |

## Complete Example

```javascript
import inquirer from 'inquirer';

export async function myCommand(options) {
  const silent = options._silent || false;
  
  // Skip prompts in silent mode (for tests/automation)
  if (silent) {
    // Use defaults or options
    return;
  }
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'my-project'
    },
    {
      type: 'rawlist',      // Use rawlist, not list!
      name: 'stack',
      message: 'Select stack:',
      choices: [
        'Node.js + Express',
        'Python + FastAPI',
        'TypeScript + Next.js'
      ],
      default: 1
    },
    {
      type: 'confirm',
      name: 'useGit',
      message: 'Initialize git repository?',
      default: true
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features:',
      choices: [
        { name: 'TDD Workflow', checked: true },
        { name: 'CI/CD', checked: false },
        { name: 'Docker', checked: false }
      ]
    }
  ]);
  
  // Use answers...
  console.log(answers);
}
```

## Key Principles

1. **Default to `'rawlist'` for selections:**
   - Works universally (VS Code, iTerm, WSL, etc.)
   - Clear UX (numbered options)
   - No hidden "press arrow keys" requirement

2. **Use number for defaults:**
   ```javascript
   {
     type: 'rawlist',
     default: 1    // ✅ First option (1-indexed)
   }
   ```

3. **Skip prompts in silent mode:**
   ```javascript
   if (silent) {
     // Tests and automation need predictable behavior
     return defaultValues;
   }
   ```

4. **Provide clear instructions:**
   ```javascript
   {
     type: 'rawlist',
     message: 'Select template (type number):',  // Clear!
     choices: [...]
   }
   ```

## Why This Limitation Exists

**VS Code's integrated terminal:**
- Uses PTY (pseudo-terminal) implementation
- Doesn't fully emulate all terminal escape sequences
- Arrow key navigation in `'list'` prompts relies on these sequences
- `'rawlist'` uses simple text input (works everywhere)

**Recommendation:** Always use `'rawlist'` unless you're 100% sure users won't use VS Code.

## Alternative: Detect Terminal Type

If you really need arrow key navigation, detect the terminal:

```javascript
const isVSCode = process.env.TERM_PROGRAM === 'vscode';

const answers = await inquirer.prompt([{
  type: isVSCode ? 'rawlist' : 'list',  // Adapt to terminal
  name: 'choice',
  message: 'Select option:',
  choices: [...]
}]);
```

**But:** This adds complexity. Better to just use `'rawlist'` everywhere.

## Related

- Core Pattern: [CLI Command Structure](../../CODEBASE_ESSENTIALS.md#cli-command-structure) - Where prompts fit
- Implementation: All commands with prompts ([init.js](../../lib/commands/init.js), [migrate.js](../../lib/commands/migrate.js), etc.)
- Inquirer docs: [https://github.com/SBoudrias/Inquirer.js](https://github.com/SBoudrias/Inquirer.js)

## Discovery Notes

**When discovered:** Sprint 1 Task 1.2 - Architect review caught `'list'` usage

**Why this matters:**
- Many developers use VS Code (huge user base)
- Broken prompts look unprofessional
- Silent failures are frustrating (prompt shows but doesn't work)

**Why this became a learned skill:**
- Library-specific workaround (not universal pattern)
- VS Code terminal limitation (not our code's fault)
- Helps keep ESSENTIALS.md focused on architecture, not quirks

**Impact:**
- Universal compatibility (works in all terminals)
- Professional UX (no broken prompts)
- Simpler than terminal detection logic
