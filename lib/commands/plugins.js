/**
 * List and manage installed AIKnowSys plugins
 */

import chalk from 'chalk';
import { listInstalledPlugins, getPluginInfo } from '../plugins/loader.js';
import { logger as log } from '../logger.js';

/**
 * List installed plugins
 * 
 * @param {Object} options - Command options
 * @returns {Promise<void>}
 */
export async function listPlugins(options) {
	try {
		const pluginNames = await listInstalledPlugins();

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
		log.error('Failed to list plugins', error);
		throw error;
	}
}

/**
 * Show plugin info (verbose)
 * 
 * @param {Array<Object>} loadedPlugins - Array of loaded plugin objects
 * @returns {void}
 */
export function showPluginInfo(loadedPlugins) {
	if (loadedPlugins.length === 0) {
		return;
	}

	const info = getPluginInfo(loadedPlugins);
	console.log('');
	console.log(chalk.bold('Loaded Plugins:'));
	console.table(info);
}
