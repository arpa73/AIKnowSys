/**
 * Base seed data for AIKnowSys
 * Contains critical invariants and common patterns
 */

import { Invariant } from '../context/types.js';

/**
 * Seed data for project invariants
 */
export const BASE_INVARIANTS: Omit<Invariant, 'created_at' | 'updated_at'>[] = [
    {
        id: 'invariant-1',
        number: 1,
        name: 'ES Modules Only',
        rule: 'All internal files use import/export, never require()',
        details: [
            'package.json has "type": "module"',
            'Exception: Templates distributed to users may use .cjs for compatibility',
        ],
    },
    {
        id: 'invariant-2',
        number: 2,
        name: 'Absolute Paths Required',
        rule: 'Always use path.resolve() for user-provided paths',
        details: ['Use getPackageDir() for template paths'],
    },
    {
        id: 'invariant-3',
        number: 3,
        name: 'Graceful Failures',
        rule: 'All commands must handle missing files/directories',
        details: ['Show helpful error messages, not stack traces'],
    },
    {
        id: 'invariant-4',
        number: 4,
        name: 'Template Preservation',
        rule: 'AI agents never modify templates during normal workflow',
        details: [
            'Templates in templates/ are deliverables distributed to users',
            'User customization happens in generated files via AI-native onboarding workflow',
            'Exception: Deliberate template maintenance requires implementation plan, TDD, architect review, validation, migration guide',
            'See: .aiknowsys/learned/template-maintenance.md for workflow',
        ],
    },
    {
        id: 'invariant-5',
        number: 5,
        name: 'Template Structure Integrity',
        rule: 'When AI fills CODEBASE_ESSENTIALS.md, NEVER change section headings',
        details: [
            'Replace {{PLACEHOLDERS}} with real values, not generic placeholders',
            'Preserve template structure exactly (don\'t rename sections)',
        ],
    },
    {
        id: 'invariant-6',
        number: 6,
        name: 'Backwards Compatibility',
        rule: 'Bash scripts in scripts/ must remain functional',
        details: ['npm CLI is additive, not replacement'],
    },
    {
        id: 'invariant-7',
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
        id: 'invariant-8',
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

/**
 * Common patterns can also be seeded here
 */
export const BASE_PATTERNS = [
    {
        title: 'Absolute Path Resolution',
        pattern: 'How to handle user-provided paths consistently',
        solution: 'Use path.resolve() to convert relative paths to absolute immediately upon entry.',
        category: 'best_practice',
        keywords: ['paths', 'resolution', 'absolute'],
    }
];
