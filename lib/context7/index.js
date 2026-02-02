/**
 * Context7 MCP Integration Utilities
 * 
 * Provides detection and helper functions for Context7 integration.
 * Note: Actual Context7 queries happen through AI clients (Claude, Cursor),
 * not directly from this code. These utilities help detect availability
 * and guide AI assistants to use Context7 when appropriate.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Check if Context7 MCP is likely configured
 * 
 * @returns {Promise<{available: boolean, configPath: string|null, source: string}>}
 */
export async function isContext7Available() {
  // Check common MCP configuration locations
  const configLocations = [
    // Claude Desktop (macOS)
    path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    // Claude Desktop (Linux)
    path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json'),
    // Claude Desktop (Windows)
    path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
    // Cursor (macOS)
    path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'cursor-ai.cursor-mcp', 'config.json'),
    // Cursor (Linux)
    path.join(os.homedir(), '.config', 'Cursor', 'User', 'globalStorage', 'cursor-ai.cursor-mcp', 'config.json'),
    // Cursor (Windows)
    path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'cursor-ai.cursor-mcp', 'config.json')
  ];

  for (const configPath of configLocations) {
    try {
      if (fs.existsSync(configPath)) {
        const content = await fs.promises.readFile(configPath, 'utf-8');
        const config = JSON.parse(content);
        
        // Check if context7 is configured
        if (config.mcpServers?.context7 || config.servers?.context7) {
          return {
            available: true,
            configPath,
            source: detectSource(configPath)
          };
        }
      }
    } catch (_error) {
      // Ignore parse errors, try next location
      continue;
    }
  }

  return {
    available: false,
    configPath: null,
    source: 'none'
  };
}

/**
 * Detect which AI client is configured
 * @param {string} configPath
 * @returns {string} 'claude-desktop' | 'cursor' | 'unknown'
 */
function detectSource(configPath) {
  if (configPath.includes('Claude')) return 'claude-desktop';
  if (configPath.includes('Cursor')) return 'cursor';
  return 'unknown';
}

/**
 * Extract potential library references from text
 * 
 * Looks for common patterns:
 * - "Next.js", "React", "Vue" (framework names)
 * - "v14", "version 15" (version numbers)
 * - Import statements
 * 
 * @param {string} content - Text to analyze
 * @returns {Array<{name: string, version: string|null}>}
 */
export function extractLibraryReferences(content) {
  const references = [];
  const seen = new Set();

  // Common framework/library patterns
  const patterns = [
    // Framework names with optional version
    /\b(Next\.js|React|Vue|Angular|Svelte|Nuxt|SvelteKit|Remix)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Express|Fastify|Koa|Hapi)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Supabase|Firebase|MongoDB|PostgreSQL|MySQL)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Vite|Webpack|Rollup|esbuild|Parcel)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Tailwind|Bootstrap|Material-UI|Chakra UI)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Vitest|Jest|Mocha|Cypress|Playwright)\s*(?:v?(\d+(?:\.\d+)*))?/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1];
      const version = match[2] || null;
      const key = `${name.toLowerCase()}-${version}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        references.push({ name, version });
      }
    }
  }

  // Import statements (package names)
  const importPattern = /(?:import|from|require)\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const packageName = match[1];
    // Only include if it looks like a package name (not relative path)
    if (!packageName.startsWith('.') && !packageName.startsWith('/')) {
      // Extract root package name (e.g., 'react' from 'react/jsx-runtime')
      const rootPackage = packageName.split('/')[0];
      const key = `${rootPackage.toLowerCase()}-null`;
      if (!seen.has(key)) {
        seen.add(key);
        references.push({ name: rootPackage, version: null });
      }
    }
  }

  return references;
}

/**
 * Build a Context7 query suggestion for AI assistant
 * 
 * @param {string} libraryId - Context7 library ID (e.g., '/vercel/next.js')
 * @param {string} topic - Specific topic to query
 * @returns {string} Suggested query text for AI
 */
export function buildContext7Query(libraryId, topic) {
  return `Query Context7 for ${libraryId}: ${topic}`;
}

/**
 * Suggest Context7 library ID from library name
 * 
 * Maps common library names to their Context7 IDs
 * 
 * @param {string} libraryName
 * @returns {string|null} Context7 library ID or null if unknown
 */
export function suggestLibraryId(libraryName) {
  const mapping = {
    'next.js': '/vercel/next.js',
    'nextjs': '/vercel/next.js',
    'react': '/facebook/react',
    'vue': '/vuejs/core',
    'angular': '/angular/angular',
    'svelte': '/sveltejs/svelte',
    'nuxt': '/nuxt/nuxt',
    'sveltekit': '/sveltejs/kit',
    'remix': '/remix-run/remix',
    'express': '/expressjs/express',
    'fastify': '/fastify/fastify',
    'supabase': '/supabase/supabase',
    'mongodb': '/mongodb/docs',
    'vite': '/vitejs/vite',
    'vitest': '/vitest-dev/vitest',
    'tailwind': '/tailwindlabs/tailwindcss',
    'tailwindcss': '/tailwindlabs/tailwindcss'
  };

  return mapping[libraryName.toLowerCase()] || null;
}

/**
 * Check if skill content references external libraries
 * 
 * @param {string} skillContent - Skill markdown content
 * @returns {boolean} True if external library references detected
 */
export function hasExternalLibraryReferences(skillContent) {
  const refs = extractLibraryReferences(skillContent);
  return refs.length > 0;
}

/**
 * Generate Context7 validation reminder for AI
 * 
 * @param {string} skillPath - Path to skill file
 * @param {Array<{name: string, version: string|null}>} libraries
 * @returns {string} Reminder message
 */
export function generateValidationReminder(skillPath, libraries) {
  const libList = libraries.map(lib => 
    lib.version ? `${lib.name} v${lib.version}` : lib.name
  ).join(', ');
  
  return `
💡 Context7 Validation Suggestion

Skill: ${skillPath}
Libraries detected: ${libList}

Consider validating this skill with Context7 to ensure current APIs.
See: .github/skills/skill-validation/SKILL.md
`.trim();
}
