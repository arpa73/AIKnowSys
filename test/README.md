# Tests

Unit tests for aiknowsys CLI commands.

## Running Tests

```bash
npm test
```

## Test Structure

- `init.test.js` - Tests for the `init` command
  - Creates files with --yes flag
  - Installs custom agents
  - Installs skills
  - Handles project naming
  - Validates CLI integration

## Writing New Tests

Tests use Node.js built-in test runner (available in Node 18+). No external test framework needed.

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('my feature', () => {
  it('should work', () => {
    assert.strictEqual(1 + 1, 2);
  });
});
```

## Test Cleanup

Tests automatically clean up temporary directories in the `test/tmp/` folder after execution.
