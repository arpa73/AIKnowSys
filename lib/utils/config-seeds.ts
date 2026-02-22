import type { TechStack } from './stack-detector.js';

export function getConfigSeeds(stack: TechStack): Record<string, string> {
    let validationMatrix = '';
    let criticalInvariants = '';

    if (stack.runtime.startsWith('Node')) {
        validationMatrix = `[
  {
    "name": "Required on Every Change",
    "commands": [
      {
        "command": "${stack.packageManager} test",
        "purpose": "Run all 737+ tests",
        "expected": "All tests pass",
        "scope": "Any code change"
      },
      {
        "command": "${stack.packageManager} run lint",
        "purpose": "Check code style",
        "expected": "No errors",
        "scope": "Any code change"
      }
    ]
  }
]`;
        criticalInvariants = `[
  {
    "id": "invariant-1",
    "number": 1,
    "name": "ES Modules Only",
    "rule": "All internal files use import/export, never require()"
  }
]`;
    } else if (stack.runtime.startsWith('Python')) {
        validationMatrix = `[
  {
    "name": "Required on Every Change",
    "commands": [
      {
        "command": "pytest",
        "purpose": "Run all tests",
        "expected": "All tests pass",
        "scope": "Any code change"
      },
      {
        "command": "ruff check .",
        "purpose": "Check code style",
        "expected": "No errors",
        "scope": "Any code change"
      }
    ]
  }
]`;
        criticalInvariants = `[
  {
    "id": "invariant-1",
    "number": 1,
    "name": "Follow PEP 8",
    "rule": "Adhere to standard Python styling guidelines"
  }
]`;
    } else if (stack.runtime === 'Rust') {
        validationMatrix = `[
  {
    "name": "Required on Every Change",
    "commands": [
      {
        "command": "cargo test",
        "purpose": "Run all tests",
        "expected": "All tests pass",
        "scope": "Any code change"
      },
      {
        "command": "cargo clippy",
        "purpose": "Check code style and linting",
        "expected": "No warnings or errors",
        "scope": "Any code change"
      }
    ]
  }
]`;
        criticalInvariants = `[
  {
    "id": "invariant-1",
    "number": 1,
    "name": "Memory Safety",
    "rule": "Avoid unsafe blocks unless absolutely necessary and documented"
  }
]`;
    } else if (stack.runtime === 'Go') {
        validationMatrix = `[
  {
    "name": "Required on Every Change",
    "commands": [
      {
        "command": "go test ./...",
        "purpose": "Run all tests",
        "expected": "All tests pass",
        "scope": "Any code change"
      },
      {
        "command": "go vet ./...",
        "purpose": "Check code for suspicious constructs",
        "expected": "No errors",
        "scope": "Any code change"
      }
    ]
  }
]`;
        criticalInvariants = `[
  {
    "id": "invariant-1",
    "number": 1,
    "name": "Idiomatic Go",
    "rule": "Follow gofmt and standard Go idioms"
  }
]`;
    } else {
        validationMatrix = `[
  {
    "name": "Required on Every Change",
    "commands": [
      {
        "command": "Manual Testing",
        "purpose": "Verify functionality",
        "expected": "Code behaves as expected",
        "scope": "Any code change"
      }
    ]
  }
]`;
        criticalInvariants = `[
  {
    "id": "invariant-1",
    "number": 1,
    "name": "Project Conventions",
    "rule": "Follow project conventions"
  }
]`;
    }

    return {
        validation_matrix: validationMatrix,
        critical_invariants: criticalInvariants
    };
}
