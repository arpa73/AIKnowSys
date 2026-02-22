import * as fs from 'fs';
import { join } from 'path';

export interface TechStack {
    runtime: string;        // 'Node.js 20+' | 'Python 3.x' | 'Rust' | 'Go' | 'unknown'
    language: string;       // 'TypeScript' | 'JavaScript' | 'Python' | 'Rust' | 'Go' | 'unknown'
    testFramework: string;  // 'Vitest' | 'Jest' | 'pytest' | 'cargo test' | 'go test' | 'unknown'
    packageManager: string; // 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo' | 'go' | 'unknown'
    frameworks: string[];
}

export async function detectTechStack(projectDir: string): Promise<TechStack> {
    const stack: TechStack = {
        runtime: 'unknown',
        language: 'unknown',
        testFramework: 'unknown',
        packageManager: 'unknown',
        frameworks: [],
    };

    const hasFile = (filename: string) => fs.existsSync(join(projectDir, filename));
    const readFile = (filename: string) => {
        try {
            return fs.readFileSync(join(projectDir, filename), 'utf8');
        } catch {
            return '';
        }
    };

    // 1. Rust Detection
    if (hasFile('Cargo.toml')) {
        stack.runtime = 'Rust';
        stack.language = 'Rust';
        stack.testFramework = 'cargo test';
        stack.packageManager = 'cargo';
        return stack;
    }

    // 2. Go Detection
    if (hasFile('go.mod')) {
        stack.runtime = 'Go';
        stack.language = 'Go';
        stack.testFramework = 'go test';
        stack.packageManager = 'go';
        return stack;
    }

    // 3. Python Detection
    if (hasFile('pyproject.toml') || hasFile('requirements.txt') || hasFile('setup.py')) {
        stack.runtime = 'Python 3.x';
        stack.language = 'Python';
        stack.testFramework = 'pytest'; // default reasonable assumption
        stack.packageManager = 'pip';
        return stack;
    }

    // 4. Node.js Detection
    if (hasFile('package.json')) {
        stack.runtime = 'Node.js 20+';

        // Package Manager
        if (hasFile('yarn.lock')) {
            stack.packageManager = 'yarn';
        } else if (hasFile('pnpm-lock.yaml')) {
            stack.packageManager = 'pnpm';
        } else {
            stack.packageManager = 'npm';
        }

        // Language
        if (hasFile('tsconfig.json')) {
            stack.language = 'TypeScript';
        } else {
            stack.language = 'JavaScript';
        }

        // Try to parse package.json for more details
        const pkgContent = readFile('package.json');
        try {
            if (pkgContent) {
                const pkg = JSON.parse(pkgContent);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };

                if (deps.vitest) {
                    stack.testFramework = 'Vitest';
                } else if (deps.jest) {
                    stack.testFramework = 'Jest';
                }

                if (deps.express) stack.frameworks.push('Express');
                if (deps.fastify) stack.frameworks.push('Fastify');
                if (deps.react || deps.next) stack.frameworks.push('React');
                if (deps.vue || deps.nuxt) stack.frameworks.push('Vue');
            }
        } catch (e) {
            // Ignore JSON parse errors
        }

        return stack;
    }

    return stack;
}
