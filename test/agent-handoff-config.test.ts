import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

type Frontmatter = {
  handoffs?: Array<{
    label?: string;
    agent?: string;
    prompt?: string;
    send?: boolean;
  }>;
};

function extractYamlBlock(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    throw new Error(`No frontmatter found in ${filePath}`);
  }

  return frontmatterMatch[1];
}

function parseFrontmatter(filePath: string): Frontmatter {
  const yamlBlock = extractYamlBlock(filePath);

  return YAML.parse(yamlBlock) as Frontmatter;
}

function parseTemplateFrontmatter(filePath: string): Frontmatter {
  const yamlBlock = extractYamlBlock(filePath);

  const normalized = yamlBlock
    .replace(/\{\{#if[\s\S]*?\{\{\/if\}\}/g, '')
    .replace(/\{\{[^}]+\}\}/g, 'PLACEHOLDER');

  return YAML.parse(normalized) as Frontmatter;
}

function assertDeveloperHandoffPrompt(frontmatter: Frontmatter): void {
  const architectHandoff = frontmatter.handoffs?.find((handoff) => handoff.agent === 'SeniorArchitect');

  expect(architectHandoff).toBeDefined();
  expect(architectHandoff?.prompt).toBeDefined();
  expect(architectHandoff?.prompt).toContain('plan compliance');
  expect(architectHandoff?.prompt).toContain('success criteria');
}

describe('developer agent handoff config', () => {
  it('parses live developer agent frontmatter and keeps plan-compliance prompt', () => {
    const filePath = path.join(import.meta.dirname, '..', '.github', 'agents', 'developer.agent.md');
    const frontmatter = parseFrontmatter(filePath);

    assertDeveloperHandoffPrompt(frontmatter);
  });

  it('parses template developer agent frontmatter and keeps plan-compliance prompt', () => {
    const filePath = path.join(
      import.meta.dirname,
      '..',
      'templates',
      'agents',
      'developer.agent.template.md',
    );
    const frontmatter = parseTemplateFrontmatter(filePath);

    assertDeveloperHandoffPrompt(frontmatter);
  });
});
