import { dirname, resolve, sep } from 'path';
import { fileURLToPath } from 'url';

let cachedRoot: string | null = null;

function inferProjectRootFromModulePath(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const srcSegment = `${sep}src${sep}tools${sep}utils`;
  const distSegment = `${sep}dist${sep}tools${sep}utils`;

  if (moduleDir.includes(srcSegment)) {
    return resolve(moduleDir, '../../../../');
  }

  if (moduleDir.includes(distSegment)) {
    return resolve(moduleDir, '../../../');
  }

  return process.cwd();
}

/**
 * Resolve project root without filesystem probing.
 *
 * Priority:
 * 1) AIKNOWSYS_PROJECT_ROOT env var
 * 2) Infer repository root from module location
 * 3) process.cwd()
 *
 * Results are cached for performance.
 */
export function getProjectRoot(): string {
  if (cachedRoot) {
    return cachedRoot;
  }

  const configuredRoot = process.env.AIKNOWSYS_PROJECT_ROOT?.trim();
  const root =
    configuredRoot && configuredRoot.length > 0
      ? configuredRoot
      : inferProjectRootFromModulePath();
  cachedRoot = resolve(root);
  return cachedRoot;
}
