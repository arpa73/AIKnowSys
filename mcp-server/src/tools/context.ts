/**
 * Critical Context Tools
 * 
 * These tools provide instant access to critical project knowledge
 * that AI agents need repeatedly. Token-efficient replacements for
 * reading CODEBASE_ESSENTIALS.md manually.
 */

export async function getCriticalInvariants() {
  const invariants = [
    {
      number: 1,
      name: 'ES Modules Only',
      rule: 'All internal files use import/export, never require()',
      details: [
        'package.json has "type": "module"',
        'Exception: Templates distributed to users may use .cjs for compatibility',
      ],
    },
    {
      number: 2,
      name: 'Absolute Paths Required',
      rule: 'Always use path.resolve() for user-provided paths',
      details: ['Use getPackageDir() for template paths'],
    },
    {
      number: 3,
      name: 'Graceful Failures',
      rule: 'All commands must handle missing files/directories',
      details: ['Show helpful error messages, not stack traces'],
    },
    {
      number: 4,
      name: 'Template Preservation',
      rule: 'AI agents never modify templates during normal workflow',
      details: [
        'Templates in templates/ are deliverables distributed to users',
        'User customization happens in generated files (after aiknowsys init)',
        'Exception: Deliberate template maintenance requires implementation plan, TDD, architect review, validation, migration guide',
        'See: .aiknowsys/learned/template-maintenance.md for workflow',
      ],
    },
    {
      number: 5,
      name: 'Template Structure Integrity',
      rule: 'When AI fills CODEBASE_ESSENTIALS.md, NEVER change section headings',
      details: [
        'Replace {{PLACEHOLDERS}} with real values, not generic placeholders',
        'Preserve template structure exactly (don\'t rename sections)',
      ],
    },
    {
      number: 6,
      name: 'Backwards Compatibility',
      rule: 'Bash scripts in scripts/ must remain functional',
      details: ['npm CLI is additive, not replacement'],
    },
    {
      number: 7,
      name: 'Test-Driven Development (TDD) - MANDATORY',
      rule: 'For new features: Write tests BEFORE implementation (RED → GREEN → REFACTOR)',
      details: [
        'For bugfixes: Write test that reproduces bug FIRST, then fix, then refactor',
        'Follow RED-GREEN-REFACTOR cycle for both features and bugs',
        'Exception: Configuration-only changes (adding properties to const objects)',
        'Full workflow: .github/skills/tdd-workflow/SKILL.md',
      ],
    },
    {
      number: 8,
      name: 'Deliverables Consistency',
      rule: 'Templates (templates/ directory) are deliverables distributed to users',
      details: [
        'ANY change to core functionality MUST update corresponding templates',
        'Templates must match non-template equivalents',
        'Run npx aiknowsys validate-deliverables before commits/releases',
        'Pre-commit hook automatically validates when templates/ changed',
      ],
    },
  ];

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: 8,
            warning:
              'These 8 rules are MANDATORY. AI agents cannot skip or "think they know" these.',
            invariants,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function getValidationMatrix() {
  const validationMatrix = {
    categories: [
      {
        name: 'Required on Every Change',
        commands: [
          {
            command: 'npm test',
            purpose: 'Run all 737+ tests',
            expected: 'All tests pass',
            scope: 'Any code change',
          },
          {
            command: 'npm run lint',
            purpose: 'Check code style',
            expected: 'No errors',
            scope: 'Any code change',
          },
        ],
      },
      {
        name: 'Template Changes',
        commands: [
          {
            command: 'npx aiknowsys validate-deliverables',
            purpose: 'Verify templates match non-template equivalents',
            expected: 'All checks pass',
            scope: 'ANY change to templates/ directory',
          },
          {
            command: 'npx aiknowsys validate-deliverables --templates',
            purpose: 'Verify no broken {{VARIABLE}} references',
            expected: 'No broken variable refs',
            scope: 'Template modifications',
          },
        ],
      },
      {
        name: 'Documentation Changes',
        commands: [
          {
            command: 'Verify links valid',
            purpose: 'Check all markdown links work',
            expected: 'No 404s',
            scope: 'README or docs/ updates',
          },
          {
            command: 'Verify examples accurate',
            purpose: 'Test code examples',
            expected: 'Examples run successfully',
            scope: 'Documentation with code samples',
          },
        ],
      },
      {
        name: 'Pre-Release',
        commands: [
          {
            command: 'npm pack --dry-run',
            purpose: 'Verify package contents',
            expected: 'All required files included',
            scope: 'Before publishing to npm',
          },
          {
            command: 'npm run test:coverage',
            purpose: 'Check test coverage metrics',
            expected: 'Coverage meets thresholds',
            scope: 'Before major releases',
          },
        ],
      },
    ],
    criticalRule:
      '🚨 RULE: Never claim work is complete without running validation!',
    technologySnapshot: {
      runtime: 'Node.js 20+',
      language: 'TypeScript (ES Modules)',
      testFramework: 'Vitest 4.x',
      coverage: '737+ tests',
    },
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(validationMatrix, null, 2),
      },
    ],
  };
}
