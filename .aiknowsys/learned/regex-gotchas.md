# JavaScript Regex `/g` Flag State Issues

**Category:** Common Gotchas  
**Discovered:** Phase 2 Batch 3 (validate-deliverables extraction)  
**Impact:** High (causes intermittent bugs that are hard to debug)  
**Solution Complexity:** Easy (avoid pattern, use alternatives)

---

## The Problem

JavaScript regex patterns with the **global flag** (`/g`) maintain **stateful position tracking** between method calls. This causes `.test()` to return inconsistent results when called multiple times.

### Broken Code Example

```javascript
const pattern = /PENDING_REVIEW\.md/g;  // Note the /g flag

// First call - works as expected
pattern.test('Check PENDING_REVIEW.md file');  // ✅ true

// Second call on SAME regex - FAILS unexpectedly!
pattern.test('Check PENDING_REVIEW.md file');  // ❌ false (WAT?!)

// Third call - works again!
pattern.test('Check PENDING_REVIEW.md file');  // ✅ true

// Pattern: true, false, true, false... (alternating!)
```

**Why this happens:**
- The `/g` flag tells regex to track `lastIndex` property
- After a successful `.test()`, `lastIndex` moves to end of match
- Next `.test()` starts searching from `lastIndex`, not start of string
- If pattern not found after `lastIndex`, resets to 0 and returns false

---

## Real Bug Found in This Project

**Location:** `lib/core/validate-deliverables.ts` (before fix)

**Bug #1: autoFixPatterns()**
```typescript
// ❌ BROKEN (before fix)
for (const { find, replace } of AUTO_FIX_PATTERNS) {
  if (find.test(content)) {          // First .test() call
    content = content.replace(find, replace);  // Second use - might fail!
    fixed = true;
  }
}

// Where AUTO_FIX_PATTERNS was:
const AUTO_FIX_PATTERNS = [
  { find: /PENDING_REVIEW\.md/g, replace: 'reviews/PENDING_<username>.md' }
];
```

**Problem:** 
- `find.test(content)` advances `lastIndex`
- `content.replace(find, replace)` starts from that position
- Some matches missed, auto-fix only partially works

**Bug #2: detectLegacyPatterns()**
```typescript
// ❌ BROKEN (before fix)
if (AUTO_FIX_PATTERNS.some(fix => fix.find.test(line))) {
  fixable.push({ file: fullPath, line: index, content: line });
}
```

**Problem:**
- `.some()` may call `.test()` multiple times
- Each call advances `lastIndex`
- Fixability detection becomes unreliable

---

## The Solution

**Three safe alternatives:**

### Option 1: Use `.match()` for existence check
```typescript
// ✅ SAFE - .match() doesn't have state issues
const pattern = /PENDING_REVIEW\.md/g;
if (line.match(pattern)) {
  // Pattern exists in line
}
```

### Option 2: Compare `.replace()` result directly
```typescript
// ✅ SAFE - avoid .test() entirely
const newContent = content.replace(find, replace);
if (newContent !== content) {
  // Replacement occurred
  content = newContent;
  fixed = true;
}
```

### Option 3: Remove `/g` flag if only checking existence
```typescript
// ✅ SAFE - without /g, no state tracking
const pattern = /PENDING_REVIEW\.md/;  // No /g flag
if (pattern.test(content)) {
  // Works consistently
}
```

---

## Our Fix (Applied in Commit 1abbb2a)

**Before:**
```typescript
// Bug #1: autoFixPatterns
for (const { find, replace } of AUTO_FIX_PATTERNS) {
  if (find.test(content)) {  // ❌ Stateful
    content = content.replace(find, replace);
    fixed = true;
  }
}

// Bug #2: detectLegacyPatterns
if (AUTO_FIX_PATTERNS.some(fix => fix.find.test(line))) {  // ❌ Stateful
  fixable.push({ ... });
}
```

**After:**
```typescript
// Fix #1: autoFixPatterns - compare replace result
for (const { find, replace } of AUTO_FIX_PATTERNS) {
  const newContent = content.replace(find, replace);
  if (newContent !== content) {  // ✅ Stateless comparison
    content = newContent;
    fixed = true;
  }
}

// Fix #2: detectLegacyPatterns - use .match() instead
if (AUTO_FIX_PATTERNS.some(fix => line.match(fix.find))) {  // ✅ Stateless
  fixable.push({ ... });
}
```

---

## When You Need `/g` Flag

The `/g` flag is essential for:
- **Replacing ALL occurrences:** `content.replace(/pattern/g, 'replacement')`
- **Getting all matches:** `content.match(/pattern/g)` returns array of matches
- **Iterating with `.exec()`:** Manual iteration over all matches

**But avoid for:**
- Simple existence checks (use `.match()` or remove `/g`)
- Conditional logic (state makes it unpredictable)

---

## Testing for This Bug

**Write tests that call the same regex multiple times:**

```typescript
it('should handle regex consistently on repeated calls', () => {
  const content = 'Check PENDING_REVIEW.md twice';
  
  // If using stateful regex, this test will catch it
  const result1 = validatePattern(content);
  const result2 = validatePattern(content);  // Same input
  
  expect(result1).toBe(result2);  // Should be identical!
});
```

**Our tests caught this during TDD - tests failed before fix, passed after.**

---

## Key Takeaways

1. **Avoid `.test()` with `/g` flag** - use `.match()` instead
2. **For mutations, compare `.replace()` result** - no need for `.test()`
3. **Remove `/g` if only checking existence** - stateless is safer
4. **Test repeated calls** - catch state bugs early
5. **Document when found** - save future developers from same trap

---

## References

- **MDN:** [RegExp.prototype.test()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test)
- **MDN:** [RegExp.lastIndex](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex)
- **Our Fix:** Commit 1abbb2a (Phase 2 Batch 3 - validate-deliverables extraction)

---

**Lesson learned:** Regex state bugs are subtle, hard to debug, and TDD catches them. Write tests that call the same regex multiple times to expose state issues early.
