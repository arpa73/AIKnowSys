/**
 * YAML frontmatter parsing and modification utilities
 * Phase B Mini - Context Query Completion
 */

/**
 * Parse YAML frontmatter from markdown file
 * @returns Frontmatter object and remaining content
 */
export function parseFrontmatter(fileContent: string): {
  frontmatter: Record<string, any>;
  content: string;
} {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    throw new Error('No YAML frontmatter found');
  }

  const [, yamlStr, content] = match;

  // Simple YAML parser (handles basic types only)
  const frontmatter = parseSimpleYaml(yamlStr);

  return { frontmatter, content };
}

/**
 * Update frontmatter and regenerate file content
 */
export function updateFrontmatter(
  fileContent: string,
  updates: Record<string, any>
): string {
  const { frontmatter, content } = parseFrontmatter(fileContent);

  // Merge updates
  const newFrontmatter = { ...frontmatter, ...updates };

  //Generate YAML string
  const yamlStr = stringifySimpleYaml(newFrontmatter);

  return `---\n${yamlStr}---\n${content}`;
}

/**
 * Simple YAML parser (supports: strings, arrays, booleans, numbers)
 * Limited to aiknowsys frontmatter needs (not full YAML spec)
 */
function parseSimpleYaml(yamlStr: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yamlStr.split('\n');

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Parse value type
    if (value.startsWith('[') && value.endsWith(']')) {
      // Array
      const arrayContent = value.substring(1, value.length - 1);
      result[key] = arrayContent
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    } else if (value.startsWith('"') && value.endsWith('"')) {
      // Quoted string
      result[key] = value.substring(1, value.length - 1);
    } else if (value === 'true' || value === 'false') {
      // Boolean
      result[key] = value === 'true';
    } else if (!isNaN(Number(value))) {
      // Number
      result[key] = Number(value);
    } else {
      // Unquoted string
      result[key] = value;
    }
  }

  return result;
}

/**
 * Simple YAML stringifier (supports: strings, arrays, booleans, numbers)
 */
function stringifySimpleYaml(obj: Record<string, any>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else if (typeof value === 'string') {
      // Always quote strings that look like dates or contain special chars
      if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.includes(':') || value.includes('#') || value.includes('[')) {
        lines.push(`${key}: "${value}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else {
      // Object - convert to string
      lines.push(`${key}: ${String(value)}`);
    }
  }

  return lines.join('\n') + '\n';
}
