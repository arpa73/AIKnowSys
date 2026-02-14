/**
 * YAML frontmatter parsing and modification utilities
 * Phase B Mini - Context Query Completion
 */
/**
 * Parse YAML frontmatter from markdown file
 * @returns Frontmatter object and remaining content
 */
export function parseFrontmatter(fileContent) {
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
export function updateFrontmatter(fileContent, updates) {
    const { frontmatter, content } = parseFrontmatter(fileContent);
    // Merge updates
    const newFrontmatter = { ...frontmatter, ...updates };
    //Generate YAML string
    const yamlStr = stringifySimpleYaml(newFrontmatter);
    return `---\n${yamlStr}---\n${content}`;
}
/**
 * Simple YAML parser for frontmatter (aiknowsys-specific)
 *
 * **Supported:**
 * - Strings (quoted and unquoted)
 * - Arrays (inline format: [item1, item2])
 * - Booleans (true/false)
 * - Numbers (integers and floats)
 * - Comments (# prefix)
 *
 * **NOT Supported:**
 * - Nested objects/maps
 * - Multiline strings (| or >)
 * - Advanced YAML (anchors, refs, tags)
 * - Block arrays (- item format)
 *
 * @example
 * ```yaml
 * date: "2026-02-07"
 * topics: [TDD, validation]
 * status: in-progress
 * count: 42
 * ```
 *
 * @param yamlStr - YAML string (without --- delimiters)
 * @returns Parsed object
 */
function parseSimpleYaml(yamlStr) {
    const result = {};
    const lines = yamlStr.split('\n');
    for (const line of lines) {
        if (!line.trim() || line.trim().startsWith('#'))
            continue;
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1)
            continue;
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        // Parse value type
        if (value.startsWith('[') && value.endsWith(']')) {
            // Array
            const arrayContent = value.substring(1, value.length - 1);
            result[key] = arrayContent
                .split(',')
                .map(item => {
                const trimmed = item.trim();
                // Remove quotes from array items if present
                if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                    return trimmed.substring(1, trimmed.length - 1);
                }
                return trimmed;
            })
                .filter(item => item.length > 0);
        }
        else if (value.startsWith('"') && value.endsWith('"')) {
            // Quoted string
            result[key] = value.substring(1, value.length - 1);
        }
        else if (value === 'true' || value === 'false') {
            // Boolean
            result[key] = value === 'true';
        }
        else if (!isNaN(Number(value))) {
            // Number
            result[key] = Number(value);
        }
        else {
            // Unquoted string
            result[key] = value;
        }
    }
    return result;
}
/**
 * Simple YAML stringifier (supports: strings, arrays, booleans, numbers)
 *
 * Generates minimal YAML format for frontmatter. Automatically quotes
 * strings that contain special characters or match date format.
 *
 * @param obj - Object to stringify
 * @returns YAML string (without --- delimiters)
 */
function stringifySimpleYaml(obj) {
    const lines = [];
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined)
            continue;
        if (Array.isArray(value)) {
            // Quote all string values in arrays for consistency
            const quotedValues = value.map(item => typeof item === 'string' ? `"${item}"` : String(item));
            lines.push(`${key}: [${quotedValues.join(', ')}]`);
        }
        else if (typeof value === 'string') {
            // Always quote all strings for consistency
            lines.push(`${key}: "${value}"`);
        }
        else if (typeof value === 'boolean') {
            lines.push(`${key}: ${value}`);
        }
        else if (typeof value === 'number') {
            lines.push(`${key}: ${value}`);
        }
        else {
            // Object - convert to string
            lines.push(`${key}: ${String(value)}`);
        }
    }
    return lines.join('\n') + '\n';
}
//# sourceMappingURL=yaml-frontmatter.js.map