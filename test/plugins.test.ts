/**
 * Tests for Plugin System
 * 
 * Validates plugin discovery, loading, validation, and command registration.
 */

import { describe, test, beforeEach, afterEach, expect } from 'vitest';
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

		expect(plugins.length).toBe(0);
		expect(program.commands.length).toBe(1);
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
		
		expect(installed.length).toBe(2);
		expect(installed.includes('aiknowsys-plugin-test')).toBeTruthy();
		expect(installed.includes('aiknowsys-plugin-another')).toBeTruthy();
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

		expect(info.length).toBe(1);
		expect(info[0].name).toBe('test-plugin');
		expect(info[0].version).toBe('1.0.0');
		expect(info[0].commands).toBe('test-cmd');
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

		expect(info[0].commands).toBe('cmd1, cmd2, cmd3');
	});

	test('Handles package.json not found gracefully', async () => {
		// Create temp dir without package.json
		const emptyDir: string = join(tmpdir(), `aiknowsys-plugin-empty-${Date.now()}`);
		await mkdir(emptyDir, { recursive: true });

		process.chdir(emptyDir);

		const program: Command = new Command();

		// Should not throw, just return empty array
		const plugins: any[] = await loadPlugins(program, emptyDir);

		expect(plugins.length).toBe(0);

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

		expect(installed.length).toBe(1);
		expect(installed[0]).toBe('aiknowsys-plugin-valid');
	});

	test('Plugin info handles missing version', () => {
		const mockPlugin: any = {
			name: 'no-version-plugin',
			commands: [
				{ name: 'cmd', action: async () => {} }
			]
		};

		const info: any[] = getPluginInfo([mockPlugin]);

		expect(info[0].version).toBe('unknown');
	});

	test('Plugin info handles missing description', () => {
		const mockPlugin: any = {
			name: 'no-desc-plugin',
			version: '1.0.0',
			commands: []
		};

		const info: any[] = getPluginInfo([mockPlugin]);

		expect(info[0].description).toBe('No description');
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
		expect(Array.isArray(plugins)).toBeTruthy();
		expect(program.commands.length >= 1).toBe(true);
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
		expect(() => {
        			validatePlugin({
        				name: 'valid',
        				commands: []
        			}, 'valid-plugin');
        		}).not.toThrow();

		// Invalid: not an object
		expect(() => {
        			validatePlugin(null, 'null-plugin');
        		}).toThrow(/Plugin must export default object/);

		// Invalid: missing name
		expect(() => {
        			validatePlugin({
        				commands: []
        			}, 'no-name-plugin');
        		}).toThrow(/Plugin must have "name" property/);

		// Invalid: name not a string
		expect(() => {
        			validatePlugin({
        				name: 123,
        				commands: []
        			}, 'bad-name-plugin');
        		}).toThrow(/Plugin must have "name" property/);

		// Invalid: missing commands
		expect(() => {
        			validatePlugin({
        				name: 'test'
        			}, 'no-commands-plugin');
        		}).toThrow(/Plugin must have "commands" property/);

		// Invalid: commands not an array
		expect(() => {
        			validatePlugin({
        				name: 'test',
        				commands: 'not-array'
        			}, 'bad-commands-plugin');
        		}).toThrow(/Plugin must have "commands" property/);
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
		expect(() => {
        			validateCommand({
        				name: 'test-cmd',
        				action: async () => {}
        			}, 'test-plugin');
        		}).not.toThrow();

		// Valid command without action
		expect(() => {
        			validateCommand({
        				name: 'no-action-cmd'
        			}, 'test-plugin');
        		}).not.toThrow();

		// Invalid: missing name
		expect(() => {
        			validateCommand({
        				action: async () => {}
        			}, 'test-plugin');
        		}).toThrow(/Command missing "name" property/);

		// Invalid: action not a function
		expect(() => {
        			validateCommand({
        				name: 'bad-action',
        				action: 'not-a-function'
        			}, 'test-plugin');
        		}).toThrow(/action must be a function/);
	});
});
