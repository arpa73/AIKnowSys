/**
 * Constants and configuration for the init command
 */

/**
 * Template file paths - centralized for easy maintenance
 */
export const TEMPLATE_PATHS = {
  ESSENTIALS_FULL: 'templates/CODEBASE_ESSENTIALS.template.md',
  ESSENTIALS_MINIMAL: 'templates/CODEBASE_ESSENTIALS.minimal.template.md',
  AGENTS: 'templates/AGENTS.template.md',
  CHANGELOG: 'templates/CODEBASE_CHANGELOG.template.md',
  SETUP_GUIDE: 'SETUP_GUIDE.md',
  
  // Session persistence
  SESSIONS_README: 'templates/aiknowsys-structure/sessions/README.md',
  LEARNED_README: 'templates/aiknowsys-structure/learned/README.md',
  PERSONAL_README: 'templates/aiknowsys-structure/personal/README.md',
  PLAN_MANAGEMENT: 'templates/aiknowsys-structure/learned/plan-management.md',
  ESSENTIALS_COMPRESSION: 'templates/aiknowsys-structure/learned/essentials-compression.md',
  
  // TDD enforcement
  TDD_SKILL: 'templates/skills/tdd-workflow/SKILL.md',
  GIT_HOOK_PRE_COMMIT: 'templates/git-hooks/pre-commit',
  GIT_HOOK_README: 'templates/git-hooks/README.md',
  INSTALL_HOOKS_SCRIPT: 'templates/scripts/install-git-hooks.cjs',  // Node.js version for cross-platform support
  INSTALL_HOOKS_SCRIPT_LEGACY: 'templates/scripts/install-git-hooks.sh',  // Bash fallback
  TDD_WORKFLOW: 'templates/workflows/tdd-compliance.yml',
  
  // VSCode hooks
  VSCODE_HOOKS_JSON: 'templates/hooks/hooks.json',
  VSCODE_HOOKS_CONFIG: 'templates/hooks/config.json',
  VSCODE_SESSION_START: 'templates/hooks/session-start.js',
  VSCODE_SESSION_END: 'templates/hooks/session-end.js',
  VSCODE_VALIDATION_REMINDER: 'templates/hooks/validation-reminder.cjs',
  VSCODE_TDD_REMINDER: 'templates/hooks/tdd-reminder.cjs',
  VSCODE_SKILL_DETECTOR: 'templates/hooks/skill-detector.cjs',
  VSCODE_SKILL_PREREQ_CHECK: 'templates/hooks/skill-prereq-check.cjs',
  VSCODE_WORKSPACE_HEALTH: 'templates/hooks/workspace-health.cjs',
  VSCODE_QUALITY_HEALTH: 'templates/hooks/quality-health.cjs'
};

export const AVAILABLE_STACKS = {
  nextjs: {
    name: 'nextjs',
    display: 'Next.js 15 (App Router + TypeScript + Tailwind + Prisma)',
    description: 'Full-stack React framework with Server Components'
  },
  'vue-express': {
    name: 'vue-express',
    display: 'Vue 3 + Express (Full-stack monorepo with shared types)',
    description: 'Frontend + Backend + Shared packages'
  },
  'vue-vite': {
    name: 'vue-vite',
    display: 'Vue 3 + Vite (TypeScript + Vue Router + Pinia)',
    description: 'Frontend SPA with modern tooling'
  },
  'express-api': {
    name: 'express-api',
    display: 'Express.js API (TypeScript + Prisma + PostgreSQL)',
    description: 'Backend REST API with Node.js'
  },
  fastapi: {
    name: 'fastapi',
    display: 'FastAPI (Python + SQLAlchemy + PostgreSQL)',
    description: 'Modern Python API framework with async support'
  },
  'nextjs-api': {
    name: 'nextjs-api',
    display: 'Next.js API (App Router + API routes + Server Actions)',
    description: 'Next.js as a backend API framework'
  }
};

/**
 * Map project type key to human-readable name
 */
export function getProjectTypeName(key) {
  const names = {
    'web-app': 'Web Application',
    'frontend': 'Frontend Application',
    'backend': 'Backend Service/API',
    'library': 'Library/Package',
    'cli': 'CLI Tool',
    'other': 'Other'
  };
  return names[key] || key;
}

/**
 * Map language key to human-readable name
 */
export function getLanguageName(key) {
  const names = {
    typescript: 'TypeScript',
    python: 'Python',
    rust: 'Rust',
    go: 'Go',
    java: 'Java',
    csharp: 'C#'
  };
  return names[key] || key;
}

/**
 * Map framework key to human-readable name
 */
export function getFrameworkName(key) {
  const names = {
    vue: 'Vue 3',
    react: 'React',
    svelte: 'Svelte',
    angular: 'Angular',
    nextjs: 'Next.js',
    solid: 'Solid.js',
    vanilla: 'Vanilla JS',
    django: 'Django',
    fastapi: 'FastAPI',
    flask: 'Flask',
    express: 'Express.js',
    fastify: 'Fastify',
    nestjs: 'NestJS',
    hono: 'Hono'
  };
  return names[key] || key || 'None specified';
}
