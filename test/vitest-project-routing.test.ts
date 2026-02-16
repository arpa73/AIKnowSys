import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vitestConfig from '../vitest.config';

type VitestProject = {
  test?: {
    name?: string;
    include?: string[];
    exclude?: string[];
  };
};

const projectRoot = path.join(import.meta.dirname, '..');
const testRoot = path.join(projectRoot, 'test');

function walkTestFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && /\.test\.(ts|js)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function getDistImportingTests(): string[] {
  const files = walkTestFiles(testRoot);
  const distTests: string[] = [];

  for (const filePath of files) {
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
    if (relativePath === 'test/vitest-project-routing.test.ts') {
      continue;
    }

    const content = readFileSync(filePath, 'utf-8');
    if (content.includes('../../dist/lib/')) {
      distTests.push(relativePath);
    }
  }

  return distTests.sort();
}

function getProjectByName(name: string): VitestProject {
  const projects = (vitestConfig.test?.projects || []) as VitestProject[];
  const project = projects.find((p) => p.test?.name === name);
  if (!project) {
    throw new Error(`Vitest project not found: ${name}`);
  }
  return project;
}

describe('vitest project routing guard', () => {
  it('routes all dist-importing tests to post-build-tests', () => {
    const distImportingTests = getDistImportingTests();
    const postBuildProject = getProjectByName('post-build-tests');
    const postBuildInclude = new Set(postBuildProject.test?.include || []);

    const missingFromPostBuild = distImportingTests.filter((file) => !postBuildInclude.has(file));

    expect(missingFromPostBuild).toEqual([]);
  });

  it('excludes all dist-importing tests from source-tests', () => {
    const distImportingTests = getDistImportingTests();
    const sourceProject = getProjectByName('source-tests');
    const sourceExclude = new Set(sourceProject.test?.exclude || []);

    const missingFromSourceExcludes = distImportingTests.filter((file) => !sourceExclude.has(file));

    expect(missingFromSourceExcludes).toEqual([]);
  });

  it('keeps post-build-tests list aligned with actual dist imports', () => {
    const distImportingTests = new Set(getDistImportingTests());
    const postBuildProject = getProjectByName('post-build-tests');
    const postBuildInclude = (postBuildProject.test?.include || []).filter((entry) => entry.startsWith('test/'));

    const stalePostBuildEntries = postBuildInclude.filter((file) => !distImportingTests.has(file));

    expect(stalePostBuildEntries).toEqual([]);
  });
});
