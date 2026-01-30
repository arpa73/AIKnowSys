---
name: validation-troubleshooting
description: Universal troubleshooting guide for validation failures (tests, linting, builds). Use when tests fail, validation commands error, or build breaks. Framework-agnostic debugging strategies for common development workflow issues.
---

# Validation Troubleshooting Skill

Step-by-step debugging guide for when validation commands fail.

## When to Use This Skill

Use when:
- Tests fail after making changes
- Validation commands from matrix error
- Build/compilation fails
- Linting errors appear
- Type checking fails
- User mentions: "tests failing", "validation error", "build broken", "lint error"

**Trigger words:** "test fail", "validation fail", "build error", "lint error", "type error", "won't compile"

---

## 1. Test Failures

### Step 1: Read the Error Message Carefully

**DON'T:**
- ❌ Immediately modify code
- ❌ Delete failing tests
- ❌ Disable test runner

**DO:**
- ✅ Read full error output
- ✅ Note exact line number and file
- ✅ Identify what was expected vs actual

### Step 2: Isolate the Failure

Run only the failing test:

```bash
# Node.js
npm test -- path/to/test.test.js

# Python
pytest path/to/test.py::test_name -v

# Jest
npm test -- --testNamePattern="test name"

# Vitest
npx vitest path/to/test.test.ts

# Go
go test -run TestName ./...

# Rust
cargo test test_name
```

### Step 3: Check Test Expectations

**Common issues:**
- Test expects old behavior (need to update test)
- Implementation is wrong (fix code)
- Test setup/mocking is incorrect
- Environment/config mismatch

**Questions to ask:**
1. Is the test expectation still valid?
2. Did I change behavior the test depends on?
3. Are mocks/fixtures up to date?
4. Does the test match CODEBASE_ESSENTIALS.md patterns?

### Step 4: Debug the Test

**Add logging:**
```javascript
// JavaScript/TypeScript
console.log('Actual value:', result);
console.log('Expected:', expected);

// Python
print(f"Actual: {result}, Expected: {expected}")

// Rust
println!("Actual: {:?}, Expected: {:?}", result, expected);
```

**Run in debug mode:**
```bash
# Node.js
node --inspect-brk node_modules/.bin/jest --runInBand

# Python
python -m pdb -m pytest path/to/test.py

# Rust
rust-gdb target/debug/test_binary
```

### Step 5: Fix and Validate

1. Fix the issue (code or test)
2. Run the single test again - should pass
3. Run full test suite - all should pass
4. Commit with clear message explaining the fix

**Never claim done without running full test suite!**

---

## 2. Linting Errors

### Step 1: Identify Error Type

**Syntax errors:**
```
Parsing error: Unexpected token
Missing semicolon
Unexpected identifier
```
→ **Fix:** Correct syntax immediately

**Style violations:**
```
'variable' is assigned but never used
Missing trailing comma
Prefer const over let
```
→ **Fix:** Address or justify

**Security issues:**
```
Detected eval usage
Unsafe regex
XSS vulnerability
```
→ **Fix:** MUST fix, don't disable

### Step 2: Auto-Fix When Possible

```bash
# ESLint
npm run lint:fix

# Prettier
npm run format

# Black (Python)
black .

# Rustfmt
cargo fmt

# Go
go fmt ./...
```

### Step 3: Manual Fixes

**Read CODEBASE_ESSENTIALS.md for style rules:**
- Check "Code Patterns" section
- Verify naming conventions
- Review import ordering

**DON'T disable rules without justification:**
```javascript
// ❌ BAD - Disabling without reason
// eslint-disable-next-line no-console
console.log(data);

// ✅ GOOD - Justified exception
// eslint-disable-next-line no-console -- Debugging production issue #123
console.log(data);
```

### Step 4: Update Rules If Wrong

If rule conflicts with project patterns:
1. Discuss with team/review ESSENTIALS
2. Update linting config
3. Document change in CODEBASE_CHANGELOG.md
4. Update CODEBASE_ESSENTIALS.md if pattern changed

---

## 3. Build/Compilation Errors

### Step 1: Check Error Category

**Dependency errors:**
```
Cannot find module 'package-name'
Module not found
Package not installed
```
→ **Fix:** Install dependencies

**Type errors:**
```
Type 'string' is not assignable to type 'number'
Property 'x' does not exist on type 'Y'
```
→ **Fix:** Correct types or update type definitions

**Configuration errors:**
```
Invalid configuration object
Missing environment variable
Unknown compiler option
```
→ **Fix:** Check config files

### Step 2: Clean Build

```bash
# JavaScript/TypeScript
rm -rf node_modules dist .cache
npm install
npm run build

# Python
rm -rf __pycache__ .pytest_cache dist
pip install -r requirements.txt

# Rust
cargo clean
cargo build

# Go
go clean -cache
go build
```

### Step 3: Check Environment

**Verify versions match CODEBASE_ESSENTIALS.md:**
```bash
# Check Node.js version
node --version

# Check Python version
python --version

# Check Rust version
rustc --version

# Check Go version
go version
```

**Check environment variables:**
```bash
# List all env vars
printenv

# Check specific required vars
echo $NODE_ENV
echo $DATABASE_URL
```

### Step 4: Incremental Debugging

1. Comment out recent changes
2. Build incrementally
3. Identify breaking change
4. Fix root cause
5. Uncomment and rebuild

---

## 4. Type Checking Errors

### Common TypeScript Issues

**Missing type definitions:**
```bash
npm install --save-dev @types/package-name
```

**Type mismatch:**
```typescript
// ❌ Wrong
const id: number = "123";

// ✅ Fix - convert type
const id: number = parseInt("123", 10);

// ✅ Or - fix type annotation
const id: string = "123";
```

**Null/undefined issues:**
```typescript
// ❌ Unsafe
const name = user.name;

// ✅ Safe - optional chaining
const name = user?.name;

// ✅ Safe - nullish coalescing
const name = user?.name ?? 'Unknown';
```

### Common Python Type Issues

**mypy errors:**
```bash
# Run mypy
mypy src/

# Ignore specific line (rarely)
result = something()  # type: ignore[attr-defined]
```

---

## 5. Validation Matrix Command Failures

### Strategy: Work Through Matrix Systematically

**From CODEBASE_ESSENTIALS.md validation matrix:**

```markdown
| Command | Purpose | Expected |
|---------|---------|----------|
| npm test | Run tests | All pass |
| npm run lint | Check style | No errors |
| npm run build | Compile | No errors |
```

**Run each command:**
1. If passes → ✅ Move to next
2. If fails → 🔴 Debug using sections above
3. Don't move forward until current command passes

### Example Debugging Session

```bash
# 1. Run tests
npm test
# ❌ FAIL - 2 tests failing

# 2. Isolate failure
npm test -- auth.test.js
# Read error, fix issue

# 3. Verify fix
npm test
# ✅ PASS - All tests green

# 4. Continue to next validation
npm run lint
# ✅ PASS - No issues

# 5. Final check
npm run build
# ✅ PASS - Build successful
```

**Rule: Fix failures in order, don't skip ahead!**

---

## 6. Common Patterns and Solutions

### Pattern: "Works on my machine"

**Cause:** Environment differences

**Solutions:**
1. Check Node.js/Python/Rust version matches team
2. Verify environment variables set correctly
3. Clear caches and reinstall dependencies
4. Check for OS-specific issues (Windows vs Unix paths)
5. Use Docker/containers for consistency

### Pattern: "Test passes locally, fails in CI"

**Cause:** CI environment differences

**Solutions:**
1. Check CI logs carefully
2. Verify CI environment variables
3. Check for timing issues (add proper waits)
4. Ensure deterministic test data
5. Check for missing CI dependencies

### Pattern: "Intermittent test failures"

**Cause:** Non-deterministic tests

**Solutions:**
1. Remove time-dependent logic
2. Fix race conditions
3. Mock random/date functions
4. Ensure proper cleanup between tests
5. Avoid shared state

### Pattern: "Everything broke after dependency update"

**Cause:** Breaking changes in dependency

**Solutions:**
1. Check dependency changelog
2. Revert to previous version temporarily
3. Read migration guide
4. Update code to new API
5. Consider alternative package

---

## Workflow Checklist

When validation fails:

- [ ] **Read error message** - Don't guess
- [ ] **Check CODEBASE_ESSENTIALS.md** - Verify patterns
- [ ] **Isolate the issue** - Run single test/command
- [ ] **Debug systematically** - Use tools, not trial-and-error
- [ ] **Fix root cause** - Not just symptoms
- [ ] **Verify fix** - Run full validation matrix
- [ ] **Document if needed** - Update docs if pattern unclear
- [ ] **Commit with context** - Explain what broke and why

---

## Never Do These

❌ **Delete tests to make them pass**
- Tests found a real issue
- Fix the code, not the test

❌ **Disable linting rules without justification**
- Rules exist for a reason
- Discuss with team first

❌ **Skip validation steps**
- "It probably works" is not good enough
- Run full matrix before claiming done

❌ **Commit broken code "to fix later"**
- Breaks team workflow
- Creates technical debt

❌ **Change multiple things at once**
- Can't identify root cause
- Fix one thing, validate, then next

---

## Quick Reference

### Emergency Triage

```bash
# 1. What broke?
git diff  # Review recent changes

# 2. When did it break?
git log --oneline -10  # Recent commits

# 3. Revert if needed
git revert HEAD  # Undo last commit safely

# 4. Isolate and fix
# Use sections above based on error type

# 5. Validate before moving on
npm test && npm run lint && npm run build
```

### Getting Unstuck

If stuck for >15 minutes:
1. Read error message again (slowly)
2. Check CODEBASE_ESSENTIALS.md for relevant pattern
3. Search project for similar code that works
4. Check dependency documentation
5. Ask for help (provide full error message)

---

*Framework-agnostic troubleshooting - adapt commands to your project's tech stack.*
