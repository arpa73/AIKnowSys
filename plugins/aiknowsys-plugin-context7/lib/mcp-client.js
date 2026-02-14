/**
 * Context7 MCP Client
 * 
 * Wrapper around @modelcontextprotocol/sdk for querying Context7 documentation server.
 * 
 * @example
 * const client = new Context7Client();
 * await client.connect();
 * const libId = await client.resolveLibraryId('nextjs', 'Next.js framework');
 * const docs = await client.queryDocs(libId.libraryId, 'How to use middleware?');
 * await client.disconnect();
 */

// MCP SDK imports (used when real MCP connection is implemented)
// import { Client } from '@modelcontextprotocol/sdk/client/index.js';
// import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Default configuration for Context7 MCP server
 */
const DEFAULT_CONFIG = {
	// Note: Context7 is configured via Claude Desktop, not a standalone npm package
	// For real usage, MCP server is managed by the AI client
	mockMode: false, // Set to true for testing without MCP server
	timeout: 30000 // 30 seconds
};

export class Context7Client {
	/**
	 * @param {Object} config - Client configuration
	 * @param {string} config.serverCommand - Command to start MCP server
	 * @param {string[]} config.serverArgs - Arguments for server command
	 * @param {number} config.timeout - Request timeout in milliseconds
	 */
	constructor(config = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.client = null;
		this.transport = null;
		this.isConnected = false;
	}

	/**
	 * Connect to Context7 MCP server
	 * @returns {Promise<{success: boolean, error?: string}>}
	 */
	async connect() {
		if (this.isConnected) {
			return { success: true };
		}

		// Mock mode for testing without MCP server
		if (this.config.mockMode) {
			this.isConnected = true;
			return { success: true };
		}

		try {
			// TODO: Implement direct MCP connection for standalone usage
			// See: https://github.com/arpa73/aiknowsys-plugin-context7/issues/1
			// Note: In production, Context7 is accessed via AI client's MCP configuration
			throw new Error('Direct MCP connection not yet implemented. Use via AI client with MCP.');
		} catch (error) {
			this.isConnected = false;
			return { 
				success: false, 
				error: `Failed to connect to Context7 MCP server: ${error.message}`
			};
		}
	}

	/**
	 * Disconnect from Context7 MCP server
	 * @returns {Promise<{success: boolean}>}
	 */
	async disconnect() {
		if (!this.isConnected) {
			return { success: true };
		}

		try {
			if (this.client) {
				await this.client.close();
				this.client = null;
			}
			
			if (this.transport) {
				await this.transport.close();
				this.transport = null;
			}

			this.isConnected = false;
			return { success: true };
		} catch (_error) {
			// Force cleanup even on error
			this.client = null;
			this.transport = null;
			this.isConnected = false;
			return { success: true }; // Always succeed disconnect
		}
	}

	/**
	 * Resolve library name to Context7 library ID
	 * @param {string} libraryName - Library name (e.g., 'nextjs', 'vue', 'django')
	 * @param {string} query - Context query to help matching
	 * @returns {Promise<{success: boolean, libraryId?: string, error?: string}>}
	 */
	async resolveLibraryId(libraryName, query) {
		if (!this.isConnected) {
			return { 
				success: false, 
				error: 'Not connected to Context7 MCP server. Call connect() first.' 
			};
		}

		// Mock mode for testing
		if (this.config.mockMode) {
			const mockLibraryIds = {
				'nextjs': '/vercel/next.js',
				'vue': '/vuejs/core',
				'react': '/facebook/react',
				'django': '/django/django'
			};
			return { 
				success: true, 
				libraryId: mockLibraryIds[libraryName.toLowerCase()] || null 
			};
		}

		try {
			const result = await this.client.callTool({
				name: 'context7_resolve-library-id',
				arguments: {
					libraryName,
					query
				}
			});

			// Parse the result to extract library ID
			const content = result.content?.[0];
			if (!content?.text) {
				return { success: true, libraryId: null };
			}

			// Extract library ID from response text
			// Context7 returns libraryId in the response
			const match = content.text.match(/libraryId['":\s]+([^\s,}"']+)/i);
			const libraryId = match ? match[1] : null;

			return { success: true, libraryId };
		} catch (error) {
			return { 
				success: false, 
				error: `Failed to resolve library ID: ${error.message}` 
			};
		}
	}

	/**
	 * Query documentation from Context7
	 * @param {string} libraryId - Context7 library ID (e.g., '/vercel/next.js')
	 * @param {string} query - Documentation query
	 * @returns {Promise<{success: boolean, documentation?: string, error?: string}>}
	 */
	async queryDocs(libraryId, query) {
		if (!this.isConnected) {
			return { 
				success: false, 
				error: 'Not connected to Context7 MCP server. Call connect() first.' 
			};
		}

		// Mock mode for testing
		if (this.config.mockMode) {
			if (!libraryId.startsWith('/')) {
				return { 
					success: false, 
					error: 'Invalid library ID format. Must start with /' 
				};
			}
			return { 
				success: true, 
				documentation: `Mock documentation for ${libraryId}: ${query}` 
			};
		}

		try {
			const result = await this.client.callTool({
				name: 'context7_query-docs',
				arguments: {
					libraryId,
					query
				}
			});

			// Extract documentation from response
			const content = result.content?.[0];
			if (!content?.text) {
				return { 
					success: false, 
					error: 'No documentation returned from Context7' 
				};
			}

			return { success: true, documentation: content.text };
		} catch (error) {
			return { 
				success: false, 
				error: `Failed to query documentation: ${error.message}` 
			};
		}
	}

	/**
	 * Cleanup resources (alias for disconnect)
	 */
	async close() {
		return this.disconnect();
	}
}
