/**
 * Critical Context Tools
 * 
 * These tools provide instant access to critical project knowledge
 * that AI agents need repeatedly. Token-efficient replacements for
 * reading CODEBASE_ESSENTIALS.md manually.
 */

import path from 'node:path';
import { withStorage } from './utils/storage-helpers.js';
import { rebuildIndex } from '../../../lib/commands/rebuild-index.js';
import { BASE_INVARIANTS } from '../../../lib/seeds/base.js';

function resolveProjectId(projectId?: string): string {
  if (projectId && projectId.trim().length > 0) {
    return projectId.trim();
  }
  return path.basename(path.resolve(process.cwd()));
}

function parseProjectConfigValue<T>(rawValue: string | null): T | null {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

function defaultValidationMatrix() {
  return {
    categories: [
      {
        name: 'Required on Every Change',
        commands: [
          {
            command: 'npm test',
            purpose: 'Run all 737+ tests',
            expected: 'All tests pass',
            scope: 'Any code change',
          },
          {
            command: 'npm run lint',
            purpose: 'Check code style',
            expected: 'No errors',
            scope: 'Any code change',
          },
        ],
      },
      {
        name: 'Template Changes',
        commands: [
          {
            command: 'npx aiknowsys validate-deliverables',
            purpose: 'Verify templates match non-template equivalents',
            expected: 'All checks pass',
            scope: 'ANY change to templates/ directory',
          },
          {
            command: 'npx aiknowsys validate-deliverables --templates',
            purpose: 'Verify no broken {{VARIABLE}} references',
            expected: 'No broken variable refs',
            scope: 'Template modifications',
          },
        ],
      },
      {
        name: 'Documentation Changes',
        commands: [
          {
            command: 'Verify links valid',
            purpose: 'Check all markdown links work',
            expected: 'No 404s',
            scope: 'README or docs/ updates',
          },
          {
            command: 'Verify examples accurate',
            purpose: 'Test code examples',
            expected: 'Examples run successfully',
            scope: 'Documentation with code samples',
          },
        ],
      },
      {
        name: 'Pre-Release',
        commands: [
          {
            command: 'npm pack --dry-run',
            purpose: 'Verify package contents',
            expected: 'All required files included',
            scope: 'Before publishing to npm',
          },
          {
            command: 'npm run test:coverage',
            purpose: 'Check test coverage metrics',
            expected: 'Coverage meets thresholds',
            scope: 'Before major releases',
          },
        ],
      },
    ],
    criticalRule:
      '🚨 RULE: Never claim work is complete without running validation!',
    technologySnapshot: {
      runtime: 'Node.js 20+',
      language: 'TypeScript (ES Modules)',
      testFramework: 'Vitest 4.x',
      coverage: '737+ tests',
    },
  };
}

export async function getCriticalInvariants(projectId?: string) {
  return withStorage(async (storage) => {
    const resolvedProjectId = resolveProjectId(projectId);
    const configValue = await storage.getProjectConfig(
      resolvedProjectId,
      'critical_invariants'
    );

    const configuredInvariants = parseProjectConfigValue<unknown[]>(configValue);
    const dbInvariants = await storage.queryInvariants();
    const invariants = Array.isArray(configuredInvariants)
      ? configuredInvariants
      : (dbInvariants.length > 0
        ? dbInvariants
        : BASE_INVARIANTS);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              count: invariants.length,
              warning:
                'These critical rules are MANDATORY. AI agents cannot skip or "think they know" these.',
              invariants,
            },
            null,
            2
          ),
        },
      ],
    };
  }, 'get_critical_invariants');
}

export async function getValidationMatrix(projectId?: string) {
  return withStorage(async (storage) => {
    const resolvedProjectId = resolveProjectId(projectId);
    const configValue = await storage.getProjectConfig(
      resolvedProjectId,
      'validation_matrix'
    );

    const configuredMatrix = parseProjectConfigValue<Record<string, unknown>>(configValue);
    const validationMatrix =
      configuredMatrix && typeof configuredMatrix === 'object'
        ? configuredMatrix
        : defaultValidationMatrix();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(validationMatrix, null, 2),
        },
      ],
    };
  }, 'get_validation_matrix');
}

export async function rebuildContextIndex() {
  try {
    await rebuildIndex({
      json: true,
      _silent: true,
    });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: 'Context index rebuilt successfully',
          }),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ error: true, message }, null, 2),
        },
      ],
    };
  }
}
