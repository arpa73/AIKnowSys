# test-isolation-basepath

**Trigger Words:** test isolation, basePath, __dirname, process.chdir, temp directory, package.json

## Problem
Tests create temporary directories and use `process.chdir()` for isolation, but modules using `__dirname` still reference the original source location, causing tests to read real files instead of test fixtures.

**Example Scenario:**
- Test creates temp dir with mock `package.json`
- Test calls `process.chdir(tempDir)`
- Module reads `join(__dirname, 'package.json')` → still points to real project root
- Test fails because it sees installed plugins instead of mock data

## Solution
Add optional `basePath` parameter to functions that resolve paths. Tests pass their temp directory; production code passes `null` (default behavior).

**Implementation Pattern:**
```javascript
// Before (not test-friendly):
export async function loadPlugins(program) {
  const pkgPath = join(__dirname, '../../package.json');
  // ...
}

// After (test-friendly):
export async function loadPlugins(program, basePath = null) {
  const pkgPath = basePath
    ? join(basePath, 'package.json')
    : join(__dirname, '../../package.json');
  // ...
}

// Test usage:
const plugins = await loadPlugins(program, testDir);
```

**Why This Works:**
- Production code: `loadPlugins(program)` → uses `__dirname` (unchanged behavior)
- Tests: `loadPlugins(program, testDir)` → uses test directory
- Backward compatible: Optional parameter doesn't break existing code
- No mocking needed: Real function behavior, just configurable path

## Benefits
- ✅ True test isolation without mocking
- ✅ Backward compatible (optional parameter)
- ✅ No brittle filesystem mocks
- ✅ Easy to understand and maintain

## When to Use
- Functions that resolve paths relative to source code (`__dirname`, `import.meta.url`)
- Modules that read project files (package.json, config files)
- Any code where tests need to provide alternate search paths

## When NOT to Use
- Functions that already accept paths as arguments (already configurable)
- Code that only uses relative paths passed by caller (no hardcoded __dirname)
