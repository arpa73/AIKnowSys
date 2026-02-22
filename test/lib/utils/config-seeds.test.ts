import { describe, it, expect } from 'vitest';
import { getConfigSeeds } from '../../../lib/utils/config-seeds.js';
import type { TechStack } from '../../../lib/utils/stack-detector.js';

describe('getConfigSeeds', () => {
    it('returns appropriate seeds for Node.js + Vitest', () => {
        const stack: TechStack = {
            runtime: 'Node.js 20+',
            language: 'TypeScript',
            testFramework: 'Vitest',
            packageManager: 'npm',
            frameworks: []
        };

        const seeds = getConfigSeeds(stack);

        expect(seeds['validation_matrix']).toContain('npm test');
        expect(seeds['validation_matrix']).toContain('Run all 737+ tests');
        expect(seeds['critical_invariants']).toContain('ES Modules Only');
    });

    it('returns appropriate seeds for Python + pytest', () => {
        const stack: TechStack = {
            runtime: 'Python 3.x',
            language: 'Python',
            testFramework: 'pytest',
            packageManager: 'pip',
            frameworks: []
        };

        const seeds = getConfigSeeds(stack);

        expect(seeds['validation_matrix']).toContain('pytest');
        expect(seeds['validation_matrix']).toContain('ruff check .');
    });

    it('returns appropriate seeds for Rust', () => {
        const stack: TechStack = {
            runtime: 'Rust',
            language: 'Rust',
            testFramework: 'cargo test',
            packageManager: 'cargo',
            frameworks: []
        };

        const seeds = getConfigSeeds(stack);

        expect(seeds['validation_matrix']).toContain('cargo test');
        expect(seeds['validation_matrix']).toContain('cargo clippy');
        expect(seeds['critical_invariants']).toBeDefined();
    });

    it('returns appropriate seeds for Go', () => {
        const stack: TechStack = {
            runtime: 'Go',
            language: 'Go',
            testFramework: 'go test',
            packageManager: 'go',
            frameworks: []
        };

        const seeds = getConfigSeeds(stack);

        expect(seeds['validation_matrix']).toContain('go test ./...');
        expect(seeds['validation_matrix']).toContain('go vet ./...');
    });

    it('provides safe fallbacks for unknown stack', () => {
        const stack: TechStack = {
            runtime: 'unknown',
            language: 'unknown',
            testFramework: 'unknown',
            packageManager: 'unknown',
            frameworks: []
        };

        const seeds = getConfigSeeds(stack);

        expect(seeds['validation_matrix']).toContain('Manual Testing');
        expect(seeds['critical_invariants']).toContain('Follow project conventions');
    });
});
