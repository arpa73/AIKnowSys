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

export interface Context7Availability {
  available: boolean;
  configPath: string | null;
  source: 'claude-desktop' | 'cursor' | 'unknown' | 'none';
}

export interface LibraryReference {
  name: string;
  version: string | null;
}

interface MCPConfig {
  mcpServers?: Record<string, unknown>;
  servers?: Record<string, unknown>;
}

/**
 * Check if Context7 MCP is likely configured
 * 
 * @returns Promise resolving to availability info
 */
export async function isContext7Available(): Promise<Context7Availability> {
  // Check common MCP configuration locations
  const configLocations: string[] = [
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
        const content: string = await fs.promises.readFile(configPath, 'utf-8');
        const config: MCPConfig = JSON.parse(content);
        
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
 * @param configPath - Path to config file
 * @returns Source identifier
 */
function detectSource(configPath: string): 'claude-desktop' | 'cursor' | 'unknown' {
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
 * @param content - Text to analyze
 * @returns Array of library references
 */
export function extractLibraryReferences(content: string): LibraryReference[] {
  const references: LibraryReference[] = [];
  const seen: Set<string> = new Set();

  // Common framework/library patterns
  const patterns: RegExp[] = [
    // Framework names with optional version
    /\b(Next\.js|React|Vue|Angular|Svelte|Nuxt|SvelteKit|Remix)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Express|Fastify|Koa|Hapi)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Supabase|Firebase|MongoDB|PostgreSQL|MySQL)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Vite|Webpack|Rollup|esbuild|Parcel)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Tailwind|Bootstrap|Material-UI|Chakra UI)\s*(?:v?(\d+(?:\.\d+)*))?/gi,
    /\b(Vitest|Jest|Mocha|Cypress|Playwright)\s*(?:v?(\d+(?:\.\d+)*))?/gi
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const name: string = match[1];
      const version: string | null = match[2] || null;
      const key: string = `${name.toLowerCase()}-${version}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        references.push({ name, version });
      }
    }
  }

  // Import statements (package names)
  const importPattern: RegExp = /(?:import|from|require)\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(content)) !== null) {
    const packageName: string = match[1];
    // Only include if it looks like a package name (not relative path)
    if (!packageName.startsWith('.') && !packageName.startsWith('/')) {
      // Extract root package name (e.g., 'react' from 'react/jsx-runtime')
      const rootPackage: string = packageName.split('/')[0];
      const key: string = `${rootPackage.toLowerCase()}-null`;
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
 * @param libraryId - Context7 library ID (e.g., '/vercel/next.js')
 * @param topic - Specific topic to query
 * @returns Suggested query text for AI
 */
export function buildContext7Query(libraryId: string, topic: string): string {
  return `Query Context7 for ${libraryId}: ${topic}`;
}

/**
 * Suggest Context7 library ID from library name
 * 
 * Maps common library names to their Context7 IDs
 * 
 * @param libraryName - Library name to look up
 * @returns Context7 library ID or null if unknown
 */
export function suggestLibraryId(libraryName: string): string | null {
  const mapping: Record<string, string> = {
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
 * @param skillContent - Skill markdown content
 * @returns True if external library references detected
 */
export function hasExternalLibraryReferences(skillContent: string): boolean {
  const refs: LibraryReference[] = extractLibraryReferences(skillContent);
  return refs.length > 0;
}

/**
 * Generate Context7 validation reminder for AI
 * 
 * @param skillPath - Path to skill file
 * @param libraries - Array of library references
 * @returns Reminder message
 */
export function generateValidationReminder(skillPath: string, libraries: LibraryReference[]): string {
  const libList: string = libraries.map(lib => 
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
