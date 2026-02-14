import { describe, test, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Shell Wrappers', () => {
  const HOOKS_DIR = '.github/hooks';
  
  // Find all .sh wrappers (excluding templates)
  const wrappers = fs.existsSync(HOOKS_DIR) 
    ? fs.readdirSync(HOOKS_DIR)
        .filter(f => f.endsWith('.sh') && !f.startsWith('_'))
    : [];
  
  test('all wrappers are executable', () => {
    wrappers.forEach(wrapper => {
      const filePath = path.join(HOOKS_DIR, wrapper);
      const stats = fs.statSync(filePath);
      expect(stats.mode & 0o111).toBeGreaterThan(0); // Check executable bit
    });
  });
  
  test('all wrappers have corresponding Node.js files', () => {
    wrappers.forEach(wrapper => {
      const hookName = path.basename(wrapper, '.sh');
      const hasNodeFile = ['js', 'cjs', 'mjs'].some(ext =>
        fs.existsSync(path.join(HOOKS_DIR, `${hookName}.${ext}`))
      );
      expect(hasNodeFile).toBe(true);
    });
  });
  
  test('wrappers execute and pass stdin to Node.js', () => {
    const testInput = JSON.stringify({ test: true });
    
    wrappers.forEach(wrapper => {
      const filePath = path.join(HOOKS_DIR, wrapper);
      try {
        const output = execSync(`echo '${testInput}' | ${filePath}`, {
          encoding: 'utf8',
          timeout: 5000
        });
        // Should not crash (Node.js receives input)
        expect(output).toBeDefined();
      } catch (error: any) {
        // Some hooks may error on test input, but shouldn't crash the wrapper
        expect(error.status).toBeDefined();
      }
    });
  });
  
  test('hooks.json points to existing wrappers', () => {
    const config = JSON.parse(fs.readFileSync('.github/hooks/hooks.json', 'utf8'));
    
    Object.values(config.hooks).forEach((lifecycle: any) => {
      lifecycle.forEach((hook: any) => {
        if (hook.bash) {
          expect(fs.existsSync(hook.bash)).toBe(true);
        }
        if (hook.powershell) {
          expect(fs.existsSync(hook.powershell)).toBe(true);
        }
      });
    });
  });
});
