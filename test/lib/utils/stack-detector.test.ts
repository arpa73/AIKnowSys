import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectTechStack } from '../../../lib/utils/stack-detector.js';
import * as fs from 'fs';
import { join } from 'path';

vi.mock('fs', async () => {
    const actualFs = await vi.importActual<typeof import('fs')>('fs');
    return {
        ...actualFs,
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
    };
});

describe('detectTechStack', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockExists = (pathsFound: string[]) => {
        vi.mocked(fs.existsSync).mockImplementation((pathStr) => {
            const p = String(pathStr);
            return pathsFound.some(found => p.endsWith(found));
        });
    };

    const mockFileContent = (pathStr: string, content: string) => {
        vi.mocked(fs.readFileSync).mockImplementation((p, encoding) => {
            if (String(p).endsWith(pathStr)) {
                return content;
            }
            return '';
        });
    };

    it('detects Cargo.toml as Rust', async () => {
        mockExists(['Cargo.toml']);

        const stack = await detectTechStack('/fake/project');

        expect(stack.runtime).toBe('Rust');
        expect(stack.language).toBe('Rust');
        expect(stack.testFramework).toBe('cargo test');
        expect(stack.packageManager).toBe('cargo');
    });

    it('detects go.mod as Go', async () => {
        mockExists(['go.mod']);

        const stack = await detectTechStack('/fake/project');

        expect(stack.runtime).toBe('Go');
        expect(stack.language).toBe('Go');
        expect(stack.testFramework).toBe('go test');
        expect(stack.packageManager).toBe('go');
    });

    it('detects pyproject.toml as Python', async () => {
        mockExists(['pyproject.toml']);

        const stack = await detectTechStack('/fake/project');

        expect(stack.runtime).toBe('Python 3.x');
        expect(stack.language).toBe('Python');
        expect(stack.testFramework).toBe('pytest');
        expect(stack.packageManager).toBe('pip');
    });

    it('detects requirements.txt as Python', async () => {
        mockExists(['requirements.txt']);

        const stack = await detectTechStack('/fake/project');

        expect(stack.runtime).toBe('Python 3.x');
        expect(stack.language).toBe('Python');
        expect(stack.testFramework).toBe('pytest');
        expect(stack.packageManager).toBe('pip');
    });

    it('detects package.json with tsconfig.json as Node.js + TypeScript', async () => {
        mockExists(['package.json', 'tsconfig.json']);
        mockFileContent('package.json', JSON.stringify({
            devDependencies: {
                'vitest': '^1.0.0'
            }
        }));

        const stack = await detectTechStack('/fake/project');

        expect(stack.runtime).toBe('Node.js 20+');
        expect(stack.language).toBe('TypeScript');
        expect(stack.testFramework).toBe('Vitest');
        expect(stack.packageManager).toBe('npm');
    });

    it('detects package.json without tsconfig.json as Node.js + JavaScript', async () => {
        mockExists(['package.json']);
        mockFileContent('package.json', JSON.stringify({
            devDependencies: {
                'jest': '^29.0.0'
            }
        }));

        const stack = await detectTechStack('/fake/project');

        expect(stack.runtime).toBe('Node.js 20+');
        expect(stack.language).toBe('JavaScript');
        expect(stack.testFramework).toBe('Jest');
    });

    it('detects package manager via lockfiles for Node', async () => {
        mockExists(['package.json', 'yarn.lock']);
        mockFileContent('package.json', JSON.stringify({}));

        const stack = await detectTechStack('/fake/project');
        expect(stack.packageManager).toBe('yarn');
    });

    it('returns unknown when no indicators found', async () => {
        mockExists([]);

        const stack = await detectTechStack('/fake/project');

        expect(stack.runtime).toBe('unknown');
        expect(stack.language).toBe('unknown');
        expect(stack.testFramework).toBe('unknown');
        expect(stack.packageManager).toBe('unknown');
        expect(stack.frameworks).toEqual([]);
    });
});
