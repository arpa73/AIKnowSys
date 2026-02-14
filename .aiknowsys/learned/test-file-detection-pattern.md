---
type: project_specific
created: 2026-02-04
author: Developer Agent
shared_by: arno-paffen
shared_date: 2026-02-04
tags: [quality-check, testing, pattern-detection]
trigger_words: [test file detection, quality checker, pattern scanner, false positives]
---

# Test File Detection Pattern

## Problem

Quality checkers need to distinguish between production code and test code to avoid false positives. Test files often contain patterns that would be violations in production code (e.g., `require()` for mocking, hardcoded paths for fixtures).

## Solution Pattern

**Use explicit test file detection instead of complex string regex.**

```javascript
// GOOD: Explicit test file detection
const isTestFile = relativePath.startsWith('test/') || 
                   relativePath.includes('/test/') || 
                   relativePath.endsWith('.test.js');

if (!isTestFile && hasViolation) {
  violations.push({...});
}
```

```javascript
// AVOID: Complex regex that's hard to maintain
if (!/['"`].*violation.*['"`]/.test(line)) {
  violations.push({...});
}
```

## When to Use Each Approach

### Test File Detection ✅
**Use when:** Entire file type should be excluded
- Test files (test/, *.test.js, *.spec.js)
- Configuration files (*.config.js, *.rc.js)
- Build scripts (scripts/, build/)

**Benefits:**
- Self-documenting: `!isTestFile` is clear
- Maintainable: Easy to add new patterns
- Efficient: Check once per file, not per line

### String Detection ✅
**Use when:** Specific line contexts should be excluded
- Documentation (code examples in comments/strings)
- Error messages (code patterns in message text)
- Templates (placeholder code in strings)

**Benefits:**
- Granular: Line-by-line exclusion
- Precise: Avoids false positives from examples
- Necessary: Prevents self-reference issues

### Hybrid Approach ⭐
**Best practice:** Combine both for robust quality checking

```javascript
const hasRequire = /require\(/.test(line);
const isTestFile = relativePath.startsWith('test/') || 
                   relativePath.includes('/test/') || 
                   relativePath.endsWith('.test.js');
const isInString = /['"`].*require\(.*['"`]/.test(line);

// Only flag if NOT a test file AND NOT in a string
if (hasRequire && !isTestFile && !isInString) {
  violations.push({...});
}
```

## Real-World Example

**Context:** pattern-scanner.js flagged itself because error message contains `require()`

```javascript
// Line 69 in pattern-scanner.js:
message: 'Use import instead of require() in ES module project',
//                                ^^^^^^^^^ This triggered violation!
```

**Solution:** Hybrid approach
- Test file check: Excludes test/ directory
- String check: Excludes error messages like this

**Result:** 10 pattern violations (all intentional test cases), no self-reference

## Comparison

| Approach | Clarity | Maintainability | Granularity | Self-Reference |
|----------|---------|-----------------|-------------|----------------|
| Test File Detection | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | File-level | ❌ Not sufficient |
| String Detection | ⭐⭐⭐ | ⭐⭐⭐ | Line-level | ✅ Handles this |
| Hybrid (Both) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both levels | ✅ Robust |

## Key Learning

**"Is this a test?" > "Does this line have quotes?"**

Start with file-level detection (clearer, more maintainable). Add line-level detection only when self-reference or documentation examples create false positives.

YAGNI principle: Don't add string detection until you need it. We discovered the need when pattern-scanner.js flagged itself.

## Implementation Checklist

When building quality checkers:

- [ ] Identify what file types should be excluded
- [ ] Implement test file detection first
- [ ] Run checker and note false positives
- [ ] Add string detection only if needed for:
  - Self-reference (checker analyzing itself)
  - Documentation (code examples in comments)
  - Error messages (code patterns in strings)
- [ ] Combine both checks with `&&` logic

## Related Patterns

- **Path-aware template detection** (.aiknowsys/learned/path-aware-template-detection.md) - Uses `path.sep` for directory matching
- **Quality checker architecture** (.aiknowsys/learned/quality-checker-patterns.md) - Overall quality check design

---

*Discovered during quality-check improvements (Feb 2026). Architect review confirmed this is clearer than complex regex approaches.*
