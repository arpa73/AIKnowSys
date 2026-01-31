/**
 * Session Summarizer - Extract insights from conversation data
 * Analyzes AI conversation to generate structured session summaries
 */

/**
 * Extract files that were modified during session
 * @param {Object} conversationData - Conversation data from VSCode hooks
 * @returns {string[]} List of file paths that were modified
 */
export function extractFileChanges(conversationData) {
  // Validate input structure
  if (!conversationData || typeof conversationData !== 'object') {
    return [];
  }
  
  if (!Array.isArray(conversationData.toolCalls)) {
    return [];
  }

  const files = new Set();

  for (const toolCall of conversationData.toolCalls) {
    // Extract file paths from tool calls
    if (toolCall.tool === 'replace_string_in_file' && toolCall.args?.filePath) {
      files.add(toolCall.args.filePath);
    }
    if (toolCall.tool === 'create_file' && toolCall.args?.filePath) {
      files.add(toolCall.args.filePath);
    }
    if (toolCall.tool === 'multi_replace_string_in_file' && toolCall.args?.replacements) {
      for (const replacement of toolCall.args.replacements) {
        if (replacement.filePath) {
          files.add(replacement.filePath);
        }
      }
    }
  }

  return Array.from(files);
}

/**
 * Extract commands that were run in terminal
 * @param {Object} conversationData - Conversation data from VSCode hooks
 * @returns {string[]} List of commands that were executed
 */
export function extractCommands(conversationData) {
  // Validate input structure
  if (!conversationData || typeof conversationData !== 'object') {
    return [];
  }
  
  if (!Array.isArray(conversationData.toolCalls)) {
    return [];
  }

  const commands = [];

  for (const toolCall of conversationData.toolCalls) {
    if (toolCall.tool === 'run_in_terminal' && toolCall.args?.command) {
      commands.push(toolCall.args.command);
    }
  }

  return commands;
}

/**
 * Infer next steps based on conversation context
 * @param {Object} conversationData - Conversation data from VSCode hooks
 * @returns {string[]} Suggested next steps
 */
export function inferNextSteps(conversationData) {
  // Validate input structure
  if (!conversationData || typeof conversationData !== 'object') {
    return [];
  }
  
  if (!Array.isArray(conversationData.messages)) {
    return [];
  }

  const steps = [];
  const lastMessages = conversationData.messages.slice(-5); // Last 5 messages

  // Look for incomplete tasks or suggestions
  for (const message of lastMessages) {
    if (message.role === 'assistant' && message.content) {
      // Look for "Next steps:", "TODO:", "Consider:", etc.
      const nextStepsMatch = message.content.match(/(?:Next steps?|TODO|Consider|Remaining):\s*\n?([\s\S]*?)(?:\n\n|$)/i);
      if (nextStepsMatch) {
        const extracted = nextStepsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
          .map(line => line.replace(/^[-\d.]\s*/, '').trim())
          .filter(Boolean);
        
        steps.push(...extracted);
      }
    }
  }

  return [...new Set(steps)]; // Deduplicate
}

/**
 * Generate complete session summary
 * @param {Object} conversationData - Conversation data from VSCode hooks
 * @returns {Object} Structured session summary
 */
export async function generateSessionSummary(conversationData) {
  return {
    filesModified: extractFileChanges(conversationData),
    commandsRun: extractCommands(conversationData),
    nextSteps: inferNextSteps(conversationData),
    timestamp: conversationData.timestamp || new Date().toISOString(),
  };
}
