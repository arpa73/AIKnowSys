import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const projectRoot: string = process.env.PROJECT_ROOT || path.join(__dirname, '..');

describe('export command group', () => {
  it('should expose export group with session and plan subcommands', () => {
    const output: string = execSync('node bin/cli.js export --help', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    expect(output).toContain('Usage:');
    expect(output).toContain('export [options] [command]');
    expect(output).toContain('session');
    expect(output).toContain('plan');
  }, 10000);

  it('should expose format option for export session subcommand', () => {
    const output: string = execSync('node bin/cli.js export session --help', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    expect(output).toContain('--format <type>');
    expect(output).toContain('narrative|timeline|grouped|custom');
  }, 10000);

  it('should expose format option for export plan subcommand', () => {
    const output: string = execSync('node bin/cli.js export plan --help', {
      cwd: projectRoot,
      encoding: 'utf-8'
    });

    expect(output).toContain('--format <type>');
    expect(output).toContain('narrative|timeline|grouped|custom');
  }, 10000);
});
