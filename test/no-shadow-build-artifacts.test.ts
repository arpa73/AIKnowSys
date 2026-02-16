import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const projectRoot = path.join(import.meta.dirname, '..');

function getTrackedFiles(): string[] {
  const gitIndexPath = path.join(projectRoot, '.git', 'index');
  if (!existsSync(gitIndexPath)) {
    throw new Error('Git index not found; run this test from a git working tree');
  }

  const output = execSync('git ls-files', { cwd: projectRoot, encoding: 'utf-8' });
  return output
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean);
}

function walkTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const tsFiles: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      tsFiles.push(...walkTsFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.ts')) {
      tsFiles.push(fullPath);
    }
  }

  return tsFiles;
}

describe('repository hygiene: no shadow build artifacts in lib/', () => {
  it('does not track generated JS/typing siblings for TypeScript files', () => {
    const tracked = new Set(getTrackedFiles());
    const tsFiles = [...tracked].filter((file) => file.startsWith('lib/') && file.endsWith('.ts'));

    const shadowArtifacts: string[] = [];

    for (const tsFile of tsFiles) {
      const base = tsFile.slice(0, -3);
      const generatedCandidates = [
        `${base}.js`,
        `${base}.js.map`,
        `${base}.d.ts`,
        `${base}.d.ts.map`
      ];

      for (const candidate of generatedCandidates) {
        if (tracked.has(candidate)) {
          shadowArtifacts.push(candidate);
        }
      }
    }

    expect(shadowArtifacts.sort()).toEqual([]);
  });

  it('does not contain generated JS/typing siblings on filesystem for TypeScript files', () => {
    const libDir = path.join(projectRoot, 'lib');
    const tsFiles = walkTsFiles(libDir);
    const shadowArtifacts: string[] = [];

    for (const tsFile of tsFiles) {
      const base = tsFile.slice(0, -3);
      const generatedCandidates = [
        `${base}.js`,
        `${base}.js.map`,
        `${base}.d.ts`,
        `${base}.d.ts.map`
      ];

      for (const candidate of generatedCandidates) {
        if (existsSync(candidate)) {
          shadowArtifacts.push(path.relative(projectRoot, candidate).replace(/\\/g, '/'));
        }
      }
    }

    expect(shadowArtifacts.sort()).toEqual([]);
  });
});
