/**
 * Session Summarizer - Extract insights from conversation data
 * Analyzes AI conversation to generate structured session summaries
 */

/**
 * Tool call argument structure
 */
export interface ToolCallArgs {
  filePath?: string;
  command?: string;
  replacements?: Array<{
    filePath?: string;
  }>;
}

/**
 * Tool call structure
 */
export interface ToolCall {
  tool: string;
  args?: ToolCallArgs;
}

/**
 * Message structure
 */
export interface Message {
  role: string;
  content?: string;
}

/**
 * Conversation data from VSCode hooks
 */
export interface ConversationData {
  toolCalls?: ToolCall[];
  messages?: Message[];
  timestamp?: string;
}

/**
 * Session summary result
 */
export interface SessionSummary {
  filesModified: string[];
  commandsRun: string[];
  nextSteps: string[];
  timestamp: string;
}

/**
 * Extract files that were modified during session
 * @param conversationData - Conversation data from VSCode hooks
 * @returns List of file paths that were modified
 */
export function extractFileChanges(conversationData: ConversationData): string[] {
  // Validate input structure
  if (!conversationData || typeof conversationData !== 'object') {
    return [];
  }
  
  if (!Array.isArray(conversationData.toolCalls)) {
    return [];
  }

  const files = new Set<string>();

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
 * @param conversationData - Conversation data from VSCode hooks
 * @returns List of commands that were executed
 */
export function extractCommands(conversationData: ConversationData): string[] {
  // Validate input structure
  if (!conversationData || typeof conversationData !== 'object') {
    return [];
  }
  
  if (!Array.isArray(conversationData.toolCalls)) {
    return [];
  }

  const commands: string[] = [];

  for (const toolCall of conversationData.toolCalls) {
    if (toolCall.tool === 'run_in_terminal' && toolCall.args?.command) {
      commands.push(toolCall.args.command);
    }
  }

  return commands;
}

/**
 * Infer next steps based on conversation context
 * @param conversationData - Conversation data from VSCode hooks
 * @returns Suggested next steps
 */
export function inferNextSteps(conversationData: ConversationData): string[] {
  // Validate input structure
  if (!conversationData || typeof conversationData !== 'object') {
    return [];
  }
  
  if (!Array.isArray(conversationData.messages)) {
    return [];
  }

  const steps: string[] = [];
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
 * @param conversationData - Conversation data from VSCode hooks
 * @returns Structured session summary
 */
export async function generateSessionSummary(conversationData: ConversationData): Promise<SessionSummary> {
  return {
    filesModified: extractFileChanges(conversationData),
    commandsRun: extractCommands(conversationData),
    nextSteps: inferNextSteps(conversationData),
    timestamp: conversationData.timestamp || new Date().toISOString(),
  };
}
