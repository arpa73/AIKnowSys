# Tests

Unit tests for aiknowsys CLI commands.

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# UI mode (visual test interface)
npm run test:ui

# Coverage report
npm run test:coverage
```

## Test Structure

- `init.test.ts` - Tests for the `init` command
  - Creates files with --yes flag
  - Installs custom agents
  - Installs skills
  - Handles project naming
  - Validates CLI integration

## Writing New Tests

Tests use [Vitest](https://vitest.dev/), a fast TypeScript-native test framework with Jest-compatible API.

```typescript
import { describe, it, expect } from 'vitest';

describe('my feature', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Assertions

Vitest uses `expect()` assertions (Jest-compatible):

```typescript
// Equality
expect(value).toBe(2);              // Strict equality (===)
expect(value).toEqual(obj);         // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Arrays/Objects
expect(arr).toContain('item');
expect(obj).toHaveProperty('key', 'value');

// Errors
expect(() => fn()).toThrow();
expect(promise).rejects.toThrow(/error message/i);

// Regular expressions
expect(str).toMatch(/pattern/i);
```

### Mocking

Use `vi` for mocks and spies:

```typescript
import { vi } from 'vitest';
import * as fs from 'node:fs';

// Spy on function
const spy = vi.spyOn(fs, 'readFileSync');

// Mock module
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}));
```

## Test Cleanup

Tests automatically clean up temporary directories in the `test/tmp/` folder after execution.
