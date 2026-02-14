/**
 * aiknowsys-plugin-context7
 * 
 * Context7 MCP integration for automated deliverable validation and documentation queries.
 * 
 * Exports plugin metadata and commands following aiknowsys plugin API.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateDeliverables } from './lib/validate-deliverables.js';
import { queryDocs } from './lib/query-docs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(
	readFileSync(join(__dirname, 'package.json'), 'utf-8')
);

/**
 * Plugin metadata (required by aiknowsys plugin API)
 */
export const name = packageJson.name;
export const version = packageJson.version;
export const description = packageJson.description;

/**
 * Commands registered by this plugin
 * Each command follows Commander.js command structure
 */
export const commands = [
	{
		name: 'validate',
		description: 'Validate aiknowsys skills, CODEBASE_ESSENTIALS.md, and stack templates against current library documentation',
		async action(options, _program) {
			const { 
				type = 'all',
				library,
				format = 'text',
				projectRoot = process.cwd()
			} = options;
			
			const result = await validateDeliverables({
				projectRoot,
				type,
				library,
				format
			});
			
			console.log(result.output);
			return result;
		},
		options: [
			{
				flags: '-t, --type <type>',
				description: 'Type to validate: skills, essentials, stacks, or all (default: skills + essentials)',
				defaultValue: 'all'
			},
			{
				flags: '-l, --library <id>',
				description: 'Specific library ID to check'
			},
			{
				flags: '-f, --format <format>',
				description: 'Output format (text|json|markdown)',
				defaultValue: 'text'
			},
			{
				flags: '-p, --project-root <path>',
				description: 'Path to aiknowsys project',
				defaultValue: process.cwd()
			}
		]
	},
	{
		name: 'query-docs',
		description: 'Query library documentation via Context7 MCP',
		async action(options, _program) {
			const {
				library,
				query,
				format = 'text'
			} = options;

			const result = await queryDocs({
				library,
				query,
				format
			});

			console.log(result.output);
			return result;
		},
		options: [
			{
				flags: '-l, --library <name>',
				description: 'Library name or ID (e.g., Next.js, Vue, /vercel/next.js)'
			},
			{
				flags: '-q, --query <text>',
				description: 'Documentation query'
			},
			{
				flags: '-f, --format <format>',
				description: 'Output format (text|json|markdown)',
				defaultValue: 'text'
			}
		]
	}
];

/**
 * Plugin initialization (optional)
 * Called when plugin is loaded
 */
export async function init(_options = {}) {
	// Future: MCP client initialization, config validation, etc.
	return { success: true };
}

/**
 * Default export (required by aiknowsys plugin loader)
 */
export default {
	name,
	version,
	description,
	commands,
	init
};
