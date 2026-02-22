# TDD Workflow Skill

**Purpose:** Practice Test-Driven Development (TDD) - write tests before implementation to ensure quality and design.

**When to use:** When implementing new features, fixing bugs, or refactoring code. TDD reduces defects, improves design, and provides living documentation.

---

## What is TDD?

Test-Driven Development is a discipline where you:
1. **RED**: Write a failing test
2. **GREEN**: Write minimal code to make it pass
3. **REFACTOR**: Clean up code while keeping tests green

**Benefits:**
- ✅ Better code design (testable = decoupled)
- ✅ Fewer bugs (catch issues before implementation)
- ✅ Living documentation (tests show intent)
- ✅ Confident refactoring (tests catch regressions)
- ✅ No over-engineering (only write what's needed)

---

## The TDD Cycle (Red-Green-Refactor)

### 1. RED - Write a Failing Test

Write the smallest possible test that fails:

```javascript
// test/calculator.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { add } from '../src/calculator.js';

describe('Calculator', () => {
  it('should add two numbers', () => {
    assert.strictEqual(add(2, 3), 5);
  });
});
```

**Run the test** - it should FAIL (function doesn't exist yet)

```bash
npm test
# ❌ FAIL: Cannot find module '../src/calculator.js'
```

### 2. GREEN - Write Minimal Code

Write the **simplest** code to make the test pass:

```javascript
// src/calculator.js
export function add(a, b) {
  return a + b;
}
```

**Run the test** - it should PASS

```bash
npm test
# ✅ PASS: should add two numbers
```

### 3. REFACTOR - Improve Code

Clean up code while keeping tests green:

```javascript
// src/calculator.js
export function add(a, b) {
  // Validate inputs
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Both arguments must be numbers');
  }
  return a + b;
}
```

Add test for validation:

```javascript
it('should throw error for non-numeric input', () => {
  assert.throws(() => add('2', 3), TypeError);
});
```

**Run tests** - all should still PASS

---

## TDD for Different Scenarios

### Scenario 1: Adding a New Feature

**Goal:** Add a `multiply` function

**Step 1 - RED:** Write test first

```javascript
it('should multiply two numbers', () => {
  assert.strictEqual(multiply(4, 5), 20);
});
```

**Step 2 - GREEN:** Implement

```javascript
export function multiply(a, b) {
  return a * b;
}
```

**Step 3 - REFACTOR:** Add edge cases

```javascript
it('should handle zero multiplication', () => {
  assert.strictEqual(multiply(5, 0), 0);
});

it('should handle negative numbers', () => {
  assert.strictEqual(multiply(-3, 4), -12);
});
```

### Scenario 2: Fixing a Bug

**Bug Report:** "Calculator crashes with very large numbers"

**Step 1 - RED:** Write test that reproduces the bug

```javascript
it('should handle large numbers', () => {
  const large = Number.MAX_SAFE_INTEGER;
  assert.doesNotThrow(() => add(large, 1));
});
```

**Step 2 - GREEN:** Fix the bug

```javascript
export function add(a, b) {
  const result = a + b;
  if (!Number.isSafeInteger(result)) {
    throw new RangeError('Result exceeds safe integer range');
  }
  return result;
}
```

**Step 3 - REFACTOR:** Add more edge case tests

### Scenario 3: Refactoring Existing Code

**Goal:** Refactor complex function to be more readable

**Step 1:** Write tests for current behavior (characterization tests)

```javascript
// Capture current behavior before refactoring
describe('Complex function', () => {
  it('should return expected output for input A', () => {
    assert.strictEqual(complexFunction('A'), expectedResultA);
  });
  
  it('should return expected output for input B', () => {
    assert.strictEqual(complexFunction('B'), expectedResultB);
  });
});
```

**Step 2:** Refactor code

**Step 3:** Run tests - if they pass, refactoring preserved behavior

---

## TDD Best Practices

### 1. Write the Test You Wish You Had

Design your API through tests:

```javascript
// Good: Expressive, clear intent
it('should format user greeting with name and time', () => {
  const greeting = formatGreeting('Alice', 'morning');
  assert.strictEqual(greeting, 'Good morning, Alice!');
});
```

### 2. Test One Thing at a Time

```javascript
// ❌ BAD: Testing multiple behaviors
it('should handle all edge cases', () => {
  assert.strictEqual(divide(10, 2), 5);
  assert.throws(() => divide(10, 0));
  assert.strictEqual(divide(-10, 2), -5);
});

// ✅ GOOD: One test per behavior
it('should divide two positive numbers', () => {
  assert.strictEqual(divide(10, 2), 5);
});

it('should throw error when dividing by zero', () => {
  assert.throws(() => divide(10, 0), Error);
});

it('should handle negative divisor', () => {
  assert.strictEqual(divide(-10, 2), -5);
});
```

### 3. Use Descriptive Test Names

```javascript
// ❌ BAD: Vague
it('works', () => { ... });

// ✅ GOOD: Descriptive
it('should return empty array when no items match filter', () => { ... });
```

### 4. Follow the AAA Pattern

**Arrange-Act-Assert:**

```javascript
it('should calculate total price with tax', () => {
  // Arrange: Set up test data
  const price = 100;
  const taxRate = 0.1;
  
  // Act: Execute the function
  const total = calculateTotal(price, taxRate);
  
  // Assert: Verify the result
  assert.strictEqual(total, 110);
});
```

### 5. Keep Tests Fast

- Avoid I/O (file system, network, database) in unit tests
- Use mocks/stubs for external dependencies
- Run tests frequently (every few minutes)

### 6. Don't Test Implementation Details

```javascript
// ❌ BAD: Testing internal state
it('should set internal cache property', () => {
  const obj = new MyClass();
  obj.doSomething();
  assert.ok(obj._cache !== null); // Testing private details
});

// ✅ GOOD: Testing observable behavior
it('should return cached result on second call', () => {
  const obj = new MyClass();
  const first = obj.doSomething();
  const second = obj.doSomething();
  assert.strictEqual(first, second);
});
```

---

## TDD Workflow Checklist

Before starting any feature:

- [ ] **Write the test first** - What should the code do?
- [ ] **Run the test** - Verify it fails (RED)
- [ ] **Write minimal code** - Make it pass (GREEN)
- [ ] **Run the test** - Verify it passes
- [ ] **Refactor** - Improve code quality
- [ ] **Run tests** - Verify they still pass
- [ ] **Commit** - Save your progress

---

## Common TDD Pitfalls to Avoid

### 1. Writing Tests After Implementation

**Problem:** You lose the design benefits of TDD

**Solution:** Discipline! Write test first, then implement

### 2. Writing Too Much Code at Once

**Problem:** Hard to debug when test fails

**Solution:** Baby steps - smallest possible change

### 3. Not Running Tests Frequently

**Problem:** Lose feedback loop, harder to find issues

**Solution:** Run tests after every change (use watch mode)

### 4. Skipping the Refactor Step

**Problem:** Code becomes messy over time

**Solution:** Always clean up after tests pass

### 5. Testing Implementation Instead of Behavior

**Problem:** Tests break when refactoring

**Solution:** Test public API, not internal details

---

## TDD with aiknowsys

When using TDD in your aiknowsys project:

1. **Add test commands to Validation Matrix:**

```markdown
| Command | Purpose | Expected |
|---------|---------|----------|
| `npm test` | Run all tests | All pass |
| `npm run test:watch` | Watch mode | Continuous feedback |
| `npm run test:coverage` | Coverage report | >80% coverage |
```

2. **Update AGENTS.md workflow:**

```markdown
### Rules:
- **ALWAYS write tests before implementation** (TDD)
- Mark todo as in-progress
- Write failing test (RED)
- Implement minimal code (GREEN)
- Refactor while tests pass
- Mark todo as completed
```

3. **Document TDD in Testing Patterns section:**

```markdown
### Testing Approach: Test-Driven Development (TDD)

We practice TDD for all new features:
1. Write test first (captures intent)
2. Implement to pass test
3. Refactor for quality

Example test structure:
- `test/unit/` - Unit tests (fast, isolated)
- `test/integration/` - Integration tests (slower, realistic)
- `test/e2e/` - End-to-end tests (slowest, full stack)
```

---

## Example: TDD Session for Real Feature

**Feature:** Add CSV export to data processor

### Step 1: Write Test First (RED)

```javascript
// test/csv-exporter.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { exportToCSV } from '../src/csv-exporter.js';

describe('CSV Exporter', () => {
  it('should export array of objects to CSV string', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ];
    
    const csv = exportToCSV(data);
    
    assert.strictEqual(csv, 'name,age\nAlice,30\nBob,25');
  });
});
```

**Run:** `npm test` → ❌ FAIL (function doesn't exist)

### Step 2: Implement Minimal Code (GREEN)

```javascript
// src/csv-exporter.js
export function exportToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => Object.values(obj).join(','));
  
  return [headers.join(','), ...rows].join('\n');
}
```

**Run:** `npm test` → ✅ PASS

### Step 3: Add Edge Cases (More Tests)

```javascript
it('should handle empty array', () => {
  assert.strictEqual(exportToCSV([]), '');
});

it('should escape commas in values', () => {
  const data = [{ name: 'Smith, John', age: 30 }];
  const csv = exportToCSV(data);
  assert.strictEqual(csv, 'name,age\n"Smith, John",30');
});

it('should handle missing values', () => {
  const data = [
    { name: 'Alice', age: 30 },
    { name: 'Bob' } // age missing
  ];
  const csv = exportToCSV(data);
  assert.ok(csv.includes('Bob,'));
});
```

### Step 4: Refactor for Edge Cases

```javascript
export function exportToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  
  const escapeValue = (val) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    return str.includes(',') ? `"${str}"` : str;
  };
  
  const rows = data.map(obj => 
    headers.map(key => escapeValue(obj[key])).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}
```

**Run:** `npm test` → ✅ ALL PASS

---

## Quick Reference Card

```
TDD CYCLE:
┌─────────────────────────────────────┐
│ 1. RED    → Write failing test     │
│ 2. GREEN  → Minimal implementation  │
│ 3. REFACTOR → Clean up code         │
└─────────────────────────────────────┘

GOLDEN RULES:
• Test first, code second
• One test at a time
• Smallest possible change
• Run tests frequently
• Refactor when green

TEST STRUCTURE (AAA):
• Arrange  → Set up data
• Act      → Call function
• Assert   → Verify result
```

---

**Remember:** TDD is a discipline, not a burden. The time "lost" writing tests is gained back 10x in:
- Fewer bugs in production
- Faster debugging
- Confident refactoring
- Better API design
- Living documentation

**Start small:** Try TDD for one feature today. Once you experience the benefits, you'll never go back! 🚀
