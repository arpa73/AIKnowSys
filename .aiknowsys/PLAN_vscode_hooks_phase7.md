# Implementation Plan: VSCode Hooks Phase 7 (Performance & Dependencies)

**Status:** 📋 PLANNED  
**Created:** 2026-01-31  
**Goal:** Performance monitoring and dependency health tracking

---

## Overview

Track system performance over time and monitor dependency health for security and freshness.

**What we're building:**
1. **Performance monitoring** - Track test and build times
2. **Dependency health scanner** - Security advisories and outdated packages
3. **Performance regression detection** - Alert when things slow down
4. **Resource usage tracking** - Memory, CPU, disk usage

**Why it matters:**
- Catches performance regressions early
- Security vulnerability awareness
- Keeps dependencies fresh
- Prevents bloat accumulation

---

## Implementation Steps (12 Steps)

### Step 1: Performance tracking database
**File:** `.aiknowsys/performance-history.json`

Track over time:
```json
{
  "testRuns": [
    {
      "date": "2026-01-31T10:00:00Z",
      "duration": 25300,
      "tests": 328,
      "passed": 325,
      "failed": 0
    }
  ],
  "buildTimes": [],
  "slowestTests": []
}
```

---

### Step 2: Performance monitor hook
**File:** `templates/hooks/performance-monitor.cjs`

sessionEnd hook:
```javascript
// Record test performance
const testTime = extractTestDuration(data);
await recordPerformance({
  type: 'test',
  duration: testTime,
  timestamp: Date.now()
});

// Check for regressions
const avg = await getAveragePerformance('test', 7); // 7-day average
if (testTime > avg * 1.2) {
  console.error('[Hook] ⏱️  Performance Warning');
  console.error(`[Hook] Tests took ${testTime}ms (avg: ${avg}ms, +20%)`);
}
```

---

### Step 3: Dependency health command
**File:** `lib/commands/deps-health.js`

```bash
aiknowsys deps-health

# Output:
🔒 Dependency Health Report

Security:
  ⚠️  2 packages with advisories
      chalk@5.0.0 - Moderate severity
      ora@9.0.0 - Low severity
  
Freshness:
  ℹ️  5 packages outdated (minor)
  ℹ️  2 packages outdated (major)
  
Recommendations:
  - Run: npm audit fix
  - Update: npm update
```

---

### Steps 4-12: Weekly scans, regression alerts, resource tracking

---

## Success Criteria

- [ ] Performance tracked across sessions
- [ ] Regressions detected within 20% threshold
- [ ] Security advisories reported weekly
- [ ] 470+ tests passing
