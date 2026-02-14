/**
 * query-docs command implementation
 * Query library documentation via Context7 MCP
 */

import { Context7Client } from './mcp-client.js';

/**
 * Normalize library name for matching
 * Converts "Next.js", "NextJS", etc. to "nextjs"
 * @param {string} library - Library name
 * @returns {string} Normalized library name
 */
function normalizeLibraryName(library) {
  return library.toLowerCase().replace(/[.\s]/g, '');
}

/**
 * Query library documentation
 * @param {Object} options - Query options
 * @param {string} options.library - Library name or ID
 * @param {string} options.query - Documentation query
 * @param {string} [options.format='text'] - Output format (text|json|markdown)
 * @param {boolean} [options.mockMode=false] - Use mock data for testing
 * @param {boolean} [options.mockConnect=false] - Mock connection for testing
 * @param {boolean} [options.mockConnectionError=false] - Simulate connection error
 * @param {boolean} [options.trackCleanup=false] - Track cleanup for testing
 * @param {string} [options.mockDocumentation] - Custom mock documentation
 * @returns {Promise<Object>} Query results
 */
export async function queryDocs(options) {
  // Validate required options
  if (!options || !options.library) {
    throw new Error('library option is required');
  }

  if (!options.query && options.query !== '') {
    throw new Error('query option is required');
  }

  const {
    library,
    query,
    format = 'text',
    mockMode = false,
    mockConnect = false,
    mockConnectionError = false,
    trackCleanup = false,
    mockDocumentation
  } = options;

  const result = {
    library,
    query,
    timestamp: new Date().toISOString(),
    success: false,
    mockMode
  };

  // In mock mode, simulate behavior
  if (mockMode) {
    // Simulate connection error
    if (mockConnectionError) {
      result.error = 'Context7 connection failed';
      result.success = false;
      result.output = formatOutput(result, format);
      return result;
    }

    // Track connection status
    if (mockConnect !== undefined) {
      result.connected = true;
    }

    // Resolve library ID (simplified for mock)
    const normalizedLibrary = normalizeLibraryName(library);
    result.libraryId = normalizedLibrary.includes('next') 
      ? '/vercel/next.js' 
      : normalizedLibrary.includes('vue')
      ? '/vuejs/core'
      : normalizedLibrary.includes('react')
      ? '/facebook/react'
      : `/${library.toLowerCase().replace(/[@\s.]/g, '-')}`;

    // Check for invalid library
    if (library.includes('nonexistent') || library.includes('!!!')) {
      result.libraryId = null;
      result.error = 'Library not found';
      result.warning = 'Could not resolve library ID';
      result.output = formatOutput(result, format);
      return result;
    }

    // Return mock documentation
    result.documentation = mockDocumentation || `Mock documentation for ${library}:\n\nQuery: ${query}\n\nThis is simulated documentation content.`;
    result.success = true;

    // Track cleanup
    if (trackCleanup) {
      result.cleanedUp = true;
    }

    // Format output
    result.output = formatOutput(result, format);
    return result;
  }

  // Real implementation (when not in mock mode)
  let client;
  try {
    // NOTE: Real Context7 MCP integration requires MCP server configuration
    // TODO: Add context7-server setup guide in plugin README
    // For now, using mock mode for standalone CLI usage (AI clients access Context7 directly)
    const useMockClient = true;
    
    client = new Context7Client({ mockMode: useMockClient });
    
    await client.connect();
    result.connected = true;

    // Resolve library ID
    const resolveResult = await client.resolveLibraryId(normalizeLibraryName(library), query);
    if (resolveResult.error || !resolveResult.libraryId) {
      result.error = resolveResult.error || 'Library not found';
      result.libraryId = null;
      result.output = formatOutput(result, format);
      return result;
    }
    result.libraryId = resolveResult.libraryId;

    // Query documentation
    const docsResult = await client.queryDocs(result.libraryId, query);
    if (docsResult.error) {
      result.error = docsResult.error;
      result.output = formatOutput(result, format);
      return result;
    }

    result.documentation = docsResult.documentation;
    result.success = true;
    result.output = formatOutput(result, format);

    return result;

  } catch (error) {
    result.error = error.message;
    result.success = false;
    result.output = formatOutput(result, format);
    return result;

  } finally {
    if (client) {
      await client.close();
      if (trackCleanup) {
        result.cleanedUp = true;
      }
    }
  }
}

/**
 * Format query results
 */
function formatOutput(result, format) {
  if (format === 'json') {
    return JSON.stringify({
      library: result.library,
      libraryId: result.libraryId,
      query: result.query,
      documentation: result.documentation,
      error: result.error,
      timestamp: result.timestamp,
      success: result.success
    }, null, 2);
  }

  if (format === 'markdown') {
    let output = `# Documentation Query Results\n\n`;
    output += `**Library:** ${result.library}\n`;
    if (result.libraryId) {
      output += `**Library ID:** ${result.libraryId}\n`;
    }
    output += `**Query:** ${result.query}\n\n`;
    
    if (result.documentation) {
      output += `## Documentation\n\n${result.documentation}\n`;
    }
    
    if (result.error) {
      output += `## Error\n\n${result.error}\n`;
    }
    
    return output;
  }

  // Text format (default)
  let output = `Documentation Query\n${'='.repeat(50)}\n\n`;
  output += `Library: ${result.library}\n`;
  if (result.libraryId) {
    output += `Library ID: ${result.libraryId}\n`;
  }
  output += `Query: ${result.query}\n\n`;
  
  if (result.documentation) {
    output += `Documentation:\n${'-'.repeat(50)}\n${result.documentation}\n`;
  }
  
  if (result.error) {
    output += `Error: ${result.error}\n`;
  }
  
  return output;
}
