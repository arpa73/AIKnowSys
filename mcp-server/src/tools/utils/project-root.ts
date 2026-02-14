import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

let cachedRoot: string | null = null;

/**
 * Find project root by searching for .aiknowsys/ directory
 * 
 * This works in both development (src/) and production (dist/) environments.
 * Results are cached for performance (avoids repeated filesystem operations).
 * 
 * @returns Absolute path to project root
 * @throws Error if .aiknowsys/ directory not found within 10 parent levels
 */
export function getProjectRoot(): string {
  if (cachedRoot) {
    return cachedRoot;
  }
  
  // Start from this file's location
  let current = dirname(fileURLToPath(import.meta.url));
  
  // Try up to 10 levels (should be more than enough)
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(current, '.aiknowsys'))) {
      cachedRoot = current;
      return current;
    }
    const parent = resolve(current, '..');
    if (parent === current) {
      // Reached filesystem root
      break;
    }
    current = parent;
  }
  
  throw new Error(
    'Could not locate project root (.aiknowsys/ not found). ' +
    'Are you running from outside an AIKnowSys project?'
  );
}
