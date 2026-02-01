import { describe, test } from 'node:test';
import assert from 'node:assert';

describe('Plugin Metadata', () => {
	test('should export plugin name', async () => {
		const plugin = await import('../index.js');
		
		assert.strictEqual(typeof plugin.name, 'string');
		assert.strictEqual(plugin.name, 'aiknowsys-plugin-context7');
	});

	test('should export plugin version', async () => {
		const plugin = await import('../index.js');
		
		assert.strictEqual(typeof plugin.version, 'string');
		assert.ok(/^\d+\.\d+\.\d+/.test(plugin.version), 'Version should be semver');
	});

	test('should export plugin description', async () => {
		const plugin = await import('../index.js');
		
		assert.strictEqual(typeof plugin.description, 'string');
		assert.ok(plugin.description.length > 0);
	});

	test('should export commands array', async () => {
		const plugin = await import('../index.js');
		
		assert.ok(Array.isArray(plugin.commands));
	});
});

describe('Command Structure', () => {
	test('commands should have required fields', async () => {
		const plugin = await import('../index.js');
		
		// Will have commands once implemented
		// For now, empty array is valid
		plugin.commands.forEach(cmd => {
			assert.strictEqual(typeof cmd.name, 'string');
			assert.strictEqual(typeof cmd.description, 'string');
			assert.strictEqual(typeof cmd.action, 'function');
		});
	});
});
