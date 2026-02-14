---
title: Threshold Parameter Edge Cases
trigger: threshold, parameter edge case, default value, zero threshold
pattern: threshold-edge-cases
type: error_resolution
discovered: 2026-02-04
context: archive-plans command threshold=0 bug fix
---

## Problem

When a threshold parameter defaults to a positive number (e.g., 7 days), using `0` as an explicit value can cause unexpected behavior if the logic assumes "threshold in the past".

**Real-world example:** `archive-plans --threshold=0` was failing to archive plans because:
- `thresholdDate = new Date()` (now)
- `thresholdDate.setDate(thresholdDate.getDate() - 0)` = now
- Files created "now" have `mtime >= now`
- Condition `stats.mtime < thresholdDate` = false ❌

## Solution

Always handle `threshold=0` as a special case meaning "immediate action":

```javascript
const DEFAULT_THRESHOLD = 7;

export async function someCommand(options) {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - threshold);
  
  // Check condition
  // Special case: threshold=0 should act immediately regardless of date comparison
  // (because thresholdDate would be "now", and newly created items have time >= now)
  if (threshold === 0 || item.date < thresholdDate) {
    // Take action
  }
}
```

## Why This Works

1. **User expectation:** `threshold=0` means "act immediately, don't wait"
2. **Math breaks:** Date calculations fail when threshold=0 (now - 0 days = now)
3. **Timing issues:** Items created/modified "now" have timestamps >= now, failing `< thresholdDate`
4. **Explicit is better:** Short-circuit evaluation makes intent clear

## Implementation Checklist

When adding threshold parameters:

- [ ] Use nullish coalescing (`??`) to allow explicit `0` value
  ```javascript
  const threshold = options.threshold ?? DEFAULT_VALUE;  // ✅ Correct
  // NOT: options.threshold || DEFAULT_VALUE  // ❌ Wrong - 0 becomes DEFAULT_VALUE
  ```

- [ ] Extract default to named constant for self-documentation
  ```javascript
  const DEFAULT_ARCHIVE_THRESHOLD_DAYS = 7;
  ```

- [ ] Add explicit threshold=0 check before date comparison
  ```javascript
  if (threshold === 0 || item.date < thresholdDate) {
  ```

- [ ] Document WHY the special case exists
  ```javascript
  // Special case: threshold=0 should act immediately regardless of date
  // (because thresholdDate would be "now", and new items have time >= now)
  ```

- [ ] Test both cases:
  - Test with threshold=0 + matching items (should act)
  - Test with threshold=0 + no matching items (should not act on wrong items)

## Related Commands

This pattern applies to any command with time-based thresholds:
- `archive-sessions --threshold=N` - Archive old sessions
- `archive-plans --threshold=N` - Archive old plans
- `clean --threshold=N` - Clean old files

## Anti-Pattern

**Don't do this:**
```javascript
// ❌ BAD - threshold=0 will fail
if (stats.mtime < thresholdDate) {
  archive(item);
}
```

**Do this instead:**
```javascript
// ✅ GOOD - threshold=0 works correctly
if (threshold === 0 || stats.mtime < thresholdDate) {
  archive(item);
}
```

## References

- [lib/commands/archive-plans.js](../../lib/commands/archive-plans.js#L90-L96) - Implementation
- [test/archive.test.js](../../test/archive.test.js#L434-L485) - Test coverage
- CI test failure that revealed this bug
