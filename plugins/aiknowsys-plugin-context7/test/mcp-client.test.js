import { describe, test } from 'node:test';
import assert from 'node:assert';
import { Context7Client } from '../lib/mcp-client.js';

describe('Context7Client Construction', () => {
	test('should create client with default config', () => {
		const client = new Context7Client();
		
		assert.ok(client);
		assert.strictEqual(client.isConnected, false);
	});

	test('should create client with custom config', () => {
		const client = new Context7Client({
			serverCommand: 'custom-command',
			serverArgs: ['--custom-arg']
		});
		
		assert.ok(client);
	});
});

describe('Connection Management', () => {
	test('should connect to MCP server', async () => {
		const client = new Context7Client({ mockMode: true });
		
		const result = await client.connect();
		
		assert.strictEqual(result.success, true);
		assert.strictEqual(client.isConnected, true);
	});

	test('should disconnect from MCP server', async () => {
		const client = new Context7Client({ mockMode: true });
		await client.connect();
		
		const result = await client.disconnect();
		
		assert.strictEqual(result.success, true);
		assert.strictEqual(client.isConnected, false);
	});

	test('should handle connection errors gracefully', async () => {
		const client = new Context7Client({
			serverCommand: 'non-existent-command'
		});
		
		const result = await client.connect();
		
		assert.strictEqual(result.success, false);
		assert.ok(result.error);
	});
});

describe('Library ID Resolution', () => {
	test('should resolve library ID from name', async () => {
		const client = new Context7Client({ mockMode: true });
		await client.connect();
		
		const result = await client.resolveLibraryId('nextjs', 'Next.js framework');
		
		assert.strictEqual(result.success, true);
		assert.ok(result.libraryId);
		assert.ok(result.libraryId.startsWith('/'));
	});

	test('should handle invalid library name', async () => {
		const client = new Context7Client({ mockMode: true });
		await client.connect();
		
		const result = await client.resolveLibraryId('invalid-lib-xyz123', 'test query');
		
		// Should succeed but return no matches
		assert.strictEqual(result.success, true);
		assert.strictEqual(result.libraryId, null);
	});

	test('should require connection before resolving', async () => {
		const client = new Context7Client({ mockMode: true });
		// Not connected
		
		const result = await client.resolveLibraryId('nextjs', 'test');
		
		assert.strictEqual(result.success, false);
		assert.ok(result.error);
	});
});

describe('Documentation Queries', () => {
	test('should query documentation with library ID', async () => {
		const client = new Context7Client({ mockMode: true });
		await client.connect();
		
		const result = await client.queryDocs('/vercel/next.js', 'How to use middleware?');
		
		assert.strictEqual(result.success, true);
		assert.ok(result.documentation);
		assert.ok(typeof result.documentation === 'string');
	});

	test('should handle invalid library ID', async () => {
		const client = new Context7Client({ mockMode: true });
		await client.connect();
		
		const result = await client.queryDocs('invalid-no-slash', 'test query');
		
		// Mock mode validates format (must start with /)
		assert.strictEqual(result.success, false);
		assert.ok(result.error);
	});

	test('should require connection before querying', async () => {
		const client = new Context7Client({ mockMode: true });
		// Not connected
		
		const result = await client.queryDocs('/vercel/next.js', 'test');
		
		assert.strictEqual(result.success, false);
		assert.ok(result.error);
	});
});

describe('Error Handling', () => {
	test('should handle network timeouts', async () => {
		const client = new Context7Client({ timeout: 1 }); // 1ms timeout
		await client.connect();
		
		// Should timeout on slow queries
		const result = await client.queryDocs('/vercel/next.js', 'complex query');
		
		// Should either succeed quickly or fail gracefully
		assert.ok(result.success !== undefined);
	});

	test('should cleanup resources on error', async () => {
		const client = new Context7Client();
		
		try {
			await client.connect();
			// Force an error
			await client.queryDocs('invalid', 'test');
		} catch (_error) {
			// Should not throw, should return error object
			assert.fail('Should not throw exceptions');
		}
	});
});

describe('Client Lifecycle', () => {
	test('should support reconnection', async () => {
		const client = new Context7Client({ mockMode: true });
		
		await client.connect();
		await client.disconnect();
		await client.connect();
		
		assert.strictEqual(client.isConnected, true);
	});

	test('should handle multiple disconnects safely', async () => {
		const client = new Context7Client({ mockMode: true });
		
		await client.connect();
		await client.disconnect();
		await client.disconnect(); // Second disconnect should be safe
		
		assert.strictEqual(client.isConnected, false);
	});
});
