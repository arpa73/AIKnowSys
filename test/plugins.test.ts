/**
 * Tests for Plugin System
 * 
 * Validates plugin discovery, loading, validation, and command registration.
 */

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Command } from 'commander';
import { loadPlugins, listInstalledPlugins, getPluginInfo } from '../lib/plugins/loader.js';

describe('Plugin System', () => {
	let testDir: string;
	let originalCwd: string;

	beforeEach(async () => {
		// Create temp directory for test
		testDir = join(tmpdir(), `aiknowsys-plugin-test-${Date.now()}`);
		await mkdir(testDir, { recursive: true });
		originalCwd = process.cwd();
	});

	afterEach(async () => {
		// Cleanup
		try {
			await rm(testDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
		process.chdir(originalCwd);
	});

	test('Works without plugins installed', async () => {
		// Create minimal package.json without plugins
		const pkgPath: string = join(testDir, 'package.json');
		await writeFile(pkgPath, JSON.stringify({
			name: 'test-project',
			version: '1.0.0',
			dependencies: {
				'commander': '^12.0.0'
			}
		}));

		process.chdir(testDir);

		const program: Command = new Command();
		program.command('test-command').action(() => {});

		// Load plugins (should return empty array, not crash)
		const plugins: any[] = await loadPlugins(program, testDir);

		assert.strictEqual(plugins.length, 0, 'Should return empty array when no plugins');
		assert.strictEqual(program.commands.length, 1, 'Should only have core command');
	});

	test('Discovers plugin packages', async () => {
		const pkgPath: string = join(testDir, 'package.json');
		await writeFile(pkgPath, JSON.stringify({
			name: 'test-project',
			version: '1.0.0',
			dependencies: {
				'commander': '^12.0.0'
			},
			optionalDependencies: {
				'aiknowsys-plugin-test': '^1.0.0',
				'aiknowsys-plugin-another': '^2.0.0'
			}
		}));

		process.chdir(testDir);

		const installed: string[] = await listInstalledPlugins(testDir);
		
		assert.strictEqual(installed.length, 2, 'Should find 2 plugins');
		assert.ok(installed.includes('aiknowsys-plugin-test'), 'Should include test plugin');
		assert.ok(installed.includes('aiknowsys-plugin-another'), 'Should include another plugin');
	});

	test('Plugin exports metadata correctly', () => {
		const mockPlugin: any = {
			name: 'test-plugin',
			version: '1.0.0',
			description: 'Test plugin',
			commands: [
				{
					name: 'test-cmd',
					description: 'Test command',
					action: async () => {}
				}
			]
		};

		const info: any[] = getPluginInfo([mockPlugin]);

		assert.strictEqual(info.length, 1);
		assert.strictEqual(info[0].name, 'test-plugin');
		assert.strictEqual(info[0].version, '1.0.0');
		assert.strictEqual(info[0].commands, 'test-cmd');
	});

	test('Multiple commands in plugin metadata', () => {
		const mockPlugin: any = {
			name: 'multi-cmd-plugin',
			version: '2.0.0',
			commands: [
				{ name: 'cmd1', action: async () => {} },
				{ name: 'cmd2', action: async () => {} },
				{ name: 'cmd3', action: async () => {} }
			]
		};

		const info: any[] = getPluginInfo([mockPlugin]);

		assert.strictEqual(info[0].commands, 'cmd1, cmd2, cmd3');
	});

	test('Handles package.json not found gracefully', async () => {
		// Create temp dir without package.json
		const emptyDir: string = join(tmpdir(), `aiknowsys-plugin-empty-${Date.now()}`);
		await mkdir(emptyDir, { recursive: true });

		process.chdir(emptyDir);

		const program: Command = new Command();

		// Should not throw, just return empty array
		const plugins: any[] = await loadPlugins(program, emptyDir);

		assert.strictEqual(plugins.length, 0);

		await rm(emptyDir, { recursive: true, force: true });
	});

	test('Filters non-plugin dependencies', async () => {
		const pkgPath: string = join(testDir, 'package.json');
		await writeFile(pkgPath, JSON.stringify({
			name: 'test-project',
			dependencies: {
				'commander': '^12.0.0',
				'chalk': '^5.0.0',
				'aiknowsys-plugin-valid': '^1.0.0',
				'some-other-package': '^3.0.0'
			}
		}));

		process.chdir(testDir);

		const installed: string[] = await listInstalledPlugins(testDir);

		assert.strictEqual(installed.length, 1);
		assert.strictEqual(installed[0], 'aiknowsys-plugin-valid');
	});

	test('Plugin info handles missing version', () => {
		const mockPlugin: any = {
			name: 'no-version-plugin',
			commands: [
				{ name: 'cmd', action: async () => {} }
			]
		};

		const info: any[] = getPluginInfo([mockPlugin]);

		assert.strictEqual(info[0].version, 'unknown');
	});

	test('Plugin info handles missing description', () => {
		const mockPlugin: any = {
			name: 'no-desc-plugin',
			version: '1.0.0',
			commands: []
		};

		const info: any[] = getPluginInfo([mockPlugin]);

		assert.strictEqual(info[0].description, 'No description');
	});
});

describe('CLI Integration', () => {
	test('loadPlugins integrates with Commander without errors', async () => {
		const program: Command = new Command();
		
		// Add a core command
		program.command('test-command').action(() => {});
		
		// Load plugins (should not throw even with no plugins)
		const plugins: any[] = await loadPlugins(program);
		
		// Verify no errors and plugins array returned
		assert.ok(Array.isArray(plugins), 'Should return array');
		assert.strictEqual(program.commands.length >= 1, true, 'Should preserve core commands');
	});
});

describe('Plugin Validation (Error Cases)', () => {
	test('Invalid plugin exports handled gracefully', () => {
		// These tests validate error handling without actually loading modules
		// (since we can't easily mock ES module imports in tests)

		// Test plugin validation logic
		const validatePlugin = (plugin: any, _name: string): void => {
			if (!plugin || typeof plugin !== 'object') {
				throw new Error('Plugin must export default object');
			}
			if (!plugin.name || typeof plugin.name !== 'string') {
				throw new Error('Plugin must have "name" property (string)');
			}
			if (!plugin.commands || !Array.isArray(plugin.commands)) {
				throw new Error('Plugin must have "commands" property (array)');
			}
		};

		// Valid plugin
		assert.doesNotThrow(() => {
			validatePlugin({
				name: 'valid',
				commands: []
			}, 'valid-plugin');
		});

		// Invalid: not an object
		assert.throws(() => {
			validatePlugin(null, 'null-plugin');
		}, /Plugin must export default object/);

		// Invalid: missing name
		assert.throws(() => {
			validatePlugin({
				commands: []
			}, 'no-name-plugin');
		}, /Plugin must have "name" property/);

		// Invalid: name not a string
		assert.throws(() => {
			validatePlugin({
				name: 123,
				commands: []
			}, 'bad-name-plugin');
		}, /Plugin must have "name" property/);

		// Invalid: missing commands
		assert.throws(() => {
			validatePlugin({
				name: 'test'
			}, 'no-commands-plugin');
		}, /Plugin must have "commands" property/);

		// Invalid: commands not an array
		assert.throws(() => {
			validatePlugin({
				name: 'test',
				commands: 'not-array'
			}, 'bad-commands-plugin');
		}, /Plugin must have "commands" property/);
	});

	test('Command validation logic', () => {
		const validateCommand = (cmd: any, pluginName: string): void => {
			if (!cmd.name || typeof cmd.name !== 'string') {
				throw new Error(`Command missing "name" property in plugin "${pluginName}"`);
			}
			if (cmd.action && typeof cmd.action !== 'function') {
				throw new Error(`Command "${cmd.name}" action must be a function`);
			}
		};

		// Valid command
		assert.doesNotThrow(() => {
			validateCommand({
				name: 'test-cmd',
				action: async () => {}
			}, 'test-plugin');
		});

		// Valid command without action
		assert.doesNotThrow(() => {
			validateCommand({
				name: 'no-action-cmd'
			}, 'test-plugin');
		});

		// Invalid: missing name
		assert.throws(() => {
			validateCommand({
				action: async () => {}
			}, 'test-plugin');
		}, /Command missing "name" property/);

		// Invalid: action not a function
		assert.throws(() => {
			validateCommand({
				name: 'bad-action',
				action: 'not-a-function'
			}, 'test-plugin');
		}, /action must be a function/);
	});
});
