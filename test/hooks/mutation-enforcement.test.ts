/**
 * Tests for mutation-enforcement preToolUse hook
 * Phase 5.1: Enforcement Hooks
 */

import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

describe('mutation-enforcement hook (preToolUse)', () => {
  const hookPath = path.join(process.cwd(), '.github/hooks/mutation-enforcement.cjs');

  /**
   * Execute hook with JSON input
   */
  async function runHook(input: any): Promise<{stdout: string, stderr: string}> {
    const inputJson = JSON.stringify(input);
    try {
      const { stdout, stderr } = await execAsync(
        `echo '${inputJson}' | node "${hookPath}"`,
        { shell: '/bin/bash' }
      );
      return { stdout, stderr };
    } catch (error: any) {
      // Hook should never throw (always exits 0)
      return { stdout: error.stdout || '', stderr: error.stderr || '' };
    }
  }

  it('warns when replace_string_in_file targets session file', async () => {
    const input = {
      tool: 'replace_string_in_file',
      parameters: {
        filePath: '.aiknowsys/sessions/2026-02-08-session.md',
        oldString: 'old',
        newString: 'new'
      }
    };

    const { stderr } = await runHook(input);
    
    expect(stderr).toContain('❌ Direct file editing detected');
    expect(stderr).toContain('update-session');
    expect(stderr).toContain('YAML frontmatter validated before write');
  });

  it('warns when multi_replace_string_in_file targets session file', async () => {
    const input = {
      tool: 'multi_replace_string_in_file',
      parameters: {
        replacements: [
          { filePath: '.aiknowsys/sessions/2026-02-07-session.md' }
        ]
      }
    };

    const { stderr } = await runHook(input);
    
    expect(stderr).toContain('❌ Direct file editing detected');
    expect(stderr).toContain('update-session');
  });

  it('warns when create_file targets session file', async () => {
    const input = {
      tool: 'create_file',
      parameters: {
        filePath: '.aiknowsys/sessions/2026-02-08-session.md',
        content: '# New Session'
      }
    };

    const { stderr } = await runHook(input);
    
    expect(stderr).toContain('❌ Direct file editing detected');
    expect(stderr).toContain('MCP tools (preferred');
    expect(stderr).toContain('YAML frontmatter validated before write');
  });

  it('warns when create_file targets plan file', async () => {
    const input = {
      tool: 'create_file',
      parameters: {
        filePath: '.aiknowsys/PLAN_test.md',
        content: '# Test Plan'
      }
    };

    const { stderr } = await runHook(input);
    
    expect(stderr).toContain('❌ Direct file editing detected');
    expect(stderr).toContain('MCP tools (preferred');
    expect(stderr).toContain('update-plan');
  });

  it('warns when editing PLAN_*.md files', async () => {
    const input = {
      tool: 'replace_string_in_file',
      parameters: {
        filePath: '.aiknowsys/PLAN_feature_x.md'
      }
    };

    const { stderr } = await runHook(input);
    
    expect(stderr).toContain('❌ Direct file editing detected');
    expect(stderr).toContain('MCP tools (preferred');
    expect(stderr).toContain('update-plan');
  });

  it('warns when editing files in plans/ directory', async () => {
    const input = {
      tool: 'replace_string_in_file',
      parameters: {
        filePath: '.aiknowsys/plans/active-john-doe.md'
      }
    };

    const { stderr } = await runHook(input);
    
    expect(stderr).toContain('❌ Direct file editing detected');
  });

  it('allows editing non-session/plan files', async () => {
    const input = {
      tool: 'replace_string_in_file',
      parameters: {
        filePath: 'lib/commands/update-session.ts'
      }
    };

    const { stderr } = await runHook(input);
    
    expect(stderr).not.toContain('Direct file editing detected');
  });

  it('allows editing README and other docs', async () => {
    const input = {
      tool: 'replace_string_in_file',
      parameters: {
        filePath: 'README.md'
      }
    };

    const { stderr } = await runHook(input);
    
    expect(stderr).not.toContain('Direct file editing detected');
  });

  it('provides helpful examples in warning message', async () => {
    const input = {
      tool: 'replace_string_in_file',
      parameters: {
        filePath: '.aiknowsys/sessions/2026-02-08-session.md'
      }
    };

    const { stderr } = await runHook(input);
    
    // Should show multiple command examples
    expect(stderr).toContain('npx aiknowsys');
    expect(stderr).toContain('--append');
    expect(stderr).toContain('log');
  });

  it('mentions skill documentation in warning', async () => {
    const input = {
      tool: 'replace_string_in_file',
      parameters: {
        filePath: '.aiknowsys/sessions/test.md'
      }
    };

    const { stderr } = await runHook(input);
    
    expect(stderr).toContain('context-mutation');
    expect(stderr).toContain('SKILL.md');
  });

  it('exits with code 0 (non-blocking)', async () => {
    const input = {
      tool: 'replace_string_in_file',
      parameters: {
        filePath: '.aiknowsys/sessions/2026-02-08-session.md'
      }
    };

    // Should not throw even when warning
    await expect(runHook(input)).resolves.toBeDefined();
  });

  it('handles tools without parameters gracefully', async () => {
    const input = {
      tool: 'some_other_tool'
    };

    const { stderr } = await runHook(input);
    
    // Should not crash, just allow silently
    expect(stderr).not.toContain('Direct file editing detected');
  });
});
