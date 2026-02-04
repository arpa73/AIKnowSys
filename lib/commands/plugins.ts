/**
 * List and manage installed AIKnowSys plugins
 */

import chalk from 'chalk';
// @ts-ignore - plugins/loader.js not yet migrated to TypeScript
import { listInstalledPlugins, getPluginInfo } from '../plugins/loader.js';
import { logger as log } from '../logger.js';

export interface ListPluginsOptions {
  // No options currently used, but interface maintained for consistency
}

interface LoadedPlugin {
  name: string;
  version?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Plugin objects can have arbitrary properties
}

/**
 * List installed plugins
 * 
 * @param _options - Command options
 * @returns Promise<void>
 */
export async function listPlugins(_options: ListPluginsOptions): Promise<void> {
	try {
		const pluginNames: string[] = await listInstalledPlugins();

		if (pluginNames.length === 0) {
			log.info('No plugins installed');
			console.log('');
			console.log('Install plugins with:');
			console.log(chalk.gray('  npm install --save-optional aiknowsys-plugin-<name>'));
			console.log('');
			console.log('Available plugins:');
			console.log(chalk.gray('  - aiknowsys-plugin-context7 (Context7 MCP integration)'));
			return;
		}

		log.success(`Found ${pluginNames.length} plugin(s):`);
		console.log('');

		for (const name of pluginNames) {
			console.log(chalk.cyan('  • ') + name);
		}

		console.log('');
		console.log(chalk.gray('Run ' + chalk.white('aiknowsys --help') + ' to see plugin commands'));

	} catch (error) {
		log.error(`Failed to list plugins: ${(error as Error).message}`);
		throw error;
	}
}

/**
 * Show plugin info (verbose)
 * 
 * @param loadedPlugins - Array of loaded plugin objects
 * @returns void
 */
export function showPluginInfo(loadedPlugins: LoadedPlugin[]): void {
	if (loadedPlugins.length === 0) {
		return;
	}

	const info = getPluginInfo(loadedPlugins);
	console.log('');
	console.log(chalk.bold('Loaded Plugins:'));
	console.table(info);
}
