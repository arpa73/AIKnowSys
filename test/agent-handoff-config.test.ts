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

function readFileContent(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
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

  it('uses MCP-first context loading guidance in both live and template developer docs', () => {
    const livePath = path.join(import.meta.dirname, '..', '.github', 'agents', 'developer.agent.md');
    const templatePath = path.join(
      import.meta.dirname,
      '..',
      'templates',
      'agents',
      'developer.agent.template.md',
    );

    const liveContent = readFileContent(livePath);
    const templateContent = readFileContent(templatePath);

    expect(liveContent).toContain('mcp_aiknowsys_get_critical_invariants()');
    expect(liveContent).toContain('mcp_aiknowsys_get_active_plans()');
    expect(templateContent).toContain('mcp_aiknowsys_get_critical_invariants()');
    expect(templateContent).toContain('mcp_aiknowsys_get_active_plans()');
  });
});

describe('architect agent MCP-first guidance', () => {
  it('uses MCP-first context, plan lookup, and review persistence in live and template docs', () => {
    const livePath = path.join(import.meta.dirname, '..', '.github', 'agents', 'architect.agent.md');
    const templatePath = path.join(
      import.meta.dirname,
      '..',
      'templates',
      'agents',
      'architect.agent.template.md',
    );

    const liveContent = readFileContent(livePath);
    const templateContent = readFileContent(templatePath);

    expect(liveContent).toContain('mcp_aiknowsys_get_critical_invariants()');
    expect(liveContent).toContain('mcp_aiknowsys_get_active_plan_pointer');
    expect(liveContent).toContain('mcp_aiknowsys_query_plans');
    expect(liveContent).toContain('mcp_aiknowsys_create_review');
    expect(liveContent).toContain('mcp_aiknowsys_append_to_session');

    expect(templateContent).toContain('mcp_aiknowsys_get_critical_invariants()');
    expect(templateContent).toContain('mcp_aiknowsys_get_active_plan_pointer');
    expect(templateContent).toContain('mcp_aiknowsys_query_plans');
    expect(templateContent).toContain('mcp_aiknowsys_create_review');
    expect(templateContent).toContain('mcp_aiknowsys_append_to_session');
  });
});

describe('planner agent MCP-first guidance', () => {
  it('uses MCP-first planning and context guidance in live and template docs', () => {
    const livePath = path.join(import.meta.dirname, '..', '.github', 'agents', 'planner.agent.md');
    const templatePath = path.join(
      import.meta.dirname,
      '..',
      'templates',
      'agents',
      'planner.agent.template.md',
    );

    const liveContent = readFileContent(livePath);
    const templateContent = readFileContent(templatePath);

    expect(liveContent).toContain('mcp_aiknowsys_get_critical_invariants()');
    expect(liveContent).toContain('mcp_aiknowsys_get_active_plan_pointer');
    expect(liveContent).toContain('mcp_aiknowsys_query_plans');
    expect(liveContent).toContain('mcp_aiknowsys_create_plan');
    expect(liveContent).toContain('mcp_aiknowsys_append_to_plan');

    expect(templateContent).toContain('mcp_aiknowsys_get_critical_invariants()');
    expect(templateContent).toContain('mcp_aiknowsys_get_active_plan_pointer');
    expect(templateContent).toContain('mcp_aiknowsys_query_plans');
    expect(templateContent).toContain('mcp_aiknowsys_create_plan');
    expect(templateContent).toContain('mcp_aiknowsys_append_to_plan');
  });
});

describe('antigravity workflow MCP-first guidance', () => {
  it('uses MCP-first defaults in plan/develop/review workflows', () => {
    const planWorkflow = readFileContent(
      path.join(import.meta.dirname, '..', '.agents', 'workflows', 'plan-feature.md'),
    );
    const developWorkflow = readFileContent(
      path.join(import.meta.dirname, '..', '.agents', 'workflows', 'develop-feature.md'),
    );
    const reviewWorkflow = readFileContent(
      path.join(import.meta.dirname, '..', '.agents', 'workflows', 'architect-review.md'),
    );

    expect(planWorkflow).toContain('mcp_aiknowsys_get_critical_invariants');
    expect(planWorkflow).toContain('mcp_aiknowsys_get_active_plan_pointer');
    expect(planWorkflow).toContain('mcp_aiknowsys_create_plan');

    expect(developWorkflow).toContain('mcp_aiknowsys_get_critical_invariants');
    expect(developWorkflow).toContain('mcp_aiknowsys_query_plans');
    expect(developWorkflow).toContain('mcp_aiknowsys_append_to_session');

    expect(reviewWorkflow).toContain('mcp_aiknowsys_get_critical_invariants');
    expect(reviewWorkflow).toContain('mcp_aiknowsys_create_review');
    expect(reviewWorkflow).toContain('mcp_aiknowsys_set_plan_status');
  });
});

describe('agent usage and context-query MCP-first guidance', () => {
  it('uses MCP-first defaults in agent usage docs and context-query skill', () => {
    const usageLive = readFileContent(path.join(import.meta.dirname, '..', '.github', 'agents', 'USAGE.txt'));
    const usageTemplate = readFileContent(
      path.join(import.meta.dirname, '..', 'templates', 'agents', 'USAGE.txt'),
    );
    const contextQuerySkill = readFileContent(
      path.join(import.meta.dirname, '..', '.github', 'skills', 'context-query', 'SKILL.md'),
    );

    expect(usageLive).toContain('mcp_aiknowsys_get_critical_invariants()');
    expect(usageLive).toContain('mcp_aiknowsys_query_plans');
    expect(usageTemplate).toContain('mcp_aiknowsys_get_critical_invariants()');
    expect(usageTemplate).toContain('mcp_aiknowsys_query_plans');

    expect(contextQuerySkill).toContain('mcp_aiknowsys_query_plans');
    expect(contextQuerySkill).toContain('mcp_aiknowsys_query_sessions');
    expect(contextQuerySkill).toContain('CLI fallback');
  });
});

describe('context-mutation MCP-first guidance', () => {
  it('uses MCP mutation tools first and keeps CLI as explicit fallback', () => {
    const mutationSkillLive = readFileContent(
      path.join(import.meta.dirname, '..', '.github', 'skills', 'context-mutation', 'SKILL.md'),
    );
    const mutationSkillTemplate = readFileContent(
      path.join(import.meta.dirname, '..', 'templates', 'skills', 'context-mutation', 'SKILL.md'),
    );

    expect(mutationSkillLive).toContain('mcp_aiknowsys_create_session');
    expect(mutationSkillLive).toContain('mcp_aiknowsys_update_session_metadata');
    expect(mutationSkillLive).toContain('mcp_aiknowsys_create_plan');
    expect(mutationSkillLive).toContain('CLI fallback');

    expect(mutationSkillTemplate).toContain('mcp_aiknowsys_create_session');
    expect(mutationSkillTemplate).toContain('mcp_aiknowsys_update_session_metadata');
    expect(mutationSkillTemplate).toContain('mcp_aiknowsys_create_plan');
    expect(mutationSkillTemplate).toContain('CLI fallback');
  });
});

describe('pattern-sharing MCP-first guidance', () => {
  it('uses MCP pattern creation/discovery tools first and documents fallback path', () => {
    const patternSkillLive = readFileContent(
      path.join(import.meta.dirname, '..', '.github', 'skills', 'pattern-sharing', 'SKILL.md'),
    );
    const patternSkillTemplate = readFileContent(
      path.join(import.meta.dirname, '..', 'templates', 'skills', 'pattern-sharing', 'SKILL.md'),
    );

    expect(patternSkillLive).toContain('mcp_aiknowsys_create_learned_pattern');
    expect(patternSkillLive).toContain('mcp_aiknowsys_find_pattern');
    expect(patternSkillLive).toContain('CLI/file fallback');

    expect(patternSkillTemplate).toContain('mcp_aiknowsys_create_learned_pattern');
    expect(patternSkillTemplate).toContain('mcp_aiknowsys_find_pattern');
    expect(patternSkillTemplate).toContain('CLI/file fallback');
  });
});

describe('plan-cleanup MCP-first guidance', () => {
  it('uses MCP archival tools first and keeps bounded fallback guidance', () => {
    const cleanupLive = readFileContent(
      path.join(import.meta.dirname, '..', '.github', 'skills', 'plan-cleanup', 'SKILL.md'),
    );
    const cleanupTemplate = readFileContent(
      path.join(import.meta.dirname, '..', 'templates', 'skills', 'plan-cleanup', 'SKILL.md'),
    );

    expect(cleanupLive).toContain('mcp_aiknowsys_archive_plans');
    expect(cleanupLive).toContain('mcp_aiknowsys_archive_sessions');
    expect(cleanupLive).toContain('CLI/file fallback');

    expect(cleanupTemplate).toContain('mcp_aiknowsys_archive_plans');
    expect(cleanupTemplate).toContain('mcp_aiknowsys_archive_sessions');
    expect(cleanupTemplate).toContain('CLI/file fallback');
  });
});
