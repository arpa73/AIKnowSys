/**
 * Plugin Loader for AIKnowSys
 * 
 * Discovers and loads optional plugins from npm packages.
 * Plugins are packages named "aiknowsys-plugin-*" installed as dependencies.
 * 
 * Design principles:
 * - Core MUST work without any plugins
 * - Plugin failures MUST NOT crash core
 * - Plugins extend CLI with new commands (no core modifications)
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Discover and load aiknowsys plugins
 * 
 * Scans package.json for dependencies matching "aiknowsys-plugin-*",
 * then dynamically imports and registers each plugin's commands.
 * 
 * @param {import('commander').Command} program - Commander program instance
 * @returns {Promise<Array<Object>>} Array of loaded plugin objects
 * 
 * @example
 * import { loadPlugins } from './lib/plugins/loader.js';
 * 
 * const program = new Command();
 * // ... register core commands ...
 * await loadPlugins(program);
 * program.parse();
 */
export async function loadPlugins(program) {
	const plugins = [];

	try {
		// Read package.json to find plugin dependencies
		const pkgPath = join(__dirname, '../../package.json');
		const pkgContent = await readFile(pkgPath, 'utf-8');
		const pkg = JSON.parse(pkgContent);

		// Find all dependencies matching "aiknowsys-plugin-*"
		const allDeps = {
			...pkg.dependencies || {},
			...pkg.devDependencies || {},
			...pkg.optionalDependencies || {}
		};

		const pluginNames = Object.keys(allDeps).filter(name =>
			name.startsWith('aiknowsys-plugin-')
		);

		if (pluginNames.length === 0) {
			// No plugins installed - this is perfectly fine!
			return plugins;
		}

		// Load each plugin
		for (const pluginName of pluginNames) {
			try {
				const plugin = await loadPlugin(pluginName, program);
				if (plugin) {
					plugins.push(plugin);
				}
			} catch (error) {
				// Plugin failed to load - warn but don't crash
				console.warn(`Warning: Failed to load plugin "${pluginName}": ${error.message}`);
			}
		}

		return plugins;

	} catch (error) {
		// Failed to read package.json or discover plugins
		// This is non-fatal - just means no plugins available
		if (error.code !== 'ENOENT') {
			console.warn(`Plugin discovery failed: ${error.message}`);
		}
		return plugins;
	}
}

/**
 * Load a single plugin by name
 * 
 * Dynamically imports the plugin module, validates structure,
 * calls lifecycle hooks, and registers commands with Commander.
 * 
 * @param {string} pluginName - NPM package name (e.g., "aiknowsys-plugin-context7")
 * @param {import('commander').Command} program - Commander program instance
 * @returns {Promise<Object|null>} Plugin object or null if failed
 * @throws {Error} If plugin structure is invalid
 */
async function loadPlugin(pluginName, program) {
	try {
		// Dynamically import the plugin module
		const pluginModule = await import(pluginName);
		const plugin = pluginModule.default;

		// Validate plugin structure
		validatePluginStructure(plugin, pluginName);

		// Call onLoad hook if provided
		if (typeof plugin.onLoad === 'function') {
			await plugin.onLoad();
		}

		// Register each command with Commander
		for (const cmd of plugin.commands) {
			registerPluginCommand(program, cmd, pluginName);
		}

		console.log(`Loaded plugin: ${plugin.name} v${plugin.version || 'unknown'}`);
		return plugin;

	} catch (error) {
		// Re-throw with context
		throw new Error(`Failed to load plugin "${pluginName}": ${error.message}`);
	}
}

/**
 * Validate plugin exports correct structure
 * 
 * @param {any} plugin - Plugin object to validate
 * @param {string} pluginName - Plugin package name (for error messages)
 * @throws {Error} If plugin structure is invalid
 */
function validatePluginStructure(plugin, pluginName) {
	if (!plugin || typeof plugin !== 'object') {
		throw new Error('Plugin must export default object');
	}

	if (!plugin.name || typeof plugin.name !== 'string') {
		throw new Error('Plugin must have "name" property (string)');
	}

	if (!plugin.commands || !Array.isArray(plugin.commands)) {
		throw new Error('Plugin must have "commands" property (array)');
	}

	// Validate each command structure
	for (const cmd of plugin.commands) {
		if (!cmd.name || typeof cmd.name !== 'string') {
			throw new Error(`Command missing "name" property in plugin "${pluginName}"`);
		}

		if (cmd.action && typeof cmd.action !== 'function') {
			throw new Error(`Command "${cmd.name}" action must be a function`);
		}
	}
}

/**
 * Register a single plugin command with Commander
 * 
 * @param {import('commander').Command} program - Commander program instance
 * @param {Object} cmd - Command definition from plugin
 * @param {string} pluginName - Plugin package name (for error context)
 */
function registerPluginCommand(program, cmd, pluginName) {
	const command = program.command(cmd.name);

	if (cmd.description) {
		command.description(cmd.description);
	}

	// Add options
	if (cmd.options && Array.isArray(cmd.options)) {
		for (const opt of cmd.options) {
			command.option(opt.flags, opt.description, opt.defaultValue);
		}
	}

	// Add arguments
	if (cmd.arguments && Array.isArray(cmd.arguments)) {
		for (const arg of cmd.arguments) {
			command.argument(arg.name, arg.description, arg.defaultValue);
		}
	}

	// Set action handler
	if (typeof cmd.action === 'function') {
		command.action(async (...args) => {
			try {
				await cmd.action(...args);
			} catch (error) {
				console.error(`Error executing ${cmd.name}:`, error.message);
				process.exit(1);
			}
		});
	}
}

/**
 * Get list of installed plugins (for diagnostics)
 * 
 * @returns {Promise<Array<string>>} Plugin package names
 * 
 * @example
 * const plugins = await listInstalledPlugins();
 * console.log('Installed plugins:', plugins);
 * // Output: ['aiknowsys-plugin-context7', 'aiknowsys-plugin-github']
 */
export async function listInstalledPlugins() {
	try {
		const pkgPath = join(__dirname, '../../package.json');
		const pkgContent = await readFile(pkgPath, 'utf-8');
		const pkg = JSON.parse(pkgContent);

		const allDeps = {
			...pkg.dependencies || {},
			...pkg.devDependencies || {},
			...pkg.optionalDependencies || {}
		};

		return Object.keys(allDeps).filter(name =>
			name.startsWith('aiknowsys-plugin-')
		);
	} catch {
		return [];
	}
}

/**
 * Get detailed information about loaded plugins
 * 
 * @param {Array<Object>} plugins - Array of loaded plugin objects
 * @returns {Array<Object>} Plugin metadata
 * 
 * @example
 * const loaded = await loadPlugins(program);
 * const info = getPluginInfo(loaded);
 * console.table(info);
 */
export function getPluginInfo(plugins) {
	return plugins.map(plugin => ({
		name: plugin.name,
		version: plugin.version || 'unknown',
		commands: plugin.commands.map(cmd => cmd.name).join(', '),
		description: plugin.description || 'No description'
	}));
}
