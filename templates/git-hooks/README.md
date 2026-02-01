# Git Hooks for TDD Enforcement & Code Quality

This directory contains Git hooks to help enforce Test-Driven Development practices and code quality standards.

## Available Hooks

### `pre-commit` - TDD Compliance & Linting Check

**What it does:**
1. **Runs ESLint** on all staged JavaScript files
2. **Checks TDD compliance** - if you're staging changes to `lib/` without corresponding `test/` changes
3. **Blocks commit** if linting fails or tests are missing

**Installation:**

```bash
# Make the hook executable
chmod +x .git-hooks/pre-commit

# Copy to your local .git/hooks/ directory
cp .git-hooks/pre-commit .git/hooks/pre-commit
```

**Or use the installer script (cross-platform):**

```bash
# From project root (works on Windows, macOS, Linux)
node scripts/install-git-hooks.cjs

# Or using npm
npm run install-hooks
```

## Workflow Integration

When you try to commit changes to `lib/` without test changes:

```bash
$ git add lib/commands/new-feature.js
$ git commit -m "Add new feature"

🔍 Running TDD compliance check...
📝 Detected staged changes in lib/:
   - lib/commands/new-feature.js

⚠️  WARNING: Staging lib/ changes without test/ changes

Critical Invariant #7: Test-Driven Development (TDD)
→ Tests should be written BEFORE implementation
→ Follow RED-GREEN-REFACTOR cycle

Did you follow TDD?
  🔴 RED: Write failing test first
  🟢 GREEN: Implement minimal code to pass
  🔵 REFACTOR: Clean up while keeping tests green

Continue with commit anyway? (y/N)
```

## Bypassing the Hook

If you need to bypass the hook (e.g., for WIP commits):

```bash
git commit --no-verify -m "WIP: work in progress"
```

**⚠️ Warning:** Only bypass for legitimate reasons. Document TDD violations in `CODEBASE_CHANGELOG.md`.

## Why Git Hooks?

- **Catches violations at commit time** - Before code review, before CI
- **Provides immediate feedback** - Right when you're about to commit
- **Educational** - Reminds you of TDD process every time
- **Customizable** - You can override when needed

## Maintenance

To update hooks after pulling changes:

```bash
# Re-install hooks to get latest version (cross-platform)
node scripts/install-git-hooks.cjs

# Or using npm
npm run install-hooks
```

To disable a hook temporarily:

```bash
# Rename the hook file
mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled
```

## See Also

- [AGENTS.md](../AGENTS.md) - TDD workflow in Step 3
- [.github/skills/feature-implementation/SKILL.md](../.github/skills/feature-implementation/SKILL.md) - TDD Phase 0
- [.github/workflows/tdd-compliance.yml](../.github/workflows/tdd-compliance.yml) - CI enforcement
